export type TreatmentEvent = {
  date: string;
  type: 'medication_start' | 'medication_increase' | 'therapy_start';
  label: string;
  detail: string;
  color: string;
};

export const treatmentEvents: TreatmentEvent[] = [
  {
    date: '2024-02-01',
    type: 'medication_start',
    label: '投薬開始',
    detail: 'エスシタロプラム 5mg 開始',
    color: '#3b82f6',
  },
  {
    date: '2024-03-01',
    type: 'medication_increase',
    label: '投薬増量',
    detail: 'エスシタロプラム 10mg に増量',
    color: '#f59e0b',
  },
  {
    date: '2024-03-15',
    type: 'therapy_start',
    label: 'CBT開始',
    detail: '認知行動療法（週1回）開始',
    color: '#10b981',
  },
];
