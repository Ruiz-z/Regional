import { cn } from "@/shared/lib/utils";

export interface ParcelOption {
  id: string;
  name: string;
}

export function ParcelSelector({
  options,
  value,
  onChange,
}: {
  options: ParcelOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const all = { id: "todas", name: "Todas mis parcelas" };
  const items = [all, ...options];
  return (
    <div className="mt-2.5 flex w-fit flex-wrap gap-0.5 rounded-md bg-surface-sunken p-[3px]">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "rounded-[5px] px-3.5 py-2 text-[14px] font-bold text-ink-muted transition-colors hover:text-ink",
            value === item.id &&
              "bg-surface text-ink shadow-card",
          )}
        >
          {item.name}
        </button>
      ))}
    </div>
  );
}