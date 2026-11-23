import test from "node:test";
import assert from "node:assert/strict";
import {
  parseViewHash,
  visitUrl,
  createWalker,
  stopWalker,
  jumpWalker,
  stepWalker,
} from "../src/navigation.js";

test("Direct visit links resolve without the overview and validate room IDs", () => {
  assert.deepEqual(parseViewHash("#visite"), { mode: "walk", roomId: null });
  assert.deepEqual(parseViewHash("#visite/chambre1", ["chambre1"]), {
    mode: "walk",
    roomId: "chambre1",
  });
  assert.deepEqual(parseViewHash("#visite/inconnue", ["chambre1"]), {
    mode: "walk",
    roomId: null,
  });
  assert.equal(parseViewHash("#plan").mode, "plan");
  assert.equal(parseViewHash("").mode, "overview");
  assert.equal(parseViewHash("#%zz").mode, "overview");
});

test("Sharing a visit keeps the deployed origin, subpath, and query", () => {
  assert.equal(
    visitUrl("https://salometeddy.pages.dev/#plan"),
    "https://salometeddy.pages.dev/#visite",
  );
  assert.equal(
    visitUrl("https://example.com/project/?lang=fr#plan", "chambre1"),
    "https://example.com/project/?lang=fr#visite/chambre1",
  );
});

function travel(input, fps = 60, canWalk = () => true) {
  const state = createWalker();
  for (let i = 0; i < fps; i++) stepWalker(state, input, 1 / fps, canWalk);
  return state;
}

test("Diagonal walking is normalized and sprinting is faster", () => {
  const forward = travel({ forward: 1 });
  const diagonal = travel({ forward: 1, side: 1 });
  const sprint = travel({ forward: 1, sprint: true });
  assert.ok(
    Math.abs(Math.hypot(diagonal.x, diagonal.z) - Math.abs(forward.z)) < 1e-8,
  );
  assert.ok(Math.abs(sprint.z) > Math.abs(forward.z) * 1.5);
  assert.ok(forward.z < 0);
});

test("Movement follows view direction and remains consistent across frame rates", () => {
  const left = travel({ forward: 1, yaw: Math.PI / 2 });
  assert.ok(left.x < -1.8);
  assert.ok(Math.abs(left.z) < 1e-8);
  const slow = travel({ forward: 1 }, 30),
    fast = travel({ forward: 1 }, 120);
  assert.ok(Math.abs(slow.z - fast.z) < 0.04);
});

test("Collision substeps prevent sprinting through a thin wall while allowing sliding", () => {
  const state = travel(
    { forward: 1, side: 1, sprint: true },
    30,
    (x, z) => !(x >= 0.7 && x <= 0.76),
  );
  assert.ok(state.x < 0.7);
  assert.ok(state.z < -1.8);
});

test("Pausing discards momentum immediately", () => {
  const state = travel({ forward: 1 });
  const z = state.z;
  stopWalker(state);
  stepWalker(state, {}, 1 / 60, () => true);
  assert.equal(state.z, z);
});

test("Jump lands on the floor, remains below the ceiling, and cannot double-jump", () => {
  const state = createWalker();
  jumpWalker(state);
  let peak = 0;
  for (let i = 0; i < 100; i++) {
    stepWalker(state, {}, 1 / 60, () => true);
    peak = Math.max(peak, state.elevation);
    if (i === 6) {
      const speed = state.verticalSpeed;
      jumpWalker(state);
      assert.equal(state.verticalSpeed, speed);
    }
  }
  assert.ok(peak > 0.2 && peak < 0.4);
  assert.equal(state.elevation, 0);
  assert.equal(state.verticalSpeed, 0);
});
