'use client';

import { useState, useMemo } from 'react';
import type { PHQ9DataPoint, SimpleDataPoint } from '@/types/patient';
import { usePatient } from '@/contexts/PatientContext';
import ScoreLineChart from '@/components/charts/ScoreLineChart';
import HeatmapChart from '@/components/charts/HeatmapChart';

// ---- 型定義 ----

type TestKey = 'PHQ-9' | 'QIDS' | 'HAM-D' | 'MADRS';
type PeriodKey = '3m' | '6m' | 'all';

// ---- 重症度判定 ----

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

// ---- テスト設定 ----

// ---- 期間フィルタ ----

const periodDays: Record<PeriodKey, number> = {
  '3m': 90,
  '6m': 180,
  'all': Infinity,
};

const periodLabel: Record<PeriodKey, string> = {
  '3m': '直近3か月',
  '6m': '直近6か月',
  'all': '全期間',
};

function filterByPeriod<T extends { date: string }>(data: T[], days: number): T[] {
  if (!isFinite(days)) return data;
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return data.filter((d) => new Date(d.date) >= cutoff);
}

// ---- メインコンポーネント ----

export default function PatientTimeline() {
  const { currentPatient } = usePatient();
  const { phq9Data, qidsData, hamdData, madrsData, treatmentEvents } = currentPatient;
  const patient = currentPatient;

  const [selectedTest, setSelectedTest] = useState<TestKey>('PHQ-9');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('all');

  const testConfig = useMemo<Record<TestKey, { color: string; maxScore: number; rawData: (PHQ9DataPoint | SimpleDataPoint)[] }>>(() => ({
    'PHQ-9': { color: '#6366f1', maxScore: 27, rawData: phq9Data },
    'QIDS':  { color: '#8b5cf6', maxScore: 27, rawData: qidsData },
    'HAM-D': { color: '#3b82f6', maxScore: 52, rawData: hamdData },
    'MADRS': { color: '#06b6d4', maxScore: 60, rawData: madrsData },
  }), [phq9Data, qidsData, hamdData, madrsData]);

  const { color, maxScore, rawData } = testConfig[selectedTest];
  const days = periodDays[selectedPeriod];

  // フィルタ後のスコアデータ（{ date, total }[]）
  const filteredScoreData = useMemo(() => {
    const filtered = filterByPeriod(rawData, days);
    return filtered.map((d) => ({ date: d.date, total: d.total }));
  }, [rawData, days]);

  // PHQ-9ヒートマップ用データ
  const filteredPhq9Data = useMemo(() => {
    if (selectedTest !== 'PHQ-9') return [];
    return filterByPeriod(phq9Data, days);
  }, [selectedTest, days, phq9Data]);

  // フィルタ後の治療イベント
  const filteredEvents = useMemo(() => {
    return filterByPeriod(treatmentEvents, days);
  }, [days, treatmentEvents]);

  // 最新スコア
  const latestScore = filteredScoreData.length > 0
    ? filteredScoreData[filteredScoreData.length - 1].total
    : null;

  const severity = latestScore !== null ? getSeverity(selectedTest, latestScore) : null;

  const tests: TestKey[] = ['PHQ-9', 'QIDS', 'HAM-D', 'MADRS'];
  const periods: PeriodKey[] = ['3m', '6m', 'all'];

  return (
    <div className="flex gap-6 min-h-0">
      {/* ---- 左メインエリア ---- */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">

        {/* テスト切替タブ + 期間フィルタ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* テストタブ */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {tests.map((test) => (
              <button
                key={test}
                onClick={() => setSelectedTest(test)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedTest === test
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {test}
              </button>
            ))}
          </div>

          {/* 期間フィルタ */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {periods.map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {periodLabel[period]}
              </button>
            ))}
          </div>
        </div>

        {/* スコア折れ線グラフ */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {selectedTest} スコア推移
          </h3>
          {filteredScoreData.length > 0 ? (
            <ScoreLineChart
              data={filteredScoreData}
              events={filteredEvents}
              color={color}
              maxScore={maxScore}
            />
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              選択期間のデータがありません
            </div>
          )}
        </div>

        {/* PHQ-9 ヒートマップ */}
        {selectedTest === 'PHQ-9' && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              PHQ-9 項目別スコアヒートマップ
            </h3>
            <HeatmapChart data={filteredPhq9Data} />
          </div>
        )}
      </div>

      {/* ---- 右サイドバー ---- */}
      <div className="w-80 shrink-0 flex flex-col gap-4">

        {/* 患者サマリカード */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            患者サマリ
          </h3>
          <dl className="space-y-2">
            <div className="flex items-start gap-2">
              <dt className="text-xs text-gray-500 w-14 shrink-0 pt-0.5">年齢帯</dt>
              <dd className="text-sm font-medium text-gray-800">{patient.ageGroup}</dd>
            </div>
            <div className="flex items-start gap-2">
              <dt className="text-xs text-gray-500 w-14 shrink-0 pt-0.5">性別</dt>
              <dd className="text-sm font-medium text-gray-800">{patient.gender}</dd>
            </div>
            <div className="flex items-start gap-2">
              <dt className="text-xs text-gray-500 w-14 shrink-0 pt-0.5">診断</dt>
              <dd className="text-sm font-medium text-gray-800 leading-tight">
                {patient.diagnosis}
              </dd>
            </div>
            <div className="flex items-start gap-2">
              <dt className="text-xs text-gray-500 w-14 shrink-0 pt-0.5">診断日</dt>
              <dd className="text-sm text-gray-700">{patient.diagnosisDate}</dd>
            </div>
            <div className="flex items-start gap-2">
              <dt className="text-xs text-gray-500 w-14 shrink-0 pt-0.5">担当</dt>
              <dd className="text-sm text-gray-700">{patient.primaryTherapist}</dd>
            </div>
          </dl>
        </div>

        {/* 現在治療カード */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            現在の治療
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">薬物療法</p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                  SSRI
                </span>
                <span className="text-sm text-gray-700">
                  {patient.currentMedication.category}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                開始日: {patient.currentMedication.startDate}
              </p>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500 mb-1">心理療法</p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs font-medium">
                  CBT
                </span>
                <span className="text-sm text-gray-700">
                  {patient.psychotherapy.type}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {patient.psychotherapy.frequency}・開始: {patient.psychotherapy.startDate}
              </p>
            </div>
          </div>
        </div>

        {/* 最新スコアカード */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {selectedTest} 最新スコア
          </h3>
          {latestScore !== null && severity ? (
            <div className="flex items-end justify-between">
              <div>
                <p
                  className="text-5xl font-bold leading-none"
                  style={{ color }}
                >
                  {latestScore}
                </p>
                <p className="text-xs text-gray-500 mt-1">/ {maxScore} 点</p>
              </div>
              <div className="text-right">
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                  style={{ color: severity.color, backgroundColor: severity.bg }}
                >
                  {severity.label}
                </span>
                {filteredScoreData.length >= 2 && (() => {
                  const prev = filteredScoreData[filteredScoreData.length - 2].total;
                  const diff = latestScore - prev;
                  if (diff === 0) return null;
                  const isImproved = diff < 0;
                  return (
                    <p
                      className="text-xs mt-1 font-medium"
                      style={{ color: isImproved ? '#16a34a' : '#dc2626' }}
                    >
                      {isImproved ? '▼' : '▲'} {Math.abs(diff)} pt (前回比)
                    </p>
                  );
                })()}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">データなし</p>
          )}
        </div>
      </div>
    </div>
  );
}
