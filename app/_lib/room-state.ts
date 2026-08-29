export type RoomState = {
  airConditionerOn: boolean;
  cabinetAirConditionerOn: boolean;
  ceilingLightOn: boolean;
  dehumidifierOn: boolean;
  doorOpen: boolean;
  floorFanOn: boolean;
  floorHeatingOn: boolean;
  ptcHeaterOn: boolean;
  radiantHeaterOn: boolean;
  windowOpen: boolean;
};

export const roomDevices = [
  { category: "空调", name: "挂机空调", key: "airConditionerOn" },
  { category: "空调", name: "柜机空调", key: "cabinetAirConditionerOn" },
  { category: "除湿", name: "独立除湿机", key: "dehumidifierOn" },
  { category: "风扇", name: "落地扇", key: "floorFanOn" },
  { category: "采暖", name: "PTC 暖风机", key: "ptcHeaterOn" },
  { category: "采暖", name: "辐射采暖（小太阳）", key: "radiantHeaterOn" },
  { category: "采暖", name: "地暖", key: "floorHeatingOn" },
] as const;

export const roomDeviceCategories = ["全部", "空调", "除湿", "风扇", "采暖"] as const;

export type DeviceStateKey = (typeof roomDevices)[number]["key"];
export type RoomDeviceCategory = (typeof roomDeviceCategories)[number];

export const deviceStateGroups: readonly (readonly DeviceStateKey[])[] =
  roomDeviceCategories.slice(1).map((category) =>
    roomDevices
      .filter((device) => device.category === category)
      .map((device) => device.key),
  );

export const defaultRoomState: RoomState = {
  airConditionerOn: false,
  cabinetAirConditionerOn: false,
  ceilingLightOn: false,
  dehumidifierOn: false,
  doorOpen: false,
  floorFanOn: false,
  floorHeatingOn: false,
  ptcHeaterOn: false,
  radiantHeaterOn: false,
  windowOpen: false,
};
