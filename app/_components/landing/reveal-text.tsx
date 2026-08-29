"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type RevealTextProps = {
  children: ReactNode;
};

export default function RevealText({ children }: RevealTextProps) {
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
    >
      <span className="reveal-text__content">{children}</span>
    </span>
  );
}
