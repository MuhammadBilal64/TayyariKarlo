import { Link } from 'react-router-dom';
import { BrandMark } from './BrandMark';

type BrandLockupProps = {
  to?: string;
  markClassName?: string;
  className?: string;
  wordmarkClassName?: string;
};

export function BrandLockup({
  to = '/',
  className = '',
  markClassName = 'h-7 w-7 shrink-0 text-ink',
  wordmarkClassName = 'font-display text-[1.45rem] tracking-[-0.02em] text-ink',
}: BrandLockupProps) {
  return (
    <Link
      to={to}
      className={`inline-flex cursor-pointer items-center gap-2.5 no-underline transition-opacity duration-200 hover:opacity-75 hover:no-underline ${className}`}
    >
      <BrandMark className={markClassName} decorative />
      <span className={wordmarkClassName}>TayyariKarlo</span>
    </Link>
  );
}
