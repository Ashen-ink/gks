"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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
  type RoomState,
} from "@/app/_lib/room-state";
import {
  createRoomTimelineEvents,
  createRoomSimulationRequest,
  createRoomSimulationTimeline,
  defaultRoomSolarState,
  interpolateRoomSimulationSnapshot,
  isRoomSimulation,
  type RoomSimulationSnapshot,
} from "@/app/_lib/room-simulation";

type RoomInfoKey =
  | "climate"
  | "site"
  | "period"
  | "persona"
  | "schedule"
  | "equipment";

type SimulationStatus = "idle" | "loading" | "ready" | "failed";

function roomTimeLabel(value: string) {
  const match = value.match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : value;
}

function roomDateLabel(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[2]}/${match[3]}` : "";
}

function roomPeriodLabel(value: string) {
  const match = value.match(/T(\d{2})/);
  const hour = Number(match?.[1] ?? 12);

  if (hour < 5) return "夜深";
  if (hour < 8) return "晨光";
  if (hour < 11) return "上午";
  if (hour < 14) return "正午";
  if (hour < 18) return "午后";
  if (hour < 20) return "暮色";
  return "夜晚";
}

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
  const [roomOverrides, setRoomOverrides] = useState<Partial<RoomState>>({});
  const [roomState, setRoomState] = useState(defaultRoomState);
  const [simulationTimeline, setSimulationTimeline] = useState<
    RoomSimulationSnapshot[]
  >([]);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [timelinePosition, setTimelinePosition] = useState(0);
  const [simulationStatus, setSimulationStatus] =
    useState<SimulationStatus>("idle");
  const [selectedDevices, setSelectedDevices] = useState<
    readonly DeviceStateKey[]
  >([]);
  const stateRef = useRef(roomState);
  const simulation = useMemo(
    () =>
      interpolateRoomSimulationSnapshot(
        simulationTimeline,
        timelinePosition,
      ),
    [simulationTimeline, timelinePosition],
  );
  const timelineEvents = useMemo(
    () => createRoomTimelineEvents(simulationTimeline),
    [simulationTimeline],
  );
  const timelineTicks = useMemo(() => {
    const lastIndex = simulationTimeline.length - 1;
    if (lastIndex < 1) {
      return [];
    }

    const tickCount = Math.min(4, simulationTimeline.length);
    return Array.from({ length: tickCount }, (_, index) => {
      const position = (index / (tickCount - 1)) * lastIndex;
      const snapshot = interpolateRoomSimulationSnapshot(
        simulationTimeline,
        position,
      );
      return {
        label: snapshot ? roomPeriodLabel(snapshot.time) : "",
        position: (position / lastIndex) * 100,
      };
    });
  }, [simulationTimeline]);
  const solar = simulation?.solar ?? defaultRoomSolarState;
  const night = solar.daylight < 0.16;
  const displayState = {
    ...(simulation?.resolvedState ?? roomState),
    ...roomOverrides,
    ceilingLightOn: night,
  };

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
    if (!roomConfig) {
      return;
    }

    const controller = new AbortController();
    const configuredDevices = selectedDevicesFromConfig(roomConfig);
    const initialState = stateRef.current;

    setSimulationStatus("loading");
    fetch("/api/room/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        createRoomSimulationRequest(
          roomConfig,
          initialState,
          configuredDevices,
        ),
      ),
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Room simulation request failed");
        }
        return response.json();
      })
      .then((result: unknown) => {
        if (!isRoomSimulation(result)) {
          throw new Error("Invalid room simulation");
        }
        const timeline = createRoomSimulationTimeline(
          result,
          initialState,
          configuredDevices,
        );
        if (!timeline[0]) {
          throw new Error("Room simulation has no samples");
        }
        setSimulationTimeline(timeline);
        setTimelinePosition(0);
        setSimulationStatus("ready");
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSimulationStatus("failed");
        }
      });

    return () => {
      controller.abort();
    };
  }, [roomConfig]);

  const toggleState = (key: keyof RoomState) => {
    const state = { ...displayState, [key]: !displayState[key] };
    stateRef.current = state;
    setRoomOverrides((current) => ({ ...current, [key]: state[key] }));
    setRoomState(state);
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

    const state = { ...displayState, ...patch };
    stateRef.current = state;
    setRoomOverrides((current) => ({ ...current, ...patch }));
    setRoomState(state);
  };

  const roomDetails = roomConfig
    ? {
        climate: {
          title: "室内气候",
          rows: simulation
            ? [
                ["温度", `${simulation.temperature.toFixed(1)} °C`],
                ["湿度", `${Math.round(simulation.humidity)}%`],
                ["风向", simulation.windDirection],
                ["舒适度", simulation.comfort],
                ["不舒适度时", simulation.degreeHours?.toFixed(1) ?? "—"],
                ["气流强度", `${Math.round(simulation.airflowIntensity * 100)}%`],
                ["仿真策略", simulation.policy],
                ["当前动作", simulation.action],
                ["结果时刻", simulation.time],
              ]
            : [
                [
                  "状态",
                  simulationStatus === "failed" ? "模拟连接失败" : "正在计算",
                ],
              ],
        },
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
              aria-expanded={activeInfo === "climate"}
              data-status={simulationStatus}
              onClick={() =>
                setActiveInfo((current) =>
                  current === "climate" ? undefined : "climate",
                )
              }
            >
              <CentralIcon
                name="IconThermostat"
                join="round"
                fill="outlined"
                radius="3"
                stroke="1.5"
                size={15}
              />
              <span>
                {simulation
                  ? `${simulation.temperature.toFixed(1)}° · ${Math.round(simulation.humidity)}%`
                  : simulationStatus === "failed"
                    ? "模拟失败"
                    : "模拟中"}
              </span>
            </button>
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
                ...(rendererProps as ConstructorParameters<
                  typeof THREE.WebGPURenderer
                >[0]),
                antialias: true,
                alpha: false,
              });
              await renderer.init();
              renderer.setClearColor("#ffffff", 1);
              return renderer;
            }}
          >
            <color attach="background" args={[solar.skyColor]} />
            <AmbientOcclusion />
            <CameraControls />
            <GroundShadow daylight={solar.daylight} />
            <WhiteModelRoom
              airConditionerOn={displayState.airConditionerOn}
              airflowIntensity={simulation?.airflowIntensity ?? 1}
              ceilingLightOn={displayState.ceilingLightOn}
              deviceState={displayState}
              doorOpen={displayState.doorOpen}
              night={night}
              selectedDevices={selectedDevices}
              solar={solar}
              windowOpen={displayState.windowOpen}
              onAirConditionerToggle={() => toggleState("airConditionerOn")}
              onCeilingLightToggle={() => toggleState("ceilingLightOn")}
              onDeviceToggle={(key) => toggleState(key)}
              onDoorToggle={() => toggleState("doorOpen")}
              onWindowToggle={() => toggleState("windowOpen")}
            />
          </Canvas>
        ) : null}
      </div>
      {simulationTimeline.length > 1 && simulation ? (
        <aside
          className="room-timeline"
          aria-label="仿真时间轴"
          data-expanded={timelineExpanded}
          style={
            {
              "--timeline-progress": `${
                (timelinePosition / (simulationTimeline.length - 1)) * 100
              }%`,
            } as CSSProperties
          }
        >
          {timelineExpanded ? (
            <section className="room-timeline__events">
              <header className="room-timeline__events-header">
                <div>
                  <span>时段变化</span>
                  <small>{timelineEvents.length} 项</small>
                  <time
                    className="room-timeline__events-date"
                    dateTime={simulation.time}
                  >
                    {roomDateLabel(simulation.time)}
                  </time>
                </div>
              </header>
              {timelineEvents.length > 0 ? (
                <ol className="room-timeline__event-list">
                  {timelineEvents.map((event) => (
                    <li key={`${event.time}-${event.index}`}>
                      <button
                        type="button"
                        className="room-timeline__event"
                        aria-current={
                          Math.floor(timelinePosition) === event.index
                        }
                        onClick={() => setTimelinePosition(event.index)}
                      >
                        <time
                          className="room-timeline__event-time"
                          dateTime={event.time}
                        >
                          {roomTimeLabel(event.time)}
                        </time>
                        <span className="room-timeline__event-changes">
                          {event.changes.join(" · ")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="room-timeline__empty">当前时段没有状态变化</p>
              )}
            </section>
          ) : null}
          <div className="room-timeline__rail">
            <header className="room-timeline__rail-header">
              <button
                type="button"
                className="room-timeline__toggle"
                aria-label={timelineExpanded ? "收起时间轴" : "展开时间轴"}
                aria-expanded={timelineExpanded}
                onClick={() => setTimelineExpanded((current) => !current)}
              >
                <CentralIcon
                  name="IconChevronLeft"
                  join="round"
                  fill="outlined"
                  radius="3"
                  stroke="1.5"
                  size={16}
                />
              </button>
            </header>
            <div className="room-timeline__track">
              <div className="room-timeline__scale" aria-hidden="true">
                {timelineTicks.map((tick, index) => (
                  <span
                    key={`${tick.label}-${index}`}
                    className="room-timeline__tick"
                    data-edge={index === 0 || index === timelineTicks.length - 1}
                    style={
                      {
                        "--timeline-position": `${tick.position}%`,
                      } as CSSProperties
                    }
                  >
                    <small>{tick.label}</small>
                  </span>
                ))}
                {timelineEvents.map((event) => (
                  <span
                    key={`${event.time}-${event.index}`}
                    className="room-timeline__marker"
                    style={
                      {
                        "--timeline-position": `${
                          (event.index / (simulationTimeline.length - 1)) * 100
                        }%`,
                      } as CSSProperties
                    }
                  />
                ))}
                <span className="room-timeline__cursor">
                  <time
                    className="room-timeline__current"
                    dateTime={simulation.time}
                  >
                    {roomTimeLabel(simulation.time)}
                  </time>
                </span>
              </div>
              <input
                type="range"
                aria-label="调整仿真时间"
                aria-valuetext={roomTimeLabel(simulation.time)}
                min={0}
                max={simulationTimeline.length - 1}
                step={0.05}
                value={timelinePosition}
                onChange={(event) =>
                  setTimelinePosition(Number(event.currentTarget.value))
                }
              />
            </div>
          </div>
        </aside>
      ) : null}
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
