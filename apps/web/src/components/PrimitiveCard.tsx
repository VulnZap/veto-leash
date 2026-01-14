import { ReactNode } from 'react';

interface PrimitiveCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  delay?: number;
}

export function PrimitiveCard({ icon, title, description }: PrimitiveCardProps) {
  return (
    <div className="card-hover p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/50">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-veto-orange/10 flex items-center justify-center text-veto-orange">
          {icon}
        </div>
        <div>
          <h3 className="font-mono font-medium text-lg mb-2">{title}</h3>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

// Icons for primitives
export const PrimitiveIcons = {
  intercept: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  enforce: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  approve: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  audit: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
};
