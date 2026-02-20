import { patient } from '@/data/patient';

export default function Header() {
  return (
    <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Depression Treatment Dashboard</h1>
          <p className="text-xs text-slate-400">Clinical Decision Support System</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">患者ID:</span>
            <span className="text-sm font-mono font-semibold text-blue-300">{patient.id}</span>
          </div>
          <div className="text-sm text-slate-200">{patient.name}</div>
        </div>
        <div className="w-px h-10 bg-slate-700" />
        <div className="text-right">
          <div className="text-xs text-slate-400">担当医</div>
          <div className="text-sm text-slate-200">{patient.primaryTherapist}</div>
        </div>
      </div>
    </header>
  );
}
