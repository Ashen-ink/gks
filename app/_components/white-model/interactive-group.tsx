import type { ReactNode } from "react";
import type { ThreeEvent } from "@react-three/fiber";

type InteractiveGroupProps = {
  children: ReactNode;
  onToggle: () => void;
};

export default function InteractiveGroup({
  children,
  onToggle,
}: InteractiveGroupProps) {
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onToggle();
  };

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    document.body.style.cursor = "default";
  };

  return (
    <group
      onClick={handleClick}
      onPointerOut={handlePointerOut}
      onPointerOver={handlePointerOver}
    >
      {children}
    </group>
  );
}
