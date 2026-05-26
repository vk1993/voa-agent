"use client";

import React from "react";

interface WaveformProps {
  acc: string;
  bars?: number;
}

export function Waveform({ acc, bars = 36 }: WaveformProps) {
  const heights = [
    4, 6, 8, 12, 16, 20, 18, 14, 10, 8, 6, 10, 14, 20, 18, 12, 8, 6, 4, 8,
    12, 16, 20, 16, 12, 8, 6, 4, 8, 12, 16, 14, 10, 7, 5, 4,
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2.5, height: 24, paddingLeft: 2 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 2,
            borderRadius: 2,
            background: acc,
            opacity: 0.55,
            height: `${heights[i % heights.length]}px`,
            animation: `waveBar ${0.7 + 0.3 * (i % 4)}s ease-in-out infinite`,
            animationDelay: `${(i * 0.05) % 1}s`,
          }}
        />
      ))}
    </div>
  );
}

export default Waveform;
