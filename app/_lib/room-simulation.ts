import type { RoomConfig } from "@/app/_lib/room-config";
import type { DeviceStateKey, RoomState } from "@/app/_lib/room-state";

type SimulationSample = {
  t: string;
  T: number;
  RH: number;
  energy_w: number;
  action: string;
  warmup: boolean;
};

type SimulationResult = {
  policy: string;
  label: string;
  summary: {
    comfort: {
      degree_hours: number | null;
      por_pct?: number | null;
    };
  };
  hourly: SimulationSample[];
};

export type RoomSimulation = {
  meta: {
    band: { lo: number; hi: number };
  };
  results: SimulationResult[];
};

export type RoomSimulationSnapshot = {
  temperature: number;
  humidity: number;
  windDirection: string;
  comfort: string;
  degreeHours: number | null;
  airflowIntensity: number;
  action: string;
  policy: string;
  time: string;
  control: Partial<RoomState>;
  resolvedState: RoomState;
  solar: RoomSolarState;
};

export type RoomSolarState = {
  ambientIntensity: number;
  azimuth: number;
  daylight: number;
  elevation: number;
  hour: number;
  moonIntensity: number;
  naturalIntensity: number;
  phase: "深夜" | "日出" | "白天" | "日落";
  skyColor: string;
  sunIntensity: number;
  warmth: number;
};

export type RoomTimelineEvent = {
  changes: string[];
  index: number;
  time: string;
};

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function smoothstep(value: number, minimum: number, maximum: number) {
  const progress = clamp((value - minimum) / (maximum - minimum));
  return progress * progress * (3 - 2 * progress);
}

function mixColor(from: string, to: string, progress: number) {
  const amount = clamp(progress);
  const fromValue = Number.parseInt(from.slice(1), 16);
  const toValue = Number.parseInt(to.slice(1), 16);
  const channels = [16, 8, 0].map((shift) => {
    const start = (fromValue >> shift) & 255;
    const end = (toValue >> shift) & 255;
    return Math.round(start + (end - start) * amount)
      .toString(16)
      .padStart(2, "0");
  });

  return `#${channels.join("")}`;
}

function hourFromTime(value: string) {
  const match = value.match(/T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) {
    return 12;
  }
  return (
    Number(match[1]) + Number(match[2]) / 60 + Number(match[3] ?? 0) / 3600
  );
}

export function createRoomSolarState(time: string): RoomSolarState {
  const hour = hourFromTime(time);
  const morning = smoothstep(hour, 5.25, 7.5);
  const evening = 1 - smoothstep(hour, 17.25, 19.75);
  const daylight = morning * evening;
  const sunriseWarmth = 1 - clamp(Math.abs(hour - 6.5) / 1.8);
  const sunsetWarmth = 1 - clamp(Math.abs(hour - 18.5) / 1.8);
  const warmth = Math.max(sunriseWarmth, sunsetWarmth);
  const solarProgress = clamp((hour - 5.25) / 14.5);
  const elevation = Math.max(
    -12,
    Math.sin(((hour - 6) / 12) * Math.PI) * 61,
  );
  const azimuth = -78 + solarProgress * 156;
  const elevationIn = smoothstep(elevation, 2, 24);
  const elevationOut = 1 - smoothstep(elevation, 72, 88);
  const windowFacing = 0.64 + Math.cos((azimuth * Math.PI) / 180) * 0.36;
  const nightToTwilight = mixColor("#020713", "#efb98e", daylight * 2.4);
  const skyColor = mixColor(
    nightToTwilight,
    "#ffffff",
    smoothstep(daylight, 0.3, 0.82) * (1 - warmth * 0.34),
  );
  const phase =
    daylight < 0.08
      ? "深夜"
      : hour < 9
        ? "日出"
        : hour < 17
          ? "白天"
          : "日落";

  return {
    ambientIntensity: 0.08 + daylight * 1.82,
    azimuth,
    daylight,
    elevation,
    hour,
    moonIntensity: 0.025 + (1 - daylight) * 0.055,
    naturalIntensity:
      daylight * elevationIn * elevationOut * windowFacing * 1.45,
    phase,
    skyColor,
    sunIntensity: 0.02 + daylight * 1.23,
    warmth,
  };
}

export const defaultRoomSolarState = createRoomSolarState(
  "2025-01-01T12:00",
);

const defaultAc = {
  capacity: "1.5p" as const,
  inverter: true,
  isothermal_dry: false,
  fresh_air: null,
};

export function createRoomSimulationRequest(
  config: RoomConfig,
  state: RoomState,
  selectedDevices: readonly DeviceStateKey[],
) {
  const acMount = selectedDevices.includes("airConditionerOn")
    ? "wall"
    : selectedDevices.includes("cabinetAirConditionerOn")
      ? "floor"
      : undefined;
  const heating = selectedDevices.includes("ptcHeaterOn")
    ? "ptc"
    : selectedDevices.includes("radiantHeaterOn")
      ? "radiant"
      : selectedDevices.includes("floorHeatingOn")
        ? "floor_heating"
        : null;

  return {
    site: config.environment.site.value,
    period: {
      month: config.environment.period.month,
      ten_day: config.environment.period.ten_day.value,
    },
    equipment: {
      ac: acMount
        ? {
            ...(config.equipment.ac ?? defaultAc),
            mount: acMount,
          }
        : null,
      dehumidifier: selectedDevices.includes("dehumidifierOn"),
      fan: selectedDevices.includes("floorFanOn") ? "stand" : null,
      heating,
    },
    persona: config.persona.value,
    schedule: config.schedule.value,
    tier: config.tier,
    policies: config.policies,
    runtime: {
      door_open: state.doorOpen,
      window_open: state.windowOpen,
      ceiling_light_on: state.ceilingLightOn,
      devices: {
        wall_ac_on: state.airConditionerOn,
        floor_ac_on: state.cabinetAirConditionerOn,
        dehumidifier_on: state.dehumidifierOn,
        fan_on: state.floorFanOn,
        ptc_heater_on: state.ptcHeaterOn,
        radiant_heater_on: state.radiantHeaterOn,
        floor_heating_on: state.floorHeatingOn,
      },
    },
  };
}

export function isRoomSimulation(value: unknown): value is RoomSimulation {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const simulation = value as Partial<RoomSimulation>;
  return Boolean(
    simulation.meta &&
      typeof simulation.meta.band?.lo === "number" &&
      typeof simulation.meta.band?.hi === "number" &&
      Array.isArray(simulation.results) &&
      simulation.results.some(
        (result) =>
          typeof result?.policy === "string" && Array.isArray(result.hourly),
      ),
  );
}

function createRoomSimulationSnapshot(
  sample: SimulationSample,
  result: SimulationResult,
  simulation: RoomSimulation,
  state: RoomState,
  selectedDevices: readonly DeviceStateKey[],
): RoomSimulationSnapshot {
  const { lo, hi } = simulation.meta.band;
  const actionOpensWindow =
    sample.action.startsWith("全开") || sample.action.startsWith("vent");
  const actionClosesWindow =
    sample.action.includes("全关") ||
    sample.action.startsWith("仅客厅") ||
    sample.action.includes("关窗") ||
    sample.action === "shut" ||
    sample.action === "rain" ||
    sample.action === "无动作";
  const actionRunsAirConditioner =
    sample.action.includes("+空调") ||
    sample.action.includes("恒温") ||
    sample.action === "下雨全关" ||
    ((sample.action === "shut" || sample.action === "rain") &&
      sample.energy_w > 0);
  const actionStopsAirConditioner =
    actionOpensWindow ||
    sample.action === "全关" ||
    sample.action.startsWith("仅客厅") ||
    ((sample.action === "shut" || sample.action === "rain") &&
      sample.energy_w <= 0) ||
    sample.action === "无动作";
  const control: Partial<RoomState> = {};

  if (actionOpensWindow || actionClosesWindow) {
    if (state.windowOpen !== actionOpensWindow) {
      control.windowOpen = actionOpensWindow;
    }
  }

  if (actionRunsAirConditioner || actionStopsAirConditioner) {
    const airConditionerOn =
      selectedDevices.includes("airConditionerOn") &&
      actionRunsAirConditioner;
    const cabinetAirConditionerOn =
      selectedDevices.includes("cabinetAirConditionerOn") &&
      actionRunsAirConditioner;

    if (state.airConditionerOn !== airConditionerOn) {
      control.airConditionerOn = airConditionerOn;
    }
    if (state.cabinetAirConditionerOn !== cabinetAirConditionerOn) {
      control.cabinetAirConditionerOn = cabinetAirConditionerOn;
    }
  }

  const projectedState = { ...state, ...control };
  const deviation =
    sample.T < lo ? lo - sample.T : sample.T > hi ? sample.T - hi : 0;
  const humidity = sample.RH <= 1.2 ? sample.RH * 100 : sample.RH;
  const poweredAirflow = Object.entries(projectedState).some(
    ([key, active]) => key.endsWith("On") && key !== "ceilingLightOn" && active,
  );
  const airflowIntensity = Math.min(
    1.6,
    Math.max(
      0.65,
      0.72 +
        deviation * 0.12 +
        sample.energy_w / 12000 +
        (poweredAirflow ? 0.18 : 0),
    ),
  );
  const windDirection = projectedState.windowOpen
    ? projectedState.doorOpen
      ? "窗户 → 门"
      : "室外 → 室内"
    : projectedState.airConditionerOn || projectedState.cabinetAirConditionerOn
      ? "空调 → 室内"
      : projectedState.floorFanOn
        ? "室内循环"
        : "静风";

  return {
    temperature: sample.T,
    humidity,
    windDirection,
    comfort: sample.T < lo ? "偏冷" : sample.T > hi ? "偏热" : "舒适区间",
    degreeHours: result.summary.comfort.degree_hours,
    airflowIntensity,
    action: sample.action,
    policy: result.label,
    time: sample.t,
    control,
    resolvedState: projectedState,
    solar: createRoomSolarState(sample.t),
  };
}

export function createRoomSimulationTimeline(
  simulation: RoomSimulation,
  state: RoomState,
  selectedDevices: readonly DeviceStateKey[],
) {
  const result =
    simulation.results.find(({ policy }) => policy === "mpc") ??
    simulation.results.at(-1);

  if (!result) {
    return [];
  }

  const activeSamples = result.hourly.filter(({ warmup }) => !warmup);
  const samples = activeSamples.length > 0 ? activeSamples : result.hourly;

  const timeline: RoomSimulationSnapshot[] = [];
  let resolvedState = { ...state };

  samples.forEach((sample) => {
    const snapshot = createRoomSimulationSnapshot(
      sample,
      result,
      simulation,
      resolvedState,
      selectedDevices,
    );
    resolvedState = snapshot.resolvedState;
    timeline.push(snapshot);
  });

  return timeline;
}

function airConditionerEnabled(state: RoomState) {
  return Boolean(
    state.airConditionerOn || state.cabinetAirConditionerOn,
  );
}

function actionLabel(action: string) {
  if (action.startsWith("vent")) {
    const amount = Number(action.slice(4));
    return Number.isFinite(amount)
      ? `窗户开启 ${Math.round(amount * 100)}%`
      : "打开窗户";
  }
  if (action === "shut") {
    return "关闭窗户";
  }
  if (action === "rain") {
    return "降雨，关闭窗户";
  }
  return action && action !== "无动作" ? action : undefined;
}

function roomTimeValue(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/,
  );
  if (!match) {
    return undefined;
  }
  return Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6] ?? 0),
  );
}

function interpolateRoomTime(from: string, to: string, progress: number) {
  const fromValue = roomTimeValue(from);
  const toValue = roomTimeValue(to);
  if (fromValue === undefined || toValue === undefined) {
    return progress < 1 ? from : to;
  }
  return new Date(fromValue + (toValue - fromValue) * progress)
    .toISOString()
    .slice(0, 19);
}

function interpolate(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

export function interpolateRoomSimulationSnapshot(
  timeline: readonly RoomSimulationSnapshot[],
  position: number,
) {
  if (timeline.length === 0) {
    return undefined;
  }

  const safePosition = clamp(position, 0, timeline.length - 1);
  const lowerIndex = Math.floor(safePosition);
  const upperIndex = Math.min(lowerIndex + 1, timeline.length - 1);
  const progress = safePosition - lowerIndex;
  const lower = timeline[lowerIndex];
  const upper = timeline[upperIndex];

  if (progress === 0 || lowerIndex === upperIndex) {
    return lower;
  }

  const time = interpolateRoomTime(lower.time, upper.time, progress);

  return {
    ...lower,
    temperature: interpolate(lower.temperature, upper.temperature, progress),
    humidity: interpolate(lower.humidity, upper.humidity, progress),
    airflowIntensity: interpolate(
      lower.airflowIntensity,
      upper.airflowIntensity,
      progress,
    ),
    time,
    solar: createRoomSolarState(time),
  };
}

export function createRoomTimelineEvents(
  timeline: readonly RoomSimulationSnapshot[],
) {
  const events: RoomTimelineEvent[] = [];

  timeline.forEach((snapshot, index) => {
    const previous = timeline[index - 1];
    const changes: string[] = [];
    const windowChanged = previous
      ? snapshot.resolvedState.windowOpen !== previous.resolvedState.windowOpen
      : snapshot.control.windowOpen !== undefined;
    const airConditionerChanged = previous
      ? airConditionerEnabled(snapshot.resolvedState) !==
        airConditionerEnabled(previous.resolvedState)
      : snapshot.control.airConditionerOn !== undefined ||
        snapshot.control.cabinetAirConditionerOn !== undefined;

    if (previous && snapshot.solar.phase !== previous.solar.phase) {
      changes.push(snapshot.solar.phase);
    }
    if (windowChanged) {
      changes.push(
        snapshot.resolvedState.windowOpen ? "打开窗户" : "关闭窗户",
      );
    }
    if (airConditionerChanged) {
      changes.push(
        airConditionerEnabled(snapshot.resolvedState)
          ? "开启空调"
          : "关闭空调",
      );
    }
    const action = actionLabel(snapshot.action);
    if (
      action &&
      (!previous || snapshot.action !== previous.action) &&
      !windowChanged &&
      !airConditionerChanged
    ) {
      changes.push(action);
    }
    if (previous && snapshot.comfort !== previous.comfort) {
      changes.push(`体感进入${snapshot.comfort}`);
    }
    if (changes.length > 0) {
      events.push({ changes: [...new Set(changes)], index, time: snapshot.time });
    }
  });

  return events;
}
