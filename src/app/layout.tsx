import type { Metadata } from 'next';
import './globals.css';
import { PatientProvider } from '@/contexts/PatientContext';

export const metadata: Metadata = {
  title: 'Depression Treatment Dashboard',
  description: 'Clinical decision support system for depression treatment',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <PatientProvider>{children}</PatientProvider>
      </body>
    </html>
  );
}
