interface Props {
  title: string;
  description: string;
}

export function PlaceholderScreen({ title, description }: Props) {
  return (
    <div className="p-8">
      <div className="rounded-xl border border-border bg-white p-10">
        <h2 className="text-2xl font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-mid">{description}</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-bg px-3 py-1.5 text-xs font-medium text-brand-dark">
          Screen scaffold ready — implementation pending
        </div>
      </div>
    </div>
  );
}
