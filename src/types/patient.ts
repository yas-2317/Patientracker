export type PHQ9Item = {
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  item7: number;
  item8: number;
  item9: number;
};

export type PHQ9DataPoint = {
  date: string;
  items: PHQ9Item;
  total: number;
};

export type SimpleDataPoint = {
  date: string;
  total: number;
};

export type TreatmentEvent = {
  date: string;
  type: 'medication_start' | 'medication_increase' | 'therapy_start';
  label: string;
  detail: string;
  color: string;
};

export type Persona = {
  id: string;
  name: string;
  probability: number;
  description: string;
  characteristics: string[];
  recommendedApproach: string;
};

export type OutcomeScenario = {
  id: string;
  label: string;
  week4: { median: number; low: number; high: number };
  week8: { median: number; low: number; high: number };
  week12: { median: number; low: number; high: number };
};

export type SimilarPatient = {
  anonymousId: string;
  similarity: number;
  baseline: number;
  week4Result: number;
  treatmentPattern: string;
  outcome: 'remission' | 'response' | 'partial' | 'no_response';
};

export type ImprovementPattern = 'improver' | 'stable' | 'worsen';

export type PatientData = {
  id: string;
  name: string;
  ageGroup: string;
  gender: '男性' | '女性';
  diagnosis: string;
  diagnosisDate: string;
  currentMedication: { category: string; startDate: string };
  psychotherapy: { type: string; startDate: string; frequency: string };
  primaryTherapist: string;
  improvementPattern: ImprovementPattern;
  phq9Data: PHQ9DataPoint[];
  qidsData: SimpleDataPoint[];
  hamdData: SimpleDataPoint[];
  madrsData: SimpleDataPoint[];
  treatmentEvents: TreatmentEvent[];
  personas: Persona[];
  outcomeScenarios: OutcomeScenario[];
  similarPatients: SimilarPatient[];
};

export type PatientSummary = {
  id: string;
  name: string;
  latestPhq9: number;
  ageGroup: string;
  gender: '男性' | '女性';
  improvementPattern: ImprovementPattern;
};

export const phq9ItemLabels: Record<keyof PHQ9Item, string> = {
  item1: '興味・喜びの欠如',
  item2: '抑うつ気分',
  item3: '睡眠障害',
  item4: '疲労感',
  item5: '食欲変化',
  item6: '自己評価低下',
  item7: '集中困難',
  item8: '精神運動変化',
  item9: '自殺念慮',
};
