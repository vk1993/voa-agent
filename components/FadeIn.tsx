"use client";

import React, { useState, useEffect, useRef } from "react";

interface FadeInProps {
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function useFade(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const show = () => setVisible(true);

    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          show();
          ob.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    const t = setTimeout(() => {
      ob.observe(el);
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          show();
          ob.disconnect();
        }
      });
    }, delay);

    return () => {
      clearTimeout(t);
      ob.disconnect();
    };
  }, [delay]);

  return [ref, visible] as const;
}

export function FadeIn({ delay = 0, children, style = {} }: FadeInProps) {
  const [r, visible] = useFade(delay);
  return (
    <div
      ref={r}
      className={`fade-in${visible ? " on" : ""}`}
      style={style}
    >
      {children}
    </div>
  );
}

// Shorthand export to match the original React boilerplate
export const F = FadeIn;
export default FadeIn;
