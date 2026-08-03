/* eslint-disable @next/next/no-img-element */
"use client";
import HTMLFlipBook from "react-pageflip";

type PageFlipperProps = {
  images: string[];
  width?: number;
  height?: number;
  backgroundColor?: string;
  showPageNumbers?: boolean;
  size?: "fixed" | "stretch";
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  drawShadow?: boolean;
  flippingTime?: number;
  usePortrait?: boolean;
  startZIndex?: number;
  autoSize?: boolean;
  maxShadowOpacity?: number;
  showCover?: boolean;
  mobileScrollSupport?: boolean;
  swipeDistance?: number;
  showPageCorners?: boolean;
  disableFlipByClick?: boolean;
  useMouseEvents?: boolean;
};

// Fields cleared in the editor arrive as "" (or NaN); HTMLFlipBook throws
// "Invalid width or height" on any non-positive number, so coerce to a
// sensible fallback before handing sizing props to it.
const toPositive = (value: unknown, fallback: number): number => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
};

export default function PageFlipper({
  images,
  width = 400,
  height = 600,
  backgroundColor = "",
  showPageNumbers = true,
  size = "stretch",
  minWidth = 315,
  maxWidth = 1000,
  minHeight = 400,
  maxHeight = 1500,
  drawShadow = true,
  flippingTime = 600,
  usePortrait = true,
  startZIndex = 0,
  autoSize = true,
  maxShadowOpacity = 0.5,
  showCover = true,
  mobileScrollSupport = true,
  swipeDistance = 30,
  showPageCorners = true,
  disableFlipByClick = false,
  useMouseEvents = true,
}: PageFlipperProps) {
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <HTMLFlipBook
        width={toPositive(width, 400)}
        height={toPositive(height, 600)}
        size={size}
        minWidth={toPositive(minWidth, 315)}
        maxWidth={toPositive(maxWidth, 1000)}
        minHeight={toPositive(minHeight, 400)}
        maxHeight={toPositive(maxHeight, 1500)}
        maxShadowOpacity={maxShadowOpacity}
        drawShadow={drawShadow}
        flippingTime={flippingTime}
        useMouseEvents={useMouseEvents}
        showCover={showCover}
        mobileScrollSupport={mobileScrollSupport}
        className=""
        style={{}}
        startPage={0}
        usePortrait={usePortrait}
        clickEventForward={true}
        startZIndex={startZIndex}
        autoSize={autoSize}
        swipeDistance={swipeDistance}
        showPageCorners={showPageCorners}
        disableFlipByClick={disableFlipByClick}>
        {images.map((src, i) => (
          <div
            key={i}
            style={{
              background: backgroundColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}>
            {src ? (
              <img
                src={src}
                alt={`Page ${i + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  color: "var(--subtle)",
                }}>
                Empty Page
              </div>
            )}

            {showPageNumbers && (
              <span
                style={{
                  position: "absolute",
                  bottom: "8px",
                  right: "12px",
                  fontSize: "0.8rem",
                  color: "#666",
                  background: "rgba(255, 255, 255, 0.8)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}>
                {i + 1}
              </span>
            )}
          </div>
        ))}
      </HTMLFlipBook>
    </div>
  );
}
