// Tracé du PLAN PROJET coté A.3.2, 12/11/2026, Maison SAMA.
// Repère de numérisation du dessin, 123.5 px/m. X vers la droite, Z vers le bas.
// Les surfaces officielles du plan restent indépendantes du tracé approché.
export const SCALE = 123.5;
export const H = 3.28;
export const p = (x, z) => [(x - 721) / SCALE, (z - 321) / SCALE];
export const footprint = [
  [194, 794],
  [692, 794],
  [692, 282],
  [1735, 282],
  [1735, 860],
  [2012, 860],
  [2012, 1057],
  [2183, 1057],
  [2183, 1609],
  [1718, 1609],
  [1718, 1485],
  [752, 1485],
  [692, 1426],
  [692, 1337],
  [194, 1337],
];
// Décor de visite demandé par le client. Hors plan projet et hors surfaces.
export const landing = {
  id: "palier",
  name: "Palier",
  poly: [[-98, 919], [223, 919], [223, 1251], [-98, 1251]],
  label: [55, 1085],
  spawn: [-35, 1076.5],
  look: [300, 1076.5],
  lookHeight: 1.15,
  color: "#b7b9ad",
  description: "Palier fictif ajouté pour la visite",
  height: 2.8,
};
export const rooms = [
  {
    id: "sejour",
    name: "Séjour / cuisine",
    area: 32.77,
    poly: [
      [721, 321],
      [1360, 321],
      [1360, 1057],
      [915, 1057],
      [915, 1183],
      [721, 1183],
    ],
    label: [1090, 920],
    spawn: [1070, 1010],
    look: [780, 650],
    color: "#d1b58e",
    floor: "wood",
    description: "Cuisine ouverte · table 240 × 100 cm",
  },
  {
    id: "salon",
    name: "Salon TV",
    area: 13.35,
    poly: [
      [1370, 321],
      [1706, 321],
      [1706, 925],
      [1370, 925],
    ],
    label: [1540, 830],
    spawn: [1510, 855],
    look: [1640, 510],
    color: "#c6ae97",
    floor: "wood",
    description: "Canapé d’angle 300 × 160 cm",
  },
  {
    id: "entree",
    name: "Entrée / bureau",
    area: 14.75,
    poly: [
      [223, 824],
      [692, 824],
      [692, 1298],
      [223, 1298],
    ],
    label: [445, 1030],
    spawn: [570, 1180],
    look: [450, 900],
    color: "#d8c8ac",
    floor: "wood",
    description: "Bureau · rangement 379 × 60 cm",
  },
  {
    id: "chambre1",
    name: "Chambre 1",
    area: 14.01,
    poly: [
      [1728, 1086],
      [2153, 1086],
      [2153, 1579],
      [1755, 1579],
      [1755, 1447],
      [1728, 1447],
    ],
    label: [1910, 1510],
    spawn: [1835, 1475],
    look: [2040, 1390],
    color: "#bebfaa",
    floor: "wood",
    description: "Suite · salle d’eau et dressing",
  },
  {
    id: "chambre2",
    name: "Chambre 2",
    area: 11.27,
    poly: [
      [924, 1086],
      [1394, 1086],
      [1394, 1447],
      [924, 1447],
    ],
    label: [1120, 1370],
    spawn: [1020, 1360],
    look: [1330, 1255],
    color: "#d2ae97",
    floor: "wood",
    description: "Chambre · deux fenêtres",
  },
  {
    id: "sde1",
    name: "Salle d’eau 1",
    area: 3.96,
    poly: [
      [1404, 1246],
      [1671, 1246],
      [1671, 1311],
      [1728, 1311],
      [1728, 1447],
      [1404, 1447],
    ],
    label: [1615, 1380],
    spawn: [1655, 1405],
    look: [1480, 1280],
    color: "#a9b8ae",
    floor: "tile",
    description: "Douche 162 × 80 · double vasque 136 cm",
  },
  {
    id: "sde2",
    name: "Salle d’eau 2",
    area: 2.59,
    poly: [
      [1404, 1086],
      [1671, 1086],
      [1671, 1234],
      [1404, 1234],
    ],
    label: [1570, 1150],
    spawn: [1610, 1115],
    look: [1440, 1170],
    color: "#b5c4c0",
    floor: "tile",
    description: "Douche 120 × 80 · vasque 80 cm",
  },
  {
    id: "dressing",
    name: "Dressing",
    area: 2.93,
    poly: [
      [1715, 890],
      [1983, 890],
      [1983, 1057],
      [1715, 1057],
    ],
    label: [1850, 1010],
    spawn: [1840, 1010],
    look: [1840, 890],
    color: "#c5baa5",
    floor: "wood",
    description: "Rangement 217 × 60 cm",
  },
  {
    id: "degagement",
    name: "Dégagement",
    area: 2.69,
    poly: [
      [1370, 935],
      [1706, 935],
      [1706, 1057],
      [1370, 1057],
    ],
    label: [1490, 990],
    spawn: [1470, 995],
    look: [1640, 995],
    color: "#d7c9b4",
    floor: "wood",
    description: "Distribution des pièces",
  },
  {
    id: "buanderie",
    name: "Buanderie",
    area: 1.77,
    poly: [
      [721, 1193],
      [915, 1193],
      [915, 1333],
      [721, 1333],
    ],
    label: [815, 1260],
    spawn: [815, 1250],
    look: [755, 1285],
    color: "#b7c3bb",
    floor: "tile",
    description: "Lave-linge · rangement",
  },
  {
    id: "wc",
    name: "WC",
    area: 1.27,
    poly: [
      [721, 1343],
      [915, 1343],
      [915, 1447],
      [765, 1447],
      [721, 1403],
    ],
    label: [835, 1390],
    spawn: [865, 1400],
    look: [800, 1355],
    color: "#c2c7bc",
    floor: "tile",
    description: "WC séparé · lave-mains",
  },
];
export const totalArea = rooms.reduce((sum, r) => sum + r.area, 0);
export const visitLocations = [landing, ...rooms];
// a,b : extrémités d’axes de murs. Ouvertures repérées par distance pixel depuis a.
const W = (a, b, t = 10, openings = []) => ({ a, b, t, openings });
const win = (s, e, sill = 0.78, top = 2.85) => ({
  s,
  e,
  sill,
  top,
  type: "window",
});
const door = (s, e, options = {}) => ({
  s,
  e,
  sill: 0,
  top: 2.45,
  type: "door",
  ...options,
});
const gap = (s, e, top = 3.28) => ({ s, e, sill: 0, top, type: "gap" });
export const walls = [
  W([707, 307], [1720, 307], 29, [win(167, 328), win(676, 837)]),
  W([707, 307], [707, 1320], 29, [gap(683, 856)]),
  W([208, 809], [707, 809], 29),
  W([208, 809], [208, 1320], 29, [
    door(181, 354, { name: "Porte d’entrée", entry: true, initialOpen: false }),
  ]),
  W([208, 1320], [707, 1320], 29, [win(113, 410, 0.12, 2.85)]),
  W([1720, 307], [1720, 1071], 29, [gap(628, 750)]),
  W([1720, 875], [1997, 875], 29),
  W([1997, 875], [1997, 1071], 29),
  W([1720, 1071], [2168, 1071], 29, [
    door(35, 139, {
      name: "Porte du dressing",
      openSign: -1,
      initialOpen: true,
    }),
  ]),
  W([2168, 1071], [2168, 1594], 29),
  W([1735, 1594], [2168, 1594], 29, [win(118, 312, 0.78, 2.85)]),
  W([1735, 1465], [1735, 1594], 29),
  W([754, 1465], [1735, 1465], 29, [
    win(76, 141, 1.45, 2.7),
    win(255, 392),
    win(504, 642),
    win(756, 893, 1.3, 2.7),
  ]),
  W([707, 1320], [707, 1419], 29),
  W([707, 1419], [754, 1465], 29),
  W([1365, 321], [1365, 1057], 9, [
    door(211, 396, {
      name: "Double porte vitrée du salon",
      glass: true,
      double: true,
      openSign: -1,
      initialOpen: true,
    }),
    gap(614, 736),
  ]),
  W([1370, 930], [1706, 930], 8, [
    door(213, 303, { name: "Porte du salon", glass: true, initialOpen: true }),
  ]),
  W([919, 1071], [1720, 1071], 24, [
    door(3, 70, {
      name: "Porte de la chambre 2",
      openSign: -1,
      initialOpen: true,
    }),
    door(622, 724, {
      name: "Porte de la salle d’eau 2",
      openSign: -1,
      initialOpen: true,
    }),
  ]),
  W([919, 1086], [919, 1447], 8),
  W([1399, 1086], [1399, 1447], 8),
  W([1404, 1240], [1676, 1240], 10),
  W([1676, 1086], [1676, 1311], 8),
  W([1676, 1311], [1728, 1311], 8),
  W([1728, 1311], [1728, 1447], 8, [
    door(36, 126, { name: "Porte de la salle d’eau 1", initialOpen: true }),
  ]),
  W([721, 1188], [915, 1188], 8, [
    door(91, 194, {
      name: "Porte de la buanderie",
      openSign: -1,
      initialOpen: true,
    }),
  ]),
  W([721, 1338], [915, 1338], 8, [
    door(94, 194, { name: "Porte des WC", openSign: -1, initialOpen: true }),
  ]),
];
export function pointInPolygon(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = p(...poly[i]),
      b = p(...poly[j]);
    if (
      a[1] > z !== b[1] > z &&
      x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}
