import { useEffect, useState } from "react";

interface Props {
  /** Single static message (back-compatible). Ignored if `messages` is provided. */
  message?: string;
  /** Rotating step messages — cycles through them while loading. */
  messages?: string[];
  /** Milliseconds each rotating message stays on screen. */
  interval?: number;
}

export function LoadingOverlay({ message = "Working…", messages, interval = 2200 }: Props) {
  const steps = messages && messages.length > 0 ? messages : [message];
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    if (steps.length <= 1) return;
    const id = setInterval(() => {
      // fade out, swap, fade in
      setShown(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % steps.length);
        setShown(true);
      }, 250);
    }, interval);
    return () => clearInterval(id);
  }, [steps.length, interval]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
    >
      {/* Coil-style concentric rings */}
      <div className="relative h-20 w-20">
        <span
          className="absolute inset-0 rounded-full border-2 border-brand/20 border-t-brand"
          style={{ animation: "spin 1.1s linear infinite" }}
        />
        <span
          className="absolute inset-2 rounded-full border-2 border-brand/15 border-b-brand"
          style={{ animation: "spin 1.6s linear infinite reverse" }}
        />
        <span
          className="absolute inset-4 rounded-full border-2 border-brand/10 border-t-brand/70"
          style={{ animation: "spin 2.2s linear infinite" }}
        />
        <span className="absolute inset-[34px] rounded-full bg-brand animate-pulse" />
      </div>

      {/* Rotating message with fade */}
      <p
        className={`mt-6 min-h-5 text-sm font-medium text-ink transition-opacity duration-300 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      >
        {steps[index]}
      </p>

      {/* Staggered dots */}
      <div className="mt-3 flex gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((d) => (
          <span
            key={d}
            className="h-1.5 w-1.5 rounded-full bg-brand/60"
            style={{ animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${d * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}
