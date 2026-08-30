interface MascotProps {
  className?: string;
  size?: number;
}

export default function Mascot({
  className = "",
  size = 120,
}: MascotProps) {
  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <img
        src="/kaira-koi.png"
        alt="Kaira the koi mascot"
        className="relative h-full w-full object-contain drop-shadow-[0_0_18px_rgba(226,114,58,0.22)]"
      />
    </div>
  );
}