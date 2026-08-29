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
};

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

export function createRoomSimulationSnapshot(
  simulation: RoomSimulation,
  state: RoomState,
  selectedDevices: readonly DeviceStateKey[],
): RoomSimulationSnapshot | undefined {
  const result =
    simulation.results.find(({ policy }) => policy === "mpc") ??
    simulation.results.at(-1);
  const sample =
    result?.hourly.findLast(({ warmup }) => !warmup) ?? result?.hourly.at(-1);

  if (!result || !sample) {
    return undefined;
  }

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
    control.windowOpen = actionOpensWindow;
  }

  if (actionRunsAirConditioner || actionStopsAirConditioner) {
    control.airConditionerOn =
      selectedDevices.includes("airConditionerOn") &&
      actionRunsAirConditioner;
    control.cabinetAirConditionerOn =
      selectedDevices.includes("cabinetAirConditionerOn") &&
      actionRunsAirConditioner;
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
  };
}
