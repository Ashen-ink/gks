"use client";

import { useEffect, useRef } from "react";
import { clock, effect, frameLoop, init, surface } from "vgpu";
import indexShader from "@/app/_shaders/landing-index.wgsl";

type IndexShaderMode = "wind" | "environment" | "pose";

const modes: Record<IndexShaderMode, number> = {
  wind: 0,
  environment: 1,
  pose: 2,
};

export default function IndexShader({ mode }: { mode: IndexShaderMode }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;

    if (!element) {
      return;
    }

    let disposed = false;
    let observer: IntersectionObserver | undefined;
    let stopLoop: (() => void) | undefined;
    let disposeGpu: (() => void) | undefined;

    const setup = async () => {
      const gpu = await init({ powerPreference: "high-performance" });

      if (disposed) {
        gpu.dispose();
        return;
      }

      const output = surface(gpu, element, {
        alphaMode: "premultiplied",
        clearColor: [1, 1, 1, 1],
        dpr: [1.5, 2],
      });
      const field = effect(gpu, indexShader, {
        label: "landing-index-field",
        set: {
          params: {
            resolution: output.size,
            time: 0,
            mode: modes[mode],
          },
        },
      });
      const gpuClock = clock(gpu);
      let loop: ReturnType<typeof frameLoop> | undefined;

      const stop = () => {
        loop?.stop();
        loop = undefined;
      };

      const start = () => {
        if (loop) {
          return;
        }

        loop = frameLoop(gpu, (frame) => {
          field.set({
              params: {
                resolution: output.size,
                time: gpuClock.time,
                mode: modes[mode],
            },
          });
          frame.pass(
            { target: output, clear: [1, 1, 1, 1] },
            (pass) => pass.draw(field),
          );
        });
      };

      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            start();
          } else {
            stop();
          }
        },
        { threshold: 0.02 },
      );
      observer.observe(element);
      stopLoop = stop;
      disposeGpu = () => gpu.dispose();
    };

    setup().catch(() => {
      element.dataset.unavailable = "true";
    });

    return () => {
      disposed = true;
      observer?.disconnect();
      stopLoop?.();
      disposeGpu?.();
    };
  }, [mode]);

  return <canvas ref={canvas} className="landing-index__shader" aria-hidden="true" />;
}
