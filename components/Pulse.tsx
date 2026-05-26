"use client";

import React from "react";

interface PulseProps {
  color?: string;
  size?: number;
}

export function Pulse({ color = "var(--green)", size = 8 }: PulseProps) {
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: color }} />
      <div
        style={{
          position: "absolute",
          inset: -3,
          borderRadius: "50%",
          background: color,
          opacity: 0.3,
          animation: "pulseRing 2s ease infinite",
        }}
      />
    </div>
  );
}

export default Pulse;
