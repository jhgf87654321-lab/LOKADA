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
