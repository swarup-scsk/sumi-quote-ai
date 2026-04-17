import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Upload, FileText, Loader2, X } from "lucide-react";
import { z } from "zod";
import { useApp } from "@/context/AppContext";
import { submitRFQ } from "@/lib/api";
import type { RFQInboxItem } from "@/types";

const formSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(1, "Customer name is required")
    .max(120, "Customer name too long"),
  email_from: z
    .string()
    .trim()
    .max(255, "Email too long")
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
});

function makeRfqId() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RFQ-${y}${m}${day}-${rand}`;
}

export function RFQUpload() {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (f: File | null) => {
    setError(null);
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are accepted.");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("File exceeds 20MB limit.");
      return;
    }
    setFile(f);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const reset = () => {
    setFile(null);
    setCustomerName("");
    setEmail("");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Please select a PDF first.");
      return;
    }

    const parsed = formSchema.safeParse({
      customer_name: customerName,
      email_from: email,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    const rfq_id = makeRfqId();
    const subject = `RFQ from ${parsed.data.customer_name}`;

    const pendingItem: RFQInboxItem = {
      rfq_id,
      customer_name: parsed.data.customer_name,
      subject,
      filename: file.name,
      received_at: new Date().toISOString(),
      status: "processing",
    };
    dispatch({ type: "ADD_RFQ", rfq: pendingItem });

    setSubmitting(true);
    try {
      const specCard = await submitRFQ({
        rfq_id,
        customer_name: parsed.data.customer_name,
        email_from: parsed.data.email_from ?? "",
        subject,
        file,
      });
      dispatch({ type: "SET_SPEC_CARD", rfq_id, spec_card: specCard });
      reset();
      navigate({ to: "/rfq/$id", params: { id: rfq_id } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit RFQ";
      dispatch({
        type: "UPDATE_RFQ",
        rfq_id,
        patch: { status: "error", error_message: msg },
      });
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border bg-white p-5 shadow-sm"
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragOver
              ? "border-brand bg-brand-bg"
              : "border-border bg-surface hover:border-brand hover:bg-brand-bg"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center gap-3 rounded-md bg-white px-4 py-3 shadow-sm">
              <FileText className="h-5 w-5 text-brand" />
              <div className="text-left">
                <div className="text-sm font-medium text-ink">{file.name}</div>
                <div className="text-xs text-mid">
                  {(file.size / 1024).toFixed(0)} KB
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="ml-2 rounded p-1 text-mid hover:bg-surface hover:text-coral"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="mb-2 h-8 w-8 text-brand" />
              <div className="text-sm font-medium text-ink">
                Drop RFQ PDF here, or click to browse
              </div>
              <div className="mt-1 text-xs text-mid">PDF only · max 20MB</div>
            </>
          )}
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-mid">
              Customer Name <span className="text-coral">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              maxLength={120}
              required
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="e.g. Skoda Auto"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-mid">
              Customer Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="purchasing@example.com"
            />
          </div>
          <div className="text-[11px] text-mid">
            Subject: <span className="text-ink">RFQ from {customerName || "{customer}"}</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Extracting spec with AI…
              </>
            ) : (
              "Submit RFQ"
            )}
          </button>

          {error && (
            <div className="rounded-md border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">
              {error}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
