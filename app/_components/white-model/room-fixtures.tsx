import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import InteractiveGroup from "@/app/_components/white-model/interactive-group";
import {
  WhiteBox,
  WhiteCylinder,
} from "@/app/_components/white-model/white-mesh";
import {
  setWhiteModelCeilingLight,
  whiteModelCeilingLights,
} from "@/app/_components/white-model/white-model-material";

function AirConditioner({ onToggle }: { onToggle: () => void }) {
  return (
    <InteractiveGroup onToggle={onToggle}>
      <WhiteBox position={[4.72, 3.65, 1.5]} size={[0.42, 0.78, 2.5]} />
      <WhiteBox position={[4.49, 3.42, 1.5]} size={[0.05, 0.2, 2.15]} />
      <WhiteBox position={[4.46, 3.72, 0.82]} size={[0.04, 0.16, 0.42]} />
      <WhiteBox position={[4.45, 3.31, 1.5]} size={[0.04, 0.06, 1.9]} />
    </InteractiveGroup>
  );
}

function Door({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const leaf = useRef<THREE.Group>(null);
  const invalidate = useThree((state) => state.invalidate);

  useFrame((_, delta) => {
    if (!leaf.current) {
      return;
    }

    const targetRotation = open ? -Math.PI / 3 : 0;
    const animationDelta = Math.min(delta, 1 / 60);
    const nextRotation = THREE.MathUtils.damp(
      leaf.current.rotation.y,
      targetRotation,
      6,
      animationDelta,
    );

    leaf.current.rotation.y = nextRotation;

    if (Math.abs(nextRotation - targetRotation) > 0.001) {
      invalidate();
    } else {
      leaf.current.rotation.y = targetRotation;
    }
  });

  return (
    <InteractiveGroup onToggle={onToggle}>
      <WhiteBox position={[2.35, 3.14, 3.93]} size={[2.2, 0.12, 0.12]} />
      <WhiteBox position={[1.31, 1.6, 3.93]} size={[0.12, 3.2, 0.12]} />
      <WhiteBox position={[3.39, 1.6, 3.93]} size={[0.12, 3.2, 0.12]} />
      <group ref={leaf} position={[1.39, 0.04, 4.02]}>
        <WhiteBox position={[1, 1.51, 0]} size={[2, 3, 0.1]} />
        <WhiteCylinder
          position={[1.68, 1.48, -0.1]}
          rotation={[Math.PI / 2, 0, 0]}
          radius={0.05}
          height={0.16}
        />
      </group>
    </InteractiveGroup>
  );
}

function CeilingLight({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    setWhiteModelCeilingLight(on);
    invalidate();
  }, [invalidate, on]);

  return (
    <InteractiveGroup onToggle={onToggle}>
      {whiteModelCeilingLights.map((light) => (
        <group key={light.uuid}>
          <primitive object={light} />
          <primitive object={light.target} />
        </group>
      ))}
      <WhiteBox position={[0, 4.76, 0]} size={[2.7, 0.12, 1.35]} />
      <mesh position={[0, 4.69, 0]}>
        <boxGeometry args={[2.4, 0.04, 1.08]} />
        <meshBasicMaterial color={on ? "#ffc982" : "#e8e8e8"} toneMapped={false} />
      </mesh>
    </InteractiveGroup>
  );
}

type RoomFixturesProps = {
  ceilingLightOn: boolean;
  doorOpen: boolean;
  onAirConditionerToggle: () => void;
  onCeilingLightToggle: () => void;
  onDoorToggle: () => void;
};

export default function RoomFixtures({
  ceilingLightOn,
  doorOpen,
  onAirConditionerToggle,
  onCeilingLightToggle,
  onDoorToggle,
}: RoomFixturesProps) {
  return (
    <>
      <AirConditioner onToggle={onAirConditionerToggle} />
      <Door open={doorOpen} onToggle={onDoorToggle} />
      <CeilingLight on={ceilingLightOn} onToggle={onCeilingLightToggle} />
    </>
  );
}
