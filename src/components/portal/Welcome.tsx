import type { ReactNode } from "react";

/** Hero banner for dashboards: glass, aurora light, an orbiting core and a travelling border beam. */
export function Welcome({ eyebrow, title, children, actions }: { eyebrow: ReactNode; title: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  return (
    <section className="workspace-welcome">
      <div>
        <p className="welcome-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children && <div className="welcome-description">{children}</div>}
      </div>
      {actions && <div className="welcome-actions">{actions}</div>}
    </section>
  );
}
