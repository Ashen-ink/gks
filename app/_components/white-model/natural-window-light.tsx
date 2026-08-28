import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import {
  setWhiteModelNaturalLight,
  whiteModelNaturalLight,
} from "@/app/_components/white-model/white-model-material";

export default function NaturalWindowLight({ enabled }: { enabled: boolean }) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    setWhiteModelNaturalLight(enabled);
    invalidate();
  }, [enabled, invalidate]);

  return (
    <>
      <primitive object={whiteModelNaturalLight} />
      <primitive object={whiteModelNaturalLight.target} />
    </>
  );
}
