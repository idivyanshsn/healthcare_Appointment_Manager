import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CarePulse — Healthcare Appointment & Follow-up Manager',
  description:
    'Full-stack intelligent clinical appointment scheduling with AI symptom triage, double-booking guard, slot hold engine, and medication follow-ups.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
