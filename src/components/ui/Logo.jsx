/* eslint-disable react/no-unknown-property */
import React from "react";

const Logo = ({ iconOnly = false, isDark = false, className = "" }) => {
  // Determine fill colors based on isDark prop
  const bar1Color = "#A1A1AA";
  const bar2Color = isDark ? "#FFFFFF" : "#09090B";
  const bar3Color = isDark ? "#D4D4D8" : "#3F3F46";
  const textColor = isDark ? "#FFFFFF" : "#09090B";
  const subTextColor = isDark ? "#A1A1AA" : "#71717A";

  if (iconOnly) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="25 20 60 50"
        className={`w-auto h-full max-h-9 overflow-visible ${className}`}
      >
        {/* Equalizer Audio Frequency Static Bars */}
        <g transform="translate(30, 25)">
          {/* Bar 1 (Left) */}
          <rect
            x="0"
            y="10"
            width="12"
            height="30"
            rx="6"
            fill={bar1Color}
          />

          {/* Bar 2 (Center) */}
          <rect
            x="18"
            y="0"
            width="12"
            height="40"
            rx="6"
            fill={bar2Color}
          />

          {/* Bar 3 (Right) */}
          <rect
            x="36"
            y="15"
            width="12"
            height="25"
            rx="6"
            fill={bar3Color}
          />
        </g>
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="25 15 255 60"
      className={`w-auto h-full max-h-9 overflow-visible ${className}`}
    >
      {/* Equalizer Audio Frequency Static Bars */}
      <g transform="translate(30, 25)">
        {/* Bar 1 (Left) */}
        <rect
          x="0"
          y="10"
          width="12"
          height="30"
          rx="6"
          fill={bar1Color}
        />

        {/* Bar 2 (Center - Primary Dark) */}
        <rect
          x="18"
          y="0"
          width="12"
          height="40"
          rx="6"
          fill={bar2Color}
        />

        {/* Bar 3 (Right) */}
        <rect
          x="36"
          y="15"
          width="12"
          height="25"
          rx="6"
          fill={bar3Color}
        />
      </g>

      {/* Typography */}
      <text
        x="90"
        y="60"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="46"
        fontWeight="800"
        fill={textColor}
        letterSpacing="-2"
      >
        hq
      </text>

      <text
        x="145"
        y="60"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="20"
        fontWeight="600"
        fill={subTextColor}
        letterSpacing="3"
      >
        CONNECT
      </text>
    </svg>
  );
};

export default Logo;
