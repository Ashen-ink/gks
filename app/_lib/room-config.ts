import type { DeviceStateKey } from "@/app/_lib/room-state";

export type RoomConfig = {
  schema_version: number;
  environment: {
    site: { value: string; label: string };
    period: {
      year: number;
      month: number;
      date: string;
      ten_day: { value: "early" | "mid" | "late"; label: string };
    };
  };
  persona: {
    value: string;
    label: string;
    name: string;
    age: number;
    sex: string;
    condition: string;
  };
  schedule: { value: string; label: string };
  equipment: {
    ac: {
      mount: "wall" | "floor";
      capacity: "1p" | "1.5p" | "2p" | "2.5p" | "3p";
      inverter: boolean;
      isothermal_dry: boolean;
      fresh_air: null | "one_way" | "hrv";
    } | null;
    dehumidifier: boolean;
    fan: null | "ceiling" | "stand";
    heating: null | "ptc" | "radiant" | "floor_heating";
  };
  tier: { state: string; action: string };
  policies: string[];
  room: { case_id: string; name: string; occupants: number };
};

export function isRoomConfig(value: unknown): value is RoomConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const config = value as Partial<RoomConfig>;
  return Boolean(
    config.environment?.site?.label &&
      config.environment.period?.month &&
      config.environment.period.ten_day?.label &&
      config.persona?.label &&
      config.schedule?.label &&
      config.equipment &&
      config.room?.name,
  );
}

export function selectedDevicesFromConfig(config: RoomConfig) {
  const devices: DeviceStateKey[] = [];
  const { equipment } = config;

  if (equipment.ac?.mount === "wall") {
    devices.push("airConditionerOn");
  } else if (equipment.ac?.mount === "floor") {
    devices.push("cabinetAirConditionerOn");
  }

  if (equipment.dehumidifier) {
    devices.push("dehumidifierOn");
  }
  if (equipment.fan === "stand") {
    devices.push("floorFanOn");
  }
  if (equipment.heating === "ptc") {
    devices.push("ptcHeaterOn");
  } else if (equipment.heating === "radiant") {
    devices.push("radiantHeaterOn");
  } else if (equipment.heating === "floor_heating") {
    devices.push("floorHeatingOn");
  }

  return devices;
}
