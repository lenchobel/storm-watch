/**
 * The exact sentence that supports each fact in src/data/facts.json.
 *
 * `sha256` is the hash of the document as served by the live URL on 2026-11-14.
 * The checker fetches the URL again and compares hashes, so a recorded quote can
 * never drift away from the file the quote was read from.
 *
 * `liveSearch` is optional: it is the pattern that a plain-text extractor can
 * find in the live file. The NASA Science hazards PDF encodes its text with
 * CID-keyed fonts, so it has no plain-text pattern and is checked by hash.
 */
export interface FactQuote {
  id: string
  sha256: string
  where: string
  quotes: string[]
  liveSearch?: RegExp
}

const RAD = '2af67de84186019bce6789b6f30429f7c42b9c029665eae5b440917a0187fae3'
const HAZARDS = '35677712a988b7b5aa36427b66836794b7d736035d2d43aa0b55ec11fe4f7a8d'
const ASCEND = 'c24c4deceab9ad6da81ec78a4b05d52b79b0ee588db02cf7e9a75e7a2f465b47'
const FACTSHEET = '366b0ce9b69cbee370be904956748af954468a41b93dc71a796a986519aa8d74'

export const FACT_QUOTES: FactQuote[] = [
  {
    id: 'curiosity-rad-mars',
    sha256: RAD,
    where: 'NASA NTRS Space Radiation Book Chapter PDF, page 4',
    quotes: [
      "Measurements obtained by NASA's Mars Science Laboratory's Radiation Assessment Detector (MSL-RAD) on the Curiosity rover were 1.84 mSv/day in transit and 0.7 mSv/day on the Mars surface (Zeitlin et al., 2013).",
    ],
    liveSearch: /0\.7\s*mSv\/day/i,
  },
  {
    id: 'curiosity-rad-cruise',
    sha256: RAD,
    where: 'NASA NTRS Space Radiation Book Chapter PDF, page 4',
    quotes: [
      "Measurements obtained by NASA's Mars Science Laboratory's Radiation Assessment Detector (MSL-RAD) on the Curiosity rover were 1.84 mSv/day in transit and 0.7 mSv/day on the Mars surface (Zeitlin et al., 2013).",
    ],
    liveSearch: /1\.84\s*mSv\/day/i,
  },
  {
    id: 'moon-radio-delay',
    sha256: HAZARDS,
    where: 'NASA Science Human Spaceflight Hazards white paper PDF, page 2',
    quotes: ['At the Moon, the signal latency is about 1.3 seconds, one-way.'],
  },
  {
    id: 'mars-radio-delay-close',
    sha256: HAZARDS,
    where: 'NASA Science Human Spaceflight Hazards white paper PDF, page 2',
    quotes: [
      'On the surface, delay would be just over three minutes, one-way, when Earth and Mars are at their closest and over 20 minutes when the planets are furthest apart.',
    ],
  },
  {
    id: 'mars-radio-delay',
    sha256: ASCEND,
    where: 'NASA NTRS ASCEND Mars Comms PDF, page 10 (Section V, Conclusion)',
    quotes: [
      'In terms of communication delays, the maximum one-way communication delay is about 22 minutes for any mission and can range from 15 to 20 minutes while crew is at Mars.',
    ],
    liveSearch: /maximum one-way communication delay is about 22 minutes/i,
  },
  {
    id: 'mars-sunlight',
    sha256: FACTSHEET,
    where: 'NASA NSSDC Mars Fact Sheet, Solar irradiance row (Mars 586.2 / Earth 1361.0 = 0.431)',
    quotes: ['Solar irradiance (W/m 2 ) 586.2 1361.0 0.431'],
    liveSearch: /586\.2\s+1361\.0\s+0\.431/,
  },
  {
    id: 'shield-particles-vs-cosmic',
    sha256: RAD,
    where: 'NASA NTRS Space Radiation Book Chapter PDF, pages 2 and 3',
    quotes: [
      'This broad energy range allows many GCR to penetrate shielding, exposing astronauts to a constant low dose rate of a complex radiation field.',
      'In spacecraft, dedicated "storm shelters" with additional shielding help reduce radiation exposure during large SPEs (Townsend et al., 2018).',
    ],
    liveSearch: /many GCR to penetrate shielding/i,
  },
]
