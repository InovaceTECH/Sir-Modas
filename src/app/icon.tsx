import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#000000",
        borderRadius: 12,
        color: "#D8A4A8",
        display: "flex",
        fontSize: 30,
        fontWeight: 700,
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      S
    </div>,
    size,
  );
}
