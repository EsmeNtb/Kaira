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
      className={`relative shrink-0 overflow-hidden rounded-3xl ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <img
        src="/squirrel01.png"
        alt="Kaira the squirrel mascot"
        className="h-full w-full object-contain"
      />
    </div>
  );
}