"use client";

import { useState, useTransition } from "react";
import type { Settings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [form, setForm] = useState({
    ...settings,
    watchlist: settings.watchlist.join(", ")
  });
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: field === "watchlist" ? value : Number(value)
    }));
  }

  function save() {
    startTransition(async () => {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      setMessage(response.ok ? "Settings saved for the simulator." : "Unable to save settings.");
    });
  }

  const danger = Number(form.riskPerTradePercent) > 3 || Number(form.maxDailyLossPercent) > 8 || Number(form.dailyTargetPercent) >= 20;

  return (
    <div className="rounded border border-line bg-panel/90 p-5 shadow-glow">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Starting fake balance" value={form.startingBalance} onChange={(value) => updateField("startingBalance", value)} />
        <Field label="Daily target %" value={form.dailyTargetPercent} onChange={(value) => updateField("dailyTargetPercent", value)} />
        <Field label="Risk per trade %" value={form.riskPerTradePercent} onChange={(value) => updateField("riskPerTradePercent", value)} />
        <Field label="Max daily loss %" value={form.maxDailyLossPercent} onChange={(value) => updateField("maxDailyLossPercent", value)} />
        <label className="md:col-span-2">
          <span className="text-sm text-slate-300">Watchlist symbols</span>
          <input
            className="mt-2 w-full rounded border border-line bg-ink px-3 py-2 text-white outline-none focus:border-cyan"
            value={form.watchlist}
            onChange={(event) => updateField("watchlist", event.target.value)}
          />
        </label>
      </div>
      {danger ? (
        <p className="mt-4 rounded border border-amber/40 bg-amber/10 p-3 text-sm text-amber">
          These settings are aggressive. The app will continue warning that high daily targets and high risk are not realistic
          or guaranteed.
        </p>
      ) : null}
      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded bg-cyan px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cyan/85 disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save Settings"}
        </button>
        <span className="text-sm text-slate-400">{message}</span>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-sm text-slate-300">{label}</span>
      <input
        type="number"
        min="0"
        step="0.1"
        className="mt-2 w-full rounded border border-line bg-ink px-3 py-2 text-white outline-none focus:border-cyan"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
