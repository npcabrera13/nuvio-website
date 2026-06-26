import { ImageResponse } from "next/og";
export const runtime = "edge";

export const alt = "Nuvio — All your streaming. One app. ₱49/month.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Dynamic Open Graph image generated with next/og.
 * Shows the Nuvio brand, headline, and price on a premium dark gradient.
 */
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0a0a0f 0%, #1a0b2e 50%, #2d0a1f 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Ambient orbs */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124,58,237,0.4), transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            right: "-100px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(236,72,153,0.35), transparent 70%)",
            display: "flex",
          }}
        />

        {/* Brand row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              fontWeight: 800,
            }}
          >
            N
          </div>
          <div style={{ fontSize: "36px", fontWeight: 800, display: "flex" }}>
            Nuvio
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "76px",
            fontWeight: 800,
            lineHeight: 1.05,
            display: "flex",
            flexDirection: "column",
            maxWidth: "900px",
          }}
        >
          <div style={{ display: "flex" }}>All your streaming.</div>
          <div
            style={{
              display: "flex",
              background: "linear-gradient(100deg, #a78bfa, #ec4899)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            One app. ₱49/month.
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "28px",
            color: "rgba(255,255,255,0.75)",
            marginTop: "28px",
            display: "flex",
            maxWidth: "800px",
          }}
        >
          Netflix + Disney+ + HBO + 27 live channels. 7 days free.
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "32px",
            marginTop: "60px",
            fontSize: "24px",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#10b981", fontSize: "28px" }}>●</span> 27
            live channels
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#a78bfa", fontSize: "28px" }}>●</span>{" "}
            10,000+ titles
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#f472b6", fontSize: "28px" }}>●</span> No
            credit card needed
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
