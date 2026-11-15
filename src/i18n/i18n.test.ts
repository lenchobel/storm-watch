import { describe, expect, it } from 'vitest'
import { getText, translate } from './translate'

describe('translate', () => {
  it('fills placeholders with plain values', () => {
    expect(translate('en', 'picker.stormDetail', { hours: 2.22 })).toBe(
      'Particles in 2.22h'
    )
    expect(translate('en', 'hud.sol', { sol: 3, total: 7 })).toBe('Sol 3/7')
  })

  it('resolves nested key references', () => {
    expect(
      translate('en', 'saver.action.bolt', {
        dir: { key: 'saver.dir.more' },
        thing: { key: 'saver.thing.air' },
        sol: 4,
      })
    ).toBe('1 more air bolt on sol 4')
  })

  it('leaves a placeholder alone when no value is given', () => {
    expect(translate('en', 'saver.one', { action: 'a nap' })).toBe(
      'Try a nap. {benefit}'
    )
  })

  it('returns the key when the catalogue has no entry', () => {
    expect(translate('en', 'no.such.key')).toBe('no.such.key')
  })

  it('reads Afaan Oromoo values and falls back to English', () => {
    expect(getText('om', 'common.back')).toBe('Back')
    expect(getText('om', 'no.such.key')).toBe('no.such.key')
  })
})
