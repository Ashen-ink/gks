import {
  SQUARE_LEFT,
  SQUARE_RIGHT,
} from "@/app/_components/landing/sensor-optics-layout";

type SensorCubeLightMesh = {
  vertices: Float32Array;
  incoming: { firstVertex: number; vertices: number };
  squareEntry: { firstVertex: number; vertices: number };
  squareInternal: { firstVertex: number; vertices: number };
  squareExit: { firstVertex: number; vertices: number };
  outgoing: { firstVertex: number; vertices: number };
};

const LIGHT_LEFT = -8;
const LIGHT_RIGHT = 8;
const VERTICES_PER_SECTION = 6;

function appendSection(
  output: number[],
  start: number,
  end: number,
  startIntensity: number,
  endIntensity: number,
  startCenter: number,
  endCenter: number,
  startHalfWidth: number,
  endHalfWidth: number,
): void {
  const lowerStart = startCenter - startHalfWidth;
  const upperStart = startCenter + startHalfWidth;
  const lowerEnd = endCenter - endHalfWidth;
  const upperEnd = endCenter + endHalfWidth;

  output.push(
    start,
    lowerStart,
    startIntensity,
    start,
    upperStart,
    startIntensity,
    end,
    upperEnd,
    endIntensity,
    start,
    lowerStart,
    startIntensity,
    end,
    upperEnd,
    endIntensity,
    end,
    lowerEnd,
    endIntensity,
  );
}

export function createSensorCubeLightMesh(): SensorCubeLightMesh {
  const vertices: number[] = [];

  appendSection(
    vertices,
    LIGHT_LEFT,
    SQUARE_LEFT,
    1.2,
    3,
    0.06,
    0.06,
    0.065,
    0.065,
  );
  appendSection(
    vertices,
    SQUARE_LEFT - 0.045,
    SQUARE_LEFT + 0.045,
    5.8,
    5.8,
    0.06,
    0.06,
    0.15,
    0.15,
  );
  appendSection(
    vertices,
    SQUARE_LEFT,
    SQUARE_RIGHT,
    5.1,
    4.4,
    0.06,
    0.06,
    0.065,
    0.065,
  );
  appendSection(
    vertices,
    SQUARE_RIGHT - 0.035,
    SQUARE_RIGHT + 0.035,
    3.8,
    3.8,
    0.06,
    0.06,
    0.1,
    0.1,
  );
  appendSection(
    vertices,
    SQUARE_RIGHT,
    LIGHT_RIGHT,
    3.4,
    0.18,
    0.06,
    0.06,
    0.065,
    0.065,
  );

  return {
    vertices: new Float32Array(vertices),
    incoming: { firstVertex: 0, vertices: VERTICES_PER_SECTION },
    squareEntry: {
      firstVertex: VERTICES_PER_SECTION,
      vertices: VERTICES_PER_SECTION,
    },
    squareInternal: {
      firstVertex: VERTICES_PER_SECTION * 2,
      vertices: VERTICES_PER_SECTION,
    },
    squareExit: {
      firstVertex: VERTICES_PER_SECTION * 3,
      vertices: VERTICES_PER_SECTION,
    },
    outgoing: {
      firstVertex: VERTICES_PER_SECTION * 4,
      vertices: VERTICES_PER_SECTION,
    },
  };
}
