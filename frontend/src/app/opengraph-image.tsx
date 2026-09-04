import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Saketh Vaddiparthi - AI Engineer";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#080808",
          color: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "#E11D2E",
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          V Saketh
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700 }}>
            Saketh Vaddiparthi
          </div>
          <div style={{ color: "#C9C9C9", display: "flex", fontSize: 34 }}>
            AI Engineer building RAG pipelines, LLM agents, and production systems.
          </div>
        </div>
        <div style={{ color: "#7A7A7A", display: "flex", fontSize: 24 }}>
          saketh-ai.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}