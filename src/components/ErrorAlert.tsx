import { AlertCircle } from "lucide-react";

interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorAlert({ message, onRetry }: Props) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-xs text-coral"
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="flex-1">
        <span>{message}</span>
        {onRetry && (
          <>
            {" · "}
            <button
              type="button"
              onClick={onRetry}
              className="font-semibold underline underline-offset-2 hover:text-coral/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
