const toneStroke: Record<string, string> = {
  water: "text-accent",
  savings: "text-primary",
  warn: "text-status-warn",
};

export function HumidityChart({
  legend,
  series,
  labels,
}: {
  legend: { label: string; tone: "water" | "savings" | "warn" }[];
  series: { name: string; tone: "water" | "savings" | "warn"; points: number[]; dashed?: boolean }[];
  labels: string[];
}) {
  const xs = [60, 200, 340, 480, 620, 760, 900];
  return (
    <div className="panel">
      <div className="mb-2 text-[14px] font-bold">
        Humedad reciente por zona
      </div>
      <div className="mb-1.5 flex gap-4 text-[12px] text-ink-muted">
        {legend.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                item.tone === "water"
                  ? "bg-accent"
                  : item.tone === "savings"
                    ? "bg-primary"
                    : "bg-status-warn"
              }`}
            />
            {item.label}
          </span>
        ))}
      </div>
      <svg
        viewBox="0 0 960 160"
        width="100%"
        height="160"
        role="img"
        aria-label="Humedad reciente por zona, últimas horas"
      >
        <line x1="30" y1="16" x2="30" y2="130" stroke="var(--chart-grid)" strokeWidth="1" />
        <line x1="30" y1="130" x2="940" y2="130" stroke="var(--chart-grid)" strokeWidth="1" />
        <line x1="30" y1="16" x2="940" y2="16" stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="30" y1="73" x2="940" y2="73" stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="2 4" />
        <text x="22" y="134" textAnchor="end" fontSize="11" fill="var(--ink-muted)">0%</text>
        <text x="22" y="77" textAnchor="end" fontSize="11" fill="var(--ink-muted)">50%</text>
        <text x="22" y="20" textAnchor="end" fontSize="11" fill="var(--ink-muted)">100%</text>
        {series.map((s) => (
          <polyline
            key={s.name}
            points={xs.map((x, i) => `${x},${s.points[i]}`).join(" ")}
            fill="none"
            stroke="currentColor"
            className={toneStroke[s.tone]}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={s.dashed ? "1 5" : undefined}
          />
        ))}
        <g fontSize="11" fill="var(--ink-muted)" textAnchor="middle">
          {labels.map((label, i) => (
            <text key={label} x={xs[i]} y="146">
              {label}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}