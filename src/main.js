import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildModel } from "./model.js";
import {
  p,
  SCALE,
  H,
  rooms,
  footprint,
  pointInPolygon,
  totalArea,
} from "./plan.js";
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const icons = {
  cube: '<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z"/><path d="m3 7 9 5 9-5M12 12v10M7.5 4.5l9 5"/>',
  plan: '<path d="M3 3h18v18H3zM3 12h8V3M11 15v6M15 12h6"/>',
  walk: '<circle cx="14" cy="4" r="2"/><path d="m7 21 3-6 2-6 4 4h4M5 11l5-4 5 1M10 15l5 2v5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1"/>',
  moon: '<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>',
  camera:
    '<path d="M3 6h4l2-3h6l2 3h4v14H3z"/><circle cx="12" cy="12.5" r="4"/>',
  expand: '<path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5"/>',
  reset: '<path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  mouse: '<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 2v7"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
};
$$("[data-icon]").forEach(
  (el) =>
    (el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[el.dataset.icon]}</svg>`),
);
const format = (n) =>
  n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
$("#rooms-list").innerHTML = rooms
  .map(
    (r) =>
      `<div class="room-item"><button class="room-row" data-room="${r.id}"><span class="room-color" style="background:${r.color}"></span><span class="room-name">${r.name}</span><span class="room-area">${format(r.area)} m²</span></button><button class="room-light" data-lamp="${r.id}" aria-pressed="false" aria-label="Éclairage : ${r.name}" title="Éclairage : ${r.name}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 15c0-2-3-3-3-7a7 7 0 0 1 14 0c0 4-3 5-3 7v3H8zM9 21h6"/></svg></button></div>`,
  )
  .join("");
$("#map-svg").innerHTML =
  `<polygon class="map-outline" points="${footprint.map((q) => q.join(",")).join(" ")}"/>` +
  rooms
    .map(
      (r) =>
        `<polygon tabindex="0" role="button" aria-label="Voir ${r.name}" data-room="${r.id}" points="${r.poly.map((q) => q.join(",")).join(" ")}" fill="${r.color}"/>`,
    )
    .join("") +
  '<circle class="person" cx="0" cy="0" r="29" visibility="hidden"/>';
const labels = rooms.map((r) => {
  const button = document.createElement("button");
  button.className = "room-label" + (r.area < 4 ? " compact" : "");
  button.innerHTML = `${r.name}<small>${format(r.area)} m²</small>`;
  button.dataset.room = r.id;
  $("#room-labels").append(button);
  return {
    el: button,
    room: r,
    pos: new THREE.Vector3(p(...r.label)[0], 0.12, p(...r.label)[1]),
  };
});
let renderer,
  scene,
  camera,
  ortho,
  controls,
  composer,
  ssao,
  renderPass,
  model,
  dir,
  hemi,
  ambient;
let mode = "overview",
  walking = false,
  lighting = "day",
  lastCut = 1.2,
  flight = null,
  nearestDoor = null;
let dirty = true,
  frames = 0;
const target = new THREE.Vector3(3.75, 0, 5.1),
  keys = new Set(),
  pointer = new THREE.Vector2(),
  raycaster = new THREE.Raycaster();
const viewport = $("#viewer");
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("#toast").classList.remove("show"), 3200);
}
async function init() {
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    $("#loading").innerHTML =
      '<div class="webgl-error"><h2>La 3D n’est pas disponible dans ce navigateur.</h2><p>Activez l’accélération graphique ou ouvrez cette page dans une version récente de Chrome, Safari, Firefox ou Edge.</p><button onclick="location.reload()">Réessayer</button></div>';
    console.error(error);
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setSize(viewport.clientWidth, viewport.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.localClippingEnabled = true;
  $("#canvas-container").append(renderer.domElement);
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#e6e9e0");
  scene.fog = new THREE.Fog("#e6e9e0", 50, 110);
  camera = new THREE.PerspectiveCamera(
    36,
    viewport.clientWidth / viewport.clientHeight,
    0.05,
    180,
  );
  camera.position.copy(overviewPosition());
  camera.lookAt(target);
  ortho = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.05, 100);
  ortho.position.set(target.x, 28, target.z + 0.001);
  ortho.lookAt(target);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.minDistance = 5;
  controls.maxDistance = 90;
  controls.maxPolarAngle = Math.PI * 0.485;
  controls.addEventListener("change", () => {
    dirty = true;
  });
  controls.addEventListener("start", () => (flight = null));
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new RoomEnvironment();
  scene.environment = pmrem.fromScene(env, 0.04).texture;
  scene.environmentIntensity = 0.38;
  env.dispose();
  pmrem.dispose();
  hemi = new THREE.HemisphereLight("#f5f4e9", "#d2c9b2", 1.5);
  scene.add(hemi);
  ambient = new THREE.AmbientLight("#fff0d9", 0.35);
  scene.add(ambient);
  dir = new THREE.DirectionalLight("#fff0d5", 3.0);
  dir.position.set(-5, 17, -10);
  dir.target.position.set(3, 0, 4);
  scene.add(dir, dir.target);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.left = -17;
  dir.shadow.camera.right = 17;
  dir.shadow.camera.top = 15;
  dir.shadow.camera.bottom = -15;
  dir.shadow.camera.near = 0.5;
  dir.shadow.camera.far = 55;
  dir.shadow.bias = -0.0003;
  dir.shadow.normalBias = 0.025;
  dir.shadow.radius = 3;
  const fill = new THREE.DirectionalLight("#dae8f3", 0.65);
  fill.position.set(5, 8, 18);
  scene.add(fill);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 240),
    new THREE.MeshStandardMaterial({ color: "#e1e5d9", roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.255;
  ground.receiveShadow = true;
  scene.add(ground);
  model = buildModel(scene);
  composer = new EffectComposer(renderer);
  renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  ssao = new SSAOPass(
    scene,
    camera,
    viewport.clientWidth,
    viewport.clientHeight,
  );
  ssao.normalMaterial.clippingPlanes = [model.clipPlane];
  ssao.kernelRadius = 0.32;
  ssao.minDistance = 0.002;
  ssao.maxDistance = 0.2;
  ssao.output = SSAOPass.OUTPUT.Default;
  composer.addPass(ssao);
  composer.addPass(new OutputPass());
  attachEvents();
  resize();
  requestAnimationFrame(tick);
  setTimeout(() => {
    $("#loading").style.opacity = 0;
    setTimeout(() => $("#loading").remove(), 750);
  }, 350);
}
function overviewPosition() {
  const aspect = viewport.clientWidth / viewport.clientHeight;
  const offset = new THREE.Vector3(18, 20, 23).sub(target);
  return target.clone().add(offset.multiplyScalar(Math.max(1, 0.9 / aspect)));
}
function activeCamera() {
  return mode === "plan" && !walking ? ortho : camera;
}
function resize() {
  if (!renderer) return;
  const w = viewport.clientWidth,
    h = viewport.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  const vertical = Math.max(13.8, (19 * h) / w);
  ortho.left = (-vertical * w) / h / 2;
  ortho.right = (vertical * w) / h / 2;
  ortho.top = vertical / 2;
  ortho.bottom = -vertical / 2;
  ortho.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer?.setSize(w, h);
  dirty = true;
}
function animateCamera(position, aim, duration = 900) {
  flight = {
    from: camera.position.clone(),
    to: position.clone(),
    fromTarget: controls.target.clone(),
    toTarget: aim.clone(),
    start: performance.now(),
    duration: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 1
      : duration,
  };
  dirty = true;
}
function switchView(next) {
  flight = null;
  if (walking) exitWalk();
  mode = next;
  controls.object = activeCamera();
  controls.enableRotate = mode !== "plan";
  controls.target.copy(target);
  renderPass.camera = activeCamera();
  ssao.camera = activeCamera();
  ssao.enabled = mode !== "plan";
  $$("[data-view]").forEach((b) => {
    b.classList.toggle("selected", b.dataset.view === mode);
    b.setAttribute("aria-pressed", b.dataset.view === mode);
  });
  $$(".room-row").forEach((b) => b.classList.remove("active"));
  $("#view-name").textContent =
    mode === "plan" ? "Le plan habité" : "La maquette";
  $("#view-description").textContent =
    mode === "plan"
      ? "L’agencement du projet, vu du dessus"
      : "Une vue d’ensemble de votre futur intérieur";
  if (mode === "plan") {
    ortho.position.set(target.x, 28, target.z + 0.001);
    ortho.zoom = 1;
    ortho.updateProjectionMatrix();
  } else animateCamera(overviewPosition(), target);
  resize();
  $("#sidebar").classList.remove("open");
  dirty = true;
}
function focusRoom(id) {
  const r = rooms.find((r) => r.id === id);
  if (!r) return;
  if (walking) {
    const [x, z] = p(...r.spawn);
    camera.position.set(x, 1.65, z);
    const [tx, tz] = p(...r.look);
    lookAt(new THREE.Vector3(tx, 1.25, tz));
    return;
  }
  if (mode === "plan") switchView("overview");
  const [x, z] = p(...r.label),
    area = r.area;
  const offset = Math.max(4, Math.sqrt(area) * 1.1);
  const aim = new THREE.Vector3(x, 0.2, z);
  animateCamera(
    new THREE.Vector3(x + offset * 0.65, offset * 1.2, z + offset * 0.9),
    aim,
  );
  $("#view-name").textContent = r.name;
  $("#view-description").textContent =
    `${format(r.area)} m² · ${r.description}`;
  $$(".room-row").forEach((b) =>
    b.classList.toggle("active", b.dataset.room === id),
  );
  $("#sidebar").classList.remove("open");
  dirty = true;
}
function syncLightButtons() {
  $$("[data-lamp]").forEach((b) => {
    const on =
      model.roomLights.find((l) => l.userData.room === b.dataset.lamp)
        ?.intensity > 0;
    b.setAttribute("aria-pressed", on);
    b.classList.toggle("on", on);
  });
}
function setLighting(which) {
  lighting = which;
  const night = which === "evening";
  scene.background.set(night ? "#505c60" : "#e6e9e0");
  scene.fog.color.copy(scene.background);
  dir.color.set(night ? "#f3bc84" : "#fff0d5");
  dir.intensity = night ? 0.35 : 3;
  dir.position.set(night ? -10 : -5, night ? 5 : 17, night ? -7 : -10);
  hemi.intensity = night ? 0.5 : 1.5;
  ambient.intensity = night ? 0.12 : 0.35;
  scene.environmentIntensity = night ? 0.2 : 0.38;
  renderer.toneMappingExposure = night ? 1.1 : 1.12;
  $("#lights").checked = night;
  model.setLights(night);
  syncLightButtons();
  $$("[data-light]").forEach((b) => {
    b.classList.toggle("selected", b.dataset.light === which);
    b.setAttribute("aria-pressed", b.dataset.light === which);
  });
  dirty = true;
}
function setCut(value) {
  lastCut = value;
  model.setCut(value);
  $("#cut-value").textContent = `${format(value)} m`;
  $("#cut").value = value;
  dirty = true;
}
let yaw = 0,
  pitch = 0,
  walkBefore = null,
  drag = null,
  stick = { x: 0, z: 0 };
function lookAt(point) {
  camera.lookAt(point);
  const e = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
  yaw = e.y;
  pitch = e.x;
}
function enterWalk() {
  walkBefore = {
    mode,
    position: camera.position.clone(),
    target: controls.target.clone(),
    cut: lastCut,
    ceiling: $("#ceilings").checked,
    labels: $("#labels").checked,
  };
  flight = null;
  walking = true;
  mode = "walk";
  document.body.classList.add("walking");
  $("#walk-ui").hidden = false;
  controls.enabled = false;
  const [x, z] = p(1070, 1010);
  camera.position.set(x, 1.65, z);
  camera.fov = 65;
  camera.updateProjectionMatrix();
  lookAt(new THREE.Vector3(0.5, 1.45, 2.6));
  model.setCut(H);
  model.ceilingGroup.visible = true;
  renderPass.camera = camera;
  ssao.camera = camera;
  ssao.enabled = true;
  resize();
  toast("Glisse pour regarder, ZQSD ou flèches pour marcher");
  dirty = true;
}
function exitWalk() {
  if (!walking) return;
  walking = false;
  keys.clear();
  stick = { x: 0, z: 0 };
  drag = null;
  document.body.classList.remove("walking");
  $("#walk-ui").hidden = true;
  if (document.pointerLockElement) document.exitPointerLock();
  controls.enabled = true;
  camera.fov = 36;
  camera.updateProjectionMatrix();
  model.ceilingGroup.visible = walkBefore.ceiling;
  setCut(walkBefore.cut);
  mode = walkBefore.mode;
  camera.position.copy(walkBefore.position);
  controls.target.copy(walkBefore.target);
  controls.object = activeCamera();
  controls.enableRotate = mode !== "plan";
  renderPass.camera = activeCamera();
  ssao.camera = activeCamera();
  ssao.enabled = mode !== "plan";
  resize();
  dirty = true;
}
function updateWalking(dt) {
  const forward =
    (keys.has("KeyW") || keys.has("KeyZ") || keys.has("ArrowUp") ? 1 : 0) -
    (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) -
    stick.z;
  const side =
    (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
    (keys.has("KeyA") || keys.has("KeyQ") || keys.has("ArrowLeft") ? 1 : 0) +
    stick.x;
  const length = Math.max(1, Math.hypot(forward, side));
  const speed = (2.2 * dt * (keys.has("ShiftLeft") ? 1.6 : 1)) / length;
  const dx = (-Math.sin(yaw) * forward + Math.cos(yaw) * side) * speed,
    dz = (-Math.cos(yaw) * forward - Math.sin(yaw) * side) * speed;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.04));
  for (let i = 0; i < steps; i++) {
    if (model.canWalk(camera.position.x + dx / steps, camera.position.z))
      camera.position.x += dx / steps;
    if (model.canWalk(camera.position.x, camera.position.z + dz / steps))
      camera.position.z += dz / steps;
  }
  camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, "YXZ"));
  const r = rooms.find((r) =>
    pointInPolygon(camera.position.x, camera.position.z, r.poly),
  );
  $("#current-room").textContent = r?.name || "Passage";
  const dot = $("#map-svg .person");
  dot.setAttribute("visibility", "visible");
  dot.setAttribute("cx", camera.position.x * SCALE + 721);
  dot.setAttribute("cy", camera.position.z * SCALE + 321);
  nearestDoor = null;
  let min = 1.8;
  for (const d of model.doors) {
    const v = d.frame.localToWorld(new THREE.Vector3(d.width / 2, 1.2, 0));
    const dist = Math.hypot(v.x - camera.position.x, v.z - camera.position.z);
    if (dist < min) {
      min = dist;
      nearestDoor = d;
    }
  }
  $("#interact").hidden = !nearestDoor;
  if (nearestDoor)
    $("#interact").innerHTML =
      `${nearestDoor.target > 0.1 ? "Fermer" : "Ouvrir"} la porte <kbd>E</kbd>`;
}
function attachEvents() {
  window.addEventListener("resize", resize);
  new ResizeObserver(resize).observe(viewport);
  $$("[data-view]").forEach((b) =>
    b.addEventListener("click", () => switchView(b.dataset.view)),
  );
  $$("[data-room]").forEach((b) => {
    b.addEventListener("click", () => focusRoom(b.dataset.room));
    if (b.tagName.toLowerCase() === "polygon")
      b.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") focusRoom(b.dataset.room);
      });
  });
  $$("[data-light]").forEach((b) =>
    b.addEventListener("click", () => setLighting(b.dataset.light)),
  );
  $(".brand").addEventListener("click", (e) => {
    e.preventDefault();
    switchView("overview");
  });
  $("#cut").addEventListener("input", (e) => setCut(+e.target.value));
  $("#full-walls").addEventListener("click", () => setCut(H));
  $("#furniture").addEventListener("change", (e) => {
    model.furniture.visible = e.target.checked;
    dirty = true;
  });
  $("#labels").addEventListener("change", () => (dirty = true));
  $("#ceilings").addEventListener("change", (e) => {
    model.ceilingGroup.visible = e.target.checked;
    dirty = true;
  });
  $("#lights").addEventListener("change", (e) => {
    model.setLights(e.target.checked);
    syncLightButtons();
    dirty = true;
  });
  $("#windows").addEventListener("change", (e) => {
    model.setWindows(e.target.checked);
    dirty = true;
  });
  $$("[data-lamp]").forEach((b) =>
    b.addEventListener("click", () => {
      model.toggleRoomLight(b.dataset.lamp);
      syncLightButtons();
      $("#lights").checked = model.roomLights.every((l) => l.intensity > 0);
      dirty = true;
    }),
  );
  $("#walk").addEventListener("click", enterWalk);
  $("#exit-walk").addEventListener("click", exitWalk);
  $("#interact").addEventListener("click", () => {
    if (nearestDoor) model.toggleDoor(nearestDoor);
    dirty = true;
  });
  $("#reset").addEventListener("click", () =>
    switchView(mode === "plan" ? "plan" : "overview"),
  );
  $("#menu-button").addEventListener("click", () =>
    $("#sidebar").classList.toggle("open"),
  );
  $("#map-toggle").addEventListener("click", (e) => {
    const svg = $("#map-svg");
    svg.hidden = !svg.hidden;
    svg.style.display = svg.hidden ? "none" : "block";
    e.currentTarget.textContent = svg.hidden ? "+" : "−";
  });
  for (const [id, factor] of [
    ["#zoom-in", 0.8],
    ["#zoom-out", 1.25],
  ])
    $(id).addEventListener("click", () => {
      if (mode === "plan") {
        ortho.zoom = THREE.MathUtils.clamp(ortho.zoom / factor, 0.5, 3);
        ortho.updateProjectionMatrix();
      } else {
        const delta = camera.position
          .clone()
          .sub(controls.target)
          .multiplyScalar(factor);
        delta.clampLength(controls.minDistance, controls.maxDistance);
        animateCamera(controls.target.clone().add(delta), controls.target, 250);
      }
      dirty = true;
    });
  $("#about-button").addEventListener("click", () => $("#about").showModal());
  $("#close-about").addEventListener("click", () => $("#about").close());
  $("#about").addEventListener("click", (e) => {
    if (e.target === $("#about")) {
      const r = e.target.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        e.target.close();
    }
  });
  $("#fullscreen").addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      toast("Le plein écran n’est pas disponible dans ce navigateur.");
    }
  });
  $("#capture").addEventListener("click", () => {
    composer.render();
    renderer.domElement.toBlob((blob) => {
      if (!blob) {
        toast("La capture n’a pas pu être créée.");
        return;
      }
      const a = document.createElement("a"),
        url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `Aguesseau-projet-${mode}-${lighting}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast("La vue a été enregistrée.");
    }, "image/png");
  });
  let down = null;
  renderer.domElement.addEventListener("pointerdown", (e) => {
    down = { x: e.clientX, y: e.clientY };
    if (walking) {
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      renderer.domElement.setPointerCapture(e.pointerId);
    }
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (walking && drag && drag.id === e.pointerId) {
      yaw -= (e.clientX - drag.x) * 0.003;
      pitch = THREE.MathUtils.clamp(
        pitch - (e.clientY - drag.y) * 0.003,
        -1.4,
        1.4,
      );
      drag.x = e.clientX;
      drag.y = e.clientY;
      dirty = true;
    }
  });
  renderer.domElement.addEventListener("pointerup", (e) => {
    drag = null;
    if (
      !walking &&
      down &&
      Math.hypot(e.clientX - down.x, e.clientY - down.y) < 5
    ) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, activeCamera());
      const hits = raycaster.intersectObjects(model.root.children, true);
      for (const h of hits) {
        if (h.point.y > lastCut) continue;
        if (h.object.userData.window) {
          model.toggleWindow(h.object.userData.window);
          dirty = true;
        }
        if (h.object.userData.door) {
          model.toggleDoor(h.object.userData.door);
          toast(h.object.userData.door.name);
          dirty = true;
        }
        break;
      }
    }
    down = null;
  });
  renderer.domElement.addEventListener("pointercancel", () => (drag = null));
  document.addEventListener("keydown", (e) => {
    if (!walking) return;
    if (e.code === "Escape") {
      exitWalk();
      return;
    }
    if (
      [
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "KeyZ",
        "KeyQ",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "ShiftLeft",
      ].includes(e.code)
    ) {
      e.preventDefault();
      keys.add(e.code);
    }
    if (e.code === "KeyE" && nearestDoor && !e.repeat)
      model.toggleDoor(nearestDoor);
    if (e.code === "KeyL" && !e.repeat) {
      $("#lights").checked = !$("#lights").checked;
      model.setLights($("#lights").checked);
      syncLightButtons();
    }
    dirty = true;
  });
  document.addEventListener("keyup", (e) => keys.delete(e.code));
  window.addEventListener("blur", () => {
    keys.clear();
    drag = null;
    stick = { x: 0, z: 0 };
  });
  document.addEventListener("visibilitychange", () => {
    keys.clear();
  });
  const joy = $("#joystick");
  const changeJoy = (e) => {
    const r = joy.getBoundingClientRect(),
      dx = e.clientX - r.left - r.width / 2,
      dz = e.clientY - r.top - r.height / 2,
      l = Math.max(1, Math.hypot(dx, dz) / 32);
    stick = { x: dx / l / 32, z: dz / l / 32 };
    $("#joystick-knob").style.transform = `translate(${dx / l}px,${dz / l}px)`;
  };
  joy.addEventListener("pointerdown", (e) => {
    joy.setPointerCapture(e.pointerId);
    changeJoy(e);
  });
  joy.addEventListener("pointermove", (e) => {
    if (joy.hasPointerCapture(e.pointerId)) changeJoy(e);
  });
  for (const event of ["pointerup", "pointercancel"])
    joy.addEventListener(event, () => {
      stick = { x: 0, z: 0 };
      $("#joystick-knob").style.transform = "";
    });
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    toast("Le rendu 3D a été interrompu. Recharge la page pour reprendre.");
  });
}
const vec = new THREE.Vector3();
function updateLabels() {
  const w = viewport.clientWidth,
    h = viewport.clientHeight,
    cam = activeCamera();
  for (const l of labels) {
    if (
      walking ||
      !$("#labels").checked ||
      model.ceilingGroup.visible ||
      lastCut > 2.4
    ) {
      l.el.style.display = "none";
      continue;
    }
    vec.copy(l.pos).project(cam);
    const show =
      vec.z < 1 &&
      vec.z > -1 &&
      Math.abs(vec.x) < 0.98 &&
      Math.abs(vec.y) < 0.97;
    l.el.style.display = show ? "block" : "none";
    l.el.style.left = `${((vec.x + 1) * w) / 2}px`;
    l.el.style.top = `${((-vec.y + 1) * h) / 2}px`;
  }
  if (!walking) $("#map-svg .person").setAttribute("visibility", "hidden");
}
let lastTime = performance.now();
function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  frames++;
  if (document.hidden) return;
  if (flight && !walking) {
    const raw = Math.min(1, (now - flight.start) / flight.duration),
      t = raw * raw * (3 - 2 * raw);
    camera.position.lerpVectors(flight.from, flight.to, t);
    controls.target.lerpVectors(flight.fromTarget, flight.toTarget, t);
    if (raw === 1) flight = null;
    dirty = true;
  }
  if (walking) {
    updateWalking(dt);
    dirty = true;
  } else controls.update();
  if (model.updateDoors(dt)) dirty = true;
  if (dirty || frames < 5) {
    updateLabels();
    composer.render();
    dirty = false;
  }
}
init().catch((error) => {
  console.error(error);
  const loader = $("#loading");
  if (loader)
    loader.innerHTML =
      '<div class="webgl-error"><h2>La maquette n’a pas pu se charger.</h2><p>Rechargez la page pour réessayer.</p><button onclick="location.reload()">Recharger</button></div>';
});
