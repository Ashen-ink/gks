import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export default function CameraControls() {
  const camera = useThree((state) => state.camera);
  const canvas = useThree((state) => state.gl.domElement);
  const invalidate = useThree((state) => state.invalidate);
  const controls = useRef<OrbitControls>(null);

  useEffect(() => {
    const nextControls = new OrbitControls(camera, canvas);
    const handleChange = () => invalidate();
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (event.ctrlKey) {
        const scale = Math.exp(Math.min(Math.abs(event.deltaY), 100) * 0.005);

        if (event.deltaY < 0) {
          nextControls.dollyOut(scale);
        } else {
          nextControls.dollyIn(scale);
        }

        return;
      }

      if (event.shiftKey) {
        nextControls.pan(event.deltaX * -0.7, event.deltaY * -0.7);
        return;
      }

      nextControls.rotateLeft(event.deltaX * -0.003);
      nextControls.rotateUp(event.deltaY * -0.003);
    };

    nextControls.target.set(0, 1.5, -0.4);
    nextControls.enableDamping = true;
    nextControls.dampingFactor = 0.07;
    nextControls.enablePan = true;
    nextControls.enableZoom = false;
    nextControls.screenSpacePanning = true;
    nextControls.minDistance = 8;
    nextControls.maxDistance = 34;
    nextControls.minPolarAngle = 0.25;
    nextControls.maxPolarAngle = Math.PI / 2.05;
    nextControls.zoomToCursor = true;
    nextControls.addEventListener("change", handleChange);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    nextControls.update();
    controls.current = nextControls;

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      nextControls.removeEventListener("change", handleChange);
      nextControls.dispose();
      controls.current = null;
    };
  }, [camera, canvas, invalidate]);

  useFrame(() => {
    if (controls.current?.update()) {
      invalidate();
    }
  });

  return null;
}
