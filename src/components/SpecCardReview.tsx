import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, AlertTriangle, ChevronDown, X, Plus, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { ConfirmedSpec, FieldStatus, SpecCard, CustomerTier } from "@/types";
import { generateQuote, logAuditEvent } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Props {
  rfqId: string;
}

type FieldKey =
  | "grade"
  | "thickness_mm"
  | "thickness_tolerance"
  | "width_mm"
  | "coating"
  | "quantity_tonnes"
  | "standard"
  | "surface_finish"
  | "delivery_format";

const FIELD_DEFS: { key: FieldKey; label: string; type: "text" | "number"; confidenceKey: keyof SpecCard }[] = [
  { key: "grade", label: "Grade", type: "text", confidenceKey: "grade_confidence" },
  { key: "thickness_mm", label: "Thickness (mm)", type: "number", confidenceKey: "thickness_confidence" },
  { key: "thickness_tolerance", label: "Thickness Tolerance", type: "text", confidenceKey: "thickness_tolerance_confidence" },
  { key: "width_mm", label: "Width (mm)", type: "number", confidenceKey: "width_confidence" },
  { key: "coating", label: "Coating", type: "text", confidenceKey: "coating_confidence" },
  { key: "quantity_tonnes", label: "Quantity (tonnes)", type: "number", confidenceKey: "quantity_confidence" },
  { key: "standard", label: "Standard (EN/JIS)", type: "text", confidenceKey: "standard_confidence" },
  { key: "surface_finish", label: "Surface Finish", type: "text", confidenceKey: "surface_finish_confidence" },
  { key: "delivery_format", label: "Delivery Format", type: "text", confidenceKey: "delivery_format_confidence" },
];

function confidenceColor(pct: number) {
  if (pct >= 80) return "text-brand";
  if (pct >= 40) return "text-amber";
  return "text-coral";
}

function dotColor(status: FieldStatus) {
  if (status === "auto") return "bg-brand";
  if (status === "review") return "bg-amber";
  return "bg-coral";
}

export function SpecCardReview({ rfqId }: Props) {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const rfq = state.rfqList.find((r) => r.rfq_id === rfqId);
  const spec = rfq?.spec_card;

  const [values, setValues] = useState<Record<string, string>>(() => {
    if (!spec) return {} as Record<string, string>;
    return {
      grade: spec.grade ?? "",
      thickness_mm: spec.thickness_mm?.toString() ?? "",
      thickness_tolerance: spec.thickness_tolerance ?? "",
      width_mm: spec.width_mm?.toString() ?? "",
      coating: spec.coating ?? "",
      quantity_tonnes: spec.quantity_tonnes?.toString() ?? "",
      standard: spec.standard ?? "",
      surface_finish: spec.surface_finish ?? "",
      delivery_format: spec.delivery_format ?? "",
    };
  });
  const [fieldStatus, setFieldStatus] = useState<Record<string, FieldStatus>>(
    () => ({ ...(spec?.field_status ?? {}) }),
  );
  const [processing, setProcessing] = useState<string[]>(spec?.processing_requirements ?? []);
  const [newProcessing, setNewProcessing] = useState("");
  const [tier, setTier] = useState<CustomerTier>(state.settings.default_customer_tier);
  const [repName, setRepName] = useState("Sales Rep");
  const [warningsOpen, setWarningsOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blankFields = useMemo(
    () =>
      FIELD_DEFS.filter(
        (f) => fieldStatus[f.key] === "blank" && !values[f.key]?.trim(),
      ),
    [fieldStatus, values],
  );

  if (!rfq || !spec) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-xl font-semibold text-ink">RFQ not found</h2>
        <p className="mt-2 text-mid">No RFQ exists with ID "{rfqId}".</p>
        <Link to="/" className="mt-6 text-brand hover:text-brand-dark font-medium">
          ← Back to Inbox
        </Link>
      </div>
    );
  }

  const overallPct = Math.round(spec.overall_confidence * 100);
  const flagged = Object.values(fieldStatus).filter((s) => s !== "auto").length;

  function handleFieldChange(key: FieldKey, newValue: string) {
    const oldValue = values[key] ?? "";
    if (oldValue === newValue) return;
    setValues((v) => ({ ...v, [key]: newValue }));
    if (fieldStatus[key] !== "auto") {
      setFieldStatus((s) => ({ ...s, [key]: "auto" }));
    }
    logAuditEvent({
      event_type: "spec_field_override",
      rfq_id: rfqId,
      field_name: key,
      old_value: oldValue,
      new_value: newValue,
    });
  }

  function addProcessing() {
    const v = newProcessing.trim();
    if (!v) return;
    const next = [...processing, v];
    setProcessing(next);
    logAuditEvent({
      event_type: "spec_field_override",
      rfq_id: rfqId,
      field_name: "processing_requirements",
      old_value: processing.join("; "),
      new_value: next.join("; "),
    });
    setNewProcessing("");
  }

  function removeProcessing(idx: number) {
    const next = processing.filter((_, i) => i !== idx);
    setProcessing(next);
    logAuditEvent({
      event_type: "spec_field_override",
      rfq_id: rfqId,
      field_name: "processing_requirements",
      old_value: processing.join("; "),
      new_value: next.join("; "),
    });
  }

  async function handleConfirm() {
    if (blankFields.length > 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const confirmed: ConfirmedSpec = {
        rfq_id: rfqId,
        customer_name: spec!.customer_name,
        customer_tier: tier,
        grade: values.grade,
        thickness_mm: Number(values.thickness_mm),
        thickness_tolerance: values.thickness_tolerance,
        width_mm: Number(values.width_mm),
        coating: values.coating,
        quantity_tonnes: Number(values.quantity_tonnes),
        standard: values.standard,
        processing_requirements: processing,
        delivery_format: values.delivery_format,
        confirmed_by: repName,
        confirmed_at: new Date().toISOString(),
      };
      logAuditEvent({
        event_type: "spec_confirmed",
        rfq_id: rfqId,
        customer_name: spec!.customer_name,
        user_id: repName,
      });
      const quote = await generateQuote(confirmed);
      dispatch({ type: "SET_QUOTE", rfq_id: rfqId, quote });
      logAuditEvent({
        event_type: "quote_generated",
        rfq_id: rfqId,
        quote_id: quote.quote_id,
        quote_value_eur: quote.pricing_breakdown.quote_value_eur,
        gross_margin_pct: quote.margin.gross_margin_pct,
        approval_status: quote.margin.approval_status,
      });
      navigate({ to: "/quote/$id", params: { id: rfqId } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate quote.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <TooltipProvider>
      <div className="pb-28">
        {/* Header bar */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-mid hover:text-brand mb-3">
            <ArrowLeft className="size-4" /> Back to Inbox
          </Link>
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-ink">{spec.customer_name}</h1>
              <p className="text-sm text-mid mt-1">
                <span className="font-mono">{spec.rfq_id}</span> · {spec.subject}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium",
                  overallPct >= 80
                    ? "bg-brand-bg text-brand-dark"
                    : overallPct >= 40
                      ? "bg-amber/10 text-amber"
                      : "bg-coral/10 text-coral",
                )}
              >
                AI Confidence: {overallPct}%
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium",
                  flagged > 0 ? "bg-amber/10 text-amber" : "bg-brand-bg text-brand-dark",
                )}
              >
                {flagged > 0 ? `${flagged} field${flagged === 1 ? "" : "s"} need review` : "All fields verified"}
              </span>
            </div>
          </div>
        </div>

        {/* Spec field grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIELD_DEFS.map((f) => {
            const status = fieldStatus[f.key] ?? "blank";
            const conf = (spec[f.confidenceKey] as number) ?? 0;
            const pct = Math.round(conf * 100);
            return (
              <div
                key={f.key}
                className={cn(
                  "rounded-lg border bg-card p-4 transition-colors",
                  status === "review" && "border-amber/40",
                  status === "blank" && "border-coral/40",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-ink">{f.label}</label>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className={cn("size-2 rounded-full", dotColor(status))} />
                    <span className={cn("font-medium", confidenceColor(pct))}>
                      {status === "blank"
                        ? "Required — not found"
                        : status === "auto"
                          ? `${pct}% — auto-populated`
                          : `${pct}% — please verify`}
                    </span>
                  </div>
                </div>
                <Input
                  type={f.type}
                  value={values[f.key] ?? ""}
                  onChange={(e) => handleFieldChange(f.key, e.target.value)}
                  placeholder={status === "blank" ? "Required" : ""}
                  className={cn(
                    status === "blank" && !values[f.key]?.trim() && "border-coral",
                  )}
                />
                {status === "review" && (
                  <p className="mt-1.5 text-xs text-mid italic">
                    Inferred from drawing — please verify against source.
                  </p>
                )}
              </div>
            );
          })}

          {/* Processing requirements (full width) */}
          <div className="rounded-lg border bg-card p-4 md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-ink">Processing Requirements</label>
              <div className="flex items-center gap-1.5 text-xs">
                <span className={cn("size-2 rounded-full", dotColor(fieldStatus.processing_requirements ?? "blank"))} />
                <span className={cn("font-medium", confidenceColor(Math.round(spec.processing_confidence * 100)))}>
                  {Math.round(spec.processing_confidence * 100)}%
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {processing.length === 0 && (
                <span className="text-xs text-mid italic">No processing requirements.</span>
              )}
              {processing.map((p, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-brand-bg text-brand-dark px-2.5 py-1 rounded-full text-xs font-medium"
                >
                  {p}
                  <button
                    onClick={() => removeProcessing(i)}
                    className="hover:text-coral"
                    aria-label={`Remove ${p}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newProcessing}
                onChange={(e) => setNewProcessing(e.target.value)}
                placeholder="Add processing requirement..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addProcessing())}
              />
              <Button type="button" variant="outline" onClick={addProcessing}>
                <Plus className="size-4" /> Add
              </Button>
            </div>
          </div>
        </div>

        {/* Customer tier */}
        <div className="mt-6 rounded-lg border bg-card p-4">
          <label className="text-sm font-medium text-ink mb-3 block">Customer Tier</label>
          <div className="inline-flex rounded-md border bg-background p-1">
            {(["Spot", "Contract", "Strategic"] as CustomerTier[]).map((t) => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded transition-colors",
                  tier === t
                    ? "bg-brand text-white"
                    : "text-mid hover:text-ink",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Extraction warnings */}
        {spec.extraction_warnings.length > 0 && (
          <div className="mt-6 rounded-lg border-l-4 border-l-amber border-y border-r bg-amber/5">
            <button
              onClick={() => setWarningsOpen((o) => !o)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
                <AlertTriangle className="size-4 text-amber" />
                AI Extraction Warnings ({spec.extraction_warnings.length})
              </span>
              <ChevronDown className={cn("size-4 text-mid transition-transform", warningsOpen && "rotate-180")} />
            </button>
            {warningsOpen && (
              <ul className="px-4 pb-4 space-y-1.5 text-sm text-ink list-disc list-inside">
                {spec.extraction_warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Notes */}
        {spec.notes && (
          <div className="mt-6 rounded-lg border bg-surface p-4">
            <p className="text-sm text-mid italic">{spec.notes}</p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-coral bg-coral/5 p-3 text-sm text-coral">
            {error}
          </div>
        )}

        {/* Sticky action bar */}
        <div className="fixed bottom-0 left-16 right-0 border-t bg-background/95 backdrop-blur px-6 py-3 z-10">
          <div className="flex items-center justify-between gap-4 max-w-screen-2xl mx-auto">
            <div className="flex items-center gap-2">
              <label className="text-sm text-mid">Rep:</label>
              <Input
                value={repName}
                onChange={(e) => setRepName(e.target.value)}
                className="h-8 w-48"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" disabled={submitting}>
                Save Draft
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button
                      onClick={handleConfirm}
                      disabled={blankFields.length > 0 || submitting}
                      className="bg-brand hover:bg-brand-dark text-white"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" /> Generating quote...
                        </>
                      ) : (
                        "Confirm & Generate Quote"
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                {blankFields.length > 0 && (
                  <TooltipContent>Fill in all required fields before confirming.</TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
