import { createContext, useContext, type ReactNode } from "react";
import * as THREE from "three/webgpu";
import { lights } from "three/tsl";

const ambientLight = new THREE.AmbientLight("#ffffff", 1.9);
const sunLight = new THREE.DirectionalLight("#ffffff", 1.25);
const moonLight = new THREE.DirectionalLight("#ffffff", 0.03);

function createCeilingLight(horizontal: number, castShadow: boolean) {
  const light = new THREE.SpotLight(
    "#ffc982",
    0,
    12,
    Math.PI / 3,
    0.8,
    2,
  );

  light.position.set(horizontal, 4.62, 0);
  light.target.position.set(horizontal * 0.35, 0, 0);
  light.castShadow = castShadow;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.bias = -0.0003;
  light.shadow.normalBias = 0.025;
  light.updateMatrixWorld();
  light.target.updateMatrixWorld();

  return light;
}

export const whiteModelCeilingLights = [
  createCeilingLight(-0.82, false),
  createCeilingLight(0, true),
  createCeilingLight(0.82, false),
];
export const whiteModelNaturalLight = new THREE.DirectionalLight("#fff4df", 0);

sunLight.position.set(7.1, 11.4, 2.7);
moonLight.position.set(1.3, 5.9, 7.9);
whiteModelNaturalLight.castShadow = true;
whiteModelNaturalLight.shadow.mapSize.set(2048, 2048);
whiteModelNaturalLight.shadow.camera.left = -7;
whiteModelNaturalLight.shadow.camera.right = 7;
whiteModelNaturalLight.shadow.camera.top = 7;
whiteModelNaturalLight.shadow.camera.bottom = -7;
whiteModelNaturalLight.shadow.camera.near = 0.1;
whiteModelNaturalLight.shadow.camera.far = 30;
whiteModelNaturalLight.shadow.bias = -0.0004;
whiteModelNaturalLight.shadow.normalBias = 0.025;
sunLight.updateMatrixWorld();
moonLight.updateMatrixWorld();
whiteModelNaturalLight.updateMatrixWorld();
whiteModelNaturalLight.target.updateMatrixWorld();

export function setWhiteModelCeilingLight(enabled: boolean) {
  whiteModelCeilingLights.forEach((light, index) => {
    light.intensity = enabled ? (index === 1 ? 13 : 9) : 0;
  });
}

export function setWhiteModelNightMode(enabled: boolean) {
  ambientLight.intensity = enabled ? 0.06 : 1.9;
  sunLight.intensity = enabled ? 0.02 : 1.25;
  moonLight.intensity = enabled ? 0.04 : 0.03;
}

export function setWhiteModelNaturalLight(enabled: boolean) {
  const azimuthDegrees = -18;
  const elevationDegrees = 35;
  const azimuth = THREE.MathUtils.degToRad(azimuthDegrees);
  const elevation = THREE.MathUtils.degToRad(elevationDegrees);
  const facing = Math.max(Math.cos(azimuth), 0);
  const elevationIn = THREE.MathUtils.smoothstep(elevationDegrees, 8, 24);
  const elevationOut = 1 - THREE.MathUtils.smoothstep(elevationDegrees, 68, 82);
  const direction = new THREE.Vector3(
    Math.sin(azimuth) * Math.cos(elevation),
    -Math.sin(elevation),
    Math.cos(azimuth) * Math.cos(elevation),
  );
  const target = new THREE.Vector3(0.4, 1.15, 0.5);

  whiteModelNaturalLight.target.position.copy(target);
  whiteModelNaturalLight.position
    .copy(target)
    .add(direction.multiplyScalar(-14));
  whiteModelNaturalLight.intensity = enabled
    ? 1.45 * facing * elevationIn * elevationOut
    : 0;
  whiteModelNaturalLight.updateMatrixWorld();
  whiteModelNaturalLight.target.updateMatrixWorld();
}

export function createWhiteModelMaterial() {
  const nextMaterial = new THREE.MeshStandardNodeMaterial({
    color: "#ffffff",
    metalness: 0,
    roughness: 1,
    side: THREE.DoubleSide,
  });

  nextMaterial.lightsNode = lights([
    ambientLight,
    sunLight,
    moonLight,
    ...whiteModelCeilingLights,
    whiteModelNaturalLight,
  ]);

  return nextMaterial;
}

const material = createWhiteModelMaterial();
const PreviewMaterialContext = createContext(false);

export function WhiteModelPreviewMaterial({ children }: { children: ReactNode }) {
  return (
    <PreviewMaterialContext.Provider value>
      {children}
    </PreviewMaterialContext.Provider>
  );
}

export default function WhiteModelMaterial() {
  if (useContext(PreviewMaterialContext)) {
    return (
      <meshStandardMaterial
        color="#f7f7f7"
        metalness={0}
        roughness={0.88}
      />
    );
  }

  return <primitive attach="material" object={material} />;
}
