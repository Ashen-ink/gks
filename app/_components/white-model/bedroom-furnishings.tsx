import {
  WhiteBox,
  WhiteCylinder,
} from "@/app/_components/white-model/white-mesh";
import WhiteModelMaterial from "@/app/_components/white-model/white-model-material";

function Bed() {
  return (
    <group position={[-2.45, 0, -1.65]}>
      <WhiteBox position={[0, 0.3, 0]} size={[2.8, 0.42, 4]} />
      <WhiteBox position={[0, 0.66, 0]} size={[2.72, 0.34, 3.88]} />
      <WhiteBox position={[0, 1.35, -1.9]} size={[3, 1.8, 0.2]} />
      <WhiteBox position={[-0.7, 0.93, -1.25]} size={[1.15, 0.2, 0.7]} />
      <WhiteBox position={[0.7, 0.93, -1.25]} size={[1.15, 0.2, 0.7]} />
      <WhiteBox position={[0, 0.92, 0.5]} size={[2.7, 0.12, 2.45]} />
      <WhiteCylinder position={[-1.15, 0.1, -1.65]} radius={0.06} height={0.18} />
      <WhiteCylinder position={[1.15, 0.1, -1.65]} radius={0.06} height={0.18} />
      <WhiteCylinder position={[-1.15, 0.1, 1.65]} radius={0.06} height={0.18} />
      <WhiteCylinder position={[1.15, 0.1, 1.65]} radius={0.06} height={0.18} />
    </group>
  );
}

function Nightstand() {
  return (
    <group position={[-0.55, 0, -3]}>
      <WhiteBox position={[0, 0.48, 0]} size={[0.85, 0.86, 0.72]} />
      <WhiteBox position={[0, 0.58, 0.38]} size={[0.68, 0.36, 0.04]} />
      <WhiteCylinder
        position={[0, 0.58, 0.42]}
        rotation={[Math.PI / 2, 0, 0]}
        radius={0.025}
        height={0.12}
      />
    </group>
  );
}

function TableLamp() {
  return (
    <group position={[-0.55, 0.92, -3]}>
      <WhiteCylinder position={[0, 0.04, 0]} radius={0.18} height={0.08} />
      <WhiteCylinder position={[0, 0.4, 0]} radius={0.025} height={0.7} />
      <mesh position={[0, 0.82, 0]}>
        <coneGeometry args={[0.3, 0.48, 32, 1, true]} />
        <WhiteModelMaterial />
      </mesh>
    </group>
  );
}

function Wardrobe() {
  return (
    <group position={[-4.5, 0, 1.5]}>
      <WhiteBox position={[0, 1.45, 0]} size={[0.82, 2.8, 2.4]} />
      <WhiteBox position={[0.44, 1.45, -0.6]} size={[0.05, 2.55, 1.08]} />
      <WhiteBox position={[0.44, 1.45, 0.6]} size={[0.05, 2.55, 1.08]} />
      <WhiteCylinder
        position={[0.49, 1.45, -0.16]}
        rotation={[0, 0, Math.PI / 2]}
        radius={0.025}
        height={0.16}
      />
      <WhiteCylinder
        position={[0.49, 1.45, 0.16]}
        rotation={[0, 0, Math.PI / 2]}
        radius={0.025}
        height={0.16}
      />
    </group>
  );
}

function Desk() {
  return (
    <group position={[2.15, 0, -3.4]}>
      <WhiteBox position={[0, 1.05, 0]} size={[3.4, 0.12, 1]} />
      <WhiteBox position={[-1.25, 0.53, 0]} size={[0.65, 0.92, 0.92]} />
      <WhiteCylinder position={[1.3, 0.52, -0.36]} radius={0.05} height={0.94} />
      <WhiteCylinder position={[1.3, 0.52, 0.36]} radius={0.05} height={0.94} />
    </group>
  );
}

function Armchair() {
  return (
    <group position={[2.15, 0, -2.05]}>
      <WhiteBox position={[0, 0.4, 0]} size={[1.5, 0.48, 1.2]} />
      <WhiteBox position={[0, 1.05, 0.48]} size={[1.5, 1.15, 0.22]} />
      <WhiteBox position={[-0.66, 0.75, 0]} size={[0.22, 0.72, 1.12]} />
      <WhiteBox position={[0.66, 0.75, 0]} size={[0.22, 0.72, 1.12]} />
      <WhiteBox position={[0, 0.72, -0.04]} size={[1.05, 0.18, 0.88]} />
      <WhiteBox
        position={[0, 1.15, 0.32]}
        rotation={[-0.08, 0, 0]}
        size={[1.05, 0.78, 0.16]}
      />
      <WhiteCylinder position={[-0.5, 0.13, -0.38]} radius={0.05} height={0.22} />
      <WhiteCylinder position={[0.5, 0.13, -0.38]} radius={0.05} height={0.22} />
      <WhiteCylinder position={[-0.5, 0.13, 0.38]} radius={0.05} height={0.22} />
      <WhiteCylinder position={[0.5, 0.13, 0.38]} radius={0.05} height={0.22} />
    </group>
  );
}

export default function BedroomFurnishings() {
  return (
    <group>
      <WhiteBox position={[-2.35, 0.07, -1.2]} size={[3.8, 0.04, 5.2]} />
      <Bed />
      <Nightstand />
      <TableLamp />
      <Wardrobe />
      <Desk />
      <Armchair />
    </group>
  );
}
