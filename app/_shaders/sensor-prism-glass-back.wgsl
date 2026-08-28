struct Params {
  aspect: f32,
  offsetX: f32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var environmentSharp: texture_2d<f32>;
@group(0) @binding(2) var environmentSoft: texture_2d<f32>;
@group(0) @binding(3) var environmentSampler: sampler;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
}

struct SurfaceHit {
  distance: f32,
  outwardNormal: vec3f,
}

struct ExitPath {
  position: vec3f,
  direction: vec3f,
  incidentDirection: vec3f,
  inwardNormal: vec3f,
  escaped: u32,
}

const NO_HIT = 100000.0;
const SURFACE_EPSILON = 0.0002;
const IOR = 1.5046;
const FRESNEL_F0 = 0.040579;

fn toClip(position: vec3f) -> vec4f {
  let scale = 1.0 / max(params.aspect, 1.0);
  let projected = vec2f(
    position.x + position.z * 0.07,
    position.y + position.z * 0.035,
  );
  return vec4f(
    0.36 + (projected.x - 0.36) * scale,
    projected.y,
    0.48 - position.z * 0.12,
    1.0,
  );
}

@vertex
fn vs_main(
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
) -> VertexOutput {
  let worldPosition = position + vec3f(params.offsetX, 0.0, 0.0);
  var output: VertexOutput;
  output.position = toClip(worldPosition);
  output.worldPosition = worldPosition;
  output.worldNormal = normal;
  return output;
}

fn plane(index: u32) -> vec4f {
  if (index == 0u) {
    return vec4f(-1.0, 0.0, 0.0, 0.05);
  }
  if (index == 1u) {
    return vec4f(1.0, 0.0, 0.0, 0.77);
  }
  if (index == 2u) {
    return vec4f(0.0, -1.0, 0.0, 0.36);
  }
  if (index == 3u) {
    return vec4f(0.0, 1.0, 0.0, 0.46);
  }
  if (index == 4u) {
    return vec4f(0.0, 0.0, 1.0, 0.41);
  }
  return vec4f(0.0, 0.0, -1.0, 0.31);
}

fn planeHitDistance(origin: vec3f, direction: vec3f, surface: vec4f) -> f32 {
  let denominator = dot(surface.xyz, direction);
  if (denominator <= 0.00001) {
    return NO_HIT;
  }
  let distance = (surface.w - dot(surface.xyz, origin)) / denominator;
  return select(NO_HIT, distance, distance > SURFACE_EPSILON);
}

fn nextSurface(origin: vec3f, direction: vec3f) -> SurfaceHit {
  var nearest = NO_HIT;
  var normal = vec3f(0.0, 0.0, 1.0);

  for (var index = 0u; index < 6u; index = index + 1u) {
    let currentPlane = plane(index);
    let distance = planeHitDistance(origin, direction, currentPlane);
    if (distance < nearest) {
      nearest = distance;
      normal = currentPlane.xyz;
    }
  }

  return SurfaceHit(nearest, normal);
}

fn traceExit(
  firstPosition: vec3f,
  firstDirection: vec3f,
  firstInwardNormal: vec3f,
) -> ExitPath {
  var position = firstPosition;
  var direction = firstDirection;
  var inwardNormal = firstInwardNormal;

  for (var bounce = 0u; bounce <= 3u; bounce = bounce + 1u) {
    let transmitted = refract(direction, inwardNormal, IOR);
    if (length(transmitted) > 0.00001) {
      return ExitPath(
        position,
        normalize(transmitted),
        direction,
        inwardNormal,
        1u,
      );
    }

    direction = normalize(reflect(direction, inwardNormal));
    let hit = nextSurface(position + direction * SURFACE_EPSILON, direction);
    if (hit.distance >= 10.0) {
      break;
    }
    position = position + direction * (hit.distance + SURFACE_EPSILON);
    inwardNormal = -hit.outwardNormal;
  }

  return ExitPath(position, direction, direction, inwardNormal, 0u);
}

fn traceReflectedExit(
  surfacePosition: vec3f,
  incidentDirection: vec3f,
  inwardNormal: vec3f,
) -> ExitPath {
  let direction = normalize(reflect(incidentDirection, inwardNormal));
  let shifted = surfacePosition + direction * SURFACE_EPSILON;
  let hit = nextSurface(shifted, direction);

  if (hit.distance >= 10.0) {
    return ExitPath(surfacePosition, direction, direction, inwardNormal, 0u);
  }

  return traceExit(
    shifted + direction * hit.distance,
    direction,
    -hit.outwardNormal,
  );
}

fn fresnel(facing: f32) -> f32 {
  let inverse = 1.0 - clamp(facing, 0.0, 1.0);
  return FRESNEL_F0 + (1.0 - FRESNEL_F0) * inverse * inverse * inverse * inverse * inverse;
}

fn environmentUv(directionInput: vec3f) -> vec2f {
  let direction = normalize(directionInput);
  return vec2f(
    atan2(direction.z, direction.x) / 6.283185307179586 + 0.5,
    acos(clamp(direction.y, -1.0, 1.0)) / 3.141592653589793,
  );
}

fn sampleEnvironment(direction: vec3f) -> vec3f {
  let uv = environmentUv(direction);
  let sharp = textureSampleLevel(environmentSharp, environmentSampler, uv, 0.0).rgb;
  let soft = textureSampleLevel(environmentSoft, environmentSampler, uv, 0.0).rgb;
  return mix(sharp, soft, 0.22) * 1.7;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
  let cameraPosition = vec3f(0.36, 0.05, 3.0);
  let view = normalize(cameraPosition - input.worldPosition);
  let incident = -view;
  let inwardNormal = -normalize(input.worldNormal);
  let objectPosition = input.worldPosition - vec3f(params.offsetX, 0.0, 0.0);
  let exit = traceExit(objectPosition, incident, inwardNormal);
  let reflectedExit = traceReflectedExit(
    exit.position,
    exit.incidentDirection,
    exit.inwardNormal,
  );
  let reflectedFacing = clamp(
    -dot(reflectedExit.incidentDirection, reflectedExit.inwardNormal),
    0.0,
    1.0,
  );
  let exitTransmission = select(
    0.0,
    1.0 - fresnel(reflectedFacing),
    reflectedExit.escaped != 0u,
  );
  let reflected = sampleEnvironment(reflectedExit.direction) * 1.35 * exitTransmission;
  let facing = clamp(-dot(exit.incidentDirection, exit.inwardNormal), 0.0, 1.0);
  let weight = select(1.0, fresnel(facing), exit.escaped != 0u);
  return vec4f(reflected * weight, weight);
}
