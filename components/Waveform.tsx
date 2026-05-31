"use client";
import React from "react";

interface WaveformProps {
  acc: string;
  bars?: number;
}

// Pre-computed lookup tables — no runtime math, no floating point drift.
// All values are plain integer or 2-decimal literals.
// DURATION cycles through [0.7, 1.0, 1.3, 1.6] by bar index mod 4.
const DURATIONS = [0.7, 1.0, 1.3, 1.6];
// HEIGHTS follow a bell-curve envelope: short at edges, tall in the middle.
const HEIGHTS = [
   4,  6,  8, 12, 16, 20, 18, 14, 10,  8,
   6, 10, 14, 20, 18, 12,  8,  6,  4,  8,
  12, 16, 20, 16, 12,  8,  6,  4,  8, 12,
  16, 14, 10,  7,  5,  4,  6,  9, 13, 17,
];
// DELAYS increment by 0.05 per bar, clamped to 2 decimal places.
// Pre-computed as strings to guarantee identical server/client output.
const DELAYS = Array.from({ length: 40 }, (_, i) =>
  ((i * 5) % 100 / 100).toFixed(2)  // "0.00", "0.05", "0.10" ... "0.95"
);

export function Waveform({ acc, bars = 28 }: WaveformProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const count = Math.min(bars, HEIGHTS.length);
  return (
    <div
      style={{
        display:     "flex",
        alignItems:  "center",
        gap:         3,
        height:      28,
        paddingLeft: 2,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width:          2,
            borderRadius:   2,
            background:     acc,
            opacity:        0.65,
            height:         `${HEIGHTS[i]}px`,
            animation:      mounted ? `waveBar ${DURATIONS[i % 4]}s ease-in-out ${DELAYS[i]}s infinite` : "none",
            transformOrigin:"center",
          }}
        />
      ))}
    </div>
  );
}

export default Waveform;
