import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { M, material, artTexture } from "./materials.js";
import { p, SCALE } from "./plan.js";
const cubeGeo = new THREE.BoxGeometry(1, 1, 1),
  roundCache = new Map();
export function box(g, x, y, z, w, h, d, mat = M.wall, r = 0) {
  let geo = cubeGeo;
  if (r) {
    const key = [w, h, d, r].join("/");
    if (!roundCache.has(key))
      roundCache.set(
        key,
        new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)),
      );
    geo = roundCache.get(key);
  }
  const m = new THREE.Mesh(geo, mat);
  if (!r) m.scale.set(w, h, d);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
  return m;
}
export function cyl(g, x, y, z, r, h, mat = M.oak, r2 = r, segments = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r2, h, segments), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
  return m;
}
export function ball(g, x, y, z, r, mat = M.linen, s = [1, 1, 1]) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat);
  m.position.set(x, y, z);
  m.scale.set(...s);
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
  return m;
}
function group(g, x, y, z, rot = 0) {
  const o = new THREE.Group();
  o.position.set(x, y, z);
  o.rotation.y = rot;
  g.add(o);
  return o;
}
function stem(g, a, b, r, mat = M.metal) {
  const av = new THREE.Vector3(...a),
    bv = new THREE.Vector3(...b),
    m = cyl(
      g,
      ...av.clone().add(bv).multiplyScalar(0.5).toArray(),
      r,
      av.distanceTo(bv),
      mat,
    );
  m.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    bv.sub(av).normalize(),
  );
  return m;
}
export function plant(g, x, z, height = 1.5, base = 0) {
  const o = group(g, x, base, z);
  cyl(o, 0, 0.21, 0, 0.22, 0.42, M.stone, 0.16);
  cyl(o, 0, 0.405, 0, 0.19, 0.015, M.soil);
  stem(o, [0, 0.42, 0], [0.03, height * 0.9, 0], 0.025, M.darkOak);
  for (let i = 0; i < 20; i++) {
    const a = i * 2.399,
      y = 0.45 + (i / 20) * (height - 0.4),
      r = 0.15 + 0.16 * Math.sin(i);
    const xx = Math.cos(a) * r,
      zz = Math.sin(a) * r;
    stem(o, [0, y - 0.12, 0], [xx, y, zz], 0.006, M.darkOak);
    const leaf = ball(
      o,
      xx,
      y,
      zz,
      0.13,
      i % 3 ? M.leaf : M.leafLight,
      [0.4, 1.5, 0.8],
    );
    leaf.rotation.set(0.5, a, 0.8);
  }
  return o;
}
function book(g, x, y, z, w = 0.15, h = 0.25, d = 0.035, color = "#c5a080") {
  return box(g, x, y, z, w, h, d, material(color), 0.004);
}
function vase(g, x, y, z, size = 0.18) {
  cyl(g, x, y + size * 0.5, z, size * 0.35, size, M.ceramic, size * 0.48);
  cyl(g, x, y + size * 1.1, z, size * 0.16, size * 0.25, M.ceramic);
  for (let i = 0; i < 4; i++) {
    stem(
      g,
      [x, y + size, z],
      [x + (i - 1.5) * 0.06, y + size * 3.3, z + i * 0.025],
      0.004,
      M.darkOak,
    );
    ball(
      g,
      x + (i - 1.5) * 0.06,
      y + size * 2.8,
      z + i * 0.025,
      0.07,
      M.olive,
      [0.35, 2, 0.5],
    );
  }
}
function art(g, x, y, z, w = 1, h = 1.4, rot = 0) {
  const o = group(g, x, y, z, rot);
  box(o, 0, 0, 0, w, h, 0.04, M.darkOak);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w - 0.05, h - 0.05),
    new THREE.MeshStandardMaterial({ map: artTexture(), roughness: 0.8 }),
  );
  m.position.z = 0.025;
  o.add(m);
  return o;
}
function rug(g, x, z, w, d, mat = M.rug) {
  box(g, x, 0.02, z, w, 0.025, d, mat, 0.025);
  for (let side of [-1, 1])
    for (let i = 0; i < Math.floor(w / 0.035); i++)
      box(
        g,
        x - w / 2 + i * 0.035,
        0.02,
        z + side * (d / 2 + 0.025),
        0.012,
        0.008,
        0.06,
        mat,
      );
}
function chair(g, x, z, rot = 0) {
  const o = group(g, x, 0, z, rot);
  for (let a of [-0.19, 0.19])
    for (let b of [-0.17, 0.17])
      box(o, a, 0.23, b, 0.035, 0.45, 0.035, M.darkOak, 0.008);
  box(o, 0, 0.46, 0, 0.48, 0.08, 0.46, M.linen, 0.06);
  box(o, 0, 0.72, -0.19, 0.48, 0.37, 0.055, M.oak, 0.035).name = "chair-back";
  box(o, 0, 0.72, -0.151, 0.4, 0.28, 0.03, M.linen, 0.035);
  return o;
}
function dining(g, x, z) {
  const o = group(g, x, 0, z);
  box(o, 0, 0.77, 0, 1, 0.07, 2.4, M.oak, 0.08).name = "dining-table-top";
  for (const xx of [-0.32, 0.32])
    for (const zz of [-0.86, 0.86])
      box(o, xx, 0.365, zz, 0.065, 0.73, 0.07, M.darkOak, 0.01);
  for (const zz of [-0.85, -0.28, 0.29, 0.86]) {
    chair(o, -0.76, zz, Math.PI / 2).name = `dining-chair-west-${zz}`;
    chair(o, 0.76, zz, -Math.PI / 2).name = `dining-chair-east-${zz}`;
  }
  cyl(o, 0, 0.83, 0, 0.22, 0.045, M.ceramic, 0.17);
  for (let i = 0; i < 5; i++)
    ball(
      o,
      Math.cos(i * 1.9) * 0.11,
      0.87,
      Math.sin(i * 1.9) * 0.11,
      0.055,
      i % 2 ? M.clay : M.olive,
    );
  vase(o, 0.1, 0.81, -0.65, 0.13);
  for (let zz of [-0.5, 0.5]) {
    cyl(o, 0, 2.5, zz, 0.005, 0.8, M.black);
    cyl(o, 0, 2.03, zz, 0.1, 0.25, M.linen, 0.28);
    cyl(o, 0, 1.9, zz, 0.24, 0.015, M.glow);
  }
}
function sofa(g, x, z) {
  const o = group(g, x, 0, z); // Back faces +X, main length is Z.
  for (let zz of [-1.35, 1.35])
    for (let xx of [-0.35, 0.35]) cyl(o, xx, 0.1, zz, 0.035, 0.2, M.darkOak);
  box(o, 0, 0.29, 0, 0.91, 0.38, 3, M.linen, 0.1);
  box(o, 0.38, 0.66, 0, 0.19, 0.78, 3, M.linen, 0.08);
  for (let i = 0; i < 3; i++) {
    box(o, -0.1, 0.53, -0.98 + i * 0.99, 0.78, 0.23, 0.94, M.whiteLinen, 0.09);
    const cushion = box(o, 0.19, 0.85, -1 + i, 0.16, 0.48, 0.86, M.linen, 0.07);
    cushion.rotation.z = 0.12;
  }
  box(o, -0.31, 0.33, -1.02, 1.48, 0.4, 0.96, M.linen, 0.1);
  box(o, -0.37, 0.55, -1.02, 1.43, 0.2, 0.92, M.whiteLinen, 0.09);
  box(o, -0.06, 0.63, 1.43, 0.85, 0.27, 0.16, M.linen, 0.06);
  box(o, -0.32, 0.74, -1.32, 1.5, 0.17, 0.18, M.linen, 0.06);
  for (let i = 0; i < 3; i++) {
    const q = box(
      o,
      -0.08,
      0.83,
      0.78 - i * 0.8,
      0.15,
      0.42,
      0.42,
      i % 2 ? M.caramel : M.olive,
      0.08,
    );
    q.rotation.set(0.15, 0, 0.25);
  }
}
function bed(g, x, z, w = 1.6, accent = M.olive) {
  const o = group(g, x, 0, z, -Math.PI / 2); // Headboard faces +X in world.
  for (let xx of [-w / 2 + 0.13, w / 2 - 0.13])
    for (let zz of [-0.85, 0.85]) cyl(o, xx, 0.14, zz, 0.04, 0.28, M.darkOak);
  box(o, 0, 0.29, 0, w + 0.1, 0.3, 2.09, M.linen, 0.08);
  box(o, 0, 0.5, 0, w, 0.26, 2, M.whiteLinen, 0.1);
  box(o, 0, 0.65, -0.96, w + 0.2, 1.15, 0.12, accent, 0.08);
  box(o, 0, 0.66, 0.36, w + 0.03, 0.11, 1.24, M.linen, 0.05);
  box(o, 0, 0.72, 0.7, w + 0.06, 0.055, 0.52, accent, 0.02);
  for (const xx of [-w / 4, w / 4]) {
    const pillow = box(
      o,
      xx,
      0.73,
      -0.58,
      w / 2 - 0.1,
      0.17,
      0.46,
      M.whiteLinen,
      0.09,
    );
    pillow.rotation.x = 0.12;
  }
  for (const xx of [-w / 2 - 0.36, w / 2 + 0.36]) {
    box(o, xx, 0.3, -0.72, 0.48, 0.6, 0.42, M.oak, 0.025);
    cyl(o, xx, 0.65, -0.72, 0.1, 0.08, M.metal);
    cyl(o, xx, 0.84, -0.72, 0.015, 0.32, M.metal);
    cyl(o, xx, 1.02, -0.72, 0.14, 0.24, M.linen, 0.19);
  }
  rug(o, 0, 0.35, w + 1, 2.5);
  return o;
}
function wardrobe(g, x, z, w, d = 0.6, height = 2.85, rot = 0, color = M.sage) {
  const o = group(g, x, 0, z, rot);
  box(o, 0, height / 2, 0, w, height, d, color, 0.008);
  const count = Math.ceil(w / 0.6);
  for (let i = 0; i < count; i++) {
    const xx = -w / 2 + ((i + 0.5) * w) / count;
    box(
      o,
      xx,
      height / 2,
      d / 2 + 0.008,
      w / count - 0.014,
      height - 0.08,
      0.024,
      color,
      0.008,
    );
    box(
      o,
      xx + w / count / 2 - 0.06,
      1.05,
      d / 2 + 0.034,
      0.014,
      0.34,
      0.018,
      M.metal,
      0.004,
    );
  }
  box(o, 0, 0.04, d / 2 - 0.045, w, 0.08, 0.07, M.darkOak);
  return o;
}
function faucet(g, x, y, z, rot = 0) {
  const o = group(g, x, y, z, rot);
  stem(o, [0, 0, 0], [0, 0.27, 0], 0.012, M.metal);
  stem(o, [0, 0.27, 0], [0, 0.27, 0.16], 0.012, M.metal);
  stem(o, [0, 0.27, 0.16], [0, 0.23, 0.16], 0.013, M.metal);
  box(o, 0.045, 0.1, 0, 0.08, 0.016, 0.025, M.metal, 0.004);
}
function basin(g, x, z, w = 0.8, rot = 0) {
  const o = group(g, x, 0, z, rot);
  box(o, 0, 0.53, 0, w, 0.52, 0.45, M.oak, 0.025);
  box(o, 0, 0.81, 0, w + 0.03, 0.035, 0.46, M.stone, 0.015);
  for (let xx of w > 1 ? [-0.34, 0.34] : [0]) {
    const bowl = cyl(o, xx, 0.85, 0, 0.17, 0.1, M.ceramic, 0.14);
    bowl.scale.x = 1.15;
    cyl(o, xx, 0.901, 0, 0.13, 0.004, M.stone);
    cyl(o, xx, 0.904, 0, 0.018, 0.005, M.chrome);
    faucet(o, xx, 0.83, -0.17);
    const mirror = new THREE.Mesh(
      new THREE.CircleGeometry(0.27, 40),
      new THREE.MeshStandardMaterial({
        color: "#d3ddd4",
        metalness: 0.98,
        roughness: 0.08,
      }),
    );
    mirror.position.set(xx, 1.57, -0.24);
    o.add(mirror);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.278, 0.012, 8, 40),
      M.metal,
    );
    ring.position.copy(mirror.position);
    o.add(ring);
    box(o, xx, 2.02, -0.16, 0.36, 0.035, 0.06, M.glow, 0.01);
  }
  box(o, 0, 0.53, 0.233, w - 0.03, 0.02, 0.015, M.darkOak);
  return o;
}
function shower(g, x, z, w = 0.8, d = 1.2) {
  const o = group(g, x, 0, z);
  box(o, 0, 0.035, 0, w, 0.07, d, M.ceramic, 0.03);
  box(o, 0, 0.073, 0, w - 0.07, 0.006, d - 0.07, M.stone, 0.02);
  box(o, -w / 2, 1.2, 0, 0.015, 2.4, d, M.tile);
  box(o, w / 2, 1.08, -d * 0.22, 0.012, 2.16, d * 0.55, M.glass);
  box(o, w / 2, 2.16, -d * 0.22, 0.018, 0.018, d * 0.55, M.metal);
  box(o, w / 2, 1.08, -d * 0.49, 0.018, 2.16, 0.018, M.metal);
  box(o, 0, 1.2, -d / 2, w, 2.4, 0.015, M.tile);
  stem(o, [-w / 2 + 0.07, 1.1, 0], [-w / 2 + 0.07, 2.18, 0], 0.016, M.metal);
  stem(o, [-w / 2 + 0.07, 2.18, 0], [-w / 2 + 0.34, 2.18, 0], 0.018, M.metal);
  cyl(o, -w / 2 + 0.34, 2.17, 0, 0.13, 0.025, M.metal);
  box(o, -w / 2 + 0.09, 1.08, 0, 0.06, 0.04, 0.2, M.metal, 0.01);
  box(o, 0, 0.077, d / 2 - 0.13, 0.3, 0.008, 0.025, M.chrome);
  return o;
}
function pendant(g, x, z, y = 2.35, r = 0.24) {
  cyl(g, x, (y + 3.25) / 2, z, 0.006, 3.25 - y, M.black);
  cyl(g, x, y, z, r * 0.5, 0.22, M.linen, r);
  cyl(g, x, y - 0.115, z, r * 0.88, 0.015, M.glow);
}
function kitchen(g) {
  const o = group(g, 0, 0, 0);
  const length = 5.4; // Implantation linéaire à gauche du séjour.
  box(o, 0.31, 1.45, 0.6, 0.6, 2.9, 1.2, M.sage, 0.01);
  for (let z of [0.3, 0.9]) {
    box(o, 0.62, 1.45, z, 0.025, 2.8, 0.58, M.sage, 0.008);
    box(o, 0.65, 1.3, z + 0.2, 0.02, 0.35, 0.014, M.metal, 0.004);
  }
  for (let y of [1.05, 1.73]) {
    box(o, 0.648, y, 0.3, 0.035, 0.46, 0.48, M.darkGlass, 0.012);
    box(o, 0.675, y + 0.13, 0.3, 0.025, 0.025, 0.37, M.chrome);
  }
  const start = 1.2,
    run = length - start;
  box(o, 0.31, 0.45, start + run / 2, 0.6, 0.89, run, M.sage, 0.01);
  box(o, 0.315, 0.925, start + run / 2, 0.65, 0.055, run + 0.02, M.stone, 0.01);
  for (let z = start + 0.3; z < length; z += 0.6) {
    box(o, 0.62, 0.45, z, 0.025, 0.81, 0.58, M.sage, 0.006);
    box(o, 0.645, 0.71, z, 0.02, 0.014, 0.28, M.metal, 0.004);
  }
  box(o, 0.62, 0.055, 3.3, 0.04, 0.1, 4.2, M.darkOak);
  box(o, 0.028, 1.17, 3.22, 0.025, 0.46, 4.0, M.stone);
  box(o, 0.32, 0.963, 2.2, 0.49, 0.013, 0.6, M.darkGlass, 0.01);
  for (let a of [0.19, 0.47])
    for (let b of [2.04, 2.36]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.095, 0.003, 6, 36),
        M.chrome,
      );
      ring.rotation.y = Math.PI / 2;
      ring.rotation.z = Math.PI / 2;
      ring.position.set(a, 0.972, b);
      o.add(ring);
    }
  // Évier encastré, égouttoir et robinet.
  box(o, 0.32, 0.959, 4.53, 0.43, 0.012, 0.72, M.chrome, 0.035);
  box(o, 0.32, 0.968, 4.66, 0.35, 0.015, 0.32, M.darkGlass, 0.035);
  for (let i = 0; i < 9; i++)
    box(o, 0.32, 0.971, 4.22 + i * 0.03, 0.35, 0.005, 0.006, M.stone);
  faucet(o, 0.08, 0.97, 4.57, -Math.PI / 2);
  box(o, 0.24, 2.09, 2.2, 0.48, 0.24, 0.72, M.sage, 0.01);
  box(o, 0.24, 1.95, 2.2, 0.49, 0.025, 0.74, M.metal);
  box(o, 0.12, 2.6, 2.2, 0.2, 0.8, 0.35, M.sage);
  box(o, 0.2, 1.65, 3.65, 0.4, 0.045, 1.6, M.oak, 0.005);
  box(o, 0.2, 2.17, 3.65, 0.4, 0.045, 1.6, M.oak, 0.005);
  for (let i = 0; i < 8; i++) {
    cyl(o, 0.22, 1.75, 3.1 + i * 0.13, 0.048, 0.17, i % 3 ? M.ceramic : M.clay);
    if (i < 4) cyl(o, 0.23, 2.3, 3.15 + i * 0.19, 0.064, 0.2, M.ceramic);
  }
  box(o, 0.32, 1.0, 3.4, 0.33, 0.018, 0.37, M.oak, 0.025);
  cyl(o, 0.35, 1.04, 3.3, 0.06, 0.06, M.ceramic);
  vase(o, 0.27, 0.96, 5.12, 0.12);
  // Buffet bas indiqué sur le mur haut.
  box(o, 3.96, 0.43, 0.23, 2.0, 0.86, 0.43, M.oak, 0.025);
  box(o, 3.96, 0.87, 0.23, 2.03, 0.03, 0.45, M.stone);
  for (let i = 0; i < 4; i++)
    box(o, 3.21 + i * 0.5, 0.43, 0.454, 0.48, 0.76, 0.024, M.oak, 0.005);
  vase(o, 3.43, 0.89, 0.22, 0.18);
  book(o, 4.0, 0.91, 0.22, 0.3, 0.03, 0.22, "#b6b8a1");
  art(o, 4.0, 1.85, 0.018, 1.35, 0.76);
}
export function createFurniture(parent) {
  const g = new THREE.Group();
  parent.add(g);
  g.name = "Mobilier";
  kitchen(g);
  dining(g, ...p(1070, 680));
  const [sx, sz] = p(1645, 615);
  rug(g, ...p(1540, 620), 2.0, 3.2);
  sofa(g, sx, sz);
  const [tx, tz] = p(1515, 630);
  box(g, tx, 0.34, tz, 0.7, 0.055, 1.2, M.stone, 0.1).name = "coffee-table-top";
  cyl(g, tx, 0.16, tz - 0.34, 0.14, 0.32, M.darkOak);
  cyl(g, tx, 0.16, tz + 0.34, 0.14, 0.32, M.darkOak);
  book(g, tx, 0.39, tz, 0.22, 0.03, 0.3, "#b27756");
  vase(g, tx, 0.37, tz - 0.32, 0.12);
  // TV sur cloison du salon, hors baie de la double porte.
  const [tvx, tvz] = p(1385, 402);
  box(g, tvx, 1.6, tvz, 0.045, 0.68, 1.15, M.black, 0.02);
  box(g, tvx + 0.027, 1.6, tvz, 0.006, 0.62, 1.08, M.darkGlass);
  box(g, tvx, 0.32, tvz, 0.25, 0.38, 1.3, M.oak, 0.015);
  const [ax, az] = p(1450, 818);
  const arm = group(g, ax, 0, az, Math.atan2(tx - ax, tz - az));
  arm.name = "salon-armchair";
  box(arm, 0, 0.42, 0, 0.68, 0.25, 0.68, M.olive, 0.13);
  box(arm, 0, 0.74, -0.25, 0.68, 0.65, 0.16, M.olive, 0.1).name = "chair-back";
  for (let xx of [-0.3, 0.3])
    box(arm, xx, 0.58, 0, 0.1, 0.25, 0.64, M.olive, 0.05);
  for (let xx of [-0.25, 0.25])
    for (let zz of [-0.25, 0.25])
      cyl(arm, xx, 0.16, zz, 0.025, 0.32, M.darkOak);
  plant(g, ...p(1670, 840), 1.65);
  pendant(g, ...p(1550, 540), 2.65, 0.36);
  const [ex, ez] = p(455, 861);
  wardrobe(g, ex, ez, 3.79, 0.6, 2.7, 0, M.stone);
  const [dx, dz] = p(450, 1115);
  box(g, dx, 0.76, dz, 1.36, 0.065, 0.7, M.oak, 0.04);
  for (let xx of [-0.59, 0.59])
    for (let zz of [-0.25, 0.25])
      box(g, dx + xx, 0.36, dz + zz, 0.035, 0.72, 0.035, M.black);
  chair(g, dx, dz + 0.57, Math.PI);
  box(g, dx, 0.99, dz - 0.12, 0.5, 0.32, 0.025, M.black, 0.01);
  box(g, dx, 0.795, dz - 0.06, 0.24, 0.02, 0.18, M.black, 0.01);
  book(g, dx + 0.42, 0.81, dz, 0.2, 0.025, 0.26, "#68836f");
  plant(g, ...p(267, 1220), 1.6);
  rug(g, ...p(450, 1070), 2.5, 2.3);
  art(
    g,
    ...[...p(675, 1000)].slice(0, 1),
    1.8,
    p(675, 1000)[1],
    0.85,
    1.15,
    -Math.PI / 2,
  );
  pendant(g, ...p(450, 1055), 2.5, 0.32);
  bed(g, ...p(2030, 1370), 1.6, M.olive);
  const [w1x, w1z] = p(2029, 1123);
  wardrobe(g, w1x, w1z, 2, 0.6, 2.75, 0, M.stone);
  plant(g, ...p(1790, 1515), 1.25);
  art(g, p(2150, 1370)[0], 1.9, p(2150, 1370)[1], 1.1, 0.8, -Math.PI / 2);
  pendant(g, ...p(1860, 1260), 2.6, 0.3);
  bed(g, ...p(1270, 1257), 1.5, M.clay);
  const [c2x, c2z] = p(1130, 1115);
  box(g, c2x, 0.48, c2z, 1.2, 0.96, 0.43, M.oak, 0.02);
  for (let y of [0.2, 0.49, 0.78])
    box(g, c2x, y, c2z + 0.224, 1.14, 0.25, 0.02, M.oak);
  vase(g, c2x + 0.35, 0.99, c2z, 0.14);
  art(g, p(1390, 1250)[0], 1.95, p(1390, 1250)[1], 0.9, 0.72, -Math.PI / 2);
  plant(g, ...p(961, 1390), 1.0);
  pendant(g, ...p(1080, 1250), 2.6, 0.3);
  const [drx, drz] = p(1849, 928);
  wardrobe(g, drx, drz, 2.17, 0.6, 2.75, 0, M.oak);
  const [arx, arz] = p(1697, 1194);
  wardrobe(g, arx, arz, 1.75, 0.4, 2.7, -Math.PI / 2, M.stone);
  shower(g, ...p(1453, 1160), 0.8, 1.2);
  basin(g, ...p(1590, 1205), 0.8, Math.PI);
  shower(g, ...p(1453, 1347), 0.8, 1.62);
  basin(g, ...p(1587, 1274), 1.36, 0);
  // Buanderie : lave-linge et étagères.
  const [lx, lz] = p(762, 1260);
  box(g, lx, 0.43, lz, 0.6, 0.86, 0.6, M.ceramic, 0.015);
  const washer = cyl(g, lx + 0.306, 0.45, lz, 0.2, 0.02, M.chrome);
  washer.rotation.z = Math.PI / 2;
  const glass = cyl(g, lx + 0.32, 0.45, lz, 0.155, 0.025, M.darkGlass);
  glass.rotation.z = Math.PI / 2;
  box(g, lx + 0.31, 0.75, lz, 0.02, 0.1, 0.55, M.stone);
  box(g, lx, 0.91, lz, 0.63, 0.04, 1.03, M.oak);
  for (let y of [1.45, 1.95]) box(g, lx, y, lz, 0.5, 0.04, 0.95, M.oak);
  for (let i = 0; i < 3; i++)
    box(g, lx, 1.54 + i * 0.065, lz, 0.36, 0.06, 0.4, M.whiteLinen, 0.025);
  const [wcx, wcz] = p(805, 1380);
  box(g, wcx, 0.42, wcz - 0.21, 0.44, 0.82, 0.17, M.ceramic, 0.04);
  ball(g, wcx, 0.31, wcz + 0.05, 0.28, M.ceramic, [0.75, 0.8, 1.2]);
  const seat = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.045, 12, 40),
    M.ceramic,
  );
  seat.position.set(wcx, 0.48, wcz + 0.07);
  seat.rotation.x = -Math.PI / 2;
  seat.scale.y = 1.2;
  g.add(seat);
  box(g, wcx, 0.78, wcz - 0.1, 0.18, 0.1, 0.013, M.chrome, 0.008);
  const [hx, hz] = p(894, 1400);
  basin(g, hx, hz, 0.32, -Math.PI / 2);
  return g;
}
