import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import BedroomFurnishings from "@/app/_components/white-model/bedroom-furnishings";
import RoomShell from "@/app/_components/white-model/room-shell";
import WhiteModelLightingState from "@/app/_components/white-model/white-model-lighting-state";

type WhiteModelRoomProps = {
  airConditionerOn: boolean;
  ceilingLightOn: boolean;
  doorOpen: boolean;
  night: boolean;
  windowOpen: boolean;
  onAirConditionerToggle: () => void;
  onCeilingLightToggle: () => void;
  onDoorToggle: () => void;
  onWindowToggle: () => void;
};

export default function WhiteModelRoom({
  airConditionerOn,
  ceilingLightOn,
  doorOpen,
  night,
  windowOpen,
  onAirConditionerToggle,
  onCeilingLightToggle,
  onDoorToggle,
  onWindowToggle,
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
    </group>
  );
}
