"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { mrt, normalView, output, pass, vec3, vec4 } from "three/tsl";
import { ao } from "three/addons/tsl/display/GTAONode.js";

export default function AmbientOcclusion() {
  const camera = useThree((state) => state.camera);
  const renderer = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);
  const pipeline = useRef<THREE.RenderPipeline | null>(null);

  useEffect(() => {
    const scenePass = pass(scene, camera);
    scenePass.setMRT(mrt({ output, normal: normalView }));

    const sceneColor = scenePass.getTextureNode("output");
    const sceneDepth = scenePass.getTextureNode("depth");
    const sceneNormal = scenePass.getTextureNode("normal");
    const ambientOcclusion = ao(sceneDepth, sceneNormal, camera);

    ambientOcclusion.resolutionScale = 0.5;
    ambientOcclusion.radius.value = 0.35;
    ambientOcclusion.thickness.value = 0.6;
    ambientOcclusion.distanceExponent.value = 1.5;
    ambientOcclusion.distanceFallOff.value = 0.85;
    ambientOcclusion.scale.value = 0.8;
    ambientOcclusion.samples.value = 12;

    const occlusion = ambientOcclusion
      .getTextureNode()
      .r.mul(0.22)
      .add(0.78);
    const renderPipeline = new THREE.RenderPipeline(
      renderer as unknown as THREE.WebGPURenderer,
    );

    renderPipeline.outputNode = sceneColor.mul(
      vec4(vec3(occlusion), 1),
    );
    pipeline.current = renderPipeline;
    invalidate();

    return () => {
      pipeline.current = null;
      ambientOcclusion.dispose();
      scenePass.dispose();
      renderPipeline.dispose();
    };
  }, [camera, invalidate, renderer, scene]);

  useFrame(() => {
    pipeline.current?.render();
  }, 1);

  return null;
}
