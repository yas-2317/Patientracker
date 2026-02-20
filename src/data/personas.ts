export type Persona = {
  id: string;
  name: string;
  probability: number; // 0-100
  description: string;
  characteristics: string[];
  recommendedApproach: string;
};

export const personas: Persona[] = [
  {
    id: 'insomnia_dominant',
    name: '不眠優位型',
    probability: 62,
    description: '睡眠障害が主症状で、疲労感・集中困難を伴うパターン',
    characteristics: [
      '入眠困難・中途覚醒が顕著',
      '日中の疲労・集中力低下',
      '抑うつ気分は中等度',
      'CBTの睡眠介入に反応しやすい',
    ],
    recommendedApproach: 'CBT-I（不眠の認知行動療法）の追加を検討',
  },
  {
    id: 'anxiety_comorbid',
    name: '不安併存型',
    probability: 27,
    description: '不安症状を併存し、過緊張・回避行動が見られるパターン',
    characteristics: [
      '全般性不安・社交不安の併存',
      '回避行動による社会機能低下',
      'SSRIへの反応は良好',
      '暴露療法が有効な場合あり',
    ],
    recommendedApproach: '不安に焦点を当てたCBT要素の強化を検討',
  },
  {
    id: 'social_dysfunction',
    name: '社会機能低下型',
    probability: 11,
    description: '職場・対人関係での機能低下が前景に立つパターン',
    characteristics: [
      '職場復帰・対人関係の困難',
      '自己評価・自責感が強い',
      '対人関係療法（IPT）が有効',
      '段階的社会復帰支援が必要',
    ],
    recommendedApproach: '対人関係療法（IPT）または段階的活動スケジューリング',
  },
];

export type OutcomeScenario = {
  id: string;
  label: string;
  week4: { median: number; low: number; high: number };
  week8: { median: number; low: number; high: number };
  week12: { median: number; low: number; high: number };
};

export const outcomeScenarios: OutcomeScenario[] = [
  {
    id: 'current',
    label: '現在の治療継続（SSRI + CBT）',
    week4: { median: 8, low: 5, high: 12 },
    week8: { median: 5, low: 2, high: 9 },
    week12: { median: 3, low: 0, high: 7 },
  },
  {
    id: 'increase_ssri',
    label: 'SSRI増量',
    week4: { median: 7, low: 4, high: 11 },
    week8: { median: 4, low: 1, high: 8 },
    week12: { median: 2, low: 0, high: 6 },
  },
  {
    id: 'add_cbt_i',
    label: 'CBT-I追加（睡眠介入）',
    week4: { median: 6, low: 3, high: 10 },
    week8: { median: 3, low: 0, high: 7 },
    week12: { median: 2, low: 0, high: 5 },
  },
  {
    id: 'switch_snri',
    label: 'SNRIへ切り替え',
    week4: { median: 9, low: 5, high: 14 },
    week8: { median: 6, low: 2, high: 11 },
    week12: { median: 4, low: 1, high: 9 },
  },
];
