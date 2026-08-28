struct StudioPanel {
  direction: vec3f,
  size: vec2f,
  feather: f32,
  color: vec3f,
  intensity: f32,
}

fn srgbToLinear(color: vec3f) -> vec3f {
  let low = color / 12.92;
  let high = pow((color + vec3f(0.055)) / 1.055, vec3f(2.4));
  return select(high, low, color <= vec3f(0.04045));
}

fn directionFromEquirect(uv: vec2f) -> vec3f {
  let phi = (uv.x - 0.5) * 6.283185307179586;
  let theta = uv.y * 3.141592653589793;
  return vec3f(
    sin(theta) * cos(phi),
    cos(theta),
    sin(theta) * sin(phi),
  );
}

fn panels() -> array<StudioPanel, 3> {
  return array<StudioPanel, 3>(
    StudioPanel(
      vec3f(-0.82, 0.08, 0.57),
      vec2f(1.35, 1.1),
      0.22,
      vec3f(0.82, 0.84, 0.88),
      0.011,
    ),
    StudioPanel(
      vec3f(0.0, -0.707, 0.707),
      vec2f(0.38, 0.62),
      0.18,
      vec3f(1.0, 0.97, 0.91),
      0.22,
    ),
    StudioPanel(
      vec3f(0.612, 0.354, 0.707),
      vec2f(0.5, 0.16),
      0.035,
      vec3f(0.76, 0.88, 1.0),
      20.0,
    ),
  );
}

fn panelMask(direction: vec3f, panel: StudioPanel) -> f32 {
  let forward = normalize(panel.direction);
  let helper = select(
    vec3f(0.0, 1.0, 0.0),
    vec3f(0.0, 0.0, 1.0),
    abs(forward.y) > 0.92,
  );
  let right = normalize(cross(helper, forward));
  let up = cross(forward, right);
  let facing = dot(direction, forward);

  if (facing <= 0.01) {
    return 0.0;
  }

  let localX = abs(dot(direction, right) / facing);
  let localY = abs(dot(direction, up) / facing);
  let edgeX = 1.0 - smoothstep(
    panel.size.x,
    panel.size.x + panel.feather,
    localX,
  );
  let edgeY = 1.0 - smoothstep(
    panel.size.y,
    panel.size.y + panel.feather,
    localY,
  );
  return edgeX * edgeY;
}

fn studioEnvironment(inputDirection: vec3f) -> vec3f {
  let direction = normalize(inputDirection);
  let floorBlend = 1.0 - smoothstep(-0.22, -0.02, direction.y);
  var room = mix(
    vec3f(0.00025, 0.0003, 0.0004),
    vec3f(0.006, 0.007, 0.009),
    floorBlend,
  );
  let negativeZ = 1.0 - smoothstep(-0.08, 0.08, direction.z);
  let aboveFloor = smoothstep(-0.28, -0.08, direction.y);
  room = mix(room, vec3f(0.00002), negativeZ * aboveFloor);
  let horizon = exp(-abs(direction.y + 0.1) * 22.0) * 0.0012;
  var color = room + vec3f(horizon, horizon * 0.96, horizon * 0.9);
  let studioPanels = panels();

  for (var index = 0u; index < 3u; index = index + 1u) {
    let panel = studioPanels[index];
    color = color + panel.color * panelMask(direction, panel) * panel.intensity;
  }

  let mapped = color / (vec3f(1.0) + color);
  return srgbToLinear(pow(max(mapped, vec3f(0.0)), vec3f(1.0 / 2.2)));
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  return vec4f(studioEnvironment(directionFromEquirect(uv)), 1.0);
}
