@group(0) @binding(0) var scene: texture_2d<f32>;
@group(0) @binding(1) var linear_sampler: sampler;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let sceneColor = textureSampleLevel(scene, linear_sampler, uv, 0.0).rgb;
  let color = max(sceneColor, vec3f(0.0));
  let mapped = clamp(
    (color * (2.51 * color + vec3f(0.03))) /
      (color * (2.43 * color + vec3f(0.59)) + vec3f(0.14)),
    vec3f(0.0),
    vec3f(1.0),
  );
  let low = mapped * 12.92;
  let high = 1.055 * pow(mapped, vec3f(1.0 / 2.4)) - vec3f(0.055);
  return vec4f(select(high, low, mapped <= vec3f(0.0031308)), 1.0);
}
