"use client";

import { useState, useTransition } from "react";
import { BrainCircuit } from "lucide-react";

export function RunResearchButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function run() {
    startTransition(async () => {
      const response = await fetch("/api/research", { method: "POST" });
      const payload = await response.json();
      setMessage(payload.message ?? "Daily market study completed.");
      window.location.reload();
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={run}
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded bg-cyan px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cyan/85 disabled:opacity-60"
      >
        <BrainCircuit size={18} />
        {isPending ? "Studying..." : "Run Daily Study"}
      </button>
      <span className="text-sm text-slate-400">{message}</span>
    </div>
  );
}
