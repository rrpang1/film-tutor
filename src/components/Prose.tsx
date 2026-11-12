"use client";
import { Fragment, type ReactNode } from "react";
import type { Block } from "@/engine/types";
import { Widget } from "./widgets";

/** **bold** and *italic*, nothing else. Content is authored, not user input. */
export function inline(text: string): ReactNode {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    out.push(t.startsWith("**") ? <strong key={i++}>{t.slice(2, -2)}</strong> : <em key={i++}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.map((x, k) => <Fragment key={k}>{x}</Fragment>);
}

export default function Prose({ blocks }: { blocks: Block[] }) {
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "p": return <p key={i}>{inline(b.text)}</p>;
          case "h": return <h3 key={i} className="display">{b.text}</h3>;
          case "list": {
            const L = b.ordered ? "ol" : "ul";
            return <L key={i}>{b.items.map((t, j) => <li key={j}>{inline(t)}</li>)}</L>;
          }
          case "tip": return (
            <aside key={i} className={`tip ${b.tone ?? "note"}`}>
              <span className="tip-mark" aria-hidden>{b.tone === "gear" ? "k1000" : b.tone === "warn" ? "careful" : "note"}</span>
              <p>{inline(b.text)}</p>
            </aside>
          );
          case "terms": return (
            <dl key={i} className="terms">
              {b.items.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}
            </dl>
          );
          case "widget": return <Widget key={i} name={b.widget} props={b.props} />;
        }
      })}
    </div>
  );
}
