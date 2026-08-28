struct Params {
  texel: vec2f,
  direction: vec2f,
  radius: f32,
}

@group(0) @binding(0) var source: texture_2d<f32>;
@group(0) @binding(1) var source_sampler: sampler;
@group(0) @binding(2) var<uniform> params: Params;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let offset = params.texel * params.direction * max(params.radius, 0.01);
  var color = textureSampleLevel(source, source_sampler, uv, 0.0).rgb * 0.19648255;
  color = color + textureSampleLevel(source, source_sampler, uv + offset * 1.4117647, 0.0).rgb * 0.29690696;
  color = color + textureSampleLevel(source, source_sampler, uv - offset * 1.4117647, 0.0).rgb * 0.29690696;
  color = color + textureSampleLevel(source, source_sampler, uv + offset * 3.2941176, 0.0).rgb * 0.09447040;
  color = color + textureSampleLevel(source, source_sampler, uv - offset * 3.2941176, 0.0).rgb * 0.09447040;
  color = color + textureSampleLevel(source, source_sampler, uv + offset * 5.1764706, 0.0).rgb * 0.01038136;
  color = color + textureSampleLevel(source, source_sampler, uv - offset * 5.1764706, 0.0).rgb * 0.01038136;
  return vec4f(color, 1.0);
}
