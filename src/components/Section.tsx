import type { ReactNode } from "react";

export function Section(props: { id: string; title: string; lead: string; children: ReactNode }) {
  return (
    <section id={props.id} className="section">
      <div className="container">
        <h2>{props.title}</h2>
        <p className="lead">{props.lead}</p>
        {props.children}
      </div>
    </section>
  );
}
