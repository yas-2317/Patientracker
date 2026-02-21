'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
  ComposedChart,
  Line,
  ReferenceArea,
} from 'recharts';
import { usePatient } from '@/contexts/PatientContext';
import type { PHQ9DataPoint, PHQ9Item } from '@/types/patient';
import { phq9ItemLabels } from '@/types/patient';

// Phase colors
const PHASE_COLORS = {
  before: '#f87171',
  during: '#fbbf24',
  after: '#34d399',
} as const;

// KPI data (dummy values)
const kpiData = [
  { label: '反応率（50%改善以上）', value: '71%', description: '治療開始から50%以上のPHQ-9スコア改善' },
  { label: '寛解率（PHQ-9<5）', value: '42%', description: 'PHQ-9スコアが5点未満に到達' },
  { label: '平均改善時間', value: '8週', description: '有意な改善が確認されるまでの平均週数' },
];

// Custom tooltip for line chart
function LineTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { phase: string } }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const phase = payload[0]?.payload?.phase;
  const phaseLabel =
    phase === 'before' ? '治療前' : phase === 'during' ? '治療中' : '治療後';
  const phaseColor =
    phase === 'before' ? PHASE_COLORS.before :
    phase === 'during' ? PHASE_COLORS.during : PHASE_COLORS.after;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm text-sm">
      <p className="text-slate-500 mb-1">{label}</p>
      <p style={{ color: phaseColor }} className="font-semibold">{phaseLabel}</p>
      <p className="text-slate-800">PHQ-9: {payload[0]?.value}点</p>
    </div>
  );
}

// Custom dot color by phase
function CustomDot(props: { cx?: number; cy?: number; payload?: { phase: string } }) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined) return null;
  const phase = payload?.phase ?? 'before';
  const color =
    phase === 'before' ? PHASE_COLORS.before :
    phase === 'during' ? PHASE_COLORS.during : PHASE_COLORS.after;
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={2} />;
}

function calcAvg(data: PHQ9DataPoint[]): number {
  if (data.length === 0) return 0;
  return Math.round((data.reduce((a, d) => a + d.total, 0) / data.length) * 10) / 10;
}

function calcItemAvg(data: PHQ9DataPoint[], key: keyof PHQ9Item): number {
  if (data.length === 0) return 0;
  return Math.round((data.reduce((a, d) => a + d.items[key], 0) / data.length) * 10) / 10;
}

export default function EpisodeComparison() {
  const { currentPatient } = usePatient();
  const { phq9Data, treatmentEvents } = currentPatient;

  // Derive phase boundaries from treatment events
  const { BEFORE_END, DURING_END } = useMemo(() => {
    const sorted = [...treatmentEvents].sort((a, b) => a.date.localeCompare(b.date));
    const n = phq9Data.length;
    const firstEvent = sorted[0]?.date ?? phq9Data[Math.floor(n / 3)].date;
    const lastEvent  = sorted[sorted.length - 1]?.date ?? phq9Data[Math.floor(n * 2 / 3)].date;
    return { BEFORE_END: firstEvent, DURING_END: lastEvent };
  }, [treatmentEvents, phq9Data]);

  const {
    lineChartData, radarData,
    firstDate, lastDate, phaseColumns,
  } = useMemo(() => {
    const beforeData = phq9Data.filter((d) => d.date <= BEFORE_END);
    const duringData = phq9Data.filter((d) => d.date > BEFORE_END && d.date <= DURING_END);
    const afterData  = phq9Data.filter((d) => d.date > DURING_END);

    const beforeAvg = calcAvg(beforeData);
    const duringAvg = calcAvg(duringData);
    const afterAvg  = calcAvg(afterData);

    const lineChartData = phq9Data.map((d) => ({
      date: d.date,
      score: d.total,
      phase: d.date <= BEFORE_END ? 'before' : d.date <= DURING_END ? 'during' : 'after',
    }));

    const allDates = phq9Data.map((d) => d.date);
    const firstDate = allDates[0];
    const lastDate  = allDates[allDates.length - 1];

    const itemKeys = Object.keys(phq9ItemLabels) as (keyof PHQ9Item)[];
    const radarData = itemKeys.map((key) => ({
      subject: phq9ItemLabels[key],
      before: calcItemAvg(beforeData, key),
      after:  calcItemAvg(afterData, key),
      fullMark: 3,
    }));

    const phaseColumns = [
      {
        id: 'before', label: '治療前',
        period: `〜 ${BEFORE_END}`,
        color: PHASE_COLORS.before, avg: beforeAvg,
        barData: [{ name: '治療前', score: beforeAvg }], count: beforeData.length,
      },
      {
        id: 'during', label: '治療中',
        period: `${BEFORE_END} 〜 ${DURING_END}`,
        color: PHASE_COLORS.during, avg: duringAvg,
        barData: [{ name: '治療中', score: duringAvg }], count: duringData.length,
      },
      {
        id: 'after', label: '治療後',
        period: `${DURING_END} 〜`,
        color: PHASE_COLORS.after, avg: afterAvg,
        barData: [{ name: '治療後', score: afterAvg }], count: afterData.length,
      },
    ];

    return { beforeData, duringData, afterData, lineChartData, radarData, firstDate, lastDate, phaseColumns };
  }, [phq9Data, BEFORE_END, DURING_END]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">治療エピソード比較</h1>
        <p className="text-slate-500 text-sm mt-1">
          治療フェーズ別のPHQ-9スコアを比較・分析します
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {kpiData.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
            <p className="text-3xl font-bold text-slate-800">{kpi.value}</p>
            <p className="text-xs text-slate-400 mt-2">{kpi.description}</p>
          </div>
        ))}
      </div>

      {/* Phase comparison: Before / During / After */}
      <div className="grid grid-cols-3 gap-4">
        {phaseColumns.map((phase) => (
          <div key={phase.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4" style={{ borderTop: `4px solid ${phase.color}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-800">{phase.label}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{phase.period}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold" style={{ color: phase.color }}>{phase.avg}</span>
                  <p className="text-xs text-slate-400">平均PHQ-9</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">測定回数: {phase.count}回</p>
            </div>
            <div className="px-5 pb-5">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={phase.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 27]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number | undefined) => [`${value ?? 0}点`, 'PHQ-9']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="score" fill={phase.color} radius={[6, 6, 0, 0]} maxBarSize={80} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row: line chart + radar chart */}
      <div className="grid grid-cols-2 gap-4">
        {/* Line chart: full timeline with phase background */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-1">PHQ-9スコア推移</h2>
          <p className="text-xs text-slate-400 mb-4">全期間のスコア推移（背景色でフェーズを区分）</p>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <ReferenceArea x1={firstDate} x2={BEFORE_END} fill={PHASE_COLORS.before} fillOpacity={0.08} stroke="none"
                label={{ value: '治療前', position: 'insideTopLeft', fontSize: 10, fill: PHASE_COLORS.before }} />
              <ReferenceArea x1={BEFORE_END} x2={DURING_END} fill={PHASE_COLORS.during} fillOpacity={0.08} stroke="none"
                label={{ value: '治療中', position: 'insideTopLeft', fontSize: 10, fill: PHASE_COLORS.during }} />
              <ReferenceArea x1={DURING_END} x2={lastDate} fill={PHASE_COLORS.after} fillOpacity={0.08} stroke="none"
                label={{ value: '治療後', position: 'insideTopLeft', fontSize: 10, fill: PHASE_COLORS.after }} />
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                interval={1} angle={-20} textAnchor="end" height={40} />
              <YAxis domain={[0, 27]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<LineTooltip />} />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5}
                dot={<CustomDot />} activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 justify-center">
            {[
              { label: '治療前', color: PHASE_COLORS.before },
              { label: '治療中', color: PHASE_COLORS.during },
              { label: '治療後', color: PHASE_COLORS.after },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: item.color, opacity: 0.5 }} />
                <span className="text-xs text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Radar chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-1">PHQ-9 項目別比較（Before vs After）</h2>
          <p className="text-xs text-slate-400 mb-4">9項目の平均スコアをフェーズ間で比較</p>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
              <Radar name="治療前" dataKey="before" stroke={PHASE_COLORS.before} fill={PHASE_COLORS.before} fillOpacity={0.3} strokeWidth={2} />
              <Radar name="治療後" dataKey="after"  stroke={PHASE_COLORS.after}  fill={PHASE_COLORS.after}  fillOpacity={0.3} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Tooltip
                formatter={(value: number | undefined, name: string | undefined) => [`${value ?? 0}点`, name ?? '']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
