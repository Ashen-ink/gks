import { useMemo } from "react";
import * as THREE from "three";
import WhiteModelMaterial from "@/app/_components/white-model/white-model-material";

type Vector3 = [number, number, number];

type WhiteBoxProps = {
  castShadow?: boolean;
  material?: THREE.Material;
  position: Vector3;
  rotation?: Vector3;
  size: Vector3;
};

type WhiteCylinderProps = {
  height: number;
  position: Vector3;
  radius: number;
  rotation?: Vector3;
};

const disableRaycast = () => undefined;

export function WhiteBox({
  castShadow = true,
  material,
  position,
  rotation = [0, 0, 0],
  size,
}: WhiteBoxProps) {
  const [width, height, depth] = size;
  const geometry = useMemo(
    () => new THREE.BoxGeometry(width, height, depth),
    [width, height, depth],
  );

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow={castShadow} geometry={geometry} receiveShadow>
        {material ? (
          <primitive attach="material" object={material} />
        ) : (
          <WhiteModelMaterial />
        )}
      </mesh>
      <lineSegments raycast={disableRaycast}>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color="#dcdcdc" />
      </lineSegments>
    </group>
  );
}

export function WhiteCylinder({
  height,
  position,
  radius,
  rotation = [0, 0, 0],
}: WhiteCylinderProps) {
  return (
    <mesh castShadow position={position} receiveShadow rotation={rotation}>
      <cylinderGeometry args={[radius, radius, height, 32]} />
      <WhiteModelMaterial />
    </mesh>
  );
}
