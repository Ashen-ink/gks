# 常宁居

基于 Next.js、React Three Fiber、Three.js WebGPU 与 VGPU 的交互式室内环境项目。

## 开发

```bash
bun install
bun dev
```

## 检查

```bash
bun run lint
bun run build
```

## 结构

- `app/_components/white-world.tsx`：WebGPU 白色世界
- `app/_components/room-furniture-table.tsx`：设备选择面板
- `app/_components/room-furniture-model-preview.tsx`：设备模型预览
- `app/_components/exterior/ground-shadow.tsx`：房间外围接地阴影
- `app/_components/camera-controls.tsx`：相机视角控制
- `app/_components/white-model-room.tsx`：白模房间入口
- `app/_components/white-model/room-shell.tsx`：房间结构
- `app/_components/white-model/room-fixtures.tsx`：空调、门和顶灯等固定设备
- `app/_components/white-model/climate-devices.tsx`：可选环境设备
- `app/_components/white-model/device-airflow.tsx`：设备气流
- `app/_components/white-model/camera-facing-walls.tsx`：相机遮挡墙控制
- `app/_components/white-model/bedroom-furnishings.tsx`：卧室家具
- `app/_components/white-model/white-mesh.tsx`：白模几何组件
- `app/_components/white-model/white-model-material.tsx`：白模独立光照材质
- `app/_components/white-model/white-model-lighting-state.tsx`：白模昼夜亮度状态
- `app/_components/white-model/natural-window-light.tsx`：窗户自然入射光
- `app/_components/landing`：Landing Page 组件
- `app/_shaders`：VGPU Shader
