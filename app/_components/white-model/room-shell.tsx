import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import CameraFacingWalls from "@/app/_components/white-model/camera-facing-walls";
import AirConditionerAirflow from "@/app/_components/white-model/air-conditioner-airflow";
import InteractiveGroup from "@/app/_components/white-model/interactive-group";
import NaturalWindowLight from "@/app/_components/white-model/natural-window-light";
import RoomFixtures from "@/app/_components/white-model/room-fixtures";
import { WhiteBox } from "@/app/_components/white-model/white-mesh";
import WindowAirflow from "@/app/_components/white-model/window-airflow";

type RoomShellProps = {
  airConditionerOn: boolean;
  airConditionerSelected: boolean;
  ceilingLightOn: boolean;
  doorOpen: boolean;
  night: boolean;
  windowOpen: boolean;
  onAirConditionerToggle: () => void;
  onCeilingLightToggle: () => void;
  onDoorToggle: () => void;
  onWindowToggle: () => void;
};

type WindowSashProps = {
  direction: -1 | 1;
  open: boolean;
  position: [number, number, number];
};

function WindowSash({ direction, open, position }: WindowSashProps) {
  const sash = useRef<THREE.Group>(null);
  const invalidate = useThree((state) => state.invalidate);

  useFrame((_, delta) => {
    if (!sash.current) {
      return;
    }

    const targetRotation = open ? direction * (Math.PI / 4) : 0;
    const animationDelta = Math.min(delta, 1 / 60);
    const nextRotation = THREE.MathUtils.damp(
      sash.current.rotation.y,
      targetRotation,
      6,
      animationDelta,
    );

    sash.current.rotation.y = nextRotation;

    if (Math.abs(nextRotation - targetRotation) > 0.001) {
      invalidate();
    } else {
      sash.current.rotation.y = targetRotation;
    }
  });

  return (
    <group ref={sash} position={position}>
      <WhiteBox position={[direction * 0.825, 0.95, 0]} size={[1.65, 0.08, 0.08]} />
      <WhiteBox position={[direction * 0.825, -0.95, 0]} size={[1.65, 0.08, 0.08]} />
      <WhiteBox position={[direction * 0.04, 0, 0]} size={[0.08, 1.9, 0.08]} />
      <WhiteBox position={[direction * 1.61, 0, 0]} size={[0.08, 1.9, 0.08]} />
    </group>
  );
}

function Window({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <InteractiveGroup onToggle={onToggle}>
      <WhiteBox position={[2.35, 3.75, -3.93]} size={[3.6, 0.1, 0.1]} />
      <WhiteBox position={[2.35, 1.75, -3.93]} size={[3.6, 0.1, 0.1]} />
      <WhiteBox position={[0.55, 2.75, -3.93]} size={[0.1, 2.1, 0.1]} />
      <WhiteBox position={[4.15, 2.75, -3.93]} size={[0.1, 2.1, 0.1]} />
      <WindowSash direction={1} open={open} position={[0.65, 2.75, -3.91]} />
      <WindowSash direction={-1} open={open} position={[4.05, 2.75, -3.91]} />
    </InteractiveGroup>
  );
}

export default function RoomShell({
  airConditionerOn,
  airConditionerSelected,
  ceilingLightOn,
  doorOpen,
  night,
  windowOpen,
  onAirConditionerToggle,
  onCeilingLightToggle,
  onDoorToggle,
  onWindowToggle,
}: RoomShellProps) {
  return (
    <group>
      <WhiteBox position={[0, 0, 0]} size={[10, 0.08, 8]} />
      <mesh position={[0, 4.84, 0]} castShadow>
        <boxGeometry args={[10, 0.08, 8]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
      <NaturalWindowLight enabled={!night} />
      <CameraFacingWalls />
      <WhiteBox position={[0, 0.14, -3.9]} size={[10, 0.2, 0.12]} />
      <WhiteBox position={[-1.875, 0.14, 3.9]} size={[6.25, 0.2, 0.12]} />
      <WhiteBox position={[4.225, 0.14, 3.9]} size={[1.55, 0.2, 0.12]} />
      <WhiteBox position={[-4.9, 0.14, 0]} size={[0.12, 0.2, 8]} />
      <WhiteBox position={[4.9, 0.14, 0]} size={[0.12, 0.2, 8]} />
      <Window open={windowOpen} onToggle={onWindowToggle} />
      <WindowAirflow
        crossVentilation={windowOpen && doorOpen}
        open={windowOpen}
      />
      <AirConditionerAirflow active={airConditionerOn} />
      <RoomFixtures
        airConditionerSelected={airConditionerSelected}
        ceilingLightOn={ceilingLightOn}
        doorOpen={doorOpen}
        onAirConditionerToggle={onAirConditionerToggle}
        onCeilingLightToggle={onCeilingLightToggle}
        onDoorToggle={onDoorToggle}
      />
    </group>
  );
}
