import {
  Activity,
  ScanLine,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

interface StatsChipProps {
  transactionsAnalyzed: number;
  commitmentsDetected: number;
  demoMode?: boolean;
}

export default function StatsChip({
  transactionsAnalyzed,
  commitmentsDetected,
  demoMode = true,
}: StatsChipProps) {
  return (
    <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1">

      <Chip
        icon={ScanLine}
        tint="lavender"
      >
        {transactionsAnalyzed}{" "}
        transactions analyzed
      </Chip>

      <Chip
        icon={Activity}
        tint="mint"
      >
        {commitmentsDetected}{" "}
        commitments detected
      </Chip>

      {demoMode && (
        <Chip
          icon={Sparkles}
          tint="peach"
        >
          Demo account
        </Chip>
      )}
    </div>
  );
}

interface ChipProps {
  icon: LucideIcon;

  tint:
    | "lavender"
    | "mint"
    | "peach";

  children: React.ReactNode;
}

function Chip({
  icon: Icon,
  tint,
  children,
}: ChipProps) {
  const tones = {
    lavender:
      "text-lavender bg-lavender/10 border-lavender/20",

    mint:
      "text-mint bg-mint/10 border-mint/20",

    peach:
      "text-peach bg-peach/10 border-peach/20",
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${tones[tint]}`}
    >
      <Icon
        className="h-3 w-3"
        strokeWidth={2.4}
      />

      {children}
    </span>
  );
}