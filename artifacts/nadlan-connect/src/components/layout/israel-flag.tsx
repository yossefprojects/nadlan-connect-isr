export function IsraelFlag({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 36"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Israël"
    >
      <rect width="48" height="36" rx="3" fill="#ffffff" />
      <rect y="6" width="48" height="4.5" fill="#0038B8" />
      <rect y="25.5" width="48" height="4.5" fill="#0038B8" />
      <g fill="none" stroke="#0038B8" strokeWidth="2" strokeLinejoin="round">
        <path d="M24 11 L17.94 21.5 L30.06 21.5 Z" />
        <path d="M24 25 L30.06 14.5 L17.94 14.5 Z" />
      </g>
    </svg>
  );
}
