type BrandMarkProps = {
  className?: string;
  /** When true, mark is decorative (e.g. beside a visible wordmark). */
  decorative?: boolean;
  title?: string;
};

/** Orbit Gap mark — approved Concept D. Inherits `currentColor`. */
export function BrandMark({
  className = 'h-8 w-8',
  decorative = false,
  title = 'TayyariKarlo',
}: BrandMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
    >
      {decorative ? null : <title>{title}</title>}
      <circle
        cx="32"
        cy="32"
        r="22"
        stroke="currentColor"
        strokeWidth="8"
        strokeDasharray="112.5 25.7"
        strokeDashoffset="-18"
        transform="rotate(-48 32 32)"
      />
      <rect
        x="45.75"
        y="9.75"
        width="8.5"
        height="8.5"
        fill="currentColor"
        transform="rotate(45 50 14)"
      />
    </svg>
  );
}
