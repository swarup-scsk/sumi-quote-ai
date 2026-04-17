import { Loader2 } from "lucide-react";

interface Props {
  message?: string;
}

export function LoadingOverlay({ message = "Working…" }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/75 backdrop-blur-sm"
    >
      <Loader2 className="h-12 w-12 animate-spin text-brand" />
      <p className="mt-4 text-sm font-medium text-ink">{message}</p>
    </div>
  );
}
