"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import AmbientOcclusion from "@/app/_components/ambient-occlusion";
import CameraControls from "@/app/_components/camera-controls";
import GroundShadow from "@/app/_components/exterior/ground-shadow";
import WhiteModelRoom from "@/app/_components/white-model-room";
import {
  defaultRoomState,
  isRoomState,
  type RoomState,
} from "@/app/_lib/room-state";

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
  const [roomState, setRoomState] = useState(defaultRoomState);
  const stateRef = useRef(roomState);
  const localRevision = useRef(0);
  const latestRead = useRef(0);
  const pendingWrites = useRef(0);
  const patchQueue = useRef<Promise<void>>(Promise.resolve());
  const night = roomState.ceilingLightOn;

  useEffect(() => {
    const controller = new AbortController();

    const syncState = () => {
      if (pendingWrites.current > 0) {
        return;
      }

      const read = ++latestRead.current;
      const revision = localRevision.current;

      fetch("/api/room/state", {
        cache: "no-store",
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : undefined))
        .then((state: unknown) => {
          if (
            isRoomState(state) &&
            read === latestRead.current &&
            revision === localRevision.current &&
            pendingWrites.current === 0
          ) {
            stateRef.current = state;
            setRoomState(state);
          }
        })
        .catch(() => undefined);
    };

    syncState();
    const interval = window.setInterval(syncState, 1000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
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

  return (
    <main className="white-world">
      <Canvas
        flat
        frameloop="demand"
        shadows
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
          doorOpen={roomState.doorOpen}
          night={night}
          windowOpen={roomState.windowOpen}
          onAirConditionerToggle={() => toggleState("airConditionerOn")}
          onCeilingLightToggle={() => toggleState("ceilingLightOn")}
          onDoorToggle={() => toggleState("doorOpen")}
          onWindowToggle={() => toggleState("windowOpen")}
        />
      </Canvas>
    </main>
  );
}
