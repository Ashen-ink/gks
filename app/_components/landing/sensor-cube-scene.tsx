"use client";

import { useEffect, useRef } from "react";
import {
  draw,
  effect,
  frameLoop,
  geometry,
  init,
  sampler,
  surface,
  target,
} from "vgpu";
import { createSensorCubeGeometry } from "@/app/_components/landing/sensor-cube-geometry";
import { createSensorCubeLightMesh } from "@/app/_components/landing/sensor-cube-optics";
import { SQUARE_OFFSET_X } from "@/app/_components/landing/sensor-optics-layout";
import beamShader from "@/app/_shaders/sensor-prism-light.wgsl";
import blurShader from "@/app/_shaders/sensor-prism-blur.wgsl";
import copyShader from "@/app/_shaders/sensor-prism-copy.wgsl";
import environmentShader from "@/app/_shaders/sensor-prism-environment.wgsl";
import glassBackShader from "@/app/_shaders/sensor-prism-glass-back.wgsl";
import glassFrontShader from "@/app/_shaders/sensor-prism-glass-front.wgsl";
import presentShader from "@/app/_shaders/sensor-prism-present.wgsl";

export default function SensorCube() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;

    if (!element) {
      return;
    }

    let disposed = false;
    let observer: IntersectionObserver | undefined;
    let stopLoop: (() => void) | undefined;
    let unsubscribeResize: (() => void) | undefined;
    let disposeGpu: (() => void) | undefined;

    const setup = async () => {
      const gpu = await init({ powerPreference: "high-performance" });

      if (disposed) {
        gpu.dispose();
        return;
      }

      const output = surface(gpu, element, {
        alphaMode: "premultiplied",
        clearColor: [0, 0, 0, 1],
        dpr: [1.5, 2],
      });
      const backdrop = target(gpu, {
        size: output.size,
        format: "rgba16float",
        label: "sensor-cube-backdrop",
      });
      const scene = target(gpu, {
        size: output.size,
        format: "rgba16float",
        label: "sensor-cube-scene",
      });
      const environmentBase = target(gpu, {
        size: [256, 128],
        format: "rgba16float",
        label: "sensor-cube-environment-base",
      });
      const environmentHorizontal = target(gpu, {
        size: [128, 64],
        format: "rgba16float",
        label: "sensor-cube-environment-horizontal",
      });
      const environmentSoft = target(gpu, {
        size: [128, 64],
        format: "rgba16float",
        label: "sensor-cube-environment-soft",
      });
      const linearSampler = sampler(gpu, {
        minFilter: "linear",
        magFilter: "linear",
      });
      const environmentSampler = sampler(gpu, {
        addressModeU: "repeat",
        addressModeV: "clamp-to-edge",
        minFilter: "linear",
        magFilter: "linear",
      });
      const lightMesh = createSensorCubeLightMesh();
      const lightGeometry = geometry(gpu, {
        label: "sensor-cube-light-mesh",
        vertexCount: lightMesh.vertices.length / 3,
        buffers: [
          {
            data: lightMesh.vertices,
            stride: 12,
            attributes: {
              position: { format: "float32x2", location: 0 },
              intensity: { format: "float32", location: 3 },
            },
          },
        ],
      });
      const glassGeometry = createSensorCubeGeometry(gpu);
      const bakeEnvironment = effect(gpu, environmentShader, {
        label: "sensor-cube-environment-bake",
      });
      const blurEnvironmentHorizontal = effect(gpu, blurShader, {
        label: "sensor-cube-environment-blur-horizontal",
        set: {
          source: environmentBase,
          source_sampler: environmentSampler,
          params: {
            texel: environmentBase.texelSize,
            direction: [1, 0],
            radius: 1.2,
          },
        },
      });
      const blurEnvironmentVertical = effect(gpu, blurShader, {
        label: "sensor-cube-environment-blur-vertical",
        set: {
          source: environmentHorizontal,
          source_sampler: environmentSampler,
          params: {
            texel: environmentHorizontal.texelSize,
            direction: [0, 1],
            radius: 1.2,
          },
        },
      });
      const beams = draw(gpu, {
        shader: beamShader,
        geometry: lightGeometry,
        blend: "additive",
        depth: false,
        label: "sensor-cube-light",
        set: {
          params: {
            aspect: aspectOf(output.size),
          },
        },
      });
      const squareBack = draw(gpu, {
        shader: glassBackShader,
        geometry: glassGeometry,
        blend: "premultiplied",
        cull: "front",
        depth: false,
        label: "sensor-cube-glass-back",
        set: {
          params: {
            aspect: aspectOf(output.size),
            offsetX: SQUARE_OFFSET_X,
          },
          environmentSharp: environmentBase,
          environmentSoft,
          environmentSampler,
        },
      });
      const copyBackdrop = effect(gpu, copyShader, {
        label: "sensor-cube-copy-backdrop",
        set: {
          source: backdrop,
          source_sampler: linearSampler,
        },
      });
      const squareFront = draw(gpu, {
        shader: glassFrontShader,
        geometry: glassGeometry,
        cull: "back",
        depth: false,
        label: "sensor-cube-glass-front",
        set: {
          params: {
            resolution: output.size,
            aspect: aspectOf(output.size),
            offsetX: SQUARE_OFFSET_X,
          },
          backdrop,
          backdropSampler: linearSampler,
          environmentSharp: environmentBase,
          environmentSoft,
          environmentSampler,
        },
      });
      const present = effect(gpu, presentShader, {
        label: "sensor-cube-present",
        set: {
          scene,
          linear_sampler: linearSampler,
        },
      });
      let loop: ReturnType<typeof frameLoop> | undefined;
      let visible = false;
      let needsEnvironment = true;
      let needsScene = true;

      const stop = () => {
        loop?.stop();
        loop = undefined;
      };

      const render = () => {
        if (!visible || loop) {
          return;
        }

        loop = frameLoop(gpu, (frame) => {
          if (needsEnvironment) {
            frame.pass(
              { target: environmentBase, clear: [0, 0, 0, 1] },
              (pass) => pass.draw(bakeEnvironment),
            );
            frame.pass(
              { target: environmentHorizontal, clear: [0, 0, 0, 1] },
              (pass) => pass.draw(blurEnvironmentHorizontal),
            );
            frame.pass(
              { target: environmentSoft, clear: [0, 0, 0, 1] },
              (pass) => pass.draw(blurEnvironmentVertical),
            );
            needsEnvironment = false;
            needsScene = true;
          }

          if (needsScene) {
            frame.pass(
              { target: backdrop, clear: [0, 0, 0, 1] },
              (pass) => {
                pass.draw(beams, lightMesh.incoming);
                pass.draw(beams, lightMesh.outgoing);
                pass.draw(squareBack);
                pass.draw(beams, lightMesh.squareEntry);
                pass.draw(beams, lightMesh.squareInternal);
                pass.draw(beams, lightMesh.squareExit);
              },
            );
            frame.pass(
              { target: scene, clear: [0, 0, 0, 1] },
              (pass) => {
                pass.draw(copyBackdrop);
                pass.draw(squareFront);
              },
            );
            frame.pass(
              { target: output, clear: [0, 0, 0, 1] },
              (pass) => pass.draw(present),
            );
            needsScene = false;
          }

          stop();
        });
      };

      const updateSceneBindings = () => {
        const aspect = aspectOf(output.size);
        backdrop.resize(output.size);
        scene.resize(output.size);
        beams.set({ params: { aspect } });
        squareBack.set({
          params: {
            aspect,
            offsetX: SQUARE_OFFSET_X,
          },
        });
        copyBackdrop.set({ source: backdrop });
        squareFront.set({
          backdrop,
          params: {
            resolution: output.size,
            aspect,
            offsetX: SQUARE_OFFSET_X,
          },
        });
        present.set({ scene });
        needsScene = true;
        render();
      };

      unsubscribeResize = output.onResize(updateSceneBindings);
      observer = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible) {
            needsScene = true;
            render();
          } else {
            stop();
          }
        },
        { threshold: 0.02 },
      );
      observer.observe(element);
      stopLoop = stop;
      disposeGpu = () => {
        lightGeometry.destroy();
        glassGeometry.destroy();
        gpu.dispose();
      };
    };

    setup().catch(() => {
      element.dataset.unavailable = "true";
    });

    return () => {
      disposed = true;
      observer?.disconnect();
      stopLoop?.();
      unsubscribeResize?.();
      disposeGpu?.();
    };
  }, []);

  return <canvas ref={canvas} className="landing-sensor-cube" aria-hidden="true" />;
}

function aspectOf(size: readonly [number, number]): number {
  return size[0] / Math.max(1, size[1]);
}
