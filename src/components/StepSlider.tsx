type Step = {
  label: string;
  days: number;
};

interface LockDaysSliderProps {
  days: number | string;
  onChange: (days: number) => void;
}

const STEPS: Step[] = [
  { label: "1d", days: 1 },
  { label: "90d", days: 90 },
  { label: "180d", days: 180 },
  { label: "365d", days: 365 },
];

const MIN_DAYS = 1;
const MAX_DAYS = 365;

export default function LockDaysSlider({
  days,
  onChange,
}: LockDaysSliderProps) {
  // Convert days to number for calculations
  const numDays = typeof days === 'string' ? parseFloat(days) || MIN_DAYS : days;
  
  const progressPercent =
    ((numDays - MIN_DAYS) / (MAX_DAYS - MIN_DAYS)) * 100;


  return (
    <div className="w-full max-w-[720px] bg-[#0b1220] p-6 rounded-xl text-white">
      {/* Header */}
      <p className="text-sm text-gray-300 mb-4">
        Lock for{" "}
        <span className="text-white font-medium">{numDays} Days</span>{" "}
      </p>

      {/* Slider */}
      <div className="relative h-[24px] mb-8">
        {/* Track */}
        <div className="absolute top-1/2 -translate-y-1/2 h-[6px] w-full bg-[#1f2937] rounded-full" />

        {/* Progress */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[6px] bg-[#2dd4bf] rounded-full transition-all duration-150"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Invisible range input */}
        <input
          type="range"
          min={MIN_DAYS}
          max={MAX_DAYS}
          step={1}
          value={numDays}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute top-0 left-0 w-full h-[24px] opacity-0 cursor-pointer z-40"
        />

        {/* Clickable milestone dots with labels */}
        {STEPS.map((step) => {
          const left =
            ((step.days - MIN_DAYS) / (MAX_DAYS - MIN_DAYS)) * 100;
          const isActive = step.days === numDays;
          const isPassed = step.days < numDays;

          return (
            <div
              key={step.days}
              style={{ left: `${left}%` }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
            >
              {/* Dot button */}
              <button
                onClick={() => onChange(step.days)}
                className={`
                  w-[16px] h-[16px] rounded-full
                  flex items-center justify-center
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-[#0b1220] border-2 border-[#2dd4bf]"
                      : isPassed
                      ? "bg-[#2dd4bf]"
                      : "bg-[#1f2937]"
                  }
                `}
              >
                <span className="w-[6px] h-[6px] rounded-full bg-[#2dd4bf]" />
              </button>
              
              {/* Label below dot */}
              <span className="absolute top-6 left-1/2 -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}