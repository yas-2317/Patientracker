export type SimilarPatient = {
  anonymousId: string;
  similarity: number; // 0-100
  baseline: number; // PHQ-9
  week4Result: number; // PHQ-9
  treatmentPattern: string;
  outcome: 'remission' | 'response' | 'partial' | 'no_response';
};

export const similarPatients: SimilarPatient[] = [
  {
    anonymousId: 'PT-2847',
    similarity: 94,
    baseline: 20,
    week4Result: 8,
    treatmentPattern: 'SSRI + CBT',
    outcome: 'remission',
  },
  {
    anonymousId: 'PT-1923',
    similarity: 88,
    baseline: 18,
    week4Result: 11,
    treatmentPattern: 'SSRI単独',
    outcome: 'response',
  },
  {
    anonymousId: 'PT-3156',
    similarity: 82,
    baseline: 21,
    week4Result: 14,
    treatmentPattern: 'SSRI + CBT',
    outcome: 'partial',
  },
  {
    anonymousId: 'PT-0891',
    similarity: 79,
    baseline: 17,
    week4Result: 9,
    treatmentPattern: 'CBT単独',
    outcome: 'remission',
  },
  {
    anonymousId: 'PT-4201',
    similarity: 75,
    baseline: 22,
    week4Result: 16,
    treatmentPattern: 'SNRI + 支持的療法',
    outcome: 'partial',
  },
];
