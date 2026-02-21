'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import type { PatientData, PatientSummary } from '@/types/patient';
import { getAllPatients, getPatientSummaries } from '@/lib/patientGenerator';

type PatientContextValue = {
  currentPatient: PatientData;
  summaries: PatientSummary[];
  selectPatient: (id: string) => void;
  selectedId: string;
};

const PatientContext = createContext<PatientContextValue | null>(null);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [selectedId, setSelectedId] = useState('P001');
  const allPatients = useMemo(() => getAllPatients(), []);
  const summaries = useMemo(() => getPatientSummaries(), []);
  const currentPatient = useMemo(
    () => allPatients.find(p => p.id === selectedId) ?? allPatients[0],
    [allPatients, selectedId]
  );

  return (
    <PatientContext.Provider value={{ currentPatient, summaries, selectPatient: setSelectedId, selectedId }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient(): PatientContextValue {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error('usePatient must be used inside PatientProvider');
  return ctx;
}
