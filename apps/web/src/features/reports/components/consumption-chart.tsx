import type { HistoryChart } from "@/features/reports/types";

const XS = [40, 168, 296, 424, 552, 680, 808, 936];

function yFor(minutes: number, chart: HistoryChart): number {
  const scale = 156 / chart.yMaxMinutes;
  return 180 - minutes * scale;
}

export function ConsumptionChart({
  chart,
  legend,
}: {
  chart: HistoryChart;
  legend: { label: string; tone: "water" | "target" }[];
}) {
  const line = chart.days
    .map((day, index) => `${XS[index]},${yFor(day.minutes, chart)}`)
    .join(" ");
  const area = `${line} ${XS[XS.length - 1]},180 ${XS[0]},180`;
  const referenceY = yFor(chart.referenceMinutes, chart);

  return (
    <div className="panel">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="text-[14px] font-bold">
          Minutos regados por día
        </div>
        <div className="flex gap-4 text-[12px] text-ink-muted">
          {legend.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5">
              <span
                className={
                  item.tone === "water"
                    ? "inline-block h-2 w-2 rounded-sm bg-accent"
                    : "inline-block h-0.5 w-2.5 align-middle bg-accent"
                }
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 960 220"
        width="100%"
        height="220"
        role="img"
        aria-label="Minutos regados por día, últimos 7 días, con línea de referencia"
      >
        <line x1="40" y1="20" x2="40" y2="180" stroke="var(--chart-grid)" strokeWidth="1" />
        <line x1="40" y1="180" x2="940" y2="180" stroke="var(--chart-grid)" strokeWidth="1" />
        <line x1="40" y1="20" x2="940" y2="20" stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="40" y1="100" x2="940" y2="100" stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="2 4" />
        {[0, 30, chart.yMaxMinutes].map((minutes) => (
          <text
            key={minutes}
            x="30"
            y={yFor(minutes, chart) + 4}
            textAnchor="end"
            fontSize="11"
            fill="var(--ink-muted)"
          >
            {minutes}
          </text>
        ))}
        <line
          x1="40"
          y1={referenceY}
          x2="940"
          y2={referenceY}
          stroke="var(--chart-target)"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
        <polygon points={area} fill="var(--chart-water)" opacity="0.14" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--chart-water)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g fill="var(--chart-water)">
          {chart.days.map((day, index) => (
            <circle
              key={`${day.label}-${index}`}
              cx={XS[index]}
              cy={yFor(day.minutes, chart)}
              r="4"
            />
          ))}
        </g>
        <g fontSize="11" fill="var(--ink-muted)" textAnchor="middle">
          {chart.days.map((day, index) => (
            <text key={`label-${index}`} x={XS[index]} y="200">
              {day.label}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}