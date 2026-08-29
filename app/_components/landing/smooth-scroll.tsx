"use client";

import { useEffect, type ReactNode } from "react";

type SmoothScrollProps = {
  children: ReactNode;
};

export default function SmoothScroll({ children }: SmoothScrollProps) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let current = window.scrollY;
    let target = current;
    let frame = 0;
    let animating = false;

    const getLimit = () =>
      Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);

    const update = () => {
      current += (target - current) * 0.085;

      if (Math.abs(target - current) < 0.25) {
        current = target;
        animating = false;
      }

      window.scrollTo(0, current);

      if (animating) {
        frame = requestAnimationFrame(update);
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        return;
      }

      if (
        event.target instanceof Element &&
        event.target.closest("[data-native-scroll]")
      ) {
        return;
      }

      event.preventDefault();
      const multiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : 1;
      target = Math.min(
        Math.max(target + event.deltaY * multiplier * 0.9, 0),
        getLimit(),
      );

      if (!animating) {
        animating = true;
        frame = requestAnimationFrame(update);
      }
    };

    const handleScroll = () => {
      if (!animating) {
        current = window.scrollY;
        target = current;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return children;
}
