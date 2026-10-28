import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KeyShield — AI-Powered Secret Leak Detection & Response',
  description: 'Developer-first secret detection, masking, and automated local AI remediation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#A78BFA] text-slate-900 antialiased selection:bg-indigo-500/20 selection:text-indigo-950">
        {children}
      </body>
    </html>
  );
}
