import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#7c2d4f",
        borderRadius: 16,
        color: "white",
        display: "flex",
        fontSize: 30,
        fontWeight: 700,
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      SM
    </div>,
    size,
  );
}
