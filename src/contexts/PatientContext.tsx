'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { PatientData, PatientSummary, PHQ9DataPoint, SimpleDataPoint, TestKey } from '@/types/patient';
import { getAllPatients, getPatientSummaries } from '@/lib/patientGenerator';

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

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [selectedId, setSelectedId] = useState('P001');
  const [addedResults, setAddedResults] = useState<AddedResults>({});

  // Load from localStorage on mount (client only)
  useEffect(() => {
    setAddedResults(loadFromStorage());
  }, []);

  const allPatients = useMemo(() => getAllPatients(), []);
  const summaries = useMemo(() => getPatientSummaries(), []);

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

  return (
    <PatientContext.Provider value={{ currentPatient, summaries, selectPatient: setSelectedId, selectedId, addTestResult }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient(): PatientContextValue {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error('usePatient must be used inside PatientProvider');
  return ctx;
}
