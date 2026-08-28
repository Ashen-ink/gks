import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WhiteBox } from "@/app/_components/white-model/white-mesh";
import { createWhiteModelMaterial } from "@/app/_components/white-model/white-model-material";

const visibilityThreshold = 0.35;

function updateWall(
  group: THREE.Group | null,
  material: THREE.Material,
  targetOpacity: number,
  delta: number,
) {
  if (!group) {
    return false;
  }

  const opacity = THREE.MathUtils.damp(
    material.opacity,
    targetOpacity,
    7,
    delta,
  );

  material.opacity = opacity;

  group.traverse((child) => {
    if (child instanceof THREE.LineSegments) {
      const lineMaterial = child.material as THREE.LineBasicMaterial;

      if (!lineMaterial.transparent) {
        lineMaterial.transparent = true;
        lineMaterial.needsUpdate = true;
      }

      lineMaterial.opacity = opacity;
    }
  });

  return Math.abs(opacity - targetOpacity) > 0.001;
}

export default function CameraFacingWalls() {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const frontWall = useRef<THREE.Group>(null);
  const backWall = useRef<THREE.Group>(null);
  const leftWall = useRef<THREE.Group>(null);
  const rightWall = useRef<THREE.Group>(null);
  const materials = useMemo(() => {
    const nextMaterials = {
      front: createWhiteModelMaterial(),
      back: createWhiteModelMaterial(),
      left: createWhiteModelMaterial(),
      right: createWhiteModelMaterial(),
    };

    Object.values(nextMaterials).forEach((material) => {
      material.transparent = true;
      material.depthWrite = false;
    });

    return nextMaterials;
  }, []);

  useEffect(
    () => () => {
      Object.values(materials).forEach((material) => material.dispose());
    },
    [materials],
  );

  useFrame((_, delta) => {
    const distance = Math.hypot(camera.position.x, camera.position.z) || 1;
    const horizontal = camera.position.x / distance;
    const depth = camera.position.z / distance;
    const animationDelta = Math.min(delta, 1 / 60);
    const targets = {
      front: depth > visibilityThreshold ? 0 : 1,
      back: depth < -visibilityThreshold ? 0 : 1,
      left: horizontal < -visibilityThreshold ? 0 : 1,
      right: horizontal > visibilityThreshold ? 0 : 1,
    };

    const isFading = [
      updateWall(frontWall.current, materials.front, targets.front, animationDelta),
      updateWall(backWall.current, materials.back, targets.back, animationDelta),
      updateWall(leftWall.current, materials.left, targets.left, animationDelta),
      updateWall(rightWall.current, materials.right, targets.right, animationDelta),
    ].some(Boolean);

    if (isFading) {
      invalidate();
    }
  });

  return (
    <group>
      <group ref={frontWall}>
        <WhiteBox
          castShadow={false}
          material={materials.front}
          position={[-1.875, 2.4, 4]}
          size={[6.25, 4.8, 0.08]}
        />
        <WhiteBox
          castShadow={false}
          material={materials.front}
          position={[4.225, 2.4, 4]}
          size={[1.55, 4.8, 0.08]}
        />
        <WhiteBox
          castShadow={false}
          material={materials.front}
          position={[2.35, 4, 4]}
          size={[2.2, 1.6, 0.08]}
        />
      </group>
      <group ref={backWall}>
        <WhiteBox
          castShadow={false}
          material={materials.back}
          position={[-2.25, 2.4, -4]}
          size={[5.5, 4.8, 0.08]}
        />
        <WhiteBox
          castShadow={false}
          material={materials.back}
          position={[4.6, 2.4, -4]}
          size={[0.8, 4.8, 0.08]}
        />
        <WhiteBox
          castShadow={false}
          material={materials.back}
          position={[2.35, 0.85, -4]}
          size={[3.7, 1.7, 0.08]}
        />
        <WhiteBox
          castShadow={false}
          material={materials.back}
          position={[2.35, 4.3, -4]}
          size={[3.7, 1, 0.08]}
        />
      </group>
      <group ref={leftWall}>
        <WhiteBox
          castShadow={false}
          material={materials.left}
          position={[-5, 2.4, 0]}
          size={[0.08, 4.8, 8]}
        />
      </group>
      <group ref={rightWall}>
        <WhiteBox
          castShadow={false}
          material={materials.right}
          position={[5, 2.4, 0]}
          size={[0.08, 4.8, 8]}
        />
      </group>
    </group>
  );
}
