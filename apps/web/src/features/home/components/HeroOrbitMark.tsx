type HeroOrbitMarkProps = {
  className?: string;
};

/**
 * Decorative Orbit Gap for the Steel Stage hero.
 * Slow revolve + ink→signal gradient. Honors prefers-reduced-motion via CSS.
 */
export function HeroOrbitMark({ className = '' }: HeroOrbitMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={`hero-orbit-mark ${className}`}
      role="presentation"
      aria-hidden
    >
      <defs>
        <linearGradient
          id="hero-orbit-stroke"
          x1="8"
          y1="56"
          x2="56"
          y2="8"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="var(--color-ink)"
            stopOpacity="0.45"
          />
          <stop
            offset="50%"
            stopColor="var(--color-signal)"
            stopOpacity="0.9"
          />
          <stop
            offset="100%"
            stopColor="var(--color-signal-bright)"
            stopOpacity="1"
          />
        </linearGradient>
        <linearGradient
          id="hero-orbit-pip"
          x1="44"
          y1="20"
          x2="56"
          y2="8"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--color-ink)" />
          <stop offset="100%" stopColor="var(--color-signal)" />
        </linearGradient>
        <filter
          id="hero-orbit-glow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle
        cx="32"
        cy="32"
        r="22"
        stroke="url(#hero-orbit-stroke)"
        strokeWidth="8"
        strokeDasharray="112.5 25.7"
        strokeDashoffset="-18"
        transform="rotate(-48 32 32)"
        filter="url(#hero-orbit-glow)"
      />
      <rect
        x="45.75"
        y="9.75"
        width="8.5"
        height="8.5"
        fill="url(#hero-orbit-pip)"
        transform="rotate(45 50 14)"
      />
    </svg>
  );
}
