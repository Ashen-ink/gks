import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type Vector3 = [number, number, number];

type DeviceAirflowProps = {
  active: boolean;
  count?: number;
  direction: Vector3;
  farColor?: string;
  nearColor?: string;
  origin: Vector3;
  spread?: Vector3;
};

type Strand = {
  offset: Vector3;
  phase: number;
  speed: number;
  width: number;
};

const pointCount = 16;
const strandLength = 0.2;
const cycleLength = 1.24;
const point = new THREE.Vector3();
const previousPoint = new THREE.Vector3();
const nextPoint = new THREE.Vector3();
const tangent = new THREE.Vector3();
const viewDirection = new THREE.Vector3();
const side = new THREE.Vector3();

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

function getPathPoint(
  target: THREE.Vector3,
  strand: Strand,
  direction: Vector3,
  progress: number,
  time: number,
) {
  const boundedProgress = THREE.MathUtils.clamp(progress, 0, 1);
  const freedom = THREE.MathUtils.smoothstep(boundedProgress, 0.04, 0.9);
  const horizontalWave =
    Math.sin(boundedProgress * 9 + strand.phase * 11 + time * 1.6) *
    freedom *
    0.12;
  const depthWave =
    Math.sin(boundedProgress * 12 - strand.phase * 7 - time * 1.2) *
    freedom *
    0.1;

  return target.set(
    strand.offset[0] + direction[0] * boundedProgress + horizontalWave,
    strand.offset[1] + direction[1] * boundedProgress,
    strand.offset[2] + direction[2] * boundedProgress + depthWave,
  );
}

function updateRibbon(
  ribbon: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>,
  camera: THREE.Camera,
  strand: Strand,
  direction: Vector3,
  center: number,
  time: number,
  nearColor: THREE.Color,
  farColor: THREE.Color,
) {
  const attribute = ribbon.geometry.getAttribute("position") as THREE.BufferAttribute;
  const colorAttribute = ribbon.geometry.getAttribute("color") as THREE.BufferAttribute;
  const positions = attribute.array as Float32Array;
  const colors = colorAttribute.array as Float32Array;
  const mixedColor = new THREE.Color();

  for (let index = 0; index < pointCount; index += 1) {
    const strandProgress = index / (pointCount - 1);
    const pathProgress = center + (strandProgress - 0.5) * strandLength;

    getPathPoint(point, strand, direction, pathProgress, time);
    getPathPoint(previousPoint, strand, direction, pathProgress - 0.004, time);
    getPathPoint(nextPoint, strand, direction, pathProgress + 0.004, time);
    tangent.subVectors(nextPoint, previousPoint).normalize();
    viewDirection.subVectors(camera.position, point).normalize();
    side.crossVectors(tangent, viewDirection).normalize();

    const width =
      Math.pow(Math.sin(Math.PI * strandProgress), 0.72) * strand.width;
    const colorProgress = THREE.MathUtils.smoothstep(pathProgress, 0.04, 0.84);
    const offset = index * 6;

    mixedColor.lerpColors(nearColor, farColor, colorProgress);
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

  attribute.needsUpdate = true;
  colorAttribute.needsUpdate = true;
}

export default function DeviceAirflow({
  active,
  count = 8,
  direction,
  farColor = "#ffb432",
  nearColor = "#fff0bf",
  origin,
  spread = [0.5, 0.12, 0.3],
}: DeviceAirflowProps) {
  const strength = useRef(0);
  const colors = useMemo(
    () => ({ far: new THREE.Color(farColor), near: new THREE.Color(nearColor) }),
    [farColor, nearColor],
  );
  const [spreadX, spreadY, spreadZ] = spread;
  const strands = useMemo<Strand[]>(
    () =>
      Array.from({ length: count }, (_, index) => {
        const fraction = count === 1 ? 0.5 : index / (count - 1);
        return {
          offset: [
            (fraction - 0.5) * spreadX,
            Math.sin(index * 2.1) * spreadY,
            Math.cos(index * 1.7) * spreadZ,
          ],
          phase: (index * 0.19) % 1,
          speed: 0.34 + (index % 3) * 0.045,
          width: 0.014 + (index % 4) * 0.002,
        };
      }),
    [count, spreadX, spreadY, spreadZ],
  );
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
    [strands],
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
      active ? 1 : 0,
      active ? 5 : 7,
      animationDelta,
    );

    if (strength.current < 0.001 && !active) {
      strength.current = 0;
      return;
    }

    ribbons.forEach((ribbon, index) => {
      const strand = strands[index];
      cycles.current[index] =
        (cycles.current[index] + animationDelta * strand.speed) % cycleLength;
      const cycle = cycles.current[index];
      const visible = cycle <= 1;
      const center = THREE.MathUtils.clamp(cycle, 0, 1);
      const entrance = THREE.MathUtils.smoothstep(center, 0, 0.1);
      const exit = 1 - THREE.MathUtils.smoothstep(center, 0.78, 1);

      updateRibbon(
        ribbon,
        camera,
        strand,
        direction,
        center,
        clock.elapsedTime,
        colors.near,
        colors.far,
      );
      ribbon.visible = visible;
      ribbon.material.opacity = visible
        ? strength.current * entrance * exit * 0.78
        : 0;
    });

    invalidate();
  });

  return (
    <group position={origin}>
      {ribbons.map((ribbon, index) => (
        <primitive key={index} object={ribbon} />
      ))}
    </group>
  );
}
