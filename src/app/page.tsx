'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import TabNavigation from '@/components/TabNavigation';
import Overview from '@/components/tabs/Overview';
import PatientTimeline from '@/components/tabs/PatientTimeline';
import EpisodeComparison from '@/components/tabs/EpisodeComparison';
import PrognosisPrediction from '@/components/tabs/PrognosisPrediction';

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-6 bg-slate-50 overflow-hidden">
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'timeline' && <PatientTimeline />}
        {activeTab === 'comparison' && <EpisodeComparison />}
        {activeTab === 'prognosis' && <PrognosisPrediction />}
      </main>
    </div>
  );
}
