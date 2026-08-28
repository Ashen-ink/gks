struct Params {
  aspect: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) intensity: f32,
  @location(1) profile: f32,
  @location(2) travel: f32,
  @location(3) section: f32,
}

const QUAD_UPPER = array<u32, 6>(0u, 1u, 1u, 0u, 1u, 0u);
const QUAD_END = array<f32, 6>(0.0, 0.0, 1.0, 0.0, 1.0, 1.0);

@vertex
fn vs_main(
  @builtin(vertex_index) vertexIndex: u32,
  @location(0) position: vec2f,
  @location(3) rawIntensity: f32,
) -> VertexOutput {
  let corner = vertexIndex % 6u;
  let section = vertexIndex / 6u;
  let scale = 1.0 / max(params.aspect, 1.0);
  var projectedX = 0.36 + (position.x - 0.36) * scale;
  if (section == 0u && QUAD_END[corner] == 0.0) {
    projectedX = -1.15;
  }
  var output: VertexOutput;
  output.position = vec4f(
    projectedX,
    position.y,
    0.0,
    1.0,
  );
  output.intensity = max(rawIntensity, 0.0);
  output.profile = -1.0 + 2.0 * f32(QUAD_UPPER[corner]);
  output.travel = QUAD_END[corner];
  output.section = f32(section);
  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
  let radius = abs(input.profile);

  let flareSection =
    input.section == 1.0 ||
    input.section == 3.0;

  if (flareSection) {
    let local = vec2f(input.travel * 2.0 - 1.0, input.profile);
    let distanceSquared = dot(local, local);
    let flare = exp(-3.6 * distanceSquared) *
      (1.0 - smoothstep(0.62, 1.3, sqrt(distanceSquared)));
    let tint = select(
      vec3f(0.72, 0.9, 1.0),
      vec3f(0.9, 0.97, 1.0),
      input.section == 1.0,
    );
    return vec4f(tint * input.intensity * flare * 0.72, 0.0);
  }

  let core = exp(-180.0 * radius * radius);
  let halo = exp(-4.0 * radius * radius) * 0.045;
  let radial = (core + halo) *
    (1.0 - smoothstep(0.72, 1.0, radius));
  let outgoing = input.section == 4.0;
  let longitudinal = select(
    1.0,
    1.0 / pow(1.0 + 1.5 * input.travel, 2.2),
    outgoing,
  );
  let internal = input.section == 2.0;
  let tint = select(
    vec3f(1.0),
    vec3f(0.76, 0.92, 1.0),
    internal || outgoing,
  );
  let gain = select(1.0, 1.28, internal);
  return vec4f(
    tint * input.intensity * radial * longitudinal * gain,
    0.0,
  );
}
