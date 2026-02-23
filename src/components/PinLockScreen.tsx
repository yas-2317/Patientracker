'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export default function PinLockScreen() {
  const { hasPin, unlock, setPin } = useAuth();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');

  function handleDigit(digit: string) {
    if (digit === '⌫') {
      setInput((prev) => prev.slice(0, -1));
      setError('');
      return;
    }
    if (digit === '') return;
    if (input.length >= 4) return;
    const next = input + digit;
    setInput(next);

    if (next.length === 4) {
      if (hasPin) {
        // 認証モード
        unlock(next).then((ok) => {
          if (!ok) {
            setError('PINが違います');
            setInput('');
          }
        });
      } else {
        // 初回設定モード: step1
        if (step === 'enter') {
          setConfirmInput(next);
          setInput('');
          setStep('confirm');
        } else {
          // step2: 確認
          if (next === confirmInput) {
            setPin(next);
          } else {
            setError('PINが一致しません。最初からやり直してください');
            setInput('');
            setConfirmInput('');
            setStep('enter');
          }
        }
      }
    }
  }

  const title = hasPin
    ? 'PINを入力してください'
    : step === 'enter'
    ? 'PINを設定してください（4桁）'
    : 'もう一度入力してください';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-80">
        <h1 className="text-lg font-semibold text-slate-800 text-center mb-6">{title}</h1>

        {/* ドット表示 */}
        <div className="flex justify-center gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-colors ${
                i < input.length
                  ? 'bg-indigo-500 border-indigo-500'
                  : 'bg-transparent border-slate-300'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        {/* テンキー */}
        <div className="grid grid-cols-3 gap-3">
          {DIGITS.map((d, i) => (
            <button
              key={i}
              onClick={() => handleDigit(d)}
              disabled={d === ''}
              className={`h-14 rounded-xl text-xl font-semibold transition-colors ${
                d === ''
                  ? 'invisible'
                  : d === '⌫'
                  ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  : 'bg-slate-100 text-slate-800 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
