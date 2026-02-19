"use client";

import { useEffect, useMemo, useState } from "react";

type Hit = {
  label: string;
  x: number;
  y: number;
  top?: {
    tag: string;
    id?: string;
    className?: string;
    text?: string;
    rect?: { x: number; y: number; w: number; h: number };
    style?: Record<string, string>;
  };
  stack?: Array<{
    tag: string;
    id?: string;
    className?: string;
  }>;
};

function pickStyle(el: Element) {
  const s = window.getComputedStyle(el as HTMLElement);
  const keys = [
    "position",
    "zIndex",
    "pointerEvents",
    "opacity",
    "display",
    "visibility",
    "inset",
    "top",
    "left",
    "right",
    "bottom",
    "width",
    "height",
  ] as const;
  const out: Record<string, string> = {};
  for (const k of keys) out[k] = s[k];
  return out;
}

function brief(el: Element) {
  const r = (el as HTMLElement).getBoundingClientRect?.();
  return {
    tag: el.tagName.toLowerCase(),
    id: (el as HTMLElement).id || undefined,
    className: ((el as HTMLElement).className as any) || undefined,
    text:
      (el as HTMLElement).textContent?.trim().slice(0, 80) ||
      (el as HTMLElement).getAttribute?.("aria-label") ||
      undefined,
    rect: r
      ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
      : undefined,
    style: pickStyle(el),
  };
}

export default function HitTestPage() {
  const [hits, setHits] = useState<Hit[]>([]);

  const points = useMemo(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    const h = typeof window !== "undefined" ? window.innerHeight : 800;
    return [
      { label: "center", x: Math.round(w / 2), y: Math.round(h / 2) },
      { label: "header-left", x: 40, y: 40 },
      { label: "header-right", x: w - 40, y: 40 },
      { label: "near-top", x: Math.round(w / 2), y: 80 },
    ];
  }, []);

  useEffect(() => {
    const next: Hit[] = points.map((p) => {
      const top = document.elementFromPoint(p.x, p.y);
      const stack = document.elementsFromPoint(p.x, p.y).slice(0, 8);
      return {
        label: p.label,
        x: p.x,
        y: p.y,
        top: top ? brief(top) : undefined,
        stack: stack.map((el) => ({
          tag: el.tagName.toLowerCase(),
          id: (el as HTMLElement).id || undefined,
          className: ((el as HTMLElement).className as any) || undefined,
        })),
      };
    });
    // Also log to console for easy copy
    // eslint-disable-next-line no-console
    console.log("[hit-test]", next);
    setHits(next);
  }, [points]);

  return (
    <div className="min-h-[100svh] bg-white p-6 font-mono text-sm">
      <h1 className="text-lg font-bold">Hit test</h1>
      <p className="mt-2 text-slate-600">
        如果“所有地方都点不了”，这里会显示每个点位最上层元素（通常是某个全屏遮罩层）。
      </p>
      <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4">
        {JSON.stringify(hits, null, 2)}
      </pre>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";

type Hit = {
  label: string;
  x: number;
  y: number;
  top: NodeInfo | null;
  stack: NodeInfo[];
};

type NodeInfo = {
  tag: string;
  id: string | null;
  className: string | null;
  dataAttrs: Record<string, string>;
  rect: { x: number; y: number; width: number; height: number };
  style: {
    position: string;
    zIndex: string;
    pointerEvents: string;
    opacity: string;
    display: string;
    visibility: string;
    inset: string;
    top: string;
    left: string;
    right: string;
    bottom: string;
  };
};

function toNodeInfo(el: Element): NodeInfo {
  const htmlEl = el as HTMLElement;
  const rect = htmlEl.getBoundingClientRect();
  const cs = window.getComputedStyle(htmlEl);
  const dataAttrs: Record<string, string> = {};
  for (const attr of Array.from(htmlEl.attributes)) {
    if (attr.name.startsWith("data-")) dataAttrs[attr.name] = attr.value;
  }

  return {
    tag: el.tagName.toLowerCase(),
    id: htmlEl.id ? htmlEl.id : null,
    className: htmlEl.className ? String(htmlEl.className) : null,
    dataAttrs,
    rect: {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
    style: {
      position: cs.position,
      zIndex: cs.zIndex,
      pointerEvents: cs.pointerEvents,
      opacity: cs.opacity,
      display: cs.display,
      visibility: cs.visibility,
      inset: cs.inset,
      top: cs.top,
      left: cs.left,
      right: cs.right,
      bottom: cs.bottom,
    },
  };
}

function safeElementsFromPoint(x: number, y: number): Element[] {
  // Safari doesn’t have elementsFromPoint in some contexts, but Chrome/Edge do.
  const fn = (document as any).elementsFromPoint as undefined | ((x: number, y: number) => Element[]);
  if (typeof fn === "function") return fn.call(document, x, y);
  const top = document.elementFromPoint(x, y);
  return top ? [top] : [];
}

export default function HitTestPage() {
  const [hits, setHits] = useState<Hit[]>([]);
  const [error, setError] = useState<string | null>(null);

  const points = useMemo(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 0;
    const h = typeof window !== "undefined" ? window.innerHeight : 0;
    return [
      { label: "center", x: Math.round(w / 2), y: Math.round(h / 2) },
      { label: "header-ish (20,20)", x: 20, y: 20 },
      { label: "below header (20,90)", x: 20, y: 90 },
    ];
  }, []);

  useEffect(() => {
    const run = () => {
      try {
        setError(null);
        const next: Hit[] = [];

        // Add points based on the login/register links if present
        const loginLink = document.querySelector('a[href="/cloudbase/login"]') as HTMLAnchorElement | null;
        const registerLink = document.querySelector('a[href="/cloudbase/register"]') as HTMLAnchorElement | null;
        const extraPoints: { label: string; x: number; y: number }[] = [];

        for (const [label, el] of [
          ["login link center", loginLink],
          ["register link center", registerLink],
        ] as const) {
          if (!el) continue;
          const r = el.getBoundingClientRect();
          extraPoints.push({
            label,
            x: Math.round(r.left + r.width / 2),
            y: Math.round(r.top + r.height / 2),
          });
        }

        for (const p of [...points, ...extraPoints]) {
          const stackEls = safeElementsFromPoint(p.x, p.y);
          const stack = stackEls.slice(0, 8).map(toNodeInfo);
          const topEl = document.elementFromPoint(p.x, p.y);
          next.push({
            label: p.label,
            x: p.x,
            y: p.y,
            top: topEl ? toNodeInfo(topEl) : null,
            stack,
          });
        }

        setHits(next);
        // Also log a concise version to console for copy/paste
        // eslint-disable-next-line no-console
        console.log("[hit-test]", next);
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    };

    run();
    const onResize = () => run();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [points]);

  return (
    <div style={{ padding: 16, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Hit test: elementFromPoint()</h1>
      <p style={{ marginBottom: 12, color: "#555" }}>
        Open DevTools console to see <code>[hit-test]</code> logs. This page reports the topmost element at key points and its
        computed styles (position/z-index/pointer-events/opacity).
      </p>

      {error ? (
        <div style={{ padding: 12, background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8 }}>
          Error: {error}
        </div>
      ) : null}

      <pre style={{ whiteSpace: "pre-wrap", background: "#0b1020", color: "#e5e7eb", padding: 12, borderRadius: 8 }}>
        {JSON.stringify(hits, null, 2)}
      </pre>
    </div>
  );
}

