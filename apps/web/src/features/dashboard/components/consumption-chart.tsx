export function WaterConsumptionChart({
  days,
}: {
  days: { label: string; minutes: number }[];
}) {
  const xs = [50, 150, 250, 350, 450, 550, 650];
  return (
    <div className="panel">
      <div className="mb-2 text-[14px] font-bold">
        Consumo de agua (minutos regados)
      </div>
      <svg
        viewBox="0 0 960 120"
        width="100%"
        height="120"
        role="img"
        aria-label="Consumo de agua, minutos regados por día, escala 0 a 60 minutos"
      >
        <line x1="30" y1="10" x2="30" y2="95" stroke="var(--chart-grid)" strokeWidth="1" />
        <line x1="30" y1="95" x2="940" y2="95" stroke="var(--chart-grid)" strokeWidth="1" />
        <line x1="30" y1="52" x2="940" y2="52" stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="30" y1="10" x2="940" y2="10" stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="2 4" />
        <text x="22" y="99" textAnchor="end" fontSize="11" fill="var(--ink-muted)">0</text>
        <text x="22" y="56" textAnchor="end" fontSize="11" fill="var(--ink-muted)">30</text>
        <text x="22" y="14" textAnchor="end" fontSize="11" fill="var(--ink-muted)">60</text>
        <g fill="var(--chart-water)">
          {days.map((day, i) => (
            <rect
              key={day.label}
              x={xs[i]}
              y={95 - day.minutes}
              width="60"
              height={day.minutes}
              rx="3"
            />
          ))}
        </g>
        <g fontSize="11" fill="var(--ink-muted)" textAnchor="middle">
          {days.map((day, i) => (
            <text key={day.label} x={xs[i] + 30} y="110">
              {day.label}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}