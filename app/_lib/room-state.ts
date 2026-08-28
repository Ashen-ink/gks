export type RoomState = {
  airConditionerOn: boolean;
  ceilingLightOn: boolean;
  doorOpen: boolean;
  windowOpen: boolean;
};

export const ROOM_STATE_COOKIE = "room-state";

export const defaultRoomState: RoomState = {
  airConditionerOn: false,
  ceilingLightOn: false,
  doorOpen: false,
  windowOpen: false,
};

const keys = [
  "airConditionerOn",
  "ceilingLightOn",
  "doorOpen",
  "windowOpen",
] as const;

export function decodeRoomState(value?: string): RoomState {
  if (!value || !/^[01]{4}$/.test(value)) {
    return { ...defaultRoomState };
  }

  return {
    airConditionerOn: value[0] === "1",
    ceilingLightOn: value[1] === "1",
    doorOpen: value[2] === "1",
    windowOpen: value[3] === "1",
  };
}

export function encodeRoomState(state: RoomState) {
  return keys.map((key) => (state[key] ? "1" : "0")).join("");
}

export function isRoomState(value: unknown): value is RoomState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const state = value as Record<string, unknown>;
  return keys.every((key) => typeof state[key] === "boolean");
}

export function parseRoomStatePatch(value: unknown): Partial<RoomState> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const input = value as Record<string, unknown>;
  const patch: Partial<RoomState> = {};

  for (const [key, field] of Object.entries(input)) {
    if (!keys.includes(key as (typeof keys)[number]) || typeof field !== "boolean") {
      return null;
    }

    patch[key as keyof RoomState] = field;
  }

  return patch;
}
