struct Params {
  resolution: vec2f,
  time: f32,
  mode: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

fn panelAspect() -> f32 {
  return params.resolution.x / max(params.resolution.y, 1.0);
}

fn segmentDistance(point: vec2f, start: vec2f, end: vec2f) -> f32 {
  let segment = end - start;
  let denominator = max(dot(segment, segment), 0.000001);
  let projection = clamp(dot(point - start, segment) / denominator, 0.0, 1.0);
  return length(point - start - segment * projection);
}

fn obstacleContribution(
  point: vec2f,
  center: vec2f,
  radius: f32,
) -> f32 {
  let offset = point - center;
  let radiusSquared = radius * radius;
  let distanceSquared = max(dot(offset, offset), radiusSquared * 0.82);
  return radiusSquared * offset.y / distanceSquared;
}

fn circleMark(
  point: vec2f,
  center: vec2f,
  radius: f32,
  pixel: f32,
) -> f32 {
  let distance = length(point - center);
  let ring = 1.0 - smoothstep(
    pixel * 0.7,
    pixel * 1.45,
    abs(distance - radius),
  );
  let left = 1.0 - smoothstep(
    pixel * 1.7,
    pixel * 3.0,
    length(point - center + vec2f(radius, 0.0)),
  );
  let right = 1.0 - smoothstep(
    pixel * 1.7,
    pixel * 3.0,
    length(point - center - vec2f(radius, 0.0)),
  );
  return ring * 0.72 + left + right;
}

fn windColor(uv: vec2f, localY: f32) -> vec3f {
  let aspect = panelAspect();
  let point = vec2f(uv.x * aspect, localY);
  let firstCenter = vec2f(0.27 * aspect, 0.2);
  let secondCenter = vec2f(0.47 * aspect, 0.46);
  let thirdCenter = vec2f(0.68 * aspect, 0.7);
  let fourthCenter = vec2f(0.17 * aspect, 0.8);
  let firstRadius = 0.07;
  let secondRadius = 0.105;
  let thirdRadius = 0.065;
  let fourthRadius = 0.075;
  let stream =
    point.y -
    obstacleContribution(point, firstCenter, firstRadius) * 0.82 -
    obstacleContribution(point, secondCenter, secondRadius) * 0.88 -
    obstacleContribution(point, thirdCenter, thirdRadius) * 0.78 -
    obstacleContribution(point, fourthCenter, fourthRadius) * 0.72;
  let laneCount = 7.0;
  let laneCoordinate = stream * laneCount;
  let band = abs(fract(laneCoordinate) - 0.5);
  let lane = floor(laneCoordinate);
  let packet = pow(
    0.5 + 0.5 * sin(uv.x * 40.0 - params.time * 2.1 + lane * 1.37),
    12.0,
  );
  let pixel = 1.0 / max(params.resolution.y, 1.0);
  let bandPixel = pixel * laneCount;
  let lineHalfWidth = bandPixel * 2.25;
  let antiAlias = bandPixel * 0.75;
  let line = 1.0 - smoothstep(
    lineHalfWidth - antiAlias,
    lineHalfWidth + antiAlias,
    band,
  );
  let span =
    smoothstep(0.04, 0.055, uv.x) *
    (1.0 - smoothstep(0.94, 0.955, uv.x));
  let firstDistance = length(point - firstCenter);
  let secondDistance = length(point - secondCenter);
  let thirdDistance = length(point - thirdCenter);
  let fourthDistance = length(point - fourthCenter);
  let outside =
    smoothstep(firstRadius * 0.94, firstRadius * 1.08, firstDistance) *
    smoothstep(secondRadius * 0.94, secondRadius * 1.08, secondDistance) *
    smoothstep(thirdRadius * 0.94, thirdRadius * 1.08, thirdDistance) *
    smoothstep(fourthRadius * 0.94, fourthRadius * 1.08, fourthDistance);
  let marks =
    circleMark(point, firstCenter, firstRadius, pixel) +
    circleMark(point, secondCenter, secondRadius, pixel) +
    circleMark(point, thirdCenter, thirdRadius, pixel) +
    circleMark(point, fourthCenter, fourthRadius, pixel);
  let lineEnergy = line * span * outside;
  let background = vec3f(0.018, 0.021, 0.026);
  let graphite = vec3f(0.34, 0.37, 0.43);
  let silver = vec3f(0.72, 0.78, 0.86);
  var color = background + graphite * lineEnergy * (0.68 + packet * 0.08);
  color = color + silver * lineEnergy * packet * 0.14;
  color = color + graphite * marks * 0.62;
  return color;
}

fn environmentColor(uv: vec2f, localY: f32) -> vec3f {
  let aspect = panelAspect();
  let point = vec2f(uv.x * aspect, localY);
  let pixel = 1.0 / max(params.resolution.y, 1.0);
  let origin = vec2f(0.04 * aspect, 0.96);
  let top = 0.04;
  let bottom = 0.96;
  var frames = 0.0;
  var highlights = 0.0;

  for (var index = 0; index < 5; index = index + 1) {
    let progress = fract(params.time * 0.075 + f32(index) / 5.0);
    let deceleratedProgress = progress * (1.88 - 0.88 * progress);
    let position = mix(0.04, 0.94, deceleratedProgress);
    let targetX = position * aspect;
    let life = 1.0 - smoothstep(0.78, 1.0, progress);
    let vertical = segmentDistance(
      point,
      vec2f(targetX, top),
      vec2f(targetX, bottom),
    );
    let diagonal = segmentDistance(
      point,
      origin,
      vec2f(targetX, top),
    );
    let distance = min(vertical, diagonal);
    let line = 1.0 - smoothstep(
      pixel * 0.62,
      pixel * 1.32,
      distance,
    );
    frames = frames + line * life;
    highlights = highlights + line * life *
      pow(0.5 + 0.5 * sin(progress * 6.2831853), 8.0);
  }

  let topRail = segmentDistance(
    point,
    vec2f(0.04 * aspect, top),
    vec2f(0.94 * aspect, top),
  );
  let bottomRail = segmentDistance(
    point,
    origin,
    vec2f(0.94 * aspect, bottom),
  );
  let leftRail = segmentDistance(
    point,
    vec2f(0.04 * aspect, top),
    origin,
  );
  let borderDistance = min(topRail, min(bottomRail, leftRail));
  let border = 1.0 - smoothstep(
    pixel * 0.72,
    pixel * 1.5,
    borderDistance,
  );
  let background = vec3f(0.018, 0.021, 0.026);
  let graphite = vec3f(0.31, 0.34, 0.4);
  let silver = vec3f(0.68, 0.73, 0.82);
  return background + graphite * (frames * 0.72 + border * 0.78) +
    silver * highlights * 0.16;
}

fn ringNormal(time: f32, phase: f32, pitchScale: f32) -> vec3f {
  let yaw = time + phase;
  let pitch = sin(time * 0.73 + phase * 1.41) * pitchScale;
  return normalize(vec3f(
    sin(yaw) * cos(pitch),
    sin(pitch),
    cos(yaw) * cos(pitch),
  ));
}

fn ringMetric(point: vec2f, radius: f32, normal: vec3f) -> vec3f {
  let minorAxis = normalize(normal.xy + vec2f(0.000001, 0.0));
  let majorAxis = vec2f(-minorAxis.y, minorAxis.x);
  let minorRatio = max(abs(normal.z), 0.09);
  let minorRadius = radius * minorRatio;
  let normalized = vec2f(
    dot(point, minorAxis) / minorRadius,
    dot(point, majorAxis) / radius,
  );
  let radialLength = max(length(normalized), 0.0001);
  let gradient = length(vec2f(
    normalized.x / (minorRadius * radialLength),
    normalized.y / (radius * radialLength),
  ));
  let distance = abs(radialLength - 1.0) / max(gradient, 0.0001);
  let depthRange = sqrt(max(1.0 - normal.z * normal.z, 0.0));
  let phase = atan2(normalized.y, normalized.x);
  let depth = 0.5 + 0.5 * cos(phase) * depthRange;
  return vec3f(distance, depth, phase);
}

fn thinLine(distance: f32, pixel: f32) -> f32 {
  return 1.0 - smoothstep(pixel * 0.45, pixel * 1.45, distance);
}

fn poseColor(uv: vec2f, localY: f32) -> vec3f {
  let aspect = panelAspect();
  let pixel = 1.0 / max(params.resolution.y, 1.0);
  let point = vec2f(uv.x * aspect, localY);
  let center = vec2f(0.57 * aspect, 0.5);
  let orbitPoint = point - center;
  let outerFirst = ringMetric(
    orbitPoint,
    0.54,
    ringNormal(params.time * 0.38, 0.2, 0.82),
  );
  let outerSecond = ringMetric(
    orbitPoint,
    0.39,
    ringNormal(params.time * -0.31, 2.1, 1.02),
  );
  let innerFirst = ringMetric(
    orbitPoint,
    0.24,
    ringNormal(params.time * -0.72, 1.4, 1.08),
  );
  let outerFirstDash = smoothstep(
    -0.9,
    -0.82,
    sin(outerFirst.z * 30.0 - params.time * 0.56),
  );
  let innerDash = smoothstep(
    -0.9,
    -0.82,
    sin(innerFirst.z * 14.0 + params.time * 0.48),
  );
  let outerRings =
    thinLine(outerFirst.x, pixel * 0.675) *
      (0.42 + outerFirst.y * 0.58) * outerFirstDash +
    thinLine(outerSecond.x, pixel * 1.35) *
      (0.42 + outerSecond.y * 0.58);
  let innerRings = thinLine(innerFirst.x, pixel * 0.75) *
    (0.48 + innerFirst.y * 0.52) * innerDash;
  let background = vec3f(0.018, 0.021, 0.026);
  let orbit = vec3f(0.55, 0.59, 0.67);
  let inner = vec3f(0.72, 0.77, 0.86);
  return background + orbit * outerRings * 0.72 + inner * innerRings * 0.82;
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  if (params.mode == 0.0) {
    return vec4f(windColor(uv, uv.y), 1.0);
  }
  if (params.mode == 1.0) {
    return vec4f(environmentColor(uv, uv.y), 1.0);
  }
  if (params.mode == 2.0) {
    return vec4f(poseColor(uv, uv.y), 1.0);
  }
  return vec4f(0.018, 0.021, 0.026, 1.0);
}
