export default function Logo({
  className = "w-auto h-full max-h-8",
  iconOnly = false,
  isDark = false,
}) {
  const primaryColor = isDark ? "#FFFFFF" : "currentColor";
  const subtitleColor = isDark ? "#A1A1AA" : "#71717A";

  if (iconOnly) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        fill="none"
        className={className}
        aria-label="HQ icon"
      >
        {/* Left Pillar */}
        <rect x="0" y="0" width="7.5" height="32" fill={primaryColor} />
        {/* Crossbeam */}
        <rect x="7.5" y="11" width="11" height="7" fill={primaryColor} />
        {/* Right Pillar (Upper) */}
        <rect x="18.5" y="0" width="7.5" height="20" fill={primaryColor} />
        {/* Q Foundation Diagonal Spur */}
        <polygon
          points="18.5,20 26,20 32,26 32,32 26,32 18.5,24.5"
          fill={primaryColor}
        />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 196 36"
      fill="none"
      className={className}
      aria-label="HQ Connect logo"
    >
      {/* Architectural HQ Emblem (32x32) */}
      <g transform="translate(0, 2)">
        {/* Left Pillar */}
        <rect x="0" y="0" width="7.5" height="32" fill={primaryColor} />
        {/* Architectural Crossbeam */}
        <rect x="7.5" y="11" width="11" height="7" fill={primaryColor} />
        {/* Right Pillar Upper */}
        <rect x="18.5" y="0" width="7.5" height="20" fill={primaryColor} />
        {/* Q Foundation Spur */}
        <polygon
          points="18.5,20 26,20 32,26 32,32 26,32 18.5,24.5"
          fill={primaryColor}
        />
      </g>

      {/* Vector Wordmark: HQ */}
      <g transform="translate(45, 4)">
        {/* H */}
        <path
          d="M0 2 H5.5 V12.5 H16.5 V2 H22 V26 H16.5 V17.5 H5.5 V26 H0 V2 Z"
          fill={primaryColor}
        />
        {/* Q (Precision geometry with sharp dynamic tail) */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M40 2 C33.37 2 28 7.37 28 14 C28 20.63 33.37 26 40 26 C42.2 26 44.25 25.4 46 24.38 L48.8 27.2 L52.7 23.3 L49.9 20.5 C51.22 18.66 52 16.42 52 14 C52 7.37 46.63 2 40 2 Z M40 7 C43.86 7 47 10.14 47 14 C47 17.86 43.86 21 40 21 C36.14 21 33 17.86 33 14 C33 10.14 36.14 7 40 7 Z"
          fill={primaryColor}
        />
      </g>

      {/* Subtitle: CONNECT */}
      <text
        x="112"
        y="23"
        fontFamily="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="10.5"
        fontWeight="700"
        letterSpacing="3.5"
        fill={subtitleColor}
      >
        CONNECT
      </text>
    </svg>
  );
}
