'use client';

import { useState, useRef } from 'react';
import { usePatient } from '@/contexts/PatientContext';
import type { TestKey, PHQ9DataPoint, SimpleDataPoint, PHQ9Item } from '@/types/patient';
import { phq9ItemLabels } from '@/types/patient';

// ---- 定数 ----

const TEST_MAX: Record<TestKey, number> = {
  'PHQ-9': 27,
  'QIDS': 27,
  'HAM-D': 52,
  'MADRS': 60,
};

const PHQ9_KEYS = ['item1','item2','item3','item4','item5','item6','item7','item8','item9'] as const;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---- モック OCR ----

function mockOcr(testKey: TestKey): Promise<{ items?: PHQ9Item; total: number }> {
  return new Promise(resolve => {
    setTimeout(() => {
      if (testKey === 'PHQ-9') {
        const items: PHQ9Item = {} as PHQ9Item;
        let total = 0;
        for (const k of PHQ9_KEYS) {
          const v = Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3;
          items[k] = v;
          total += v;
        }
        resolve({ items, total });
      } else {
        const max = TEST_MAX[testKey];
        const total = Math.floor(Math.random() * (max * 0.6)) + Math.floor(max * 0.1);
        resolve({ total });
      }
    }, 1500);
  });
}

// ---- サブコンポーネント：PHQ-9 9項目入力 ----

function Phq9ItemsForm({
  items,
  onChange,
}: {
  items: PHQ9Item;
  onChange: (items: PHQ9Item) => void;
}) {
  const total = PHQ9_KEYS.reduce((s, k) => s + items[k], 0);

  return (
    <div className="space-y-3">
      {PHQ9_KEYS.map((key) => (
        <div key={key} className="flex items-center gap-3">
          <label className="text-xs text-gray-600 w-28 shrink-0 leading-tight">
            {phq9ItemLabels[key]}
          </label>
          <input
            type="range"
            min={0}
            max={3}
            step={1}
            value={items[key]}
            onChange={e => onChange({ ...items, [key]: Number(e.target.value) })}
            className="flex-1 accent-indigo-500"
          />
          <span className="text-sm font-semibold text-indigo-600 w-5 text-right">
            {items[key]}
          </span>
        </div>
      ))}
      <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-gray-500">合計スコア</span>
        <span className="text-2xl font-bold text-indigo-600">{total}<span className="text-sm text-gray-400 ml-1">/ 27</span></span>
      </div>
    </div>
  );
}

// ---- サブコンポーネント：単純スコア入力 ----

function SimpleScoreForm({
  testKey,
  value,
  onChange,
}: {
  testKey: TestKey;
  value: number;
  onChange: (v: number) => void;
}) {
  const max = TEST_MAX[testKey];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={e => onChange(Math.min(max, Math.max(0, Number(e.target.value))))}
          className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-lg font-semibold text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <span className="text-sm text-gray-400">/ {max} 点</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-400 rounded-full transition-all"
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ---- メインコンポーネント ----

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type InputTab = 'manual' | 'ocr';

const EMPTY_PHQ9_ITEMS: PHQ9Item = { item1:0, item2:0, item3:0, item4:0, item5:0, item6:0, item7:0, item8:0, item9:0 };

export default function AddTestModal({ isOpen, onClose }: Props) {
  const { selectedId, addTestResult } = usePatient();

  // フォーム状態
  const [inputTab, setInputTab] = useState<InputTab>('manual');
  const [testKey, setTestKey] = useState<TestKey>('PHQ-9');
  const [date, setDate] = useState(todayStr());
  const [phq9Items, setPhq9Items] = useState<PHQ9Item>(EMPTY_PHQ9_ITEMS);
  const [simpleScore, setSimpleScore] = useState(0);

  // OCR状態
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleTestKeyChange(next: TestKey) {
    setTestKey(next);
    setPhq9Items(EMPTY_PHQ9_ITEMS);
    setSimpleScore(0);
    setOcrDone(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setOcrFile(file);
    setOcrDone(false);
    if (!file) { setOcrPreview(null); return; }
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => setOcrPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setOcrPreview(null); // PDF はプレビューなし
    }
  }

  async function handleOcr() {
    if (!ocrFile) return;
    setOcrLoading(true);
    try {
      const result = await mockOcr(testKey);
      if (testKey === 'PHQ-9' && result.items) {
        setPhq9Items(result.items);
      } else {
        setSimpleScore(result.total);
      }
      setOcrDone(true);
    } finally {
      setOcrLoading(false);
    }
  }

  function handleSave() {
    let point: PHQ9DataPoint | SimpleDataPoint;
    if (testKey === 'PHQ-9') {
      const total = PHQ9_KEYS.reduce((s, k) => s + phq9Items[k], 0);
      point = { date, items: phq9Items, total };
    } else {
      point = { date, total: simpleScore };
    }
    addTestResult(selectedId, testKey, point);
    handleClose();
  }

  function handleClose() {
    setInputTab('manual');
    setTestKey('PHQ-9');
    setDate(todayStr());
    setPhq9Items(EMPTY_PHQ9_ITEMS);
    setSimpleScore(0);
    setOcrFile(null);
    setOcrPreview(null);
    setOcrDone(false);
    onClose();
  }

  const canSave = testKey === 'PHQ-9'
    ? true // PHQ-9 は常に保存可（0点でも有効）
    : simpleScore >= 0;

  // OCRタブ後に手動フォームで確認
  const showResultForm = inputTab === 'manual' || (inputTab === 'ocr' && ocrDone);

  return (
    <>
      {/* オーバーレイ */}
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40" onClick={handleClose} />}

      {/* ドロワー */}
      <div className={`fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* ヘッダー */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold">検査結果を追加</h2>
            <p className="text-xs text-slate-400 mt-0.5">患者ID: {selectedId}</p>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 入力タブ切替 */}
        <div className="flex border-b border-gray-200 shrink-0">
          {([['manual', '手動入力'], ['ocr', 'OCRで読み込む']] as [InputTab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setInputTab(id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                inputTab === id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {id === 'ocr' && '📷 '}{label}
            </button>
          ))}
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* OCR タブ: ファイルアップロード */}
          {inputTab === 'ocr' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">検査票の写真またはPDFをアップロードしてください</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                >
                  <div className="text-3xl mb-2">📎</div>
                  <div className="text-sm font-medium text-gray-600">
                    {ocrFile ? ocrFile.name : 'ファイルを選択'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">画像 (JPG/PNG) または PDF</div>
                </button>
              </div>

              {/* 画像プレビュー */}
              {ocrPreview && (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ocrPreview} alt="プレビュー" className="w-full object-contain max-h-48" />
                </div>
              )}
              {ocrFile && !ocrPreview && (
                <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2 text-sm text-gray-600">
                  <span>📄</span><span>{ocrFile.name}</span>
                </div>
              )}

              {/* 検査種別（OCRタブ内） */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">検査種別</label>
                <select
                  value={testKey}
                  onChange={e => handleTestKeyChange(e.target.value as TestKey)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {(['PHQ-9', 'QIDS', 'HAM-D', 'MADRS'] as TestKey[]).map(t => (
                    <option key={t} value={t}>{t}（0〜{TEST_MAX[t]}点）</option>
                  ))}
                </select>
              </div>

              {/* OCR実行ボタン */}
              <button
                onClick={handleOcr}
                disabled={!ocrFile || ocrLoading}
                className="w-full py-3 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {ocrLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    読み取り中...
                  </>
                ) : (
                  '📷 OCRで読み取る'
                )}
              </button>

              {ocrDone && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
                  ✅ 読み取り完了。下欄で内容を確認・修正してから保存してください。
                </div>
              )}
            </div>
          )}

          {/* 手動入力タブ: 日付 + 検査種別 */}
          {inputTab === 'manual' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">実施日</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">検査種別</label>
                <select
                  value={testKey}
                  onChange={e => handleTestKeyChange(e.target.value as TestKey)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {(['PHQ-9', 'QIDS', 'HAM-D', 'MADRS'] as TestKey[]).map(t => (
                    <option key={t} value={t}>{t}（0〜{TEST_MAX[t]}点）</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* OCR後の実施日入力 */}
          {inputTab === 'ocr' && ocrDone && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">実施日</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          )}

          {/* スコア入力フォーム（手動 or OCR後） */}
          {showResultForm && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                {testKey} スコア入力
                {inputTab === 'ocr' && ocrDone && (
                  <span className="ml-2 text-green-600 normal-case">（OCR読み取り結果）</span>
                )}
              </h3>
              {testKey === 'PHQ-9' ? (
                <Phq9ItemsForm items={phq9Items} onChange={setPhq9Items} />
              ) : (
                <SimpleScoreForm testKey={testKey} value={simpleScore} onChange={setSimpleScore} />
              )}
            </div>
          )}
        </div>

        {/* フッター：保存ボタン */}
        <div className="px-5 py-4 border-t border-gray-200 shrink-0 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || (inputTab === 'ocr' && !ocrDone) || !date}
            className="flex-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            保存する →
          </button>
        </div>
      </div>
    </>
  );
}
