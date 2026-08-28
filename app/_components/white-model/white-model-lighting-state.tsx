import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { setWhiteModelNightMode } from "@/app/_components/white-model/white-model-material";

export default function WhiteModelLightingState({ night }: { night: boolean }) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    setWhiteModelNightMode(night);
    invalidate();
  }, [invalidate, night]);

  return null;
}
