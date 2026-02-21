'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine,
} from 'recharts';
import { usePatient } from '@/contexts/PatientContext';

// ---- 重症度判定 ----
type TestKey = 'PHQ-9' | 'QIDS' | 'HAM-D' | 'MADRS';

function getSeverity(test: TestKey, score: number): { label: string; color: string; bg: string } {
  switch (test) {
    case 'PHQ-9':
      if (score <= 4)  return { label: '軽微',     color: '#16a34a', bg: '#dcfce7' };
      if (score <= 9)  return { label: '軽度',     color: '#ca8a04', bg: '#fef9c3' };
      if (score <= 14) return { label: '中等度',   color: '#ea580c', bg: '#ffedd5' };
      if (score <= 19) return { label: '中等重度', color: '#dc2626', bg: '#fee2e2' };
      return                  { label: '重度',     color: '#991b1b', bg: '#fecaca' };
    case 'QIDS':
      if (score <= 5)  return { label: '正常',     color: '#16a34a', bg: '#dcfce7' };
      if (score <= 10) return { label: '軽度',     color: '#ca8a04', bg: '#fef9c3' };
      if (score <= 15) return { label: '中等度',   color: '#ea580c', bg: '#ffedd5' };
      if (score <= 20) return { label: '重度',     color: '#dc2626', bg: '#fee2e2' };
      return                  { label: '最重度',   color: '#991b1b', bg: '#fecaca' };
    case 'HAM-D':
      if (score <= 7)  return { label: '正常',     color: '#16a34a', bg: '#dcfce7' };
      if (score <= 13) return { label: '軽度',     color: '#ca8a04', bg: '#fef9c3' };
      if (score <= 18) return { label: '中等度',   color: '#ea580c', bg: '#ffedd5' };
      if (score <= 22) return { label: '重度',     color: '#dc2626', bg: '#fee2e2' };
      return                  { label: '最重度',   color: '#991b1b', bg: '#fecaca' };
    case 'MADRS':
      if (score <= 6)  return { label: '正常',     color: '#16a34a', bg: '#dcfce7' };
      if (score <= 19) return { label: '軽度',     color: '#ca8a04', bg: '#fef9c3' };
      if (score <= 34) return { label: '中等度',   color: '#ea580c', bg: '#ffedd5' };
      return                  { label: '重度',     color: '#dc2626', bg: '#fee2e2' };
  }
}

export default function Overview() {
  const { currentPatient } = usePatient();
  const {
    phq9Data, qidsData, hamdData, madrsData,
    treatmentEvents, personas, outcomeScenarios,
  } = currentPatient;
  const patient = currentPatient;

  const latestPhq9  = phq9Data[phq9Data.length - 1].total;
  const latestQids  = qidsData[qidsData.length - 1].total;
  const latestHamd  = hamdData[hamdData.length - 1].total;
  const latestMadrs = madrsData[madrsData.length - 1].total;

  const scores = useMemo<{ test: TestKey; latest: number; max: number; color: string; prev: number }[]>(() => [
    { test: 'PHQ-9', latest: latestPhq9,  max: 27, color: '#6366f1', prev: phq9Data[phq9Data.length - 2].total },
    { test: 'QIDS',  latest: latestQids,  max: 27, color: '#8b5cf6', prev: qidsData[qidsData.length - 2].total },
    { test: 'HAM-D', latest: latestHamd,  max: 52, color: '#3b82f6', prev: hamdData[hamdData.length - 2].total },
    { test: 'MADRS', latest: latestMadrs, max: 60, color: '#06b6d4', prev: madrsData[madrsData.length - 2].total },
  ], [latestPhq9, latestQids, latestHamd, latestMadrs, phq9Data, qidsData, hamdData, madrsData]);

  const sparkData = useMemo(() =>
    phq9Data.slice(-6).map((d) => ({ date: d.date.slice(5), score: d.total })),
    [phq9Data]
  );

  const baselinePhq9 = phq9Data[0].total;
  const improvePct = baselinePhq9 > 0
    ? Math.round(((baselinePhq9 - latestPhq9) / baselinePhq9) * 100)
    : 0;

  const topPersona = useMemo(() =>
    [...personas].sort((a, b) => b.probability - a.probability)[0],
    [personas]
  );

  const bestScenario = outcomeScenarios[2] ?? outcomeScenarios[0];

  const medCategory = patient.currentMedication.category.match(/^([A-Z]+)/)?.[1] ?? 'SSRI';
  const therapyShort = patient.psychotherapy.type.match(/（([^）]+)）/)?.[1] ?? 'CBT';

  return (
    <div className="grid grid-cols-12 gap-4 h-full" style={{ maxHeight: 'calc(100vh - 140px)' }}>

      {/* ===== 左列 (3/12) ===== */}
      <div className="col-span-3 flex flex-col gap-3">

        {/* 患者情報 */}
        <div className="bg-slate-800 text-white rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
              {patient.name[0]}
            </div>
            <div>
              <div className="text-sm font-semibold">{patient.name.replace('（匿名）', '')}</div>
              <div className="text-xs text-slate-400">{patient.id}</div>
            </div>
          </div>
          <dl className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <dt className="text-slate-400">年齢帯</dt>
              <dd className="text-slate-100">{patient.ageGroup} · {patient.gender}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">診断</dt>
              <dd className="text-slate-100 text-right leading-tight">{patient.diagnosis}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">担当医</dt>
              <dd className="text-slate-100">{patient.primaryTherapist}</dd>
            </div>
          </dl>
          <div className="mt-3 pt-3 border-t border-slate-700 flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 bg-blue-600 rounded text-xs">{medCategory}</span>
            <span className="px-2 py-0.5 bg-emerald-600 rounded text-xs">{therapyShort}</span>
          </div>
        </div>

        {/* 改善サマリ */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">治療経過</div>
          <div className="text-center mb-3">
            <div className={`text-4xl font-bold ${improvePct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {improvePct >= 0 ? '-' : '+'}{Math.abs(improvePct)}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5">PHQ-9 改善率</div>
          </div>
          <div className="flex justify-between text-center text-xs mb-3">
            <div>
              <div className="text-lg font-bold text-red-500">{baselinePhq9}</div>
              <div className="text-slate-400">ベースライン</div>
            </div>
            <div className="flex items-center text-slate-400 text-lg">→</div>
            <div>
              <div className={`text-lg font-bold ${improvePct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{latestPhq9}</div>
              <div className="text-slate-400">最新</div>
            </div>
          </div>
          {/* スパークライン */}
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={sparkData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={false} />
              {treatmentEvents.map((e) => (
                <ReferenceLine key={e.date} x={e.date.slice(5)} stroke={e.color} strokeWidth={1} strokeDasharray="3 2" />
              ))}
              <Tooltip
                contentStyle={{ fontSize: '11px', padding: '4px 8px' }}
                formatter={(v) => [`${v}pt`, 'PHQ-9']}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1 mt-2">
            {treatmentEvents.map((e) => (
              <div key={e.date} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                <span className="truncate">{e.date.slice(5)} {e.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== 中央列 (5/12) ===== */}
      <div className="col-span-5 flex flex-col gap-3">

        {/* 4テスト最新スコア */}
        <div className="grid grid-cols-2 gap-3">
          {scores.map(({ test, latest, max, color, prev }) => {
            const sev = getSeverity(test, latest);
            const diff = latest - prev;
            return (
              <div key={test} className="bg-white rounded-xl shadow-sm p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-500">{test}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                    style={{ color: sev.color, backgroundColor: sev.bg }}
                  >
                    {sev.label}
                  </span>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold" style={{ color }}>{latest}</span>
                  <span className="text-xs text-slate-400 mb-1">/ {max}</span>
                </div>
                {diff !== 0 && (
                  <div
                    className="text-xs font-medium mt-0.5"
                    style={{ color: diff < 0 ? '#16a34a' : '#dc2626' }}
                  >
                    {diff < 0 ? '▼' : '▲'} {Math.abs(diff)} pt 前回比
                  </div>
                )}
                {/* ミニプログレスバー */}
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(latest / max) * 100}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* PHQ-9 全期間グラフ */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            PHQ-9 スコア推移（全期間）
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart
              data={phq9Data.map((d) => ({ date: d.date.slice(5), score: d.total }))}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={1} angle={-20} textAnchor="end" height={28} />
              <YAxis domain={[0, 27]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: '11px' }} formatter={(v) => [`${v}pt`, 'PHQ-9']} />
              {treatmentEvents.map((e) => (
                <ReferenceLine key={e.date} x={e.date.slice(5)} stroke={e.color} strokeDasharray="4 2" strokeWidth={1.5}
                  label={{ value: e.label, position: 'insideTopRight', fontSize: 9, fill: e.color }}
                />
              ))}
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>

          {/* KPI行 */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
            {[
              { label: '反応率',   value: '71%', color: 'text-blue-600' },
              { label: '寛解率',   value: '42%', color: 'text-emerald-600' },
              { label: '平均改善', value: '8週', color: 'text-purple-600' },
            ].map((kpi) => (
              <div key={kpi.label} className="text-center">
                <div className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</div>
                <div className="text-xs text-slate-400">{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== 右列 (4/12) ===== */}
      <div className="col-span-4 flex flex-col gap-3">

        {/* ペルソナ分析 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">ペルソナ分析</div>
          <div className="space-y-2.5">
            {personas.map((p) => (
              <div key={p.id} className={`rounded-lg p-2.5 ${p.id === topPersona.id ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-semibold ${p.id === topPersona.id ? 'text-blue-700' : 'text-slate-700'}`}>
                    {p.id === topPersona.id && '★ '}{p.name}
                  </span>
                  <span className={`text-xs font-bold ${p.id === topPersona.id ? 'text-blue-600' : 'text-slate-500'}`}>
                    {p.probability}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${p.id === topPersona.id ? 'bg-blue-500' : 'bg-slate-400'}`}
                    style={{ width: `${p.probability}%` }}
                  />
                </div>
                {p.id === topPersona.id && (
                  <p className="text-xs text-blue-600 mt-1.5 leading-tight">{p.recommendedApproach}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 予後予測サマリ */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">予後予測（推奨シナリオ）</div>
          <div className="text-xs text-slate-400 mb-3 truncate">{bestScenario.label}</div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: '4週後', data: bestScenario.week4 },
              { label: '8週後', data: bestScenario.week8 },
              { label: '12週後', data: bestScenario.week12 },
            ].map(({ label, data }) => {
              const sev = getSeverity('PHQ-9', data.median);
              return (
                <div key={label} className="text-center bg-slate-50 rounded-lg p-2">
                  <div className="text-xs text-slate-400 mb-1">{label}</div>
                  <div className="text-xl font-bold" style={{ color: sev.color }}>{data.median}</div>
                  <div className="text-xs" style={{ color: sev.color }}>{sev.label}</div>
                  <div className="text-xs text-slate-400">{data.low}–{data.high}</div>
                </div>
              );
            })}
          </div>

          {/* 免責注記 */}
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-2 mt-auto">
            <p className="text-xs text-yellow-700 leading-tight">
              ⚠️ この予測は参考情報です。診断・治療の決定は必ず医師が行ってください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
