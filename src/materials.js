import * as THREE from "three";
let seed = 719;
function rand() {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 4294967296;
}
function canvas(size = 512) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return [c, c.getContext("2d")];
}
function texture(c, repeat = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function woodTexture() {
  const [c, x] = canvas(1024);
  x.fillStyle = "#c1a078";
  x.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 6000; i++) {
    const xx = rand() * 1024,
      yy = rand() * 1024;
    x.strokeStyle = `rgba(${rand() > 0.5 ? "77,50,29" : "230,209,166"},${rand() * 0.13})`;
    x.lineWidth = 0.3 + rand() * 1.5;
    x.beginPath();
    x.moveTo(xx, yy);
    x.bezierCurveTo(
      xx + rand() * 300,
      yy + rand() * 8,
      xx + rand() * 600,
      yy - rand() * 8,
      xx + 450 + rand() * 600,
      yy + rand() * 4,
    );
    x.stroke();
  }
  return texture(c);
}
function parquetTexture() {
  const [c, x] = canvas(1024);
  x.fillStyle = "#ac8c65";
  x.fillRect(0, 0, 1024, 1024);
  for (let col = -1; col < 5; col++)
    for (let row = -6; row < 33; row++) {
      const bx = col * 256,
        by = row * 48;
      for (let side = 0; side < 2; side++) {
        const points = side
          ? [
              [bx + 128, by + 128],
              [bx + 256, by],
              [bx + 256, by + 47],
              [bx + 128, by + 175],
            ]
          : [
              [bx, by],
              [bx + 128, by + 128],
              [bx + 128, by + 175],
              [bx, by + 47],
            ];
        x.save();
        x.beginPath();
        points.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
        x.closePath();
        const l = 63 + rand() * 12;
        x.fillStyle = `hsl(${31 + rand() * 4},${25 + rand() * 11}%,${l}%)`;
        x.fill();
        x.clip();
        for (let g = 0; g < 35; g++) {
          const y = by + rand() * 48;
          x.strokeStyle = `rgba(${rand() > 0.5 ? "82,52,27" : "250,237,207"},${0.04 + rand() * 0.18})`;
          x.lineWidth = 0.3 + rand() * 0.9;
          x.beginPath();
          x.moveTo(side ? bx + 256 : bx, y);
          x.bezierCurveTo(
            bx + 64,
            y + 64,
            bx + 100,
            y + 102,
            bx + 128,
            y + 128,
          );
          x.stroke();
        }
        x.restore();
        x.strokeStyle = "#79644755";
        x.lineWidth = 0.7;
        x.beginPath();
        points.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
        x.closePath();
        x.stroke();
      }
    }
  return texture(c, 0.33);
}
function fabricTexture() {
  const [c, x] = canvas(256);
  x.fillStyle = "#efeee5";
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 22000; i++) {
    const b = 100 + rand() * 130;
    x.fillStyle = `rgba(${b},${b},${b},.13)`;
    x.fillRect(rand() * 256, rand() * 256, 1, 2);
  }
  for (let i = 0; i < 256; i += 2) {
    x.fillStyle = "#958c7414";
    x.fillRect(i, 0, 1, 256);
    x.fillRect(0, i, 256, 1);
  }
  return texture(c, 4);
}
function stoneTexture() {
  const [c, x] = canvas(512);
  x.fillStyle = "#e7e4da";
  x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 18000; i++) {
    x.fillStyle = `rgba(80,75,64,${rand() * 0.075})`;
    x.fillRect(rand() * 512, rand() * 512, rand() * 2, rand() * 2);
  }
  for (let i = 0; i < 8; i++) {
    x.strokeStyle = "#7d847312";
    x.lineWidth = rand() * 2;
    x.beginPath();
    let y = rand() * 512;
    x.moveTo(0, y);
    for (let j = 0; j < 12; j++) {
      y += (rand() - 0.5) * 80;
      x.lineTo(j * 50, y);
    }
    x.stroke();
  }
  return texture(c, 1.2);
}
function tileTexture() {
  const [c, x] = canvas(512);
  x.fillStyle = "#c5cec5";
  x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 8; j++) {
      x.fillStyle = `hsl(${124 + rand() * 10},${7 + rand() * 5}%,${67 + rand() * 9}%)`;
      x.fillRect(i * 64 + 1, j * 64 + 1, 62, 62);
      x.strokeStyle = "#ffffff18";
      x.strokeRect(i * 64 + 3, j * 64 + 3, 58, 58);
    }
  return texture(c, 1.2);
}
const oakMap = woodTexture(),
  parquetMap = parquetTexture(),
  fabricMap = fabricTexture(),
  stoneMap = stoneTexture(),
  tileMap = tileTexture();
export const M = {
  wall: new THREE.MeshStandardMaterial({ color: "#f5f2e9", roughness: 0.92 }),
  trim: new THREE.MeshStandardMaterial({ color: "#faf7ef", roughness: 0.55 }),
  plaster: new THREE.MeshStandardMaterial({
    color: "#e5e4d9",
    roughness: 0.95,
  }),
  oak: new THREE.MeshStandardMaterial({
    map: oakMap,
    roughness: 0.46,
    color: "#e0caa8",
  }),
  darkOak: new THREE.MeshStandardMaterial({
    map: oakMap,
    color: "#8d6b49",
    roughness: 0.6,
  }),
  floor: new THREE.MeshStandardMaterial({
    map: parquetMap,
    roughness: 0.58,
    metalness: 0,
  }),
  stone: new THREE.MeshStandardMaterial({
    map: stoneMap,
    roughness: 0.42,
    color: "#eeeae0",
  }),
  tile: new THREE.MeshStandardMaterial({ map: tileMap, roughness: 0.3 }),
  bathfloor: new THREE.MeshStandardMaterial({
    map: stoneMap,
    roughness: 0.62,
    color: "#c5c8bd",
  }),
  linen: new THREE.MeshStandardMaterial({
    map: fabricMap,
    color: "#e7dfcd",
    roughness: 1,
  }),
  whiteLinen: new THREE.MeshStandardMaterial({
    map: fabricMap,
    color: "#fffaf0",
    roughness: 1,
  }),
  sage: new THREE.MeshStandardMaterial({ color: "#8c9986", roughness: 0.62 }),
  clay: new THREE.MeshStandardMaterial({ color: "#ba7553", roughness: 0.94 }),
  olive: new THREE.MeshStandardMaterial({
    map: fabricMap,
    color: "#72785d",
    roughness: 1,
  }),
  caramel: new THREE.MeshStandardMaterial({
    map: fabricMap,
    color: "#b78155",
    roughness: 1,
  }),
  black: new THREE.MeshStandardMaterial({ color: "#262e2d", roughness: 0.3 }),
  metal: new THREE.MeshStandardMaterial({
    color: "#9c7947",
    metalness: 0.78,
    roughness: 0.28,
  }),
  chrome: new THREE.MeshStandardMaterial({
    color: "#bbc6bd",
    metalness: 0.9,
    roughness: 0.16,
  }),
  ceramic: new THREE.MeshStandardMaterial({
    color: "#faf7f0",
    roughness: 0.18,
  }),
  glass: new THREE.MeshPhysicalMaterial({
    color: "#c5dfd6",
    transparent: true,
    opacity: 0.18,
    roughness: 0.08,
    metalness: 0.06,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
  darkGlass: new THREE.MeshStandardMaterial({
    color: "#192425",
    roughness: 0.12,
    metalness: 0.22,
  }),
  leaf: new THREE.MeshStandardMaterial({
    color: "#52684a",
    roughness: 0.87,
    side: THREE.DoubleSide,
  }),
  leafLight: new THREE.MeshStandardMaterial({
    color: "#7a8a53",
    roughness: 0.9,
    side: THREE.DoubleSide,
  }),
  soil: new THREE.MeshStandardMaterial({ color: "#453a2c", roughness: 1 }),
  rug: new THREE.MeshStandardMaterial({
    map: fabricMap,
    color: "#d2c6ad",
    roughness: 1,
  }),
  glow: new THREE.MeshStandardMaterial({
    color: "#ffefc7",
    emissive: "#ffce7e",
    emissiveIntensity: 0,
    roughness: 0.4,
  }),
};
export function material(color, roughness = 0.6) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}
export function artTexture() {
  const [c, x] = canvas(512);
  x.fillStyle = "#ece6d7";
  x.fillRect(0, 0, 512, 512);
  x.fillStyle = "#b47252";
  x.beginPath();
  x.ellipse(240, 200, 145, 190, -0.3, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = "#c5b398";
  x.fillRect(15, 330, 390, 180);
  x.fillStyle = "#4e6655";
  x.beginPath();
  x.ellipse(380, 410, 135, 190, 0.5, 0, Math.PI * 2);
  x.fill();
  x.strokeStyle = "#eeeece";
  x.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    x.beginPath();
    x.arc(130, 480, 50 + i * 17, Math.PI, Math.PI * 2);
    x.stroke();
  }
  return texture(c);
}
