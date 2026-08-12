interface KrugLogoProps {
  size?: number;
  className?: string;
}

export function KrugLogo({ size = 48, className }: KrugLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Круг логотип"
    >
      {/* Left speech bubble circle */}
      <circle cx="24" cy="28" r="18" fill="#6750A4" opacity="0.9" />
      {/* Right speech bubble circle */}
      <circle cx="40" cy="28" r="18" fill="#FF715B" opacity="0.85" />
      {/* Overlap blend */}
      <circle cx="32" cy="28" r="10" fill="#9A6FD8" opacity="0.7" />
      {/* Left tail */}
      <path d="M16 42 L10 52 L22 46" fill="#6750A4" opacity="0.9" />
      {/* Right tail */}
      <path d="M48 42 L54 52 L42 46" fill="#FF715B" opacity="0.85" />
    </svg>
  );
}
