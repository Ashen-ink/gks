import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { setWhiteModelTimeOfDay } from "@/app/_components/white-model/white-model-material";
import type { RoomSolarState } from "@/app/_lib/room-simulation";

export default function WhiteModelLightingState({
  solar,
}: {
  solar: RoomSolarState;
}) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    setWhiteModelTimeOfDay(solar);
    invalidate();
  }, [invalidate, solar]);

  return null;
}
