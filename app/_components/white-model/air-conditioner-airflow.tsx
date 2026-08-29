import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type AirConditionerAirflowProps = {
  active: boolean;
  intensity?: number;
};

type StrandConfig = {
  y: number;
  z: number;
  driftY: number;
  driftZ: number;
  phase: number;
  speed: number;
  width: number;
};

const pointCount = 24;
const strandLength = 0.3;
const cycleLength = 1.24;
const nearColor = new THREE.Color("#ffffff");
const farColor = new THREE.Color("#3296e6");
const mixedColor = new THREE.Color();
const strands: StrandConfig[] = [
  { y: 3.29, z: 0.62, driftY: -0.9, driftZ: -0.22, phase: 0.04, speed: 0.32, width: 0.014 },
  { y: 3.27, z: 0.82, driftY: -1.2, driftZ: 0.16, phase: 0.24, speed: 0.36, width: 0.018 },
  { y: 3.31, z: 1.02, driftY: -0.78, driftZ: -0.3, phase: 0.48, speed: 0.34, width: 0.015 },
  { y: 3.25, z: 1.22, driftY: -1.34, driftZ: 0.28, phase: 0.72, speed: 0.39, width: 0.019 },
  { y: 3.3, z: 1.42, driftY: -1.06, driftZ: -0.18, phase: 0.96, speed: 0.33, width: 0.016 },
  { y: 3.28, z: 1.62, driftY: -0.86, driftZ: 0.34, phase: 1.16, speed: 0.37, width: 0.017 },
  { y: 3.32, z: 1.82, driftY: -1.28, driftZ: -0.26, phase: 0.14, speed: 0.35, width: 0.014 },
  { y: 3.26, z: 2.02, driftY: -0.96, driftZ: 0.2, phase: 0.38, speed: 0.4, width: 0.02 },
  { y: 3.3, z: 2.22, driftY: -1.16, driftZ: -0.32, phase: 0.62, speed: 0.31, width: 0.016 },
  { y: 3.27, z: 2.38, driftY: -0.82, driftZ: 0.24, phase: 0.86, speed: 0.38, width: 0.015 },
];

const point = new THREE.Vector3();
const previousPoint = new THREE.Vector3();
const nextPoint = new THREE.Vector3();
const tangent = new THREE.Vector3();
const viewDirection = new THREE.Vector3();
const side = new THREE.Vector3();

function getPathPoint(
  target: THREE.Vector3,
  config: StrandConfig,
  progress: number,
  time: number,
) {
  const boundedProgress = THREE.MathUtils.clamp(progress, 0, 1);
  const freedom = THREE.MathUtils.smoothstep(boundedProgress, 0.04, 0.9);
  const verticalWave =
    Math.sin(boundedProgress * 9 + config.phase * 8 + time * 1.2) *
    (0.015 + freedom * 0.16);
  const depthWave =
    Math.sin(boundedProgress * 12 - config.phase * 6 - time) *
    (0.012 + freedom * 0.2);

  return target.set(
    4.42 - boundedProgress * 6.4,
    config.y + config.driftY * boundedProgress + verticalWave,
    config.z + config.driftZ * boundedProgress + depthWave,
  );
}

function createRibbonGeometry() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(pointCount * 2 * 3);
  const colors = new Float32Array(pointCount * 2 * 3);
  const indices: number[] = [];

  for (let index = 0; index < pointCount - 1; index += 1) {
    const left = index * 2;
    const nextLeft = left + 2;
    indices.push(left, nextLeft, left + 1, nextLeft, nextLeft + 1, left + 1);
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  return geometry;
}

function updateRibbon(
  ribbon: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>,
  camera: THREE.Camera,
  config: StrandConfig,
  center: number,
  time: number,
) {
  const positionAttribute = ribbon.geometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;
  const colorAttribute = ribbon.geometry.getAttribute("color") as THREE.BufferAttribute;
  const positions = positionAttribute.array as Float32Array;
  const colors = colorAttribute.array as Float32Array;

  for (let index = 0; index < pointCount; index += 1) {
    const strandProgress = index / (pointCount - 1);
    const pathProgress = center + (strandProgress - 0.5) * strandLength;
    const boundedProgress = THREE.MathUtils.clamp(pathProgress, 0, 1);

    getPathPoint(point, config, pathProgress, time);
    getPathPoint(previousPoint, config, pathProgress - 0.004, time);
    getPathPoint(nextPoint, config, pathProgress + 0.004, time);
    tangent.subVectors(nextPoint, previousPoint).normalize();
    viewDirection.subVectors(camera.position, point).normalize();
    side.crossVectors(tangent, viewDirection).normalize();

    const width =
      Math.pow(Math.sin(Math.PI * strandProgress), 0.72) * config.width;
    const colorMix = THREE.MathUtils.smoothstep(boundedProgress, 0.06, 0.72);
    const offset = index * 6;

    mixedColor.lerpColors(nearColor, farColor, colorMix);
    positions[offset] = point.x + side.x * width;
    positions[offset + 1] = point.y + side.y * width;
    positions[offset + 2] = point.z + side.z * width;
    positions[offset + 3] = point.x - side.x * width;
    positions[offset + 4] = point.y - side.y * width;
    positions[offset + 5] = point.z - side.z * width;
    colors[offset] = mixedColor.r;
    colors[offset + 1] = mixedColor.g;
    colors[offset + 2] = mixedColor.b;
    colors[offset + 3] = mixedColor.r;
    colors[offset + 4] = mixedColor.g;
    colors[offset + 5] = mixedColor.b;
  }

  positionAttribute.needsUpdate = true;
  colorAttribute.needsUpdate = true;
}

export default function AirConditionerAirflow({
  active,
  intensity = 1,
}: AirConditionerAirflowProps) {
  const strength = useRef(0);
  const cycles = useRef(strands.map((strand) => strand.phase));
  const invalidate = useThree((state) => state.invalidate);
  const ribbons = useMemo(
    () =>
      strands.map(() => {
        const material = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
          vertexColors: true,
        });

        return new THREE.Mesh(createRibbonGeometry(), material);
      }),
    [],
  );

  useEffect(
    () => () => {
      ribbons.forEach((ribbon) => {
        ribbon.geometry.dispose();
        ribbon.material.dispose();
      });
    },
    [ribbons],
  );

  useFrame(({ camera, clock }, delta) => {
    const animationDelta = Math.min(delta, 1 / 60);
    const airflowIntensity = THREE.MathUtils.clamp(intensity, 0.45, 1.6);
    strength.current = THREE.MathUtils.damp(
      strength.current,
      active ? Math.min(airflowIntensity, 1) : 0,
      active ? 5 : 7,
      animationDelta,
    );

    if (strength.current < 0.001 && !active) {
      strength.current = 0;
      return;
    }

    ribbons.forEach((ribbon, index) => {
      const config = strands[index];
      cycles.current[index] =
        (cycles.current[index] +
          animationDelta * config.speed * airflowIntensity) %
        cycleLength;
      const cycle = cycles.current[index];
      const visible = cycle <= 1;
      const center = THREE.MathUtils.clamp(cycle, 0, 1);
      const entrance = THREE.MathUtils.smoothstep(center, 0, 0.1);
      const exit = 1 - THREE.MathUtils.smoothstep(center, 0.82, 1);

      updateRibbon(ribbon, camera, config, center, clock.elapsedTime);
      ribbon.visible = visible;
      ribbon.material.opacity = visible
        ? strength.current * entrance * exit * 0.72
        : 0;
    });

    invalidate();
  });

  return (
    <group>
      {ribbons.map((ribbon, index) => (
        <primitive key={index} object={ribbon} />
      ))}
    </group>
  );
}
