import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { AppSettings, CustomerTier } from "@/types";

const TIER_INFO: Record<CustomerTier, string> = {
  Spot: "12% floor · 30 day terms · 7 day validity",
  Contract: "10% floor · 60 day terms · 14 day validity",
  Strategic: "8% floor · 90 day terms · 21 day validity",
};

type TestStatus = "idle" | "testing" | "success" | "failed";

export function SettingsPanel() {
  const { state, dispatch } = useApp();
  const [draft, setDraft] = useState<AppSettings>(state.settings);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMsg, setTestMsg] = useState<string>("");
  const [infoOpen, setInfoOpen] = useState(false);

  const update = (patch: Partial<AppSettings>) => setDraft((d) => ({ ...d, ...patch }));
  const updateThresholds = (patch: Partial<AppSettings["confidence_thresholds"]>) =>
    setDraft((d) => ({ ...d, confidence_thresholds: { ...d.confidence_thresholds, ...patch } }));

  const testConnection = async () => {
    setTestStatus("testing");
    setTestMsg("");
    try {
      const res = await fetch(`${draft.n8n_base_url}/audit-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "connection_test",
          timestamp: new Date().toISOString(),
          notes: "Settings panel connection test",
        }),
      });
      if (res.ok) {
        setTestStatus("success");
        setTestMsg(`Connected (HTTP ${res.status})`);
      } else {
        setTestStatus("failed");
        setTestMsg(`Failed (HTTP ${res.status})`);
      }
    } catch (err) {
      setTestStatus("failed");
      setTestMsg(err instanceof Error ? err.message : "Network error");
    }
  };

  const handleSave = () => {
    dispatch({ type: "SET_SETTINGS", settings: draft });
    toast.success("Settings saved", { duration: 2000 });
  };

  const { high, low } = draft.confidence_thresholds;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Configuration &amp; Settings</h2>
        <p className="text-sm text-mid">
          Configure connection, AI thresholds and customer defaults. All changes persist locally.
        </p>
      </header>

      {draft.demo_mode ? (
        <div className="rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-amber">
          Demo mode active — no real N8N calls are being made.
        </div>
      ) : (
        <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-700">
          Live mode active — real N8N calls are being made.
        </div>
      )}

      {/* SECTION 1 — Connection */}
      <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-ink">1 · Connection</h3>

        <label className="block text-sm font-medium text-ink">N8N Base URL</label>
        <div className="mt-1.5 flex gap-2">
          <input
            type="text"
            value={draft.n8n_base_url}
            onChange={(e) => update({ n8n_base_url: e.target.value })}
            className="flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="http://localhost:5678/webhook"
          />
          <button
            type="button"
            onClick={testConnection}
            disabled={testStatus === "testing"}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm hover:bg-brand-bg disabled:opacity-50"
          >
            {testStatus === "testing" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Test Connection
          </button>
        </div>
        <p className="mt-1.5 text-xs text-mid">The base webhook URL of your N8N instance</p>
        {testStatus === "success" && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-dark">
            <CheckCircle2 className="h-3.5 w-3.5" /> {testMsg}
          </p>
        )}
        {testStatus === "failed" && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-coral">
            <XCircle className="h-3.5 w-3.5" /> {testMsg}
          </p>
        )}

        <fieldset className="mt-5 rounded-lg border border-border bg-surface p-3">
          <legend className="px-1 text-sm font-medium text-ink">Demo Mode</legend>
          <p className="mb-2 text-xs text-mid">
            When ON, all API calls return mock data (DC04 / SCE Prague scenario).
          </p>
          <div className="flex gap-4">
            {[
              { value: true, label: "On" },
              { value: false, label: "Off" },
            ].map((opt) => {
              const active = draft.demo_mode === opt.value;
              return (
                <label
                  key={opt.label}
                  className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink"
                >
                  <input
                    type="radio"
                    name="demo_mode"
                    checked={active}
                    onChange={() => {
                      const next = { ...draft, demo_mode: opt.value };
                      setDraft(next);
                      dispatch({ type: "SET_SETTINGS", settings: next });
                    }}
                    className="sr-only"
                  />
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      active ? "border-brand" : "border-mid"
                    }`}
                  >
                    {active && <span className="h-2 w-2 rounded-full bg-brand" />}
                  </span>
                  {opt.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </section>


      {/* SECTION 2 — Thresholds */}
      <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-ink">2 · Confidence Thresholds</h3>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-medium text-ink">Auto-populate threshold</label>
              <span className="text-sm font-semibold text-brand-dark">
                {Math.round(high * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={1}
              step={0.01}
              value={high}
              onChange={(e) => updateThresholds({ high: parseFloat(e.target.value) })}
              className="mt-2 w-full accent-[var(--brand)]"
            />
            <p className="mt-1 text-xs text-mid">Fields above this are green / auto-filled.</p>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-medium text-ink">Flag for review threshold</label>
              <span className="text-sm font-semibold text-coral">{Math.round(low * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={0.7}
              step={0.01}
              value={low}
              onChange={(e) => updateThresholds({ low: parseFloat(e.target.value) })}
              className="mt-2 w-full accent-[var(--coral)]"
            />
            <p className="mt-1 text-xs text-mid">Fields below this are red / blank.</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 rounded-lg bg-surface p-3 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-ink">
            <span className="h-2 w-2 rounded-full bg-brand" /> Auto ≥ {Math.round(high * 100)}%
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-ink">
            <span className="h-2 w-2 rounded-full bg-amber" /> Review {Math.round(low * 100)}–
            {Math.round(high * 100) - 1}%
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-ink">
            <span className="h-2 w-2 rounded-full bg-coral" /> Blank &lt; {Math.round(low * 100)}%
          </span>
        </div>
      </section>

      {/* SECTION 3 — Customer Defaults */}
      <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-ink">3 · Customer Defaults</h3>
        <label className="block text-sm font-medium text-ink">Default Customer Tier</label>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {(Object.keys(TIER_INFO) as CustomerTier[]).map((tier) => {
            const active = draft.default_customer_tier === tier;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => update({ default_customer_tier: tier })}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  active
                    ? "border-brand bg-brand-bg"
                    : "border-border bg-white hover:border-brand/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      active ? "border-brand" : "border-mid"
                    }`}
                  >
                    {active && <span className="h-2 w-2 rounded-full bg-brand" />}
                  </span>
                  <span className="text-sm font-semibold text-ink">{tier}</span>
                </div>
                <p className="mt-1.5 text-xs text-mid">{TIER_INFO[tier]}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 4 — Prototype Info */}
      <section className="rounded-xl border border-border bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setInfoOpen((o) => !o)}
          className="flex w-full items-center justify-between p-6 text-left"
        >
          <h3 className="text-base font-semibold text-ink">4 · Prototype Info</h3>
          {infoOpen ? (
            <ChevronUp className="h-4 w-4 text-mid" />
          ) : (
            <ChevronDown className="h-4 w-4 text-mid" />
          )}
        </button>
        {infoOpen && (
          <dl className="grid gap-3 border-t border-border px-6 py-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-mid">Build Version</dt>
              <dd className="mt-0.5 text-ink">0.1.0-prototype</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-mid">Phase</dt>
              <dd className="mt-0.5 text-ink">PROTOTYPE — Apr–Jun 2026</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-mid">Stack</dt>
              <dd className="mt-0.5 text-ink">N8N + Lovable</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-mid">Scope</dt>
              <dd className="mt-0.5 text-ink">Flat rolled steel · EN standard · SCE Prague</dd>
            </div>
          </dl>
        )}
      </section>

      <button
        type="button"
        onClick={handleSave}
        className="w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
      >
        Save Settings
      </button>
    </div>
  );
}
