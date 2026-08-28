import * as THREE from "three";

const textureSize = 512;
const textureData = new Uint8Array(textureSize * textureSize * 4);

for (let y = 0; y < textureSize; y += 1) {
  for (let x = 0; x < textureSize; x += 1) {
    const horizontal = (x / (textureSize - 1)) * 2 - 1;
    const vertical = (y / (textureSize - 1)) * 2 - 1;
    const distance = Math.sqrt(horizontal * horizontal + vertical * vertical);
    const progress = THREE.MathUtils.clamp((distance - 0.38) / 0.62, 0, 1);
    const smoothProgress = progress * progress * (3 - 2 * progress);
    const alpha = Math.round((1 - smoothProgress) * 255);
    const offset = (y * textureSize + x) * 4;

    textureData[offset] = alpha;
    textureData[offset + 1] = alpha;
    textureData[offset + 2] = alpha;
    textureData[offset + 3] = 255;
  }
}

const shadowTexture = new THREE.DataTexture(
  textureData,
  textureSize,
  textureSize,
  THREE.RGBAFormat,
);

shadowTexture.colorSpace = THREE.NoColorSpace;
shadowTexture.magFilter = THREE.LinearFilter;
shadowTexture.minFilter = THREE.LinearFilter;
shadowTexture.needsUpdate = true;

export default function GroundShadow() {
  return (
    <mesh position={[0, -0.052, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[18, 18]} />
      <meshBasicMaterial
        alphaMap={shadowTexture}
        color="#777777"
        depthWrite={false}
        opacity={0.28}
        toneMapped={false}
        transparent
      />
    </mesh>
  );
}
