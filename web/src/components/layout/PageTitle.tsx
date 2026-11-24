import type { ReactNode } from 'react';
export function PageTitle({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <div className="page-title">
      <p className="eyebrow">
        {eyebrow}
        <span />
      </p>
      <h1>{children}</h1>
    </div>
  );
}
