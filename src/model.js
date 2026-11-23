import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { M, material } from "./materials.js";
import { box, cyl, createFurniture } from "./furniture.js";
import {
  p,
  SCALE,
  H,
  rooms,
  walls,
  footprint,
  landing,
  pointInPolygon,
} from "./plan.js";
export function buildModel(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const architectural = new THREE.Group(),
    ceilingGroup = new THREE.Group();
  root.add(architectural, ceilingGroup);
  ceilingGroup.visible = false;
  const wallParts = [],
    colliders = [],
    doors = [],
    windows = [],
    roomLights = [],
    lightMeshes = [];
  const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.2);
  const archMat = (m) => {
    const a = m.clone();
    a.clippingPlanes = [clipPlane];
    a.clipShadows = true;
    return a;
  };
  const trim = archMat(M.trim),
    glass = archMat(M.glass),
    brass = archMat(M.metal),
    doorMat = archMat(M.wall);
  const entryWood = archMat(M.oak);
  entryWood.name = "Chêne de la porte d’entrée";
  entryWood.color.set("#bd8958");
  entryWood.roughness = 0.56;
  entryWood.map = M.oak.map.clone();
  entryWood.map.center.set(0.5, 0.5);
  entryWood.map.rotation = Math.PI / 2;
  entryWood.map.needsUpdate = true;
  const entryPanel = entryWood.clone();
  entryPanel.color.set("#a8764b");
  function shapeMesh(poly, y, mat, g = root) {
    const s = new THREE.Shape();
    poly.forEach((q, i) => {
      const [x, z] = p(...q);
      i ? s.lineTo(x, -z) : s.moveTo(x, -z);
    });
    s.closePath();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(s), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    m.receiveShadow = true;
    g.add(m);
    return m;
  }
  const shape = new THREE.Shape();
  footprint.forEach((q, i) => {
    const [x, z] = p(...q);
    i ? shape.lineTo(x, -z) : shape.moveTo(x, -z);
  });
  shape.closePath();
  const slab = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: false }),
    material("#bdbfb3", 0.85),
  );
  slab.rotation.x = -Math.PI / 2;
  slab.position.y = -0.23;
  slab.receiveShadow = true;
  slab.castShadow = true;
  root.add(slab);
  shapeMesh(footprint, 0.002, M.wall);
  const [landingX, landingZ] = p(62.5, 1085);
  box(root, landingX, -0.12, landingZ, 321 / SCALE, 0.22, 332 / SCALE,
    material("#bdbfb3", 0.85)).name = "landing-slab";
  shapeMesh(landing.poly, 0.009, M.stone).name = "landing-floor";
  const landingCeiling = shapeMesh(landing.poly, landing.height,
    material("#eeeae1"), ceilingGroup);
  landingCeiling.material.side = THREE.DoubleSide;
  landingCeiling.name = "landing-ceiling";
  const [matX, matZ] = p(135, 1076.5);
  box(root, matX, 0.022, matZ, 0.62, 0.025, 1.05, M.rug, 0.015)
    .name = "landing-doormat";
  const landingLight = new THREE.PointLight("#ffdfb5", 13, 6, 2);
  landingLight.position.set(landingX, 2.55, landingZ);
  root.add(landingLight);
  cyl(ceilingGroup, landingX, landing.height - 0.05, landingZ, 0.18, 0.07, M.metal);
  cyl(ceilingGroup, landingX, landing.height - 0.095, landingZ, 0.15, 0.03,
    new THREE.MeshStandardMaterial({ color: "#fff0d7", emissive: "#ffda9b", emissiveIntensity: 1.2 }));
  for (const room of rooms) {
    shapeMesh(room.poly, 0.009, room.floor === "tile" ? M.bathfloor : M.floor);
    const ceiling = shapeMesh(room.poly, H, material("#eeeae1"), ceilingGroup);
    ceiling.material.side = THREE.DoubleSide;
    const [lx, lz] = p(...room.label);
    const light = new THREE.PointLight("#ffd7a3", 0, 8, 1.8);
    light.position.set(lx, 2.65, lz);
    light.userData.room = room.id;
    roomLights.push(light);
    root.add(light);
    const disc = cyl(ceilingGroup, lx, H - 0.03, lz, 0.13, 0.04, M.glow);
    lightMeshes.push(disc);
  }
  function wallBlock(w, a, b, y0, y1) {
    if (b - a < 0.005 || y1 - y0 < 0.005) return;
    const [x, z] = p(...w.a),
      [xx, zz] = p(...w.b),
      length = Math.hypot(xx - x, zz - z),
      dx = (xx - x) / length,
      dz = (zz - z) / length;
    const middle = (a + b) / 2;
    const mesh = box(
      architectural,
      x + dx * middle,
      (y0 + y1) / 2,
      z + dz * middle,
      b - a,
      y1 - y0,
      w.t / SCALE,
      M.wall,
    );
    mesh.rotation.y = -Math.atan2(dz, dx);
    wallParts.push({ mesh, y0, y1 });
    if (y0 < 1.5 && y1 > 0.4)
      colliders.push({
        x1: x + dx * a,
        z1: z + dz * a,
        x2: x + dx * b,
        z2: z + dz * b,
        r: w.t / SCALE / 2,
      });
    if (y0 === 0) {
      for (let side of [-1, 1]) {
        const sk = box(
          architectural,
          x + dx * middle - dz * side * (w.t / SCALE / 2 + 0.009),
          0.065,
          z + dz * middle + dx * side * (w.t / SCALE / 2 + 0.009),
          b - a,
          0.13,
          0.018,
          trim,
        );
        sk.rotation.y = mesh.rotation.y;
      }
    }
  }
  function archAt(w, offset, y = 0) {
    const [x, z] = p(...w.a),
      [xx, zz] = p(...w.b),
      angle = Math.atan2(zz - z, xx - x);
    const o = new THREE.Group();
    o.position.set(
      x + Math.cos(angle) * offset,
      y,
      z + Math.sin(angle) * offset,
    );
    o.rotation.y = -angle;
    architectural.add(o);
    return o;
  }
  function doorLeaf(parent, width, height, isGlass, hinge, sign, entry = false) {
    const pivot = new THREE.Group();
    pivot.position.x = hinge;
    parent.add(pivot);
    const center = (sign * width) / 2;
    if (isGlass) {
      box(
        pivot,
        center,
        height / 2,
        0,
        width - 0.04,
        height - 0.05,
        0.025,
        glass,
      );
      for (let x of [sign * 0.025, sign * (width - 0.025)])
        box(pivot, x, height / 2, 0, 0.035, height, 0.04, trim);
      for (let y of [0.04, height / 2, height - 0.04])
        box(pivot, center, y, 0, width, 0.04, 0.04, trim);
    } else {
      box(
        pivot,
        center,
        height / 2,
        0,
        width - 0.025,
        height - 0.025,
        0.04,
        entry ? entryWood : doorMat,
        0.006,
      ).name = entry ? "entry-door-leaf" : "door-leaf";
      if (entry) {
        // Panneaux et veinage visibles aussi bien depuis le palier que de l’intérieur.
        for (const face of [-1, 1])
          for (const col of [0, 1])
            for (const [y, h] of [[0.54, 0.7], [1.65, 1.12]])
              box(pivot, sign * width * (0.25 + col * 0.5), y, face * 0.026,
                width / 2 - 0.15, h, 0.018, entryPanel, 0.008);
        for (const y of [0.3, 1.2, height - 0.3])
          cyl(pivot, sign * 0.025, y, 0, 0.024, 0.13, brass);
      } else for (let y of [0.5, 1.55]) {
        for (let xx of [sign * 0.12, sign * (width - 0.12)])
          box(pivot, xx, y, 0.025, 0.025, y < 1 ? 0.6 : 1.05, 0.015, trim);
        for (let yy of [y - (y < 1 ? 0.3 : 0.525), y + (y < 1 ? 0.3 : 0.525)])
          box(pivot, center, yy, 0.025, width - 0.23, 0.025, 0.015, trim);
      }
    }
    for (let zz of [-0.04, 0.04]) {
      box(
        pivot,
        sign * (width - 0.1),
        1.03,
        zz,
        0.04,
        0.14,
        0.025,
        brass,
        0.004,
      );
      box(
        pivot,
        sign * (width - 0.145),
        1.05,
        zz * 1.5,
        0.11,
        0.018,
        0.018,
        brass,
        0.004,
      );
    }
    return pivot;
  }
  for (const w of walls) {
    const [x, z] = p(...w.a),
      [xx, zz] = p(...w.b);
    const len = Math.hypot(xx - x, zz - z);
    let last = 0;
    for (const o of [...w.openings].sort((a, b) => a.s - b.s)) {
      const a = o.s / SCALE,
        b = o.e / SCALE;
      widthCheck(a, b, len);
      wallBlock(w, last, a, 0, H);
      wallBlock(w, a, b, 0, o.sill);
      wallBlock(w, a, b, o.top, H);
      last = b;
      const width = b - a;
      if (o.type === "gap") continue;
      const frame = archAt(w, a);
      const frameMat = o.entry ? entryWood : trim;
      for (let fx of [0.018, width - 0.018])
        box(
          frame,
          fx,
          (o.sill + o.top) / 2,
          0,
          0.038,
          o.top - o.sill + 0.025,
          w.t / SCALE + 0.04,
          frameMat,
        );
      box(
        frame,
        width / 2,
        o.top,
        0,
        width + 0.03,
        0.045,
        w.t / SCALE + 0.04,
        frameMat,
      );
      if (o.type === "window") {
        box(
          frame,
          width / 2,
          o.sill,
          0,
          width + 0.07,
          0.055,
          w.t / SCALE + 0.09,
          trim,
        );
        const n = Math.max(2, Math.round(width / 0.65)),
          pivots = [];
        for (let j = 0; j < n; j++) {
          const side = j % 2 ? -1 : 1,
            lw = width / n,
            pivot = new THREE.Group();
          pivot.position.x = (j + (side < 0 ? 1 : 0)) * lw;
          frame.add(pivot);
          const wx = (side * lw) / 2;
          box(
            pivot,
            wx,
            (o.sill + o.top) / 2,
            0,
            lw - 0.035,
            o.top - o.sill - 0.08,
            0.018,
            glass,
          );
          for (const fx of [0, side * lw])
            box(
              pivot,
              fx,
              (o.sill + o.top) / 2,
              0,
              0.035,
              o.top - o.sill,
              0.055,
              trim,
            );
          for (const fy of [
            o.sill + 0.025,
            o.top - 0.025,
            o.sill + (o.top - o.sill) * 0.6,
          ])
            box(pivot, wx, fy, 0, lw, 0.032, 0.05, trim);
          box(
            pivot,
            side * (lw - 0.08),
            Math.max(o.sill + 0.25, 1.4),
            0.06,
            0.02,
            0.12,
            0.025,
            brass,
          );
          pivots.push({ pivot, side });
        }
        const window = { pivots, angle: 0, target: 0 };
        pivots.forEach(({ pivot }) =>
          pivot.traverse((obj) => {
            if (obj.isMesh) obj.userData.window = window;
          }),
        );
        windows.push(window);
        // Niche, tringle et rideaux en lin. Extérieur des petits sanitaires laissé libre.
        if (width > 1) {
          box(frame, width / 2, 3.08, 0.18, width + 0.24, 0.1, 0.25, trim);
          const curtainMat = archMat(M.whiteLinen);
          for (let side of [0, 1])
            for (let j = 0; j < 8; j++) {
              const cx = side ? width + 0.015 - j * 0.025 : -0.015 + j * 0.025;
              const c = cyl(frame, cx, 1.5, 0.16, 0.022, 2.98, curtainMat);
              c.scale.z = 0.8;
            }
        }
        // Radiateur discret sous les fenêtres avec allège haute.
        if (o.sill > 0.6 && width > 0.85) {
          for (let j = 0; j < 12; j++)
            box(
              frame,
              width * 0.2 + (j * (width * 0.6)) / 12,
              0.36,
              0.17,
              width * 0.045,
              0.55,
              0.08,
              trim,
              0.015,
            );
        }
      } else {
        const isDouble = o.double;
        const pivots = isDouble
          ? [
              doorLeaf(frame, width / 2, o.top, !!o.glass, 0, 1, !!o.entry),
              doorLeaf(frame, width / 2, o.top, !!o.glass, width, -1, !!o.entry),
            ]
          : [doorLeaf(frame, width, o.top, !!o.glass, 0, 1, !!o.entry)];
        const d = {
          name: o.name || "Porte",
          frame,
          pivots,
          width,
          height: o.top,
          angle: o.initialOpen ? Math.PI * 0.48 : 0,
          target: o.initialOpen ? Math.PI * 0.48 : 0,
          closed: !o.initialOpen,
          entry: !!o.entry,
          openSign: o.openSign || 1,
        };
        pivots.forEach((pv, i) => {
          pv.rotation.y = (i ? -d.angle : d.angle) * d.openSign;
          pv.traverse((obj) => {
            if (obj.isMesh) obj.userData.door = d;
          });
        });
        doors.push(d);
      }
    }
    wallBlock(w, last, len, 0, H);
  }
  // Trois murs ferment le palier. Le quatrième est la façade existante avec sa porte.
  for (const [a, b] of [
    [[-92, 925], [208, 925]],
    [[-92, 1245], [208, 1245]],
    [[-92, 925], [-92, 1245]],
  ]) {
    wallBlock({ a, b, t: 12 }, 0,
      Math.hypot(b[0] - a[0], b[1] - a[1]) / SCALE, 0, landing.height);
  }
  function widthCheck(a, b, len) {
    if (a < -0.001 || b > len + 0.03 || a >= b)
      throw new Error(`Ouverture hors mur: ${a},${b} / ${len}`);
  }
  const furniture = createFurniture(root);
  // Fusion du mobilier statique par matériau : ombres détaillées, peu d'appels GPU.
  furniture.updateMatrixWorld(true);
  const grouped = new Map();
  furniture.traverse((o) => {
    if (!o.isMesh) return;
    const key = o.material.uuid;
    const geo = (
      o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()
    ).applyMatrix4(o.matrixWorld);
    if (!grouped.has(key))
      grouped.set(key, { material: o.material, geometries: [] });
    grouped.get(key).geometries.push(geo);
  });
  furniture.clear();
  for (const { material, geometries } of grouped.values()) {
    const geo = mergeGeometries(geometries, false);
    geometries.forEach((x) => x.dispose());
    if (!geo) throw new Error("Échec de la fusion du mobilier");
    if (geo) {
      const m = new THREE.Mesh(geo, material);
      m.castShadow = true;
      m.receiveShadow = true;
      furniture.add(m);
    }
  }
  function setCut(height) {
    clipPlane.constant = height;
    for (const { mesh, y0, y1 } of wallParts) {
      mesh.visible = y0 < height;
      const hi = Math.min(height, y1);
      if (hi > y0) {
        mesh.scale.y = hi - y0;
        mesh.position.y = (y0 + hi) / 2;
      }
    }
  }
  function setLights(on) {
    for (const l of roomLights)
      l.intensity = on ? (l.userData.room === "sejour" ? 26 : 14) : 0;
    M.glow.emissiveIntensity = on ? 2.5 : 0;
  }
  function updateDoors(dt) {
    let active = false;
    for (const w of windows) {
      if (Math.abs(w.target - w.angle) > 0.002) {
        w.angle = THREE.MathUtils.damp(w.angle, w.target, 8, dt);
        active = true;
      }
      w.pivots.forEach(
        ({ pivot, side }) => (pivot.rotation.y = w.angle * side),
      );
    }
    for (const d of doors) {
      if (Math.abs(d.target - d.angle) > 0.002) {
        d.angle = THREE.MathUtils.damp(d.angle, d.target, 8, dt);
        active = true;
      }
      d.pivots.forEach(
        (pv, i) => (pv.rotation.y = (i ? -d.angle : d.angle) * d.openSign),
      );
    }
    return active;
  }
  function setWindows(open) {
    windows.forEach((w) => (w.target = open ? 1.1 : 0));
  }
  function toggleWindow(w) {
    w.target = w.target > 0.1 ? 0 : 1.1;
  }
  function toggleRoomLight(id) {
    const l = roomLights.find((l) => l.userData.room === id);
    if (l) l.intensity = l.intensity ? 0 : id === "sejour" ? 26 : 14;
    M.glow.emissiveIntensity = roomLights.some((l) => l.intensity > 0)
      ? 2.5
      : 0;
  }
  function toggleDoor(d) {
    d.target = d.target > 0.1 ? 0 : Math.PI * 0.48;
    d.closed = d.target < 0.1;
  }
  function distSegment(x, z, a, b, c, d) {
    const dx = c - a,
      dz = d - b,
      t = THREE.MathUtils.clamp(
        ((x - a) * dx + (z - b) * dz) / (dx * dx + dz * dz),
        0,
        1,
      );
    return Math.hypot(x - a - t * dx, z - b - t * dz);
  }
  const furnitureObstacles = [
    [721, 321, 801, 988],
    [1008, 532, 1132, 828],
    [1564, 398, 1702, 804],
    [1438, 401, 1643, 505],
    [223, 824, 692, 898],
    [366, 1072, 534, 1158],
    [1900, 1265, 2153, 1472],
    [1140, 1158, 1394, 1356],
    [1906, 1086, 2153, 1160],
    [1715, 890, 1983, 964],
    [1671, 1086, 1728, 1311],
  ].map(([a, b, c, d]) => {
    const [x1, z1] = p(a, b),
      [x2, z2] = p(c, d);
    return { x1, z1, x2, z2 };
  });
  function canWalk(x, z) {
    if (furniture.visible)
      for (const b of furnitureObstacles)
        if (
          x > b.x1 - 0.12 &&
          x < b.x2 + 0.12 &&
          z > b.z1 - 0.12 &&
          z < b.z2 + 0.12
        )
          return false;
    if (!pointInPolygon(x, z, footprint) && !pointInPolygon(x, z, landing.poly))
      return false;
    for (const c of colliders)
      if (distSegment(x, z, c.x1, c.z1, c.x2, c.z2) < c.r + 0.14) return false;
    for (const d of doors) {
      for (let i = 0; i < d.pivots.length; i++) {
        const pv = d.pivots[i];
        pv.updateWorldMatrix(true, false);
        const start = pv.localToWorld(new THREE.Vector3()),
          end = pv.localToWorld(
            new THREE.Vector3(((i ? -1 : 1) * d.width) / d.pivots.length, 0, 0),
          );
        if (distSegment(x, z, start.x, start.z, end.x, end.z) < 0.15)
          return false;
      }
    }
    return true;
  }
  setCut(1.2);
  return {
    root,
    furniture,
    ceilingGroup,
    doors,
    roomLights,
    clipPlane,
    setCut,
    setLights,
    setWindows,
    toggleWindow,
    toggleRoomLight,
    updateDoors,
    toggleDoor,
    canWalk,
    wallParts,
    colliders,
  };
}
