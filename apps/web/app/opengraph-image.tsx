import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GSD Community Hub — Open Source on Solana";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(79,209,197,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(79,209,197,0.04) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
            display: "flex",
          }}
        />

        {/* Orb 1 */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "60px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(79,209,197,0.08)",
            filter: "blur(80px)",
            display: "flex",
          }}
        />

        {/* Orb 2 */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "100px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(30,58,95,0.15)",
            filter: "blur(80px)",
            display: "flex",
          }}
        />

        {/* Decorative hexagon top-left */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 60 60"
          style={{ position: "absolute", top: 60, left: 80, opacity: 0.06 }}
        >
          <polygon
            points="30,2 56,16 56,44 30,58 4,44 4,16"
            fill="none"
            stroke="#4fd1c5"
            strokeWidth="1"
          />
        </svg>

        {/* Decorative hexagon bottom-right */}
        <svg
          width="60"
          height="60"
          viewBox="0 0 60 60"
          style={{ position: "absolute", bottom: 80, right: 120, opacity: 0.06 }}
        >
          <polygon
            points="30,2 56,16 56,44 30,58 4,44 4,16"
            fill="none"
            stroke="#4fd1c5"
            strokeWidth="1"
          />
        </svg>

        {/* Decorative hexagon top-right */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 60 60"
          style={{ position: "absolute", top: 120, right: 200, opacity: 0.04 }}
        >
          <polygon
            points="30,2 56,16 56,44 30,58 4,44 4,16"
            fill="none"
            stroke="#4fd1c5"
            strokeWidth="1"
          />
        </svg>

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* GSD Logo */}
          <div
            style={{
              fontSize: "80px",
              fontWeight: 200,
              letterSpacing: "16px",
              color: "#f8fafc",
              marginBottom: "12px",
              display: "flex",
            }}
          >
            <span>GS</span>
            <span style={{ color: "#4fd1c5" }}>D</span>
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: "32px",
              fontWeight: 200,
              color: "#f8fafc",
              marginBottom: "12px",
              display: "flex",
            }}
          >
            <span style={{ color: "#4fd1c5", fontWeight: 300, marginRight: "10px" }}>
              Community
            </span>
            <span>Hub</span>
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: "18px",
              color: "#718096",
              fontWeight: 300,
              marginBottom: "32px",
              display: "flex",
            }}
          >
            Open Source. Real Utility. For All. For Ever.
          </div>

          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 20px",
              border: "1px solid rgba(79,209,197,0.3)",
              borderRadius: "50px",
              fontSize: "14px",
              color: "#4fd1c5",
              letterSpacing: "2px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                background: "#4fd1c5",
                borderRadius: "50%",
                display: "flex",
              }}
            />
            BUILT ON SOLANA
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            right: "40px",
            fontSize: "16px",
            color: "#4fd1c5",
            letterSpacing: "2px",
            fontWeight: 300,
            display: "flex",
          }}
        >
          gsd-community-hub
        </div>
      </div>
    ),
    { ...size },
  );
}
