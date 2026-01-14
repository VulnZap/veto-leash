import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Console easter egg for developers
if (typeof window !== 'undefined') {
  console.log(`
%c  +  %c

%cve+o%c — Authorization infrastructure for AI agents.

Control what agents can access, do, and change.
Before they touch the real world, they go through Veto.

%c→ GitHub:%c https://github.com/VulnZap/veto
%c→ Docs:%c   https://github.com/VulnZap/veto/docs
%c→ We're hiring:%c https://plaw.inc/careers

`,
    'font-size: 48px; font-family: monospace; color: #f97316;',
    '',
    'font-size: 24px; font-family: monospace; font-weight: bold; color: #e5e5e5;',
    'font-size: 14px; font-family: system-ui; color: #a3a3a3;',
    'font-weight: bold; color: #f97316;',
    'color: #e5e5e5;',
    'font-weight: bold; color: #f97316;',
    'color: #e5e5e5;',
    'font-weight: bold; color: #f97316;',
    'color: #e5e5e5;'
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
