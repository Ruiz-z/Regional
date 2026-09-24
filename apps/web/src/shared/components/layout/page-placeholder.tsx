import { Topbar } from "@/shared/components/layout/topbar";

export function PagePlaceholder({
  title,
  subtitle,
  task,
}: {
  title: string;
  subtitle?: string;
  task: string;
}) {
  return (
    <>
      <Topbar>
        <h1 className="m-0 font-display text-2xl font-bold text-ink">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
        ) : null}
      </Topbar>
      <div className="flex flex-1 flex-col gap-6 px-8 pb-12 pt-6">
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border-strong p-16 text-center">
          <p className="text-sm font-semibold text-ink-muted">
            {task} en construcción
          </p>
        </div>
      </div>
    </>
  );
}