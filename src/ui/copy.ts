import { starScienceGoal } from '../engine/rules'
import type { Site, TextParams } from '../engine/types'

/** A key plus the values that fill its placeholders. The UI calls t(). */
export interface TextLine {
  key: string
  params: TextParams
}

/** Two stars need this much science. The engine owns the number. */
export function twoStarScienceGoal(site: Site): number {
  return starScienceGoal(site)
}

export function starGoalLines(site: Site): TextLine[] {
  const goal = starScienceGoal(site)
  return [
    { key: 'goal.earnScience', params: { n: goal } },
    { key: 'goal.keepHealth', params: {} },
  ]
}

export function starGoalLine(site: Site): TextLine {
  const goal = starScienceGoal(site)
  return { key: 'goal.line', params: { n: goal } }
}

export interface GlossaryEntry {
  termKey: string
  definitionKey: string
}

export const GLOSSARY: GlossaryEntry[] = [
  { termKey: 'glossary.radiation.term', definitionKey: 'glossary.radiation.definition' },
  { termKey: 'glossary.solarFlare.term', definitionKey: 'glossary.solarFlare.definition' },
  { termKey: 'glossary.solarStorm.term', definitionKey: 'glossary.solarStorm.definition' },
  { termKey: 'glossary.particles.term', definitionKey: 'glossary.particles.definition' },
  { termKey: 'glossary.cosmicRays.term', definitionKey: 'glossary.cosmicRays.definition' },
  { termKey: 'glossary.shield.term', definitionKey: 'glossary.shield.definition' },
  { termKey: 'glossary.sol.term', definitionKey: 'glossary.sol.definition' },
  { termKey: 'glossary.radioDelay.term', definitionKey: 'glossary.radioDelay.definition' },
  { termKey: 'glossary.twoStars.term', definitionKey: 'glossary.twoStars.definition' },
  { termKey: 'glossary.threeStars.term', definitionKey: 'glossary.threeStars.definition' },
]

export const SIMPLIFIED_POINTS: string[] = [
  'simplified.point1',
  'simplified.point2',
  'simplified.point3',
  'simplified.point4',
  'simplified.point5',
  'simplified.point6',
]

export interface QuizItem {
  id: string
  questionKey: string
  optionKeys: string[]
  correctIndex: number
  explanationKey: string
}

export const QUIZ_ITEMS: QuizItem[] = [
  {
    id: 'shield-cosmic',
    questionKey: 'quiz.shieldCosmic.question',
    optionKeys: [
      'quiz.shieldCosmic.option1',
      'quiz.shieldCosmic.option2',
      'quiz.shieldCosmic.option3',
    ],
    correctIndex: 0,
    explanationKey: 'quiz.shieldCosmic.explanation',
  },
  {
    id: 'clock-risk',
    questionKey: 'quiz.clockRisk.question',
    optionKeys: [
      'quiz.clockRisk.option1',
      'quiz.clockRisk.option2',
      'quiz.clockRisk.option3',
    ],
    correctIndex: 1,
    explanationKey: 'quiz.clockRisk.explanation',
  },
  {
    id: 'mars-delay',
    questionKey: 'quiz.marsDelay.question',
    optionKeys: [
      'quiz.marsDelay.option1',
      'quiz.marsDelay.option2',
      'quiz.marsDelay.option3',
    ],
    correctIndex: 0,
    explanationKey: 'quiz.marsDelay.explanation',
  },
]

export const TEACHER_PLAN = {
  titleKey: 'teacher.title',
  goalKey: 'teacher.goal',
  activityTitleKey: 'teacher.activityTitle',
  activityKeys: [
    'teacher.activity1',
    'teacher.activity2',
    'teacher.activity3',
    'teacher.activity4',
    'teacher.activity5',
    'teacher.activity6',
    'teacher.activity7',
  ],
  questionsTitleKey: 'teacher.questionsTitle',
  questionKeys: ['teacher.question1', 'teacher.question2', 'teacher.question3'],
  seedsTitleKey: 'teacher.seedsTitle',
  seedKeys: ['teacher.seed1', 'teacher.seed2', 'teacher.seed3'],
}
