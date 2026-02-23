import type { PatientData } from '@/types/patient';

const PATIENTS_KEY = 'pt_custom_patients';

export function generateAnonymousId(existingIds: string[]): string {
  const usedNums = new Set(
    existingIds
      .filter((id) => /^U\d+$/.test(id))
      .map((id) => parseInt(id.slice(1), 10)),
  );
  let n = 1;
  while (usedNums.has(n)) n++;
  return `U${String(n).padStart(3, '0')}`;
}

export function saveCustomPatients(patients: PatientData[]): void {
  try {
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
  } catch {
    // ignore storage errors
  }
}

export function loadCustomPatients(): PatientData[] {
  try {
    const raw = localStorage.getItem(PATIENTS_KEY);
    return raw ? (JSON.parse(raw) as PatientData[]) : [];
  } catch {
    return [];
  }
}
