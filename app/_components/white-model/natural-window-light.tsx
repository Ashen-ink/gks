import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import {
  setWhiteModelNaturalLight,
  whiteModelNaturalLight,
} from "@/app/_components/white-model/white-model-material";
import type { RoomSolarState } from "@/app/_lib/room-simulation";

export default function NaturalWindowLight({
  solar,
}: {
  solar: RoomSolarState;
}) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    setWhiteModelNaturalLight(solar);
    invalidate();
  }, [invalidate, solar]);

  return (
    <>
      <primitive object={whiteModelNaturalLight} />
      <primitive object={whiteModelNaturalLight.target} />
    </>
  );
}
