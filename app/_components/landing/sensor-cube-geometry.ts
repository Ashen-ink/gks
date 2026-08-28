import { geometry, type Gpu } from "vgpu";

type Vec2 = readonly [number, number];
type Vec3 = readonly [number, number, number];

type ContourPoint = {
  position: Vec2;
  normal: Vec2;
};

const BLOCK = {
  topLeft: [-0.05, 0.46] as Vec2,
  bottomLeft: [-0.05, -0.36] as Vec2,
  bottomRight: [0.77, -0.36] as Vec2,
  topRight: [0.77, 0.46] as Vec2,
};
const BACK = -0.31;
const FRONT = 0.41;
const BEVEL_RADIUS = 0.035;
const CORNER_SEGMENTS = 4;
const BEVEL_SEGMENTS = 4;
const EDGE_SEGMENTS = 16;

export function createSensorCubeGeometry(gpu: Gpu) {
  const contour = roundedBlockContour(
    [BLOCK.topLeft, BLOCK.bottomLeft, BLOCK.bottomRight, BLOCK.topRight],
    BEVEL_RADIUS,
  );
  const vertices: number[] = [];
  const indices: number[] = [];
  const rings: number[][] = [];

  const push = (position: Vec3, normal: Vec3) => {
    const index = vertices.length / 6;
    vertices.push(...position, ...normal);
    return index;
  };

  const addRing = (theta: number, z: number, zNormal: number) => {
    const inset = BEVEL_RADIUS * (1 - Math.cos(theta));
    const weight = Math.cos(theta);
    const ring = contour.map(({ position, normal }) =>
      push(
        [
          position[0] - normal[0] * inset,
          position[1] - normal[1] * inset,
          z,
        ],
        [normal[0] * weight, normal[1] * weight, zNormal],
      ),
    );
    rings.push(ring);
  };

  const maxTheta = Math.PI / 2 - 0.06;
  const maxSine = Math.sin(maxTheta);

  for (let step = BEVEL_SEGMENTS; step >= 0; step -= 1) {
    const theta = (maxTheta * step) / BEVEL_SEGMENTS;
    addRing(
      theta,
      BACK + BEVEL_RADIUS - (BEVEL_RADIUS * Math.sin(theta)) / maxSine,
      -Math.sin(theta),
    );
  }

  for (let step = 0; step <= BEVEL_SEGMENTS; step += 1) {
    const theta = (maxTheta * step) / BEVEL_SEGMENTS;
    addRing(
      theta,
      FRONT - BEVEL_RADIUS + (BEVEL_RADIUS * Math.sin(theta)) / maxSine,
      Math.sin(theta),
    );
  }

  for (let band = 0; band < rings.length - 1; band += 1) {
    const current = rings[band]!;
    const next = rings[band + 1]!;

    for (let point = 0; point < contour.length; point += 1) {
      const following = (point + 1) % contour.length;
      indices.push(
        current[point]!,
        current[following]!,
        next[following]!,
        current[point]!,
        next[following]!,
        next[point]!,
      );
    }
  }

  addCap(rings[0]!, [0, 0, -1], true);
  addCap(rings[rings.length - 1]!, [0, 0, 1], false);

  return geometry(gpu, {
    label: "sensor-cube-glass-geometry",
    buffers: [
      {
        data: new Float32Array(vertices),
        stride: 24,
        attributes: {
          position: { format: "float32x3", location: 0 },
          normal: { format: "float32x3", location: 1 },
        },
      },
    ],
    indices: new Uint16Array(indices),
  });

  function addCap(source: readonly number[], normal: Vec3, reverse: boolean) {
    const cap = source.map((sourceIndex) => {
      const offset = sourceIndex * 6;
      return push(
        [vertices[offset]!, vertices[offset + 1]!, vertices[offset + 2]!],
        normal,
      );
    });
    const center: Vec3 = [
      cap.reduce((sum, index) => sum + vertices[index * 6]!, 0) / cap.length,
      cap.reduce((sum, index) => sum + vertices[index * 6 + 1]!, 0) /
        cap.length,
      cap.reduce((sum, index) => sum + vertices[index * 6 + 2]!, 0) /
        cap.length,
    ];
    const centerIndex = push(center, normal);

    for (let point = 0; point < cap.length; point += 1) {
      const following = (point + 1) % cap.length;
      if (reverse) {
        indices.push(centerIndex, cap[following]!, cap[point]!);
      } else {
        indices.push(centerIndex, cap[point]!, cap[following]!);
      }
    }
  }
}

function roundedBlockContour(
  corners: readonly Vec2[],
  radius: number,
): ContourPoint[] {
  const arcs = corners.map((corner, index) => {
    const previous = corners[(index + corners.length - 1) % corners.length]!;
    const next = corners[(index + 1) % corners.length]!;
    const towardPrevious = normalize([
      previous[0] - corner[0],
      previous[1] - corner[1],
    ]);
    const towardNext = normalize([
      next[0] - corner[0],
      next[1] - corner[1],
    ]);
    const halfAngle =
      Math.acos(clamp(dot(towardPrevious, towardNext), -1, 1)) / 2;
    const tangentDistance = radius / Math.max(Math.tan(halfAngle), 1e-6);
    const centerDistance = radius / Math.max(Math.sin(halfAngle), 1e-6);
    const bisector = normalize([
      towardPrevious[0] + towardNext[0],
      towardPrevious[1] + towardNext[1],
    ]);
    const center: Vec2 = [
      corner[0] + bisector[0] * centerDistance,
      corner[1] + bisector[1] * centerDistance,
    ];
    const start: Vec2 = [
      corner[0] + towardPrevious[0] * tangentDistance,
      corner[1] + towardPrevious[1] * tangentDistance,
    ];
    const end: Vec2 = [
      corner[0] + towardNext[0] * tangentDistance,
      corner[1] + towardNext[1] * tangentDistance,
    ];
    const startAngle = Math.atan2(start[1] - center[1], start[0] - center[0]);
    let endAngle = Math.atan2(end[1] - center[1], end[0] - center[0]);

    while (endAngle <= startAngle) {
      endAngle += Math.PI * 2;
    }

    return Array.from(
      { length: CORNER_SEGMENTS + 1 },
      (_, step): ContourPoint => {
        const angle =
          startAngle + ((endAngle - startAngle) * step) / CORNER_SEGMENTS;
        const normal: Vec2 = [Math.cos(angle), Math.sin(angle)];
        return {
          position: [
            center[0] + normal[0] * radius,
            center[1] + normal[1] * radius,
          ],
          normal,
        };
      },
    );
  });

  return arcs.flatMap((arc, index) => {
    const end = arc[arc.length - 1]!;
    const next = arcs[(index + 1) % arcs.length]![0]!;
    const normal = outwardNormal(
      corners[index]!,
      corners[(index + 1) % corners.length]!,
    );
    const straight = Array.from(
      { length: EDGE_SEGMENTS - 1 },
      (_, step): ContourPoint => {
        const amount = (step + 1) / EDGE_SEGMENTS;
        return {
          position: [
            end.position[0] + (next.position[0] - end.position[0]) * amount,
            end.position[1] + (next.position[1] - end.position[1]) * amount,
          ],
          normal,
        };
      },
    );
    return [...arc, ...straight];
  });
}

function normalize(value: Vec2): Vec2 {
  const length = Math.hypot(value[0], value[1]) || 1;
  return [value[0] / length, value[1] / length];
}

function dot(first: Vec2, second: Vec2): number {
  return first[0] * second[0] + first[1] * second[1];
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function outwardNormal(start: Vec2, end: Vec2): Vec2 {
  const edge: Vec2 = [end[0] - start[0], end[1] - start[1]];
  const length = Math.hypot(edge[0], edge[1]) || 1;
  return [edge[1] / length, -edge[0] / length];
}
