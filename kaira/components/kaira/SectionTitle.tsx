import type { ReactNode} from "react";

interface SelectionTitleProps {
  children: ReactNode;
}

export default function SectionTitle({ children,}: SelectionTitleProps ) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="h-px flex-1 bg-border/60" />
      <span className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
        {children}
      </span>
      <span className="h-px flex-1 bg-border/60" />
    </div>
  );
}