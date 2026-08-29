import { useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import DeviceAirflow from "@/app/_components/white-model/device-airflow";
import InteractiveGroup from "@/app/_components/white-model/interactive-group";
import {
  WhiteBox,
  WhiteCylinder,
} from "@/app/_components/white-model/white-mesh";
import WhiteModelMaterial from "@/app/_components/white-model/white-model-material";
import type { DeviceStateKey, RoomState } from "@/app/_lib/room-state";

type Vector3 = [number, number, number];

type DeviceProps = {
  position: Vector3;
  rotation?: Vector3;
};

type RotatingGroupProps = {
  active: boolean;
  children: ReactNode;
  speed: number;
};

function RotatingGroup({
  active,
  children,
  speed,
}: RotatingGroupProps) {
  const group = useRef<THREE.Group>(null);
  const invalidate = useThree((state) => state.invalidate);

  useFrame((_, delta) => {
    if (!active || !group.current) {
      return;
    }

    group.current.rotation.z += Math.min(delta, 1 / 30) * speed;
    invalidate();
  });

  return <group ref={group}>{children}</group>;
}

export function CabinetAirConditioner({
  position,
  rotation = [0, 0, 0],
}: DeviceProps) {
  return (
    <group position={position} rotation={rotation}>
      <WhiteBox position={[0, 1.02, 0]} size={[0.74, 2.04, 0.58]} />
      <WhiteBox position={[0, 1.63, 0.3]} size={[0.58, 0.48, 0.04]} />
      {[-0.21, -0.07, 0.07, 0.21].map((horizontal) => (
        <WhiteBox
          key={horizontal}
          position={[horizontal, 1.63, 0.33]}
          size={[0.025, 0.36, 0.03]}
        />
      ))}
      <WhiteBox position={[0, 0.48, 0.3]} size={[0.5, 0.08, 0.04]} />
    </group>
  );
}

export function Dehumidifier({
  position,
  rotation = [0, 0, 0],
}: DeviceProps) {
  return (
    <group position={position} rotation={rotation}>
      <WhiteBox position={[0, 0.58, 0]} size={[0.68, 1.12, 0.52]} />
      <WhiteBox position={[0, 1.16, -0.04]} size={[0.46, 0.04, 0.3]} />
      <WhiteBox position={[0, 0.35, 0.27]} size={[0.5, 0.42, 0.04]} />
      {[-0.22, 0.22].flatMap((horizontal) =>
        [-0.16, 0.16].map((depth) => (
          <WhiteCylinder
            key={`${horizontal}-${depth}`}
            position={[horizontal, 0.04, depth]}
            radius={0.045}
            height={0.08}
          />
        )),
      )}
    </group>
  );
}

export function FloorFan({
  active,
  position,
  rotation = [0, 0, 0],
}: DeviceProps & { active: boolean }) {
  return (
    <group position={position} rotation={rotation}>
      <WhiteCylinder position={[0, 0.06, 0]} radius={0.34} height={0.12} />
      <WhiteCylinder position={[0, 0.72, 0]} radius={0.045} height={1.24} />
      <group position={[0, 1.5, 0]}>
        <mesh>
          <torusGeometry args={[0.43, 0.035, 12, 48]} />
          <WhiteModelMaterial />
        </mesh>
        <WhiteCylinder
          position={[0, 0, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          radius={0.1}
          height={0.18}
        />
        <RotatingGroup active={active} speed={7.4}>
          {[0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].map((angle) => (
            <WhiteBox
              key={angle}
              position={[
                Math.cos(angle) * 0.2,
                Math.sin(angle) * 0.2,
                0,
              ]}
              rotation={[0, 0, angle]}
              size={[0.34, 0.12, 0.05]}
            />
          ))}
        </RotatingGroup>
      </group>
    </group>
  );
}

export function PtcHeater({
  position,
  rotation = [0, 0, 0],
}: DeviceProps) {
  return (
    <group position={position} rotation={rotation}>
      <WhiteBox position={[0, 0.55, 0]} size={[0.62, 1.06, 0.38]} />
      {[-0.2, -0.1, 0, 0.1, 0.2].map((horizontal) => (
        <WhiteBox
          key={horizontal}
          position={[horizontal, 0.6, 0.21]}
          size={[0.025, 0.68, 0.035]}
        />
      ))}
      <WhiteBox position={[0, 0.06, 0]} size={[0.78, 0.08, 0.5]} />
    </group>
  );
}

export function RadiantHeater({
  position,
  rotation = [0, 0, 0],
}: DeviceProps) {
  return (
    <group position={position} rotation={rotation}>
      <WhiteCylinder position={[0, 0.06, 0]} radius={0.38} height={0.12} />
      <WhiteCylinder position={[0, 0.52, 0]} radius={0.045} height={0.82} />
      <group position={[0, 1.02, 0]} rotation={[-0.18, 0, 0]}>
        <WhiteCylinder
          position={[0, 0, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          radius={0.42}
          height={0.16}
        />
        <mesh position={[0, 0, 0.11]}>
          <torusGeometry args={[0.31, 0.025, 12, 48]} />
          <WhiteModelMaterial />
        </mesh>
        <WhiteCylinder
          position={[0, 0, 0.12]}
          rotation={[Math.PI / 2, 0, 0]}
          radius={0.08}
          height={0.05}
        />
      </group>
    </group>
  );
}

export function FloorHeating({ position }: Pick<DeviceProps, "position">) {
  return (
    <group position={position}>
      <WhiteBox position={[0, 0, 0]} size={[2.8, 0.035, 2.2]} />
      {[-0.85, -0.42, 0, 0.42, 0.85].map((depth) => (
        <WhiteBox
          key={depth}
          position={[0, 0.03, depth]}
          size={[2.4, 0.025, 0.035]}
        />
      ))}
    </group>
  );
}

type ClimateDevicesProps = {
  airflowIntensity: number;
  onToggle: (key: DeviceStateKey) => void;
  selectedDevices: readonly DeviceStateKey[];
  state: RoomState;
};

export default function ClimateDevices({
  airflowIntensity,
  onToggle,
  selectedDevices,
  state,
}: ClimateDevicesProps) {
  return (
    <group>
      {selectedDevices.includes("cabinetAirConditionerOn") ? (
        <InteractiveGroup onToggle={() => onToggle("cabinetAirConditionerOn")}>
          <CabinetAirConditioner
            position={[4.45, 0.04, -0.35]}
            rotation={[0, -Math.PI / 2, 0]}
          />
        </InteractiveGroup>
      ) : null}
      {selectedDevices.includes("dehumidifierOn") ? (
        <InteractiveGroup onToggle={() => onToggle("dehumidifierOn")}>
          <Dehumidifier position={[3.65, 0.04, 1.1]} rotation={[0, -0.3, 0]} />
        </InteractiveGroup>
      ) : null}
      {selectedDevices.includes("floorFanOn") ? (
        <InteractiveGroup onToggle={() => onToggle("floorFanOn")}>
          <FloorFan
            active={state.floorFanOn}
            position={[0.4, 0.04, 2.75]}
            rotation={[0, Math.PI, 0]}
          />
        </InteractiveGroup>
      ) : null}
      {selectedDevices.includes("ptcHeaterOn") ? (
        <InteractiveGroup onToggle={() => onToggle("ptcHeaterOn")}>
          <PtcHeater position={[-0.85, 0.04, 2.75]} rotation={[0, Math.PI, 0]} />
        </InteractiveGroup>
      ) : null}
      {selectedDevices.includes("radiantHeaterOn") ? (
        <InteractiveGroup onToggle={() => onToggle("radiantHeaterOn")}>
          <RadiantHeater
            position={[-2.05, 0.04, 2.65]}
            rotation={[0, Math.PI, 0]}
          />
        </InteractiveGroup>
      ) : null}
      {selectedDevices.includes("floorHeatingOn") ? (
        <InteractiveGroup onToggle={() => onToggle("floorHeatingOn")}>
          <FloorHeating position={[1.85, 0.055, 0.65]} />
        </InteractiveGroup>
      ) : null}
      <DeviceAirflow
        active={state.cabinetAirConditionerOn}
        intensity={airflowIntensity}
        count={8}
        direction={[-3.8, -0.85, 0]}
        farColor="#57aeea"
        nearColor="#ffffff"
        origin={[4.12, 1.62, -0.35]}
        spread={[0.08, 0.28, 0.52]}
      />
      <DeviceAirflow
        active={state.ptcHeaterOn}
        intensity={airflowIntensity}
        count={7}
        direction={[0, 0.85, -1.85]}
        origin={[-0.85, 0.72, 2.48]}
        spread={[0.48, 0.16, 0.1]}
      />
      <DeviceAirflow
        active={state.radiantHeaterOn}
        intensity={airflowIntensity}
        count={7}
        direction={[0, 0.62, -1.65]}
        origin={[-2.05, 1.08, 2.4]}
        spread={[0.5, 0.14, 0.1]}
      />
      <DeviceAirflow
        active={state.floorHeatingOn}
        intensity={airflowIntensity}
        count={12}
        direction={[0, 1.55, 0.1]}
        origin={[1.85, 0.13, 0.65]}
        spread={[2.2, 0.04, 1.55]}
      />
    </group>
  );
}
