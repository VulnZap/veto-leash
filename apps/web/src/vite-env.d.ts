/// <reference types="vite/client" />

declare module 'react-dom/client' {
  import { Container } from 'react-dom';
  import { ReactNode } from 'react';

  interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }

  function createRoot(container: Container | null): Root;
  function hydrateRoot(container: Container | null, initialChildren: ReactNode): Root;

  export { createRoot, hydrateRoot, Root };
}
