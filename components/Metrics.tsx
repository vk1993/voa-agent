"use client";
import React, { useEffect, useRef, useState } from "react";

/** Hook that animates a numeric count‑up when the element becomes visible.
 * Uses IntersectionObserver with a 0.3 threshold and runs only once.
 */
function useCountUp(target: number, options?: { duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const duration = options?.duration ?? 1500; // ms
  const [mounted, setMounted] = useState(false);

  // Set mounted after first render on client
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Ensure component is mounted before starting count up
        if (entry.isIntersecting && !started.current && mounted) {
          started.current = true;
          const startTime = performance.now();
          const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setCount(target);
            }
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, mounted]);

  return { ref, count: mounted ? count : target } as const;
}

/** Stat definition supporting optional prefix / suffix */
interface StatDef {
  prefix?: string;
  value: number;
  suffix?: string;
  label: string;
}

export default function Metrics({ acc }: { acc: string }) {
  const stats: StatDef[] = [
    { value: 147, label: "Active B2B Tenants" },
    { value: 8, label: "Industry Verticals" },
    { prefix: "<", value: 800, suffix: "ms", label: "Average AI Response" },
    { value: 23, suffix: "%", label: "Avg Conversion Rate" },
    { value: 23, label: "Countries Active" },
  ];

  return (
    <section
      style={{
        background: "rgba(10, 12, 18, 0.6)",
        borderTop: "0.5px solid rgba(255, 255, 255, 0.05)",
        borderBottom: "0.5px solid rgba(255, 255, 255, 0.05)",
        padding: "60px 0",
        position: "relative",
        zIndex: 5,
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 24,
            alignItems: "center",
          }}
        >
          {stats.map((s, i) => {
            const { ref, count } = useCountUp(s.value);
            const display = `${s.prefix ?? ""}${count}${s.suffix ?? ""}`;
            return (
              <div key={i} style={{ textAlign: "center", padding: "16px", position: "relative" }}>
                <div style={{ display: "inline-block", position: "relative", marginBottom: 8 }}>
                  <div
                    ref={ref}
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(32px, 3.2vw, 44px)",
                      fontWeight: 700,
                      color: acc,
                      lineHeight: 1,
                      letterSpacing: "-.03em",
                    }}
                  >
                    {display}
                  </div>
                  <div className="gold-underline" />
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--txt2)",
                    marginTop: 10,
                    lineHeight: 1.4,
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                  }}
                >
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
