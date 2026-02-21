import type {
  PatientData, PatientSummary, PHQ9DataPoint, PHQ9Item,
  SimpleDataPoint, TreatmentEvent, Persona, OutcomeScenario,
  SimilarPatient, ImprovementPattern,
} from '@/types/patient';

// ---- シード付き乱数 (xorshift32) ----
class SeededRandom {
  private state: number;
  constructor(seed: number) {
    this.state = (seed >>> 0) || 1;
  }
  next(): number {
    let x = this.state;
    x ^= x << 13; x ^= x >> 17; x ^= x << 5;
    this.state = x >>> 0;
    return this.state / 0x100000000;
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(arr: T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
  chance(p: number): boolean { return this.next() < p; }
}

// ---- 定数テーブル ----
const SURNAMES = ['田中','鈴木','佐藤','伊藤','山田','中村','小林','加藤','吉田','山口',
                  '松本','井上','木村','林','斎藤','清水','山崎','森','阿部','池田'];
const FEMALE_GIVEN = ['花子','陽子','恵子','美咲','愛','千恵','直美','由美','幸子','裕子',
                      'さくら','梨花','菜摘','優子','真奈美','亜希子','理恵','智子','里美','咲'];
const MALE_GIVEN   = ['太郎','一郎','健','誠','浩','洋介','大輔','学','隆','博',
                      '雄一','和也','信二','義則','正樹','秀明','竜司','光男','勝人','拓也'];
const THERAPISTS = ['Dr. 山田','Dr. 鈴木','Dr. 田中','Dr. 佐々木','Dr. 高橋'];
const AGE_GROUPS = ['20代','30代','40代','50代','60代'];
const TREATMENT_MEDS = [
  { name: 'SSRI（エスシタロプラム）', category: 'SSRI', increase: 'エスシタロプラム 10mg に増量' },
  { name: 'SSRI（セルトラリン）',     category: 'SSRI', increase: 'セルトラリン 100mg に増量' },
  { name: 'SNRI（デュロキセチン）',   category: 'SNRI', increase: 'デュロキセチン 60mg に増量' },
  { name: 'SNRI（ベンラファキシン）', category: 'SNRI', increase: 'ベンラファキシン 150mg に増量' },
];
const THERAPY_TYPES = ['認知行動療法（CBT）','対人関係療法（IPT）','支持的精神療法','マインドフルネス認知療法'];
const DIAGNOSES = [
  '大うつ病性障害（中等症）',
  '大うつ病性障害（重症）',
  '大うつ病性障害（軽症）',
  '持続性抑うつ障害',
];
const PERSONA_POOL: Persona[] = [
  {
    id: 'insomnia_dominant',
    name: '不眠優位型',
    probability: 0,
    description: '睡眠障害が主症状で、疲労感・集中困難を伴うパターン',
    characteristics: ['入眠困難・中途覚醒が顕著','日中の疲労・集中力低下','CBTの睡眠介入に反応しやすい'],
    recommendedApproach: 'CBT-I（不眠の認知行動療法）の追加を検討',
  },
  {
    id: 'anxiety_comorbid',
    name: '不安併存型',
    probability: 0,
    description: '不安症状を併存し、回避行動が見られるパターン',
    characteristics: ['全般性不安・社交不安の併存','回避行動による社会機能低下','SSRIへの反応は良好'],
    recommendedApproach: '不安に焦点を当てたCBT要素の強化を検討',
  },
  {
    id: 'social_dysfunction',
    name: '社会機能低下型',
    probability: 0,
    description: '職場・対人関係での機能低下が前景に立つパターン',
    characteristics: ['職場復帰・対人関係の困難','自己評価・自責感が強い','対人関係療法（IPT）が有効'],
    recommendedApproach: '対人関係療法（IPT）または段階的活動スケジューリング',
  },
];

// ---- 日付ユーティリティ ----
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ---- PHQ-9 9項目への配分 ----
function distributeItems(rng: SeededRandom, total: number): PHQ9Item {
  const weights = [0.14, 0.14, 0.13, 0.13, 0.10, 0.12, 0.12, 0.08, 0.04];
  const keys = ['item1','item2','item3','item4','item5','item6','item7','item8','item9'] as const;
  const raw = weights.map(w => Math.min(3, Math.round(total * w * (0.7 + rng.next() * 0.6))));
  // 自殺念慮は重症度低い時は0
  if (total < 12) raw[8] = 0;
  // 合計をtotalに近づける微調整（最大3回）
  for (let iter = 0; iter < 3; iter++) {
    const sum = raw.reduce((a, b) => a + b, 0);
    const diff = total - sum;
    if (diff === 0) break;
    const idx = rng.int(0, 8);
    raw[idx] = Math.max(0, Math.min(3, raw[idx] + Math.sign(diff)));
  }
  return Object.fromEntries(keys.map((k, i) => [k, raw[i]])) as PHQ9Item;
}

// ---- PHQ-9スコア軌跡生成 ----
function generatePHQ9(rng: SeededRandom, pattern: ImprovementPattern, baseline: number, startDate: Date): PHQ9DataPoint[] {
  const points: PHQ9DataPoint[] = [];
  let score = baseline;
  for (let i = 0; i < 12; i++) {
    const date = fmtDate(addDays(startDate, i * 14));
    if (i > 0) {
      const ratio = i / 11;
      if (pattern === 'improver') {
        const target = Math.max(1, baseline * (1 - ratio * 0.88));
        score = Math.max(0, Math.min(27, Math.round(target + rng.int(-1, 1))));
      } else if (pattern === 'stable') {
        score = Math.max(0, Math.min(27, score + rng.int(-1, 1)));
      } else {
        // worsen: 最初少し改善 → 後半悪化
        if (i < 4) score = Math.max(0, score - rng.int(0, 1));
        else       score = Math.min(27, score + rng.int(0, 2));
      }
    }
    points.push({ date, items: distributeItems(rng, score), total: score });
  }
  return points;
}

// ---- 他スケールをPHQ-9から導出 ----
const SCALE_RATIO = { QIDS: 0.95, HAMD: 1.16, MADRS: 1.58 };
const SCALE_MAX   = { QIDS: 27,   HAMD: 52,   MADRS: 60  };
function deriveScale(rng: SeededRandom, phq9: PHQ9DataPoint[], scale: 'QIDS'|'HAMD'|'MADRS'): SimpleDataPoint[] {
  // 12点から均等に10点を選ぶ（0,1,2,3,5,6,8,9,10,11 インデックス）
  const indices = [0,1,2,3,5,6,8,9,10,11];
  return indices.map(i => ({
    date: phq9[i].date,
    total: Math.max(0, Math.min(SCALE_MAX[scale],
      Math.round(phq9[i].total * SCALE_RATIO[scale] + rng.int(-1, 1)))),
  }));
}

// ---- 治療イベント生成 ----
function generateEvents(rng: SeededRandom, med: typeof TREATMENT_MEDS[0], startDate: Date): TreatmentEvent[] {
  return [
    {
      date: fmtDate(addDays(startDate, 14)),
      type: 'medication_start' as const,
      label: '投薬開始',
      detail: `${med.name} 開始`,
      color: '#3b82f6',
    },
    {
      date: fmtDate(addDays(startDate, 56)),
      type: 'medication_increase' as const,
      label: '投薬増量',
      detail: med.increase,
      color: '#f59e0b',
    },
    {
      date: fmtDate(addDays(startDate, 42)),
      type: 'therapy_start' as const,
      label: '心理療法開始',
      detail: `${rng.pick(THERAPY_TYPES)}（週1回）開始`,
      color: '#10b981',
    },
  ].sort((a, b) => a.date.localeCompare(b.date));
}

// ---- ペルソナ生成 ----
function generatePersonas(rng: SeededRandom): Persona[] {
  // 3種のペルソナに確率を割り当て（合計100）
  const p1 = rng.int(40, 70);
  const p2 = rng.int(10, 100 - p1 - 5);
  const p3 = 100 - p1 - p2;
  return PERSONA_POOL.map((p, i) => ({
    ...p,
    probability: [p1, p2, p3][i],
  }));
}

// ---- アウトカムシナリオ生成 ----
function generateOutcomeScenarios(rng: SeededRandom, latestScore: number): OutcomeScenario[] {
  const base = latestScore;
  const mk = (med: number, spread: number) => ({
    median: Math.max(0, Math.round(med + rng.int(-1, 1))),
    low:    Math.max(0, Math.round(med - spread)),
    high:   Math.round(med + spread + rng.int(0, 2)),
  });
  return [
    { id: 'current',      label: '現在の治療継続',      week4: mk(base*0.7,3), week8: mk(base*0.5,3), week12: mk(base*0.35,3) },
    { id: 'increase_med', label: '投薬増量',             week4: mk(base*0.65,3), week8: mk(base*0.45,3), week12: mk(base*0.3,3) },
    { id: 'add_cbt_i',    label: 'CBT-I追加',            week4: mk(base*0.6,3), week8: mk(base*0.4,3), week12: mk(base*0.25,3) },
    { id: 'switch_med',   label: '他剤への切り替え',     week4: mk(base*0.75,4), week8: mk(base*0.55,4), week12: mk(base*0.4,4) },
  ];
}

// ---- 類似患者生成 ----
const SIMILAR_PATTERNS = ['SSRI + CBT','SSRI単独','SNRI + CBT','CBT単独','SNRI + 支持的療法'];
const OUTCOMES = ['remission','response','partial','partial','no_response'] as const;
function generateSimilarPatients(rng: SeededRandom, baseline: number): SimilarPatient[] {
  return Array.from({ length: 5 }, (_, i) => {
    const sim = rng.int(70, 97) - i * 4;
    const w4 = Math.max(0, Math.round(baseline * (0.3 + rng.next() * 0.5)));
    return {
      anonymousId: `PT-${rng.int(1000, 9999)}`,
      similarity: sim,
      baseline: baseline + rng.int(-3, 3),
      week4Result: w4,
      treatmentPattern: rng.pick(SIMILAR_PATTERNS),
      outcome: OUTCOMES[Math.min(4, Math.floor((w4 / baseline) * 5))],
    };
  });
}

// ---- 患者生成メイン ----
export function generatePatient(num: number): PatientData {
  const rng = new SeededRandom(num * 31337);

  const gender = rng.chance(0.55) ? '女性' as const : '男性' as const;
  const ageGroup = rng.pick(AGE_GROUPS);
  const pattern: ImprovementPattern = rng.chance(0.6) ? 'improver' : rng.chance(0.625) ? 'stable' : 'worsen';
  const baseline = pattern === 'worsen' ? rng.int(10, 18) : rng.int(14, 26);
  const med = rng.pick(TREATMENT_MEDS);
  const therapyType = rng.pick(THERAPY_TYPES);

  // 開始日：2023-01-01 〜 2024-06-30 のランダム
  const startDate = addDays(new Date(2023, 0, 1), rng.int(0, 545));

  const phq9 = generatePHQ9(rng, pattern, baseline, startDate);
  const events = generateEvents(rng, med, startDate);
  const latestScore = phq9[phq9.length - 1].total;

  const therapyStartDate = fmtDate(addDays(startDate, 42));
  const medStartDate = fmtDate(addDays(startDate, 14));

  return {
    id: `P${String(num).padStart(3, '0')}`,
    name: `${rng.pick(SURNAMES)} ${gender === '女性' ? rng.pick(FEMALE_GIVEN) : rng.pick(MALE_GIVEN)}（匿名）`,
    ageGroup,
    gender,
    diagnosis: rng.pick(DIAGNOSES),
    diagnosisDate: fmtDate(startDate),
    currentMedication: { category: `${med.category}（${med.name}）`, startDate: medStartDate },
    psychotherapy: { type: therapyType, startDate: therapyStartDate, frequency: '週1回' },
    primaryTherapist: rng.pick(THERAPISTS),
    improvementPattern: pattern,
    phq9Data: phq9,
    qidsData: deriveScale(rng, phq9, 'QIDS'),
    hamdData: deriveScale(rng, phq9, 'HAMD'),
    madrsData: deriveScale(rng, phq9, 'MADRS'),
    treatmentEvents: events,
    personas: generatePersonas(rng),
    outcomeScenarios: generateOutcomeScenarios(rng, latestScore),
    similarPatients: generateSimilarPatients(rng, baseline),
  };
}

// ---- キャッシュ付き全患者取得 ----
let _cache: PatientData[] | null = null;

export function getAllPatients(): PatientData[] {
  if (_cache) return _cache;
  _cache = Array.from({ length: 100 }, (_, i) => generatePatient(i + 1));
  return _cache;
}

export function getPatientSummaries(): PatientSummary[] {
  return getAllPatients().map(p => ({
    id: p.id,
    name: p.name,
    latestPhq9: p.phq9Data[p.phq9Data.length - 1].total,
    ageGroup: p.ageGroup,
    gender: p.gender,
    improvementPattern: p.improvementPattern,
  }));
}
