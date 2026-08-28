import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type WindowAirflowProps = {
  crossVentilation: boolean;
  open: boolean;
};

type StrandConfig = {
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  phase: number;
  speed: number;
  width: number;
};

const pointCount = 18;
const cycleLength = 1.32;
const strandLength = 0.1;
const speedMultiplier = 1.5;
const strands: StrandConfig[] = [
  { x: 0.92, y: 2.18, driftX: -1.2, driftY: -0.42, phase: 0.02, speed: 0.22, width: 0.016 },
  { x: 1.28, y: 2.62, driftX: -0.82, driftY: -0.72, phase: 0.31, speed: 0.19, width: 0.021 },
  { x: 1.66, y: 3.18, driftX: -1.46, driftY: -0.54, phase: 0.66, speed: 0.24, width: 0.015 },
  { x: 2.06, y: 2.34, driftX: -0.38, driftY: -0.34, phase: 0.94, speed: 0.21, width: 0.022 },
  { x: 2.52, y: 3.28, driftX: -0.92, driftY: -0.88, phase: 1.17, speed: 0.18, width: 0.017 },
  { x: 2.88, y: 2.7, driftX: -0.24, driftY: -0.56, phase: 0.48, speed: 0.23, width: 0.02 },
  { x: 3.34, y: 2.16, driftX: -0.74, driftY: -0.2, phase: 0.82, speed: 0.2, width: 0.015 },
  { x: 3.72, y: 3.12, driftX: -0.38, driftY: -0.68, phase: 0.19, speed: 0.215, width: 0.019 },
  { x: 1.08, y: 2.92, driftX: -0.56, driftY: -0.48, phase: 0.14, speed: 0.235, width: 0.014 },
  { x: 1.46, y: 2.04, driftX: -1.08, driftY: -0.24, phase: 0.42, speed: 0.205, width: 0.018 },
  { x: 1.84, y: 2.84, driftX: -0.64, driftY: -0.82, phase: 0.73, speed: 0.25, width: 0.016 },
  { x: 2.24, y: 3.42, driftX: -1.26, driftY: -0.62, phase: 1.06, speed: 0.19, width: 0.02 },
  { x: 2.7, y: 2.14, driftX: -0.42, driftY: -0.32, phase: 0.57, speed: 0.225, width: 0.015 },
  { x: 3.06, y: 3.46, driftX: -0.86, driftY: -0.94, phase: 0.88, speed: 0.21, width: 0.017 },
  { x: 3.48, y: 2.54, driftX: -0.3, driftY: -0.46, phase: 1.25, speed: 0.245, width: 0.014 },
  { x: 3.88, y: 2.82, driftX: -0.7, driftY: -0.58, phase: 0.36, speed: 0.195, width: 0.019 },
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
  crossVentilation: number,
) {
  const boundedProgress = THREE.MathUtils.clamp(progress, 0, 1);
  const freedom = THREE.MathUtils.smoothstep(boundedProgress, 0.06, 0.9);
  const horizontalWave =
    Math.sin(boundedProgress * 8.5 + config.phase * 7 + time * 1.15) *
    (0.025 + freedom * 0.3);
  const verticalWave =
    Math.sin(boundedProgress * 11 - config.phase * 5 - time * 0.8) *
    (0.018 + freedom * 0.19);
  const localX = config.x + config.driftX * boundedProgress + horizontalWave;
  const localY = config.y + config.driftY * boundedProgress + verticalWave;
  const localZ = -4.52 + boundedProgress * 4.8;
  const doorX = 2.35 + Math.sin(config.phase * 17) * 0.62;
  const doorY = 1.58 + Math.cos(config.phase * 13) * 0.62;
  const throughX =
    THREE.MathUtils.lerp(config.x, doorX, boundedProgress) + horizontalWave;
  const throughY =
    THREE.MathUtils.lerp(config.y, doorY, boundedProgress) + verticalWave;
  const throughZ = -4.52 + boundedProgress * 8.45;

  return target.set(
    THREE.MathUtils.lerp(localX, throughX, crossVentilation),
    THREE.MathUtils.lerp(localY, throughY, crossVentilation),
    THREE.MathUtils.lerp(localZ, throughZ, crossVentilation),
  );
}

function createRibbonGeometry() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(pointCount * 2 * 3);
  const indices: number[] = [];

  for (let index = 0; index < pointCount - 1; index += 1) {
    const left = index * 2;
    const nextLeft = left + 2;
    indices.push(left, nextLeft, left + 1, nextLeft, nextLeft + 1, left + 1);
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  return geometry;
}

function updateRibbon(
  ribbon: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>,
  camera: THREE.Camera,
  config: StrandConfig,
  center: number,
  time: number,
  crossVentilation: number,
) {
  const attribute = ribbon.geometry.getAttribute("position") as THREE.BufferAttribute;
  const positions = attribute.array as Float32Array;

  for (let index = 0; index < pointCount; index += 1) {
    const strandProgress = index / (pointCount - 1);
    const pathProgress = center + (strandProgress - 0.5) * strandLength;
    const tangentOffset = 0.004;

    getPathPoint(point, config, pathProgress, time, crossVentilation);
    getPathPoint(
      previousPoint,
      config,
      pathProgress - tangentOffset,
      time,
      crossVentilation,
    );
    getPathPoint(
      nextPoint,
      config,
      pathProgress + tangentOffset,
      time,
      crossVentilation,
    );
    tangent.subVectors(nextPoint, previousPoint).normalize();
    viewDirection.subVectors(camera.position, point).normalize();
    side.crossVectors(tangent, viewDirection).normalize();

    const width =
      Math.pow(Math.sin(Math.PI * strandProgress), 0.72) * config.width;
    const offset = index * 6;

    positions[offset] = point.x + side.x * width;
    positions[offset + 1] = point.y + side.y * width;
    positions[offset + 2] = point.z + side.z * width;
    positions[offset + 3] = point.x - side.x * width;
    positions[offset + 4] = point.y - side.y * width;
    positions[offset + 5] = point.z - side.z * width;
  }

  attribute.needsUpdate = true;
}

export default function WindowAirflow({
  crossVentilation,
  open,
}: WindowAirflowProps) {
  const strength = useRef(0);
  const throughStrength = useRef(0);
  const cycles = useRef(strands.map((strand) => strand.phase));
  const invalidate = useThree((state) => state.invalidate);
  const ribbons = useMemo(
    () =>
      strands.map(() => {
        const material = new THREE.MeshBasicMaterial({
          color: "#3296e6",
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.NormalBlending,
          side: THREE.DoubleSide,
          toneMapped: false,
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
    strength.current = THREE.MathUtils.damp(
      strength.current,
      open ? 1 : 0,
      open ? 4.5 : 6,
      animationDelta,
    );
    throughStrength.current = THREE.MathUtils.damp(
      throughStrength.current,
      crossVentilation ? 1 : 0,
      4,
      animationDelta,
    );

    if (strength.current < 0.001 && !open) {
      strength.current = 0;
      return;
    }

    ribbons.forEach((ribbon, index) => {
      const config = strands[index];
      const velocity = THREE.MathUtils.lerp(1, 1.9, throughStrength.current);
      cycles.current[index] =
        (cycles.current[index] +
          animationDelta * config.speed * speedMultiplier * velocity) %
        cycleLength;
      const cycle = cycles.current[index];
      const active = cycle <= 1;
      const center = THREE.MathUtils.clamp(cycle, 0, 1);
      const entrance = THREE.MathUtils.smoothstep(center, 0, 0.12);
      const exitStart = THREE.MathUtils.lerp(0.76, 0.9, throughStrength.current);
      const exit = 1 - THREE.MathUtils.smoothstep(center, exitStart, 1);
      const density = index < 7 ? 1 : throughStrength.current;

      updateRibbon(
        ribbon,
        camera,
        config,
        center,
        clock.elapsedTime,
        throughStrength.current,
      );
      ribbon.visible = active;
      ribbon.material.opacity = active
        ? strength.current * entrance * exit * density * 0.78
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
