import { cn } from "@/lib/utils";

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  label?: string;
  className?: string;
}

export function Slider({ value, min = 0, max = 1, step = 0.01, onChange, label, className }: SliderProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && (
        <label className="sr-only" htmlFor={label}>
          {label}
        </label>
      )}
      <input
        id={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-violet-500"
        aria-label={label ?? "slider"}
      />
      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{Math.round(value * 100)}%</span>
    </div>
  );
}
