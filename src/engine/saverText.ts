import type { Result, TextParams } from './types'

export type Edit =
  | { kind: 'bolt'; sol: number; cat: 'air' | 'shield' | 'lab'; delta: 1 | -1 }
  | { kind: 'clock'; block: number | 'none' }

interface TextPart {
  text: string
  key: string
  params: TextParams
}

export interface SaverLine {
  text: string
  textKey: string
  textParams: TextParams
}

function thingKey(cat: 'air' | 'shield' | 'lab'): string {
  return cat === 'air'
    ? 'saver.thing.air'
    : cat === 'shield'
      ? 'saver.thing.shield'
      : 'saver.thing.science'
}

function formatAction(edit: Edit): TextPart {
  if (edit.kind === 'bolt') {
    const dir = edit.delta === 1 ? 'more' : 'less'
    const thing = edit.cat === 'air' ? 'air' : edit.cat === 'shield' ? 'shield' : 'science'
    return {
      text: `1 ${dir} ${thing} bolt on sol ${edit.sol}`,
      key: 'saver.action.bolt',
      params: {
        dir: { key: dir === 'more' ? 'saver.dir.more' : 'saver.dir.less' },
        thing: { key: thingKey(edit.cat) },
        sol: edit.sol,
      },
    }
  }
  if (edit.block === 'none') {
    return { text: 'working every block', key: 'saver.action.workAll', params: {} }
  }
  return {
    text: `going to shelter on block ${edit.block}`,
    key: 'saver.action.shelter',
    params: { block: edit.block },
  }
}

function formatBenefit(edits: Edit[], before: Result, after: Result): TextPart {
  if (!before.survived && after.survived) {
    return before.air <= 0
      ? { text: 'The air would have lasted.', key: 'saver.benefit.air', params: {} }
      : { text: 'The crew would have stayed safe.', key: 'saver.benefit.safe', params: {} }
  }
  if (edits.length === 1 && edits[0].kind === 'clock' && edits[0].block === 'none') {
    return {
      text: 'You would have earned more science.',
      key: 'saver.benefit.moreScience',
      params: {},
    }
  }
  return {
    text: `You would have earned ${after.stars} stars.`,
    key: 'saver.benefit.stars',
    params: { n: after.stars },
  }
}

export function buildSaverLine(edits: Edit[], before: Result, after: Result): SaverLine {
  const first = formatAction(edits[0])
  const benefit = formatBenefit(edits, before, after)
  if (edits.length === 1) {
    return {
      text: `Try ${first.text}. ${benefit.text}`,
      textKey: 'saver.one',
      textParams: {
        action: { key: first.key, params: first.params },
        benefit: { key: benefit.key, params: benefit.params },
      },
    }
  }
  const second = formatAction(edits[1])
  return {
    text: `Try ${first.text}. Then ${second.text}. ${benefit.text}`,
    textKey: 'saver.two',
    textParams: {
      action1: { key: first.key, params: first.params },
      action2: { key: second.key, params: second.params },
      benefit: { key: benefit.key, params: benefit.params },
    },
  }
}

export function buildSaverText(edits: Edit[], before: Result, after: Result): string {
  return buildSaverLine(edits, before, after).text
}
