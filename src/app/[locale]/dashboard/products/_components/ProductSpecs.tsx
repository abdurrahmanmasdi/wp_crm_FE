'use client';

export function ProductSpecs({
  specs,
}: {
  specs: Record<string, unknown> | null;
}) {
  if (!specs) {
    return null;
  }

  const keys = Object.keys(specs).slice(0, 3);
  if (keys.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 mb-3 flex flex-wrap gap-1">
      {keys.map((key) => {
        const val = specs[key];
        const displayKey = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());

        return (
          <span
            key={key}
            className="inline-flex items-center rounded border border-white/5 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400"
          >
            {String(val)} {displayKey}
          </span>
        );
      })}
    </div>
  );
}
