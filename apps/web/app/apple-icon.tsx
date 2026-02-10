import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          borderRadius: "40px",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="100%" stopColor="#4fd1c5" />
            </linearGradient>
          </defs>
          <g transform="translate(60,60)">
            {/* Hexagonal frame */}
            <polygon
              points="0,-42 36,-21 36,21 0,42 -36,21 -36,-21"
              fill="none"
              stroke="url(#g)"
              strokeWidth="2"
              opacity="0.5"
            />
            {/* Action lines */}
            <rect x="-18" y="-20" width="36" height="6" rx="3" fill="#4fd1c5" opacity="0.9" />
            <rect x="-18" y="-3" width="30" height="6" rx="3" fill="#38b2ac" />
            <rect x="-18" y="14" width="22" height="6" rx="3" fill="#4fd1c5" opacity="0.7" />
            {/* Check marks */}
            <line x1="24" y1="-18" x2="27" y2="-15" stroke="#4fd1c5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="27" y1="-15" x2="33" y2="-22" stroke="#4fd1c5" strokeWidth="2.5" strokeLinecap="round" />
            {/* Corner nodes */}
            <circle cx="0" cy="-42" r="4.5" fill="#4fd1c5" />
            <circle cx="36" cy="-21" r="3.5" fill="#38b2ac" />
            <circle cx="36" cy="21" r="3.5" fill="#38b2ac" />
            <circle cx="0" cy="42" r="4.5" fill="#4fd1c5" />
            <circle cx="-36" cy="21" r="3.5" fill="#38b2ac" opacity="0.6" />
            <circle cx="-36" cy="-21" r="3.5" fill="#38b2ac" opacity="0.6" />
          </g>
        </svg>
      </div>
    ),
    { ...size },
  );
}
