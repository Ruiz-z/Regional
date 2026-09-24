import * as React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function DropletIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M8 1.8C8 1.8 3.2 7.2 3.2 10a4.8 4.8 0 0 0 9.6 0C12.8 7.2 8 1.8 8 1.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function RefreshIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v3h-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CircleSolidIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      {...props}
    >
      <circle cx="8" cy="8" r="5" fill="currentColor" />
    </svg>
  );
}

export function OctagonWarningIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M5.5 2h5L14 5.5v5L10.5 14h-5L2 10.5v-5Z"
        fill="currentColor"
      />
      <path
        d="M8 5v3.6M8 10.6v.4"
        stroke="var(--status-danger-soft)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TriangleWarningIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      {...props}
    >
      <path d="M8 2.5 14 13.5H2Z" fill="currentColor" />
    </svg>
  );
}

export function OfflineIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      {...props}
    >
      <circle
        cx="8"
        cy="8"
        r="5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M4.2 11.8 11.8 4.2"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export function InfoCircleIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      {...props}
    >
      <circle
        cx="8"
        cy="8"
        r="5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 7.2v4M8 5.2v.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BugIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      {...props}
    >
      <ellipse cx="8" cy="9" rx="3.6" ry="4.6" fill="currentColor" />
      <path
        d="M3 6l2 1.5M13 6l-2 1.5M2.5 10h2M13.5 10h-2M3.5 14l1.8-1.5M12.5 14l-1.8-1.5M6.5 3.5 5.5 2M9.5 3.5 10.5 2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}