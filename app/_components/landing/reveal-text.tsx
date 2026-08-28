"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type RevealTextProps = {
  children: ReactNode;
  delay?: number;
};

export default function RevealText({ children, delay = 0 }: RevealTextProps) {
  const element = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!element.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.35 },
    );

    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);

  return (
    <span
      ref={element}
      className="reveal-text"
      data-visible={visible}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      <span className="reveal-text__content">{children}</span>
    </span>
  );
}
