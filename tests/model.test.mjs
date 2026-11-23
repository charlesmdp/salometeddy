import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  rooms,
  footprint,
  totalArea,
  p,
  pointInPolygon,
  H,
  walls,
  SCALE,
} from "../src/plan.js";
// The model itself does not need a GPU. Textures are not part of these geometry tests.
const ctx = new Proxy({}, { get: () => () => {}, set: () => true });
globalThis.document = {
  createElement: () => ({ width: 0, height: 0, getContext: () => ctx }),
};
const { buildModel } = await import("../src/model.js");
const scene = new THREE.Scene();
const model = buildModel(scene);
scene.updateMatrixWorld(true);
test("All eleven project rooms reproduce the published total area", () => {
  assert.equal(rooms.length, 11);
  assert.ok(Math.abs(totalArea - 101.36) < 1e-8);
  assert.equal(rooms.find((r) => r.id === "sejour").area, 32.77);
  assert.equal(rooms.find((r) => r.id === "salon").area, 13.35);
});
test("Openings fit their host walls without overlapping", () => {
  for (const w of walls) {
    let last = 0;
    const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
    for (const o of w.openings) {
      assert.ok(o.s >= last);
      assert.ok(o.e <= len + 0.1);
      assert.ok(o.top <= H);
      last = o.e;
    }
  }
});
test("All room labels and walk starts are inside their floor polygons", () => {
  for (const r of rooms) {
    for (const position of [r.label, r.spawn]) {
      const [x, z] = p(...position);
      assert.ok(pointInPolygon(x, z, r.poly), r.id);
      assert.ok(pointInPolygon(x, z, footprint), r.id);
    }
  }
});
test("Meshes contain finite vertices and plausible bounds", () => {
  let meshes = 0;
  scene.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    assert.ok(o.matrixWorld.elements.every(Number.isFinite));
    const a = o.geometry.getAttribute("position").array;
    assert.ok(a.every(Number.isFinite), o.name);
  });
  assert.ok(meshes > 100);
  const bounds = new THREE.Box3().setFromObject(model.root);
  assert.ok(bounds.max.x - bounds.min.x < 17);
  assert.ok(bounds.max.z - bounds.min.z < 12);
  assert.ok(bounds.max.y < 3.5);
});
test("Cutting walls preserves the finished top height and restores full height", () => {
  for (const cut of [0.2, 1.2, 2.4, H]) {
    model.setCut(cut);
    for (const { mesh, y0, y1 } of model.wallParts) {
      assert.equal(mesh.visible, y0 < cut);
      if (mesh.visible)
        assert.ok(
          Math.abs(mesh.position.y + mesh.scale.y / 2 - Math.min(y1, cut)) <
            1e-6,
        );
    }
  }
  model.setCut(1.2);
});
test("Wall collisions keep the visitor inside the apartment", () => {
  assert.equal(model.canWalk(-30, 0), false);
  assert.equal(model.canWalk(0, -10), false);
  assert.equal(model.canWalk(...p(707, 600)), false);
  assert.equal(model.canWalk(...p(1100, 900)), true);
});
test("Every room can be reached from the living room with doors open", () => {
  for (const d of model.doors) {
    d.target = Math.PI * 0.48;
    d.angle = d.target;
  }
  model.updateDoors(1);
  scene.updateMatrixWorld(true);
  const step = 0.09,
    minX = -4.4,
    minZ = -0.4,
    maxX = 12,
    maxZ = 10.6,
    nx = Math.ceil((maxX - minX) / step),
    nz = Math.ceil((maxZ - minZ) / step),
    pass = new Uint8Array(nx * nz);
  for (let iz = 0; iz < nz; iz++)
    for (let ix = 0; ix < nx; ix++)
      if (model.canWalk(minX + ix * step, minZ + iz * step))
        pass[iz * nx + ix] = 1;
  const start = p(1070, 1010),
    startI =
      Math.round((start[1] - minZ) / step) * nx +
      Math.round((start[0] - minX) / step),
    visited = new Uint8Array(nx * nz),
    queue = [startI];
  visited[startI] = 1;
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head],
      ix = i % nx;
    for (const j of [
      ix > 0 ? i - 1 : -1,
      ix < nx - 1 ? i + 1 : -1,
      i - nx,
      i + nx,
    ])
      if (j >= 0 && j < pass.length && pass[j] && !visited[j]) {
        visited[j] = 1;
        queue.push(j);
      }
  }
  const unreachable = [];
  for (const room of rooms) {
    const [x, z] = p(...room.spawn);
    let reachable = false;
    for (let dz = -2; dz <= 2; dz++)
      for (let dx = -2; dx <= 2; dx++) {
        const i =
          (Math.round((z - minZ) / step) + dz) * nx +
          Math.round((x - minX) / step) +
          dx;
        if (visited[i]) reachable = true;
      }
    if (!reachable) unreachable.push(room.id);
  }
  assert.deepEqual(
    unreachable,
    [],
    "Unreachable rooms: " + unreachable.join(", "),
  );
});

test("Furniture batches retain all material groups after merging", () => {
  assert.ok(model.furniture.children.length >= 25);
  const verts = model.furniture.children.reduce(
    (n, m) => n + m.geometry.getAttribute("position").count,
    0,
  );
  assert.ok(verts > 100000);
});
