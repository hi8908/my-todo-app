"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chart || !ref.current) return;

    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          mindmap: { padding: 16 },
        });

        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, chart);

        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Mermaid render error:", e);
          setError("図解の表示に失敗しました");
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <p className="text-sm text-red-500 italic">{error}</p>
    );
  }

  return (
    <div
      ref={ref}
      className="w-full overflow-x-auto rounded-lg bg-white border border-gray-200 p-4 [&_svg]:mx-auto [&_svg]:max-w-full"
    />
  );
}
