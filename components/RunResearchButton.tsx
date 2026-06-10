"use client";

import { useState, useTransition } from "react";
import { BrainCircuit, Loader2 } from "lucide-react";

export function RunResearchButton({ compact = false }: { compact?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function run() {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/research", { method: "POST" });
        const payload = await response.json();

        if (!response.ok) {
          setError(payload.error ?? "Live market study failed.");
          return;
        }

        setMessage(payload.message ?? "Daily market study completed.");
        window.setTimeout(() => window.location.reload(), 850);
      } catch {
        setError("Unable to reach the research API.");
      }
    });
  }

  return (
    <div className={compact ? "grid gap-2" : "flex flex-col gap-3 sm:flex-row sm:items-center"}>
      <button
        type="button"
        onClick={run}
        disabled={isPending}
        className={`inline-flex items-center justify-center gap-2 rounded font-semibold transition disabled:opacity-60 ${
          compact
            ? "border border-cyan/50 bg-cyan/10 px-3 py-2 text-sm text-cyan hover:bg-cyan hover:text-ink"
            : "bg-cyan px-4 py-2 text-sm text-ink hover:bg-cyan/85"
        }`}
      >
        {isPending ? <Loader2 className="animate-spin" size={18} /> : <BrainCircuit size={18} />}
        {isPending ? "Studying live data..." : "Run Daily Study"}
      </button>
      {message ? <span className="text-sm text-mint">{message}</span> : null}
      {error ? <span className="text-sm text-danger">{error}</span> : null}
    </div>
  );
}
