'use client';

import { useState } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { usePatient } from '@/contexts/PatientContext';
import type { Persona, OutcomeScenario, SimilarPatient } from '@/types/patient';

// ---- types ----
type OutcomeKey = SimilarPatient['outcome'];

const OUTCOME_BADGE: Record<OutcomeKey, { label: string; className: string }> = {
  remission:   { label: '寛解',   className: 'bg-green-100 text-green-800 border border-green-300' },
  response:    { label: '改善',   className: 'bg-blue-100 text-blue-800 border border-blue-300' },
  partial:     { label: '部分改善', className: 'bg-yellow-100 text-yellow-800 border border-yellow-300' },
  no_response: { label: '無効',   className: 'bg-red-100 text-red-800 border border-red-300' },
};

// ---- helper ----
function buildChartData(scenarios: OutcomeScenario[], scenarioId: string, latestScore: number) {
  const scenario = scenarios.find((s) => s.id === scenarioId);
  if (!scenario) return [];
  return [
    { label: '現在',  median: latestScore, low: latestScore, high: latestScore },
    { label: '4週後', median: scenario.week4.median,  low: scenario.week4.low,  high: scenario.week4.high },
    { label: '8週後', median: scenario.week8.median,  low: scenario.week8.low,  high: scenario.week8.high },
    { label: '12週後', median: scenario.week12.median, low: scenario.week12.low, high: scenario.week12.high },
  ];
}

// ---- sub-components ----

function SummaryCards({ baselineScore, baselineDate, latestScore, latestDate }: {
  baselineScore: number; baselineDate: string;
  latestScore: number;  latestDate: string;
}) {
  const improvementPt  = latestScore - baselineScore;
  const improvementPct = baselineScore > 0
    ? Math.round((improvementPt / baselineScore) * 100)
    : 0;

  const cards = [
    { title: 'ベースライン PHQ-9', value: baselineScore, sub: baselineDate, valueColor: 'text-red-600' },
    { title: '直近 PHQ-9',         value: latestScore,   sub: latestDate,   valueColor: 'text-green-600' },
    {
      title: '改善速度',
      value: `${improvementPt}pt`,
      sub: `開始〜直近（${improvementPct}%改善）`,
      valueColor: 'text-blue-600',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-lg shadow-sm p-4 flex flex-col gap-1">
          <p className="text-xs text-gray-500 font-medium">{card.title}</p>
          <p className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</p>
          <p className="text-xs text-gray-400">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}

function PersonaAnalysis({ personas }: { personas: Persona[] }) {
  const maxProbability = Math.max(...personas.map((p) => p.probability));

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 h-full flex flex-col gap-4">
      <h2 className="text-base font-bold text-gray-800">ペルソナ分析</h2>
      <div className="flex flex-col gap-4">
        {personas.map((persona) => {
          const isTop = persona.probability === maxProbability;
          return (
            <div
              key={persona.id}
              className={`rounded-lg p-4 border ${
                isTop ? 'border-blue-500 border-2 bg-blue-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-gray-800">{persona.name}</span>
                <span className={`text-sm font-semibold ${isTop ? 'text-blue-700' : 'text-gray-600'}`}>
                  {persona.probability}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${persona.probability}%` }} />
              </div>
              <p className="text-xs text-gray-500 mb-2">{persona.description}</p>
              <ul className="mb-2 space-y-0.5">
                {persona.characteristics.map((c, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="mt-0.5 text-gray-400">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
              <span className="inline-block text-xs bg-green-100 text-green-800 border border-green-300 rounded px-2 py-0.5">
                {persona.recommendedApproach}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OutcomePrediction({ scenarios, latestScore }: { scenarios: OutcomeScenario[]; latestScore: number }) {
  const [selectedScenarioId, setSelectedScenarioId] = useState(scenarios[0]?.id ?? '');
  const chartData = buildChartData(scenarios, selectedScenarioId, latestScore);

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 h-full flex flex-col gap-4">
      <h2 className="text-base font-bold text-gray-800">治療シナリオ別アウトカム予測</h2>

      <select
        className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={selectedScenarioId}
        onChange={(e) => setSelectedScenarioId(e.target.value)}
      >
        {scenarios.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>

      <div className="flex-1 min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#d1d5db' }} tickLine={false} />
            <YAxis domain={[0, 30]} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#d1d5db' }} tickLine={false}
              label={{ value: 'PHQ-9', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: '#9ca3af' } }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(value: number | undefined, name: string | undefined) => {
                const labels: Record<string, string> = {
                  high: '上限（95%CI）', low: '下限（95%CI）', median: '中央値',
                };
                return [value ?? 0, labels[name ?? ''] ?? name ?? ''];
              }}
            />
            <Legend
              formatter={(value: string) => {
                const labels: Record<string, string> = {
                  high: '上限（95%CI）', low: '下限（95%CI）', median: '中央値',
                };
                return labels[value] ?? value;
              }}
              wrapperStyle={{ fontSize: 11 }}
            />
            <ReferenceLine y={5}  stroke="#86efac" strokeDasharray="4 4" label={{ value: '軽微(5)',  position: 'right', fontSize: 10, fill: '#16a34a' }} />
            <ReferenceLine y={10} stroke="#fbbf24" strokeDasharray="4 4" label={{ value: '軽度(10)', position: 'right', fontSize: 10, fill: '#d97706' }} />
            <ReferenceLine y={15} stroke="#f87171" strokeDasharray="4 4" label={{ value: '中等(15)', position: 'right', fontSize: 10, fill: '#dc2626' }} />
            <Area type="monotone" dataKey="high" stroke="#93c5fd" strokeWidth={0} fill="#bfdbfe" fillOpacity={0.5} name="high" />
            <Area type="monotone" dataKey="low"  stroke="#93c5fd" strokeWidth={0} fill="#ffffff" fillOpacity={1}   name="low" />
            <Line type="monotone" dataKey="median" stroke="#2563eb" strokeWidth={2.5}
              dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }} activeDot={{ r: 6 }} name="median" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SimilarPatientsTable({ patients }: { patients: SimilarPatient[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h2 className="text-base font-bold text-gray-800 mb-4">類似患者データ</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {['匿名ID', '類似度', 'ベースライン PHQ-9', '4週後 PHQ-9', '治療パターン', 'アウトカム'].map((col) => (
                <th key={col} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {patients.map((patient, idx) => {
              const badge = OUTCOME_BADGE[patient.outcome];
              return (
                <tr key={patient.anonymousId}
                  className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                  <td className="py-3 px-3 font-mono font-medium text-gray-700">{patient.anonymousId}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-20">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${patient.similarity}%` }} />
                      </div>
                      <span className="text-xs text-gray-600 w-8 text-right">{patient.similarity}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center"><span className="font-semibold text-gray-800">{patient.baseline}</span></td>
                  <td className="py-3 px-3 text-center"><span className="font-semibold text-gray-800">{patient.week4Result}</span></td>
                  <td className="py-3 px-3 text-gray-600">{patient.treatmentPattern}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-block text-xs rounded px-2 py-0.5 font-medium ${badge.className}`}>{badge.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DisclaimerBox() {
  return (
    <div className="rounded-lg border border-yellow-400 bg-yellow-50 px-5 py-4 flex gap-3 items-start">
      <span className="text-xl leading-none mt-0.5" aria-hidden>⚠️</span>
      <p className="text-sm text-yellow-800 leading-relaxed">
        この予測は参考情報です。診断・治療の決定は必ず医師が行ってください。本システムの予測は過去データに基づく統計的推定であり、個々の患者に対する医療的判断を代替するものではありません。
      </p>
    </div>
  );
}

// ---- main export ----
export default function PrognosisPrediction() {
  const { currentPatient } = usePatient();
  const { phq9Data, personas, outcomeScenarios, similarPatients } = currentPatient;

  const baselineScore = phq9Data[0].total;
  const baselineDate  = phq9Data[0].date;
  const latestScore   = phq9Data[phq9Data.length - 1].total;
  const latestDate    = phq9Data[phq9Data.length - 1].date;

  return (
    <div className="flex flex-col gap-6 p-6">
      <SummaryCards
        baselineScore={baselineScore}
        baselineDate={baselineDate}
        latestScore={latestScore}
        latestDate={latestDate}
      />

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2">
          <PersonaAnalysis personas={personas} />
        </div>
        <div className="col-span-3">
          <OutcomePrediction scenarios={outcomeScenarios} latestScore={latestScore} />
        </div>
      </div>

      <SimilarPatientsTable patients={similarPatients} />

      <DisclaimerBox />
    </div>
  );
}
