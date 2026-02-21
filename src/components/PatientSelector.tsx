'use client';

import { useState, useMemo } from 'react';
import { usePatient } from '@/contexts/PatientContext';
import type { PatientSummary, ImprovementPattern } from '@/types/patient';

function getSeverityBadge(score: number): { label: string; cls: string } {
  if (score <= 4)  return { label: '軽微',     cls: 'bg-green-100 text-green-800' };
  if (score <= 9)  return { label: '軽度',     cls: 'bg-yellow-100 text-yellow-800' };
  if (score <= 14) return { label: '中等度',   cls: 'bg-orange-100 text-orange-800' };
  if (score <= 19) return { label: '中等重度', cls: 'bg-red-100 text-red-800' };
  return               { label: '重度',     cls: 'bg-red-200 text-red-900' };
}

const PATTERN: Record<ImprovementPattern, { icon: string; color: string; label: string }> = {
  improver: { icon: '↗', color: 'text-emerald-600', label: '改善中' },
  stable:   { icon: '→', color: 'text-amber-600',   label: '安定' },
  worsen:   { icon: '↘', color: 'text-red-500',     label: '悪化傾向' },
};

export default function PatientSelector() {
  const { currentPatient, summaries, selectPatient, selectedId } = usePatient();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return summaries;
    return summaries.filter(s =>
      s.id.toLowerCase().includes(q) ||
      s.name.replace('（匿名）', '').toLowerCase().includes(q) ||
      s.ageGroup.includes(q) ||
      s.gender.includes(q)
    );
  }, [summaries, query]);

  return (
    <>
      {/* ヘッダー内トリガーボタン */}
      <button
        onClick={() => setIsOpen(true)}
        className="text-right hover:bg-slate-800 rounded-lg px-3 py-1.5 transition-colors group"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">患者ID:</span>
          <span className="text-sm font-mono font-semibold text-blue-300">{currentPatient.id}</span>
          <svg className="w-3 h-3 text-slate-400 group-hover:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="text-sm text-slate-200 text-left">{currentPatient.name}</div>
      </button>

      {/* オーバーレイ */}
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setIsOpen(false)} />}

      {/* サイドドロワー */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* ドロワーヘッダー */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold">患者を選択</h2>
            <p className="text-xs text-slate-400">100名のダミーデータ</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 検索 */}
        <div className="px-4 py-3 border-b border-slate-200 shrink-0">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="ID・名前・年齢帯・性別で検索..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">✕</button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">{filtered.length}名を表示</p>
        </div>

        {/* 患者リスト */}
        <div className="overflow-y-auto flex-1">
          {filtered.map((s: PatientSummary) => {
            const sev = getSeverityBadge(s.latestPhq9);
            const pat = PATTERN[s.improvementPattern];
            const selected = s.id === selectedId;
            return (
              <button
                key={s.id}
                onClick={() => { selectPatient(s.id); setIsOpen(false); }}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 border-b border-slate-100 transition-colors border-l-4 ${selected ? 'bg-blue-50 border-l-blue-500' : 'hover:bg-slate-50 border-l-transparent'}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${selected ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {s.id.slice(1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-mono text-slate-400">{s.id}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${sev.cls}`}>{sev.label}</span>
                  </div>
                  <div className="text-sm font-medium text-slate-800 truncate">{s.name.replace('（匿名）', '')}</div>
                  <div className="text-xs text-slate-400">{s.ageGroup} · {s.gender}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-slate-700">{s.latestPhq9}</div>
                  <div className={`text-xs font-medium ${pat.color}`}>{pat.icon} {pat.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
