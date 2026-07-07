export type Period = "today" | "week" | "month" | "custom";

interface PeriodFilterProps {
  period: Period;
  onPeriodChange: (period: Period) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
}

export default function PeriodFilter({
  period,
  onPeriodChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}: PeriodFilterProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {(["today", "week", "month", "custom"] as Period[]).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPeriodChange(p)}
          className={period === p ? "tab-pill-active" : "tab-pill-inactive"}
        >
          {p === "custom" ? "Custom" : p}
        </button>
      ))}

      {period === "custom" && (
        <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 ring-1 ring-slate-200">
          <input
            type="date"
            className="input-field w-auto border-0 bg-transparent px-2 py-1.5 shadow-none focus:ring-0"
            value={customFrom}
            onChange={(e) => onCustomFromChange(e.target.value)}
          />
          <span className="text-slate-400">→</span>
          <input
            type="date"
            className="input-field w-auto border-0 bg-transparent px-2 py-1.5 shadow-none focus:ring-0"
            value={customTo}
            onChange={(e) => onCustomToChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
