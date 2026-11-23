// Small, GPU-independent navigation rules shared by the UI and tests.
export function parseViewHash(hash, roomIds = []) {
  let route;
  try {
    route = decodeURIComponent(hash.replace(/^#/, ""))
      .toLowerCase()
      .replace(/\/$/, "");
  } catch {
    return { mode: "overview", roomId: null };
  }
  const [view, requestedRoom] = route.split("/");
  if (view === "visite") {
    return {
      mode: "walk",
      roomId: roomIds.includes(requestedRoom) ? requestedRoom : null,
    };
  }
  return { mode: view === "plan" ? "plan" : "overview", roomId: null };
}

export function visitUrl(href, roomId = "") {
  const url = new URL(href);
  url.hash = roomId ? `visite/${encodeURIComponent(roomId)}` : "visite";
  return url.href;
}

export function createWalker(x = 0, z = 0) {
  return { x, z, vx: 0, vz: 0, elevation: 0, verticalSpeed: 0, stride: 0 };
}

export function stopWalker(walker) {
  walker.vx = 0;
  walker.vz = 0;
}

export function jumpWalker(walker) {
  if (walker.elevation <= 0) walker.verticalSpeed = 2.4;
}

export function stepWalker(
  walker,
  { forward = 0, side = 0, yaw = 0, sprint = false },
  delta,
  canWalk,
) {
  const dt = Math.min(Math.max(delta, 0), 0.05);
  const length = Math.max(1, Math.hypot(forward, side));
  const speed = sprint ? 3.6 : 2.2;
  const desiredX =
    ((-Math.sin(yaw) * forward + Math.cos(yaw) * side) * speed) / length;
  const desiredZ =
    ((-Math.cos(yaw) * forward - Math.sin(yaw) * side) * speed) / length;
  const smoothing = 1 - Math.exp(-(forward || side ? 16 : 24) * dt);
  walker.vx += (desiredX - walker.vx) * smoothing;
  walker.vz += (desiredZ - walker.vz) * smoothing;
  if (Math.abs(walker.vx) < 0.001) walker.vx = 0;
  if (Math.abs(walker.vz) < 0.001) walker.vz = 0;
  const dx = walker.vx * dt,
    dz = walker.vz * dt;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.035));
  const oldX = walker.x,
    oldZ = walker.z;
  for (let i = 0; i < steps; i++) {
    if (canWalk(walker.x + dx / steps, walker.z)) walker.x += dx / steps;
    else walker.vx = 0;
    if (canWalk(walker.x, walker.z + dz / steps)) walker.z += dz / steps;
    else walker.vz = 0;
  }
  if (walker.elevation > 0 || walker.verticalSpeed > 0) {
    walker.verticalSpeed -= 9.81 * dt;
    walker.elevation = Math.max(
      0,
      walker.elevation + walker.verticalSpeed * dt,
    );
    if (!walker.elevation) walker.verticalSpeed = 0;
  }
  const distance = Math.hypot(walker.x - oldX, walker.z - oldZ);
  walker.stride += distance * 8;
  return distance;
}
