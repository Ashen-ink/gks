import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WhiteBox } from "@/app/_components/white-model/white-mesh";
import { createWhiteModelMaterial } from "@/app/_components/white-model/white-model-material";

const visibilityThreshold = 0.35;
const dayLineColor = new THREE.Color("#dcdcdc");
const dayBackgroundColor = new THREE.Color("#ffffff");
const nightLineColor = new THREE.Color("#0b1020");
const nightBackgroundColor = new THREE.Color("#020713");

function updateWall(
  group: THREE.Group | null,
  material: THREE.Material,
  targetOpacity: number,
  delta: number,
  night: boolean,
) {
  if (!group) {
    return false;
  }

  if (targetOpacity > 0 && !group.visible) {
    group.visible = true;
    group.userData.hiddenFrames = 0;
  }

  if (targetOpacity === 0 && !group.visible) {
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

      lineMaterial.opacity = opacity * opacity;
      lineMaterial.color.lerpColors(
        night ? nightBackgroundColor : dayBackgroundColor,
        night ? nightLineColor : dayLineColor,
        opacity * opacity,
      );
    }
  });

  if (targetOpacity === 0 && opacity <= 0.001) {
    material.opacity = 0;
    group.userData.hiddenFrames = (group.userData.hiddenFrames ?? 0) + 1;

    group.traverse((child) => {
      if (child instanceof THREE.LineSegments) {
        const lineMaterial = child.material as THREE.LineBasicMaterial;
        lineMaterial.opacity = 0;
        lineMaterial.color.copy(
          night ? nightBackgroundColor : dayBackgroundColor,
        );
      }
    });

    if (group.userData.hiddenFrames > 1) {
      group.visible = false;
      return false;
    }

    return true;
  }

  group.userData.hiddenFrames = 0;

  return Math.abs(opacity - targetOpacity) > 0.001;
}

export default function CameraFacingWalls({ night }: { night: boolean }) {
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
      material.alphaHash = true;
      material.depthWrite = true;
      material.transparent = false;
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
      updateWall(frontWall.current, materials.front, targets.front, animationDelta, night),
      updateWall(backWall.current, materials.back, targets.back, animationDelta, night),
      updateWall(leftWall.current, materials.left, targets.left, animationDelta, night),
      updateWall(rightWall.current, materials.right, targets.right, animationDelta, night),
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
