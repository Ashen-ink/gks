"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import {
  CabinetAirConditioner,
  Dehumidifier,
  FloorFan,
  FloorHeating,
  PtcHeater,
  RadiantHeater,
} from "@/app/_components/white-model/climate-devices";
import { WallAirConditioner } from "@/app/_components/white-model/room-fixtures";
import { WhiteModelPreviewMaterial } from "@/app/_components/white-model/white-model-material";
import type { DeviceStateKey } from "@/app/_lib/room-state";

function DeviceModel({ device }: { device: DeviceStateKey }) {
  switch (device) {
    case "airConditionerOn":
      return (
        <WallAirConditioner
          position={[0, 0.45, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
      );
    case "cabinetAirConditionerOn":
      return <CabinetAirConditioner position={[0, 0, 0]} />;
    case "dehumidifierOn":
      return <Dehumidifier position={[0, 0, 0]} />;
    case "floorFanOn":
      return <FloorFan active={false} position={[0, 0, 0]} />;
    case "ptcHeaterOn":
      return <PtcHeater position={[0, 0, 0]} />;
    case "radiantHeaterOn":
      return <RadiantHeater position={[0, 0, 0]} />;
    case "floorHeatingOn":
      return <FloorHeating position={[0, 0.02, 0]} />;
  }
}

export default function RoomFurnitureModelPreview({
  device,
}: {
  device: DeviceStateKey;
}) {
  return (
    <div className="room-furniture-model__preview" aria-hidden="true">
      <Canvas
        camera={{ position: [3.4, 2.8, 5.2], fov: 30, near: 0.1, far: 30 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{ alpha: true, antialias: true }}
        shadows={{ type: THREE.PCFShadowMap }}
        onCreated={({ camera, gl }) => {
          camera.lookAt(0, 0.7, 0);
          gl.setClearColor(0xffffff, 0);
        }}
      >
        <ambientLight intensity={2.2} />
        <directionalLight
          castShadow
          intensity={2.5}
          position={[3, 5, 4]}
          shadow-bias={-0.0004}
          shadow-mapSize-height={512}
          shadow-mapSize-width={512}
        />
        <WhiteModelPreviewMaterial>
          <group rotation={[0, -0.45, 0]} scale={0.98}>
            <DeviceModel device={device} />
          </group>
        </WhiteModelPreviewMaterial>
        <mesh receiveShadow position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.35, 64]} />
          <shadowMaterial transparent opacity={0.2} />
        </mesh>
      </Canvas>
    </div>
  );
}
