'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { PatientData, PatientSummary, PHQ9DataPoint, SimpleDataPoint, TestKey } from '@/types/patient';
import { getAllPatients } from '@/lib/patientGenerator';
import { generateAnonymousId, saveCustomPatients, loadCustomPatients } from '@/lib/patientStorage';

const STORAGE_KEY = 'patientracker_results';

type AddedResults = Record<string, {
  phq9Data: PHQ9DataPoint[];
  qidsData: SimpleDataPoint[];
  hamdData: SimpleDataPoint[];
  madrsData: SimpleDataPoint[];
}>;

type PatientContextValue = {
  currentPatient: PatientData;
  summaries: PatientSummary[];
  selectPatient: (id: string) => void;
  selectedId: string;
  addTestResult: (patientId: string, testKey: TestKey, point: PHQ9DataPoint | SimpleDataPoint) => void;
  addPatient: (info: Omit<PatientData, 'id'>) => string;
};

const PatientContext = createContext<PatientContextValue | null>(null);

function loadFromStorage(): AddedResults {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AddedResults) : {};
  } catch {
    return {};
  }
}

function mergeAndSort<T extends { date: string }>(base: T[], added: T[]): T[] {
  return [...base, ...added].sort((a, b) => a.date.localeCompare(b.date));
}

const BASE_PATIENTS = getAllPatients();

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [selectedId, setSelectedId] = useState('P001');
  const [addedResults, setAddedResults] = useState<AddedResults>({});
  const [customPatients, setCustomPatients] = useState<PatientData[]>([]);

  // Load persisted data on mount (client only)
  useEffect(() => {
    setAddedResults(loadFromStorage());
    setCustomPatients(loadCustomPatients());
  }, []);

  const allPatients = useMemo(
    () => [...BASE_PATIENTS, ...customPatients],
    [customPatients],
  );

  const summaries = useMemo((): PatientSummary[] =>
    allPatients.map(p => ({
      id: p.id,
      name: p.name,
      latestPhq9: p.phq9Data[p.phq9Data.length - 1]?.total ?? 0,
      ageGroup: p.ageGroup,
      gender: p.gender,
      improvementPattern: p.improvementPattern,
      isUserAdded: p.isUserAdded,
    })),
    [allPatients],
  );

  const currentPatient = useMemo((): PatientData => {
    const base = allPatients.find(p => p.id === selectedId) ?? allPatients[0];
    const extra = addedResults[base.id];
    if (!extra) return base;
    return {
      ...base,
      phq9Data: mergeAndSort(base.phq9Data, extra.phq9Data),
      qidsData: mergeAndSort(base.qidsData, extra.qidsData),
      hamdData: mergeAndSort(base.hamdData, extra.hamdData),
      madrsData: mergeAndSort(base.madrsData, extra.madrsData),
    };
  }, [allPatients, selectedId, addedResults]);

  const addTestResult = useCallback((
    patientId: string,
    testKey: TestKey,
    point: PHQ9DataPoint | SimpleDataPoint,
  ) => {
    setAddedResults(prev => {
      const existing = prev[patientId] ?? { phq9Data: [], qidsData: [], hamdData: [], madrsData: [] };
      let next: typeof existing;
      switch (testKey) {
        case 'PHQ-9': next = { ...existing, phq9Data: [...existing.phq9Data, point as PHQ9DataPoint] }; break;
        case 'QIDS':  next = { ...existing, qidsData: [...existing.qidsData, point as SimpleDataPoint] }; break;
        case 'HAM-D': next = { ...existing, hamdData: [...existing.hamdData, point as SimpleDataPoint] }; break;
        case 'MADRS': next = { ...existing, madrsData: [...existing.madrsData, point as SimpleDataPoint] }; break;
      }
      const updated = { ...prev, [patientId]: next };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, []);

  const addPatient = useCallback((info: Omit<PatientData, 'id'>): string => {
    const allIds = [...BASE_PATIENTS.map(p => p.id), ...customPatients.map(p => p.id)];
    const id = generateAnonymousId(allIds);
    const newPatient: PatientData = { ...info, id, isUserAdded: true };
    setCustomPatients(prev => {
      const updated = [...prev, newPatient];
      saveCustomPatients(updated);
      return updated;
    });
    return id;
  }, [customPatients]);

  return (
    <PatientContext.Provider value={{ currentPatient, summaries, selectPatient: setSelectedId, selectedId, addTestResult, addPatient }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient(): PatientContextValue {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error('usePatient must be used inside PatientProvider');
  return ctx;
}
