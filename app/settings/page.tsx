import { SettingsForm } from "@/components/SettingsForm";
import { WarningBanner } from "@/components/WarningBanner";
import { readAccount } from "@/lib/store";

export default async function SettingsPage() {
  const account = await readAccount();

  return (
    <>
      <WarningBanner />
      <section className="mb-6 rounded border border-line bg-panel/90 p-5 shadow-glow">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Simulation Controls</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">Risk and Watchlist Settings</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          These controls only change the fake-money simulator. High daily targets, high risk per trade, and high daily
          loss limits will trigger warnings because they can create unrealistic expectations.
        </p>
      </section>
      <SettingsForm settings={account.settings} />
    </>
  );
}
