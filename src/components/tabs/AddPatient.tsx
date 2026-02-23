'use client';

import { useState, useRef } from 'react';
import { usePatient } from '@/contexts/PatientContext';
import type { TestKey, PHQ9Item, PHQ9DataPoint, SimpleDataPoint, PatientData } from '@/types/patient';
import { phq9ItemLabels } from '@/types/patient';

// ---- 定数 ----

const TEST_MAX: Record<TestKey, number> = {
  'PHQ-9': 27,
  'QIDS': 27,
  'HAM-D': 52,
  'MADRS': 60,
};

const PHQ9_KEYS = ['item1','item2','item3','item4','item5','item6','item7','item8','item9'] as const;

const EMPTY_PHQ9_ITEMS: PHQ9Item = { item1:0, item2:0, item3:0, item4:0, item5:0, item6:0, item7:0, item8:0, item9:0 };

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---- モック OCR（患者情報票読み取り） ----

function mockOcrPatient(): Promise<{
  name: string; dob: string; gender: '男性' | '女性'; diagnosis: string;
}> {
  return new Promise(resolve => setTimeout(() => {
    resolve({
      name: '読み取り結果（要確認）',
      dob: '1980-01-01',
      gender: '男性',
      diagnosis: '大うつ病性障害',
    });
  }, 1500));
}

function mockOcrTest(testKey: TestKey): Promise<{ items?: PHQ9Item; total: number }> {
  return new Promise(resolve => setTimeout(() => {
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
      resolve({ total: Math.floor(Math.random() * (max * 0.6)) + Math.floor(max * 0.1) });
    }
  }, 1500));
}

// ---- PHQ-9 項目スライダー ----

function Phq9ItemsForm({ items, onChange }: { items: PHQ9Item; onChange: (v: PHQ9Item) => void }) {
  const total = PHQ9_KEYS.reduce((s, k) => s + items[k], 0);
  return (
    <div className="space-y-3">
      {PHQ9_KEYS.map(key => (
        <div key={key} className="flex items-center gap-3">
          <label className="text-xs text-gray-600 w-28 shrink-0 leading-tight">{phq9ItemLabels[key]}</label>
          <input
            type="range" min={0} max={3} step={1} value={items[key]}
            onChange={e => onChange({ ...items, [key]: Number(e.target.value) })}
            className="flex-1 accent-indigo-500"
          />
          <span className="text-sm font-semibold text-indigo-600 w-5 text-right">{items[key]}</span>
        </div>
      ))}
      <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-gray-500">合計スコア</span>
        <span className="text-2xl font-bold text-indigo-600">{total}<span className="text-sm text-gray-400 ml-1">/ 27</span></span>
      </div>
    </div>
  );
}

// ---- 単純スコア入力 ----

function SimpleScoreForm({ testKey, value, onChange }: { testKey: TestKey; value: number; onChange: (v: number) => void }) {
  const max = TEST_MAX[testKey];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="number" min={0} max={max} value={value}
          onChange={e => onChange(Math.min(max, Math.max(0, Number(e.target.value))))}
          className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-lg font-semibold text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <span className="text-sm text-gray-400">/ {max} 点</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}

// ---- メインコンポーネント ----

type Step = 'info' | 'test' | 'done';

export default function AddPatient() {
  const { addPatient, selectPatient } = usePatient();
  const [step, setStep] = useState<Step>('info');
  const [addedId, setAddedId] = useState('');

  // 患者基本情報
  const [realName, setRealName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'男性' | '女性'>('男性');
  const [diagnosis, setDiagnosis] = useState('大うつ病性障害');
  const [institutionalId, setInstitutionalId] = useState('');
  const [notes, setNotes] = useState('');

  // OCR（患者情報票）
  const infoFileRef = useRef<HTMLInputElement>(null);
  const [infoFile, setInfoFile] = useState<File | null>(null);
  const [ocrInfoLoading, setOcrInfoLoading] = useState(false);

  // 初回検査結果
  const [includeTest, setIncludeTest] = useState(false);
  const [testKey, setTestKey] = useState<TestKey>('PHQ-9');
  const [testDate, setTestDate] = useState(todayStr());
  const [phq9Items, setPhq9Items] = useState<PHQ9Item>(EMPTY_PHQ9_ITEMS);
  const [simpleScore, setSimpleScore] = useState(0);
  const [testInputMode, setTestInputMode] = useState<'manual' | 'ocr'>('manual');
  const testFileRef = useRef<HTMLInputElement>(null);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [ocrTestLoading, setOcrTestLoading] = useState(false);
  const [ocrTestDone, setOcrTestDone] = useState(false);

  async function handleOcrInfo() {
    if (!infoFile) return;
    setOcrInfoLoading(true);
    try {
      const result = await mockOcrPatient();
      setRealName(result.name);
      setDob(result.dob);
      setGender(result.gender);
      setDiagnosis(result.diagnosis);
    } finally {
      setOcrInfoLoading(false);
    }
  }

  async function handleOcrTest() {
    if (!testFile) return;
    setOcrTestLoading(true);
    try {
      const result = await mockOcrTest(testKey);
      if (testKey === 'PHQ-9' && result.items) {
        setPhq9Items(result.items);
      } else {
        setSimpleScore(result.total);
      }
      setOcrTestDone(true);
    } finally {
      setOcrTestLoading(false);
    }
  }

  function handleRegister() {
    // 初回検査データを構築
    const phq9Data: PHQ9DataPoint[] = [];
    const qidsData: SimpleDataPoint[] = [];
    const hamdData: SimpleDataPoint[] = [];
    const madrsData: SimpleDataPoint[] = [];

    if (includeTest) {
      if (testKey === 'PHQ-9') {
        const total = PHQ9_KEYS.reduce((s, k) => s + phq9Items[k], 0);
        phq9Data.push({ date: testDate, items: phq9Items, total });
      } else if (testKey === 'QIDS') {
        qidsData.push({ date: testDate, total: simpleScore });
      } else if (testKey === 'HAM-D') {
        hamdData.push({ date: testDate, total: simpleScore });
      } else {
        madrsData.push({ date: testDate, total: simpleScore });
      }
    }

    const info: Omit<PatientData, 'id'> = {
      name: institutionalId || realName || '匿名患者',
      ageGroup: dob ? `${new Date().getFullYear() - new Date(dob).getFullYear()}歳代` : '不明',
      gender,
      diagnosis,
      diagnosisDate: todayStr(),
      currentMedication: { category: '未設定', startDate: todayStr() },
      psychotherapy: { type: '未設定', startDate: todayStr(), frequency: '未設定' },
      primaryTherapist: '未設定',
      improvementPattern: 'stable',
      phq9Data,
      qidsData,
      hamdData,
      madrsData,
      treatmentEvents: [],
      personas: [],
      outcomeScenarios: [],
      similarPatients: [],
      realName: realName || undefined,
      institutionalId: institutionalId || undefined,
    };

    const id = addPatient(info);
    setAddedId(id);
    setStep('done');
  }

  function handleGoToPatient() {
    selectPatient(addedId);
    resetForm();
  }

  function resetForm() {
    setStep('info');
    setAddedId('');
    setRealName('');
    setDob('');
    setGender('男性');
    setDiagnosis('大うつ病性障害');
    setInstitutionalId('');
    setNotes('');
    setInfoFile(null);
    setIncludeTest(false);
    setTestKey('PHQ-9');
    setTestDate(todayStr());
    setPhq9Items(EMPTY_PHQ9_ITEMS);
    setSimpleScore(0);
    setTestInputMode('manual');
    setTestFile(null);
    setOcrTestDone(false);
  }

  // ---- 完了画面 ----
  if (step === 'done') {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center space-y-6">
        <div className="text-5xl">✅</div>
        <h2 className="text-2xl font-bold text-slate-800">患者を登録しました</h2>
        <p className="text-slate-500">
          匿名ID: <span className="font-mono font-bold text-indigo-600 text-lg">{addedId}</span>
          {institutionalId && (
            <span className="ml-2 text-slate-400">（施設ID: {institutionalId}）</span>
          )}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleGoToPatient}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            この患者のダッシュボードを開く
          </button>
          <button
            onClick={resetForm}
            className="px-6 py-2.5 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            別の患者を追加する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">新規患者を追加</h1>
        <p className="text-slate-500 text-sm mt-1">
          患者情報を入力し、匿名IDを発行します。実名は分離保管されます。
        </p>
      </div>

      {/* セクション 1: 患者基本情報 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">患者基本情報</h2>
          {/* OCR 読み込み（患者情報票） */}
          <div className="flex items-center gap-2">
            <input
              ref={infoFileRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={e => setInfoFile(e.target.files?.[0] ?? null)}
            />
            <button
              onClick={() => infoFileRef.current?.click()}
              className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              📎 {infoFile ? infoFile.name : '患者情報票を読み込む'}
            </button>
            {infoFile && (
              <button
                onClick={handleOcrInfo}
                disabled={ocrInfoLoading}
                className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {ocrInfoLoading ? '読み取り中...' : '📷 OCR'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">実名（任意）</label>
            <input
              type="text" value={realName} onChange={e => setRealName(e.target.value)}
              placeholder="山田 太郎"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <p className="text-xs text-slate-400 mt-1">ダッシュボードには表示されません</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">施設ID（任意）</label>
            <input
              type="text" value={institutionalId} onChange={e => setInstitutionalId(e.target.value)}
              placeholder="例: MH-2024-001"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <p className="text-xs text-slate-400 mt-1">空欄時は U-ID を自動発行</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">生年月日</label>
            <input
              type="date" value={dob} onChange={e => setDob(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">性別</label>
            <select
              value={gender} onChange={e => setGender(e.target.value as '男性' | '女性')}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="男性">男性</option>
              <option value="女性">女性</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">診断名</label>
            <input
              type="text" value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">備考</label>
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>
      </div>

      {/* セクション 2: 初回検査結果（任意） */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3">
          <input
            type="checkbox" id="includeTest" checked={includeTest}
            onChange={e => setIncludeTest(e.target.checked)}
            className="w-4 h-4 accent-indigo-500"
          />
          <label htmlFor="includeTest" className="text-base font-semibold text-slate-800 cursor-pointer">
            初回検査結果を登録する（任意）
          </label>
        </div>

        {includeTest && (
          <div className="space-y-5">
            {/* 入力モード切替 */}
            <div className="flex border-b border-slate-200">
              {([['manual', '手動入力'], ['ocr', 'OCRで読み込む']] as ['manual' | 'ocr', string][]).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTestInputMode(id)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    testInputMode === id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {id === 'ocr' && '📷 '}{label}
                </button>
              ))}
            </div>

            {/* OCR タブ */}
            {testInputMode === 'ocr' && (
              <div className="space-y-4">
                <input
                  ref={testFileRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={e => { setTestFile(e.target.files?.[0] ?? null); setOcrTestDone(false); }}
                />
                <button
                  onClick={() => testFileRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 rounded-xl p-5 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                >
                  <div className="text-2xl mb-1">📎</div>
                  <div className="text-sm text-slate-600">{testFile ? testFile.name : '検査票を選択'}</div>
                  <div className="text-xs text-slate-400 mt-1">画像 (JPG/PNG) または PDF</div>
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">検査種別</label>
                    <select
                      value={testKey}
                      onChange={e => { setTestKey(e.target.value as TestKey); setOcrTestDone(false); setPhq9Items(EMPTY_PHQ9_ITEMS); setSimpleScore(0); }}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      {(['PHQ-9', 'QIDS', 'HAM-D', 'MADRS'] as TestKey[]).map(t => (
                        <option key={t} value={t}>{t}（0〜{TEST_MAX[t]}点）</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">実施日</label>
                    <input type="date" value={testDate} onChange={e => setTestDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>
                <button
                  onClick={handleOcrTest}
                  disabled={!testFile || ocrTestLoading}
                  className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {ocrTestLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      読み取り中...
                    </>
                  ) : '📷 OCRで読み取る'}
                </button>
                {ocrTestDone && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
                    ✅ 読み取り完了。下欄で内容を確認・修正してください。
                  </div>
                )}
              </div>
            )}

            {/* 手動 or OCR後のスコア入力 */}
            {(testInputMode === 'manual' || ocrTestDone) && (
              <div className="space-y-4">
                {testInputMode === 'manual' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">検査種別</label>
                      <select
                        value={testKey}
                        onChange={e => { setTestKey(e.target.value as TestKey); setPhq9Items(EMPTY_PHQ9_ITEMS); setSimpleScore(0); }}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        {(['PHQ-9', 'QIDS', 'HAM-D', 'MADRS'] as TestKey[]).map(t => (
                          <option key={t} value={t}>{t}（0〜{TEST_MAX[t]}点）</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">実施日</label>
                      <input type="date" value={testDate} onChange={e => setTestDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                )}
                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                    {testKey} スコア入力
                    {ocrTestDone && <span className="ml-2 text-green-600 normal-case">（OCR読み取り結果）</span>}
                  </h3>
                  {testKey === 'PHQ-9' ? (
                    <Phq9ItemsForm items={phq9Items} onChange={setPhq9Items} />
                  ) : (
                    <SimpleScoreForm testKey={testKey} value={simpleScore} onChange={setSimpleScore} />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 登録ボタン */}
      <div className="flex justify-end gap-3 pb-8">
        <button
          onClick={resetForm}
          className="px-5 py-2.5 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
        >
          リセット
        </button>
        <button
          onClick={handleRegister}
          className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          患者を登録する →
        </button>
      </div>
    </div>
  );
}
