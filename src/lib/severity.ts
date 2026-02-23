import type { TestKey } from '@/types/patient';

export type SeverityInfo = { label: string; color: string; bg: string };

export function getSeverity(test: TestKey, score: number): SeverityInfo {
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
