"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { CentralIcon } from "@central-icons-react/all";
import * as THREE from "three/webgpu";
import AmbientOcclusion from "@/app/_components/ambient-occlusion";
import CameraControls from "@/app/_components/camera-controls";
import GroundShadow from "@/app/_components/exterior/ground-shadow";
import RoomFurnitureTable from "@/app/_components/room-furniture-table";
import WhiteModelRoom from "@/app/_components/white-model-room";
import {
  isRoomConfig,
  type RoomConfig,
  selectedDevicesFromConfig,
} from "@/app/_lib/room-config";
import {
  defaultRoomState,
  deviceStateGroups,
  type DeviceStateKey,
  isRoomState,
  type RoomState,
} from "@/app/_lib/room-state";

type RoomInfoKey = "site" | "period" | "persona" | "schedule" | "equipment";

THREE.setConsoleFunction((type, message, ...parameters) => {
  if (
    type === "warn" &&
    message ===
      "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead."
  ) {
    return;
  }

  console[type](message, ...parameters);
});

export default function WhiteWorld() {
  const [activeInfo, setActiveInfo] = useState<RoomInfoKey>();
  const [furnitureOpen, setFurnitureOpen] = useState(false);
  const [roomConfig, setRoomConfig] = useState<RoomConfig>();
  const [roomConfigFailed, setRoomConfigFailed] = useState(false);
  const [roomState, setRoomState] = useState(defaultRoomState);
  const [selectedDevices, setSelectedDevices] = useState<
    readonly DeviceStateKey[]
  >([]);
  const stateRef = useRef(roomState);
  const localRevision = useRef(0);
  const pendingWrites = useRef(0);
  const patchQueue = useRef<Promise<void>>(Promise.resolve());
  const night = roomState.ceilingLightOn;

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/room/config", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Room config request failed");
        }
        return response.json();
      })
      .then((config: unknown) => {
        if (!isRoomConfig(config)) {
          throw new Error("Invalid room config");
        }
        setSelectedDevices(selectedDevicesFromConfig(config));
        setRoomConfig(config);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setRoomConfigFailed(true);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const revision = localRevision.current;

    fetch("/api/room/state", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((state: unknown) => {
        if (
          isRoomState(state) &&
          revision === localRevision.current &&
          pendingWrites.current === 0
        ) {
          stateRef.current = state;
          setRoomState(state);
        }
      })
      .catch(() => undefined);

    return () => {
      controller.abort();
    };
  }, []);

  const persistState = (patch: Partial<RoomState>) => {
    pendingWrites.current += 1;
    patchQueue.current = patchQueue.current
      .then(async () => {
        try {
          await fetch("/api/room/state", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          });
        } finally {
          pendingWrites.current -= 1;
        }
      })
      .catch(() => undefined);
  };

  const toggleState = (key: keyof RoomState) => {
    const value = !stateRef.current[key];
    const state = { ...stateRef.current, [key]: value };
    localRevision.current += 1;
    stateRef.current = state;
    setRoomState(state);
    persistState({ [key]: value });
  };

  const selectDevice = (key: DeviceStateKey) => {
    const patch: Partial<RoomState> = {};
    const group = deviceStateGroups.find((keys) => keys.includes(key));

    group?.forEach((deviceKey) => {
      patch[deviceKey] = false;
    });

    setSelectedDevices((current) => {
      const selected = current.includes(key);
      const remaining = group
        ? current.filter((deviceKey) => !group.includes(deviceKey))
        : current;
      return selected ? remaining : [...remaining, key];
    });

    const state = { ...stateRef.current, ...patch };
    localRevision.current += 1;
    stateRef.current = state;
    setRoomState(state);
    persistState(patch);
  };

  const roomDetails = roomConfig
    ? {
        site: {
          title: "地点",
          rows: [
            ["站点", roomConfig.environment.site.label],
            ["站点代码", roomConfig.environment.site.value],
            ["房间", roomConfig.room.name],
            ["户型", roomConfig.room.case_id],
          ],
        },
        period: {
          title: "时间",
          rows: [
            ["日期", roomConfig.environment.period.date],
            ["年份", String(roomConfig.environment.period.year)],
            ["月份", `${roomConfig.environment.period.month} 月`],
            ["时段", roomConfig.environment.period.ten_day.label],
          ],
        },
        persona: {
          title: "人物",
          rows: [
            ["画像", roomConfig.persona.label],
            ["姓名", roomConfig.persona.name],
            ["年龄", `${roomConfig.persona.age} 岁`],
            ["性别", roomConfig.persona.sex],
            ["健康状况", roomConfig.persona.condition],
          ],
        },
        schedule: {
          title: "居住",
          rows: [
            ["状态", roomConfig.schedule.label],
            ["人数", `${roomConfig.room.occupants} 人`],
            ["状态感知", roomConfig.tier.state],
            ["动作控制", roomConfig.tier.action],
            ["仿真策略", roomConfig.policies.join(" · ")],
            ["配置版本", String(roomConfig.schema_version)],
          ],
        },
        equipment: {
          title: "设备",
          rows: [
            [
              "空调",
              roomConfig.equipment.ac
                ? roomConfig.equipment.ac.mount === "wall"
                  ? "挂机空调"
                  : "柜机空调"
                : "无",
            ],
            ["匹数", roomConfig.equipment.ac?.capacity.toUpperCase() ?? "—"],
            ["变频", roomConfig.equipment.ac?.inverter ? "是" : "否"],
            [
              "等温除湿",
              roomConfig.equipment.ac?.isothermal_dry ? "是" : "否",
            ],
            [
              "新风",
              roomConfig.equipment.ac?.fresh_air === "one_way"
                ? "单向新风"
                : roomConfig.equipment.ac?.fresh_air === "hrv"
                  ? "全热交换"
                  : "无",
            ],
            ["除湿机", roomConfig.equipment.dehumidifier ? "有" : "无"],
            [
              "风扇",
              roomConfig.equipment.fan === "ceiling"
                ? "吊扇"
                : roomConfig.equipment.fan === "stand"
                  ? "落地扇"
                  : "无",
            ],
            [
              "采暖",
              roomConfig.equipment.heating === "ptc"
                ? "PTC 暖风机"
                : roomConfig.equipment.heating === "radiant"
                  ? "辐射采暖"
                  : roomConfig.equipment.heating === "floor_heating"
                    ? "地暖"
                    : "无",
            ],
          ],
        },
      }
    : undefined;

  const activeDetails = activeInfo ? roomDetails?.[activeInfo] : undefined;

  return (
    <main
      className="white-world"
      data-furniture-open={furnitureOpen}
      data-initialized={Boolean(roomConfig)}
      data-night={night}
    >
      {roomConfig ? (
        <header className="room-environment-bar" aria-label="环境信息">
          <nav>
            <button
              type="button"
              aria-expanded={activeInfo === "site"}
              onClick={() =>
                setActiveInfo((current) =>
                  current === "site" ? undefined : "site",
                )
              }
            >
              <CentralIcon
                name="IconLocation"
                join="round"
                fill="outlined"
                radius="3"
                stroke="1.5"
                size={15}
              />
              <span>{roomConfig.environment.site.label}</span>
            </button>
            <button
              type="button"
              aria-expanded={activeInfo === "period"}
              onClick={() =>
                setActiveInfo((current) =>
                  current === "period" ? undefined : "period",
                )
              }
            >
              <CentralIcon
                name="IconCalendarClock"
                join="round"
                fill="outlined"
                radius="3"
                stroke="1.5"
                size={15}
              />
              <span>
                {roomConfig.environment.period.year} ·{" "}
                {roomConfig.environment.period.month} 月 ·{" "}
                {roomConfig.environment.period.ten_day.label}
              </span>
            </button>
            <button
              type="button"
              aria-expanded={activeInfo === "persona"}
              onClick={() =>
                setActiveInfo((current) =>
                  current === "persona" ? undefined : "persona",
                )
              }
            >
              <CentralIcon
                name="IconPersona"
                join="round"
                fill="outlined"
                radius="3"
                stroke="1.5"
                size={15}
              />
              <span>{roomConfig.persona.label}</span>
            </button>
            <button
              type="button"
              aria-expanded={activeInfo === "schedule"}
              onClick={() =>
                setActiveInfo((current) =>
                  current === "schedule" ? undefined : "schedule",
                )
              }
            >
              <CentralIcon
                name="IconHomeRoundDoor"
                join="round"
                fill="outlined"
                radius="3"
                stroke="1.5"
                size={15}
              />
              <span>{roomConfig.schedule.label}</span>
            </button>
            <button
              type="button"
              aria-expanded={activeInfo === "equipment"}
              onClick={() =>
                setActiveInfo((current) =>
                  current === "equipment" ? undefined : "equipment",
                )
              }
            >
              <CentralIcon
                name="IconHomeEnergy"
                join="round"
                fill="outlined"
                radius="3"
                stroke="1.5"
                size={15}
              />
              <span>设备</span>
            </button>
          </nav>
          {activeDetails ? (
            <section className="room-environment-detail">
              <header>
                <h2>{activeDetails.title}</h2>
                <button
                  type="button"
                  aria-label="关闭详细信息"
                  onClick={() => setActiveInfo(undefined)}
                >
                  <CentralIcon
                    name="IconCrossMedium"
                    join="round"
                    fill="outlined"
                    radius="3"
                    stroke="1.5"
                    size={14}
                  />
                </button>
              </header>
              <dl>
                {activeDetails.rows.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </header>
      ) : null}
      <div className="room-initialization" role="status">
        {roomConfigFailed ? "房间配置连接失败" : "正在同步房间"}
      </div>
      <div className="white-world__viewport">
        {roomConfig ? (
          <Canvas
          flat
          frameloop="demand"
          resize={{ debounce: 0 }}
          shadows={{ type: THREE.PCFShadowMap }}
          camera={{ position: [13, 9, 15], fov: 32, near: 0.1, far: 100 }}
          onCreated={({ camera }) => camera.lookAt(0, 2.2, 0)}
          gl={async (rendererProps) => {
            const renderer = new THREE.WebGPURenderer({
              ...(rendererProps as ConstructorParameters<typeof THREE.WebGPURenderer>[0]),
              antialias: true,
              alpha: false,
            });
            await renderer.init();
            renderer.setClearColor("#ffffff", 1);
            return renderer;
          }}
          >
            <color attach="background" args={[night ? "#020713" : "#ffffff"]} />
            <AmbientOcclusion />
            <CameraControls />
            <GroundShadow />
            <WhiteModelRoom
              airConditionerOn={roomState.airConditionerOn}
              ceilingLightOn={roomState.ceilingLightOn}
              deviceState={roomState}
              doorOpen={roomState.doorOpen}
              night={night}
              selectedDevices={selectedDevices}
              windowOpen={roomState.windowOpen}
              onAirConditionerToggle={() => toggleState("airConditionerOn")}
              onCeilingLightToggle={() => toggleState("ceilingLightOn")}
              onDeviceToggle={(key) => toggleState(key)}
              onDoorToggle={() => toggleState("doorOpen")}
              onWindowToggle={() => toggleState("windowOpen")}
            />
          </Canvas>
        ) : null}
      </div>
      {roomConfig ? (
        <RoomFurnitureTable
          open={furnitureOpen}
          onOpenChange={setFurnitureOpen}
          selectedDevices={selectedDevices}
          onSelect={selectDevice}
        />
      ) : null}
    </main>
  );
}
