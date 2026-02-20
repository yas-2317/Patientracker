export type PHQ9Item = {
  item1: number; // 興味・喜びの欠如
  item2: number; // 抑うつ気分
  item3: number; // 睡眠障害
  item4: number; // 疲労感
  item5: number; // 食欲変化
  item6: number; // 自己評価低下
  item7: number; // 集中困難
  item8: number; // 精神運動変化
  item9: number; // 自殺念慮
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

export const phq9Data: PHQ9DataPoint[] = [
  {
    date: '2024-01-15',
    items: { item1: 3, item2: 3, item3: 2, item4: 3, item5: 2, item6: 2, item7: 2, item8: 1, item9: 1 },
    total: 19,
  },
  {
    date: '2024-02-01',
    items: { item1: 3, item2: 3, item3: 2, item4: 3, item5: 2, item6: 2, item7: 2, item8: 1, item9: 1 },
    total: 19,
  },
  {
    date: '2024-02-15',
    items: { item1: 3, item2: 2, item3: 2, item4: 2, item5: 2, item6: 2, item7: 2, item8: 1, item9: 1 },
    total: 17,
  },
  {
    date: '2024-03-01',
    items: { item1: 2, item2: 2, item3: 2, item4: 2, item5: 1, item6: 2, item7: 2, item8: 1, item9: 0 },
    total: 14,
  },
  {
    date: '2024-03-15',
    items: { item1: 2, item2: 2, item3: 1, item4: 2, item5: 1, item6: 1, item7: 2, item8: 1, item9: 0 },
    total: 12,
  },
  {
    date: '2024-04-01',
    items: { item1: 2, item2: 2, item3: 1, item4: 2, item5: 1, item6: 1, item7: 1, item8: 1, item9: 0 },
    total: 11,
  },
  {
    date: '2024-04-15',
    items: { item1: 1, item2: 2, item3: 1, item4: 2, item5: 1, item6: 1, item7: 1, item8: 0, item9: 0 },
    total: 9,
  },
  {
    date: '2024-05-01',
    items: { item1: 1, item2: 1, item3: 1, item4: 1, item5: 1, item6: 1, item7: 1, item8: 0, item9: 0 },
    total: 7,
  },
  {
    date: '2024-05-15',
    items: { item1: 1, item2: 1, item3: 1, item4: 1, item5: 0, item6: 1, item7: 1, item8: 0, item9: 0 },
    total: 6,
  },
  {
    date: '2024-06-01',
    items: { item1: 1, item2: 1, item3: 0, item4: 1, item5: 0, item6: 0, item7: 1, item8: 0, item9: 0 },
    total: 4,
  },
  {
    date: '2024-06-15',
    items: { item1: 0, item2: 1, item3: 0, item4: 1, item5: 0, item6: 0, item7: 0, item8: 0, item9: 0 },
    total: 2,
  },
  {
    date: '2024-07-01',
    items: { item1: 0, item2: 0, item3: 0, item4: 1, item5: 0, item6: 0, item7: 0, item8: 0, item9: 0 },
    total: 1,
  },
];

export const qidsData: SimpleDataPoint[] = [
  { date: '2024-01-15', total: 18 },
  { date: '2024-02-01', total: 18 },
  { date: '2024-02-15', total: 16 },
  { date: '2024-03-01', total: 13 },
  { date: '2024-03-15', total: 11 },
  { date: '2024-04-01', total: 10 },
  { date: '2024-04-15', total: 8 },
  { date: '2024-05-01', total: 6 },
  { date: '2024-06-01', total: 4 },
  { date: '2024-07-01', total: 2 },
];

export const hamdData: SimpleDataPoint[] = [
  { date: '2024-01-15', total: 22 },
  { date: '2024-02-01', total: 22 },
  { date: '2024-02-15', total: 20 },
  { date: '2024-03-01', total: 17 },
  { date: '2024-03-15', total: 14 },
  { date: '2024-04-01', total: 12 },
  { date: '2024-04-15', total: 10 },
  { date: '2024-05-01', total: 8 },
  { date: '2024-06-01', total: 5 },
  { date: '2024-07-01', total: 3 },
];

export const madrsData: SimpleDataPoint[] = [
  { date: '2024-01-15', total: 30 },
  { date: '2024-02-01', total: 30 },
  { date: '2024-02-15', total: 27 },
  { date: '2024-03-01', total: 22 },
  { date: '2024-03-15', total: 19 },
  { date: '2024-04-01', total: 16 },
  { date: '2024-04-15', total: 13 },
  { date: '2024-05-01', total: 10 },
  { date: '2024-06-01', total: 7 },
  { date: '2024-07-01', total: 4 },
];

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
