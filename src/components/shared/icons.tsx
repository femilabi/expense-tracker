interface IconProps {
  size?: number;
}

export function PlusIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function SearchIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function CloseIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

export function CalendarIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 9.5h17" />
    </svg>
  );
}

export function EyeIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.9 5.7A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.4 17.4 0 0 1-2.6 3.4" />
      <path d="M6.6 6.6C4 8.3 2.5 12 2.5 12s3.5 6.5 9.5 6.5a9.4 9.4 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <line x1="3" y1="3" x2="21" y2="21" />
    </svg>
  );
}

export function PencilIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      <path d="m14.5 5.5 3 3" />
    </svg>
  );
}

export function TrashIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

/** Shared outline frame for the dashboard and category icons below. */
function OutlineIcon({
  size = 18,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function TrendUpIcon({ size }: IconProps) {
  return (
    <OutlineIcon size={size}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </OutlineIcon>
  );
}

export function PieChartIcon({ size }: IconProps) {
  return (
    <OutlineIcon size={size}>
      <path d="M21 12a9 9 0 1 1-9-9" />
      <path d="M12 3a9 9 0 0 1 9 9h-9z" />
    </OutlineIcon>
  );
}

export function TargetIcon({ size }: IconProps) {
  return (
    <OutlineIcon size={size}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </OutlineIcon>
  );
}

export function ReceiptIcon({ size }: IconProps) {
  return (
    <OutlineIcon size={size}>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
    </OutlineIcon>
  );
}

export function FoodIcon({ size }: IconProps) {
  return (
    <OutlineIcon size={size}>
      <path d="M7 3v8a2 2 0 0 0 2 2v8" />
      <path d="M5 3v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V3" />
      <path d="M17 21V3c-2 1-3 3-3 6v4h3" />
    </OutlineIcon>
  );
}

export function WifiIcon({ size }: IconProps) {
  return (
    <OutlineIcon size={size}>
      <path d="M2 9a15 15 0 0 1 20 0" />
      <path d="M5 12.5a10 10 0 0 1 14 0" />
      <path d="M8.5 16a5 5 0 0 1 7 0" />
      <path d="M12 19.5h.01" />
    </OutlineIcon>
  );
}

export function CupIcon({ size }: IconProps) {
  return (
    <OutlineIcon size={size}>
      <path d="M5 8h12v5a6 6 0 0 1-12 0z" />
      <path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path d="M9 3v2" />
      <path d="M13 3v2" />
    </OutlineIcon>
  );
}

export function BusIcon({ size }: IconProps) {
  return (
    <OutlineIcon size={size}>
      <rect x="4" y="3" width="16" height="15" rx="3" />
      <path d="M4 11h16" />
      <path d="M8 15h.01" />
      <path d="M16 15h.01" />
      <path d="M7 18v3" />
      <path d="M17 18v3" />
    </OutlineIcon>
  );
}

export function HomeIcon({ size }: IconProps) {
  return (
    <OutlineIcon size={size}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </OutlineIcon>
  );
}

export function BoltIcon({ size }: IconProps) {
  return (
    <OutlineIcon size={size}>
      <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
    </OutlineIcon>
  );
}

export function HeartPulseIcon({ size }: IconProps) {
  return (
    <OutlineIcon size={size}>
      <path d="M20.5 12.5A5 5 0 0 0 12 6a5 5 0 0 0-8.5 6.5L12 21z" />
      <path d="M3.5 12h4l2-3 3 5 2-2h6" />
    </OutlineIcon>
  );
}

export function FilmIcon({ size }: IconProps) {
  return (
    <OutlineIcon size={size}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M10 9l5 3-5 3z" />
    </OutlineIcon>
  );
}

export function BagIcon({ size }: IconProps) {
  return (
    <OutlineIcon size={size}>
      <path d="M5 8h14l-1 13H6z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </OutlineIcon>
  );
}

export function DotsIcon({ size }: IconProps) {
  return (
    <OutlineIcon size={size}>
      <circle cx="6" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="18" cy="12" r="1" />
    </OutlineIcon>
  );
}

export function IncomeIcon({ size }: IconProps) {
  return (
    <OutlineIcon size={size}>
      <path d="M12 3v11" />
      <path d="M8 10l4 4 4-4" />
      <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
    </OutlineIcon>
  );
}
