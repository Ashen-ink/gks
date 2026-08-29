import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import BedroomFurnishings from "@/app/_components/white-model/bedroom-furnishings";
import ClimateDevices from "@/app/_components/white-model/climate-devices";
import RoomShell from "@/app/_components/white-model/room-shell";
import WhiteModelLightingState from "@/app/_components/white-model/white-model-lighting-state";
import type { DeviceStateKey, RoomState } from "@/app/_lib/room-state";

type WhiteModelRoomProps = {
  airConditionerOn: boolean;
  airflowIntensity: number;
  ceilingLightOn: boolean;
  doorOpen: boolean;
  deviceState: RoomState;
  night: boolean;
  windowOpen: boolean;
  onAirConditionerToggle: () => void;
  onCeilingLightToggle: () => void;
  onDoorToggle: () => void;
  onDeviceToggle: (key: DeviceStateKey) => void;
  onWindowToggle: () => void;
  selectedDevices: readonly DeviceStateKey[];
};

export default function WhiteModelRoom({
  airConditionerOn,
  airflowIntensity,
  ceilingLightOn,
  doorOpen,
  deviceState,
  night,
  windowOpen,
  onAirConditionerToggle,
  onCeilingLightToggle,
  onDoorToggle,
  onDeviceToggle,
  onWindowToggle,
  selectedDevices,
}: WhiteModelRoomProps) {
  const model = useRef<THREE.Group>(null);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    model.current?.traverse((child) => {
      if (child instanceof THREE.LineSegments) {
        const material = child.material as THREE.LineBasicMaterial;
        material.color.set(night ? "#0b1020" : "#dcdcdc");
      }
    });
    invalidate();
  }, [invalidate, night]);

  return (
    <group ref={model}>
      <WhiteModelLightingState night={night} />
      <RoomShell
        airConditionerOn={airConditionerOn}
        airConditionerSelected={selectedDevices.includes("airConditionerOn")}
        airflowIntensity={airflowIntensity}
        ceilingLightOn={ceilingLightOn}
        doorOpen={doorOpen}
        night={night}
        windowOpen={windowOpen}
        onAirConditionerToggle={onAirConditionerToggle}
        onCeilingLightToggle={onCeilingLightToggle}
        onDoorToggle={onDoorToggle}
        onWindowToggle={onWindowToggle}
      />
      <BedroomFurnishings />
      <ClimateDevices
        airflowIntensity={airflowIntensity}
        state={deviceState}
        selectedDevices={selectedDevices}
        onToggle={onDeviceToggle}
      />
    </group>
  );
}
