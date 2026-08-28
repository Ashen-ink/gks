struct Params {
  resolution: vec2f,
  aspect: f32,
  offsetX: f32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var backdrop: texture_2d<f32>;
@group(0) @binding(2) var backdropSampler: sampler;
@group(0) @binding(3) var environmentSharp: texture_2d<f32>;
@group(0) @binding(4) var environmentSoft: texture_2d<f32>;
@group(0) @binding(5) var environmentSampler: sampler;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
}

struct SurfaceHit {
  distance: f32,
}

struct InteriorHit {
  position: vec3f,
  distance: f32,
  valid: u32,
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

fn planeExitDistance(origin: vec3f, direction: vec3f, surface: vec4f) -> f32 {
  let denominator = dot(surface.xyz, direction);
  if (denominator <= 0.00001) {
    return NO_HIT;
  }
  let distance = (surface.w - dot(surface.xyz, origin)) / denominator;
  return select(NO_HIT, distance, distance > 0.0001);
}

fn nextSurface(origin: vec3f, direction: vec3f) -> SurfaceHit {
  var nearest = NO_HIT;

  for (var index = 0u; index < 6u; index = index + 1u) {
    let currentPlane = plane(index);
    let distance = planeExitDistance(origin, direction, currentPlane);
    if (distance < nearest) {
      nearest = distance;
    }
  }

  return SurfaceHit(nearest);
}

fn traceInteriorHit(entry: vec3f, direction: vec3f) -> InteriorHit {
  let shifted = entry + direction * SURFACE_EPSILON;
  let hit = nextSurface(shifted, direction);
  let valid = hit.distance < 10.0;
  let distance = select(0.0, hit.distance, valid);
  return InteriorHit(
    shifted + direction * distance,
    distance,
    select(0u, 1u, valid),
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
  return mix(sharp, soft, 0.2) * 1.7;
}

fn projectToUv(point: vec3f) -> vec2f {
  let clip = toClip(point + vec3f(params.offsetX, 0.0, 0.0));
  let ndc = clip.xy / max(clip.w, 0.00001);
  return vec2f(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5);
}

fn sampleBackdrop(uv: vec2f) -> vec3f {
  let halfTexel = 0.5 / max(params.resolution, vec2f(1.0));
  let safeUv = clamp(uv, halfTexel, vec2f(1.0) - halfTexel);
  return textureSampleLevel(backdrop, backdropSampler, safeUv, 0.0).rgb;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
  let normal = normalize(input.worldNormal);
  let cameraPosition = vec3f(0.36, 0.05, 3.0);
  let view = normalize(cameraPosition - input.worldPosition);
  let incident = -view;
  let facing = clamp(dot(view, normal), 0.0, 1.0);
  let reflectedEnvironment = sampleEnvironment(reflect(incident, normal));
  let reflection = fresnel(facing);
  let insideDirection = normalize(refract(incident, normal, 1.0 / IOR));
  let objectPosition = input.worldPosition - vec3f(params.offsetX, 0.0, 0.0);
  let interior = traceInteriorHit(objectPosition, insideDirection);
  let originalUv = input.position.xy / max(params.resolution, vec2f(1.0));
  let refractedUv = select(
    originalUv,
    projectToUv(interior.position),
    interior.valid != 0u,
  );
  let background = sampleBackdrop(refractedUv);
  let transmission = exp(-vec3f(0.22, 0.18, 0.12) * interior.distance);
  let transmitted = select(
    vec3f(0.0),
    background * transmission,
    interior.valid != 0u,
  );
  let reflected = reflectedEnvironment * 1.35;
  let grazing = pow(1.0 - facing, 1.5);
  let luminance = dot(reflectedEnvironment, vec3f(0.2126, 0.7152, 0.0722));
  let panel = smoothstep(0.5, 0.82, luminance);
  let physical = transmitted * (1.0 - reflection) + reflected * reflection;
  let highlightStrength = panel * 0.28 * (0.65 + 0.35 * grazing);
  let highlight = max(reflected * highlightStrength, vec3f(0.0));
  let milky = mix(
    max(physical, vec3f(0.0)),
    vec3f(1.0),
    0.005 + grazing * 0.003,
  );
  return vec4f(milky + highlight, 1.0);
}
