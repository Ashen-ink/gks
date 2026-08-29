import { createContext, useContext, type ReactNode } from "react";
import * as THREE from "three/webgpu";
import { lights } from "three/tsl";
import type { RoomSolarState } from "@/app/_lib/room-simulation";

const ambientLight = new THREE.AmbientLight("#ffffff", 1.9);
const sunLight = new THREE.DirectionalLight("#ffffff", 1.25);
const moonLight = new THREE.DirectionalLight("#ffffff", 0.03);
const roomLightTarget = new THREE.Vector3(0, 1.5, 0);
const windowLightTarget = new THREE.Vector3(0.4, 1.15, 0.5);
const lightDirection = new THREE.Vector3();
const daylightAmbient = new THREE.Color("#ffffff");
const nightAmbient = new THREE.Color("#111827");
const daylightSun = new THREE.Color("#ffffff");
const warmSun = new THREE.Color("#ffd0a0");

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

export function setWhiteModelTimeOfDay(solar: RoomSolarState) {
  const azimuth = THREE.MathUtils.degToRad(solar.azimuth);
  const elevation = THREE.MathUtils.degToRad(solar.elevation);

  ambientLight.intensity = solar.ambientIntensity;
  ambientLight.color.lerpColors(nightAmbient, daylightAmbient, solar.daylight);
  sunLight.intensity = solar.sunIntensity;
  sunLight.color.lerpColors(
    warmSun,
    daylightSun,
    1 - solar.warmth * 0.72,
  );
  moonLight.intensity = solar.moonIntensity;
  sunLight.target.position.copy(roomLightTarget);
  sunLight.position
    .copy(roomLightTarget)
    .add(
      lightDirection
        .set(
          Math.sin(azimuth) * Math.cos(elevation),
          Math.sin(elevation),
          Math.cos(azimuth) * Math.cos(elevation),
        )
        .multiplyScalar(14),
    );
  sunLight.updateMatrixWorld();
  sunLight.target.updateMatrixWorld();
}

export function setWhiteModelNaturalLight(solar: RoomSolarState) {
  const azimuth = THREE.MathUtils.degToRad(solar.azimuth);
  const elevation = THREE.MathUtils.degToRad(solar.elevation);

  whiteModelNaturalLight.color.lerpColors(
    warmSun,
    daylightSun,
    1 - solar.warmth * 0.78,
  );
  whiteModelNaturalLight.target.position.copy(windowLightTarget);
  whiteModelNaturalLight.position
    .copy(windowLightTarget)
    .add(
      lightDirection
        .set(
          Math.sin(azimuth) * Math.cos(elevation),
          -Math.sin(elevation),
          Math.cos(azimuth) * Math.cos(elevation),
        )
        .multiplyScalar(-14),
    );
  whiteModelNaturalLight.intensity = solar.naturalIntensity;
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
