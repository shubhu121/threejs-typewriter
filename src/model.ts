import * as THREE from "three";
import { KEYS, type FocusId, type KeySpec } from "./config";
import { knurledCylinder, mesh, roundedBox } from "./lib/geo";
import type { Materials } from "./materials";
import { makeDecal, makeKeyCap, makeScale } from "./textures";

export type KeyRig = {
  spec: KeySpec;
  group: THREE.Group;
  restRot: number;
  pressRot: number;
};

export type BarRig = {
  id: string;
  pivot: THREE.Group;
  rest: number;
  strike: number;
};

export type TypewriterRig = {
  root: THREE.Group;
  keys: Map<string, KeyRig>;
  bars: Map<string, BarRig>;
  carriage: THREE.Group;
  platen: THREE.Mesh;
  platenPivot: THREE.Group;
  returnLever: THREE.Group;
  vibrator: THREE.Group;
  spoolL: THREE.Group;
  spoolR: THREE.Group;
  colorLever: THREE.Group;
  basket: THREE.Group;
  bellHammer: THREE.Group;
  bell: THREE.Mesh;
  ratchet: THREE.Mesh;
  paperMesh: THREE.Mesh;
  pickables: THREE.Object3D[];
  hotspots: Record<FocusId, THREE.Object3D>;
  strikePoint: THREE.Vector3;
};

const KEY_PITCH = 0.0186;
const ROW_Z = [0.05, 0.07, 0.09, 0.11, 0.128];
const ROW_Y = [0.082, 0.079, 0.076, 0.073, 0.069];
const STRIKE = new THREE.Vector3(0, 0.172, -0.048);

const ghost = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0,
  depthWrite: false,
  colorWrite: false,
});

function mark(
  obj: THREE.Object3D,
  data: Record<string, string>,
  pickables: THREE.Object3D[],
): void {
  Object.assign(obj.userData, data);
  obj.castShadow = false;
  obj.receiveShadow = false;
  pickables.push(obj);
}

function volume(
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  data: Record<string, string>,
  pickables: THREE.Object3D[],
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), ghost);
  m.position.set(x, y, z);
  m.castShadow = false;
  m.receiveShadow = false;
  mark(m, data, pickables);
  return m;
}

export function buildTypewriter(
  mats: Materials,
  paperTexture: THREE.CanvasTexture,
  lineTexture: THREE.CanvasTexture,
): TypewriterRig {
  const root = new THREE.Group();
  root.name = "typewriter";
  const pickables: THREE.Object3D[] = [];

  const body = buildBody(mats);
  root.add(body);

  const keyboard = buildKeyboard(mats, pickables);
  root.add(keyboard.root);

  const basket = buildBasket(mats, pickables);
  root.add(basket.root);

  const ribbon = buildRibbon(mats, pickables);
  root.add(ribbon.root);

  const carriage = buildCarriage(mats, paperTexture, lineTexture, pickables);
  root.add(carriage.root);

  const extras = buildExtras(mats, pickables);
  root.add(extras.root);

  const hotspots: Record<FocusId, THREE.Object3D> = {
    typebars: basket.root,
    ribbon: ribbon.root,
    carriage: extras.escapement,
    platen: carriage.platen,
    shift: extras.shiftArm,
    bell: extras.bell,
  };

  return {
    root,
    keys: keyboard.keys,
    bars: basket.bars,
    carriage: carriage.root,
    platen: carriage.platen,
    platenPivot: carriage.platenPivot,
    returnLever: carriage.returnLever,
    vibrator: ribbon.vibrator,
    spoolL: ribbon.spoolL,
    spoolR: ribbon.spoolR,
    colorLever: ribbon.colorLever,
    basket: basket.root,
    bellHammer: extras.hammer,
    bell: extras.bell,
    ratchet: extras.ratchet,
    paperMesh: carriage.paper,
    pickables,
    hotspots,
    strikePoint: STRIKE.clone(),
  };
}

function buildBody(mats: Materials): THREE.Group {
  const g = new THREE.Group();
  g.name = "body";

  const base = mesh(roundedBox(0.36, 0.038, 0.275, 0.01), mats.enamel, 0, 0.031, 0.01);
  g.add(base);

  const deck = mesh(roundedBox(0.33, 0.016, 0.11, 0.004), mats.enamel, 0, 0.058, 0.078);
  deck.rotation.x = 0.12;
  g.add(deck);

  const wellFloor = mesh(roundedBox(0.28, 0.008, 0.085, 0.003), mats.enamelGloss, 0, 0.066, 0.002);
  g.add(wellFloor);

  const rear = mesh(roundedBox(0.34, 0.09, 0.06, 0.006), mats.enamel, 0, 0.088, -0.1);
  g.add(rear);

  const left = mesh(roundedBox(0.022, 0.1, 0.24, 0.005), mats.enamel, -0.168, 0.082, 0);
  const right = mesh(roundedBox(0.022, 0.1, 0.24, 0.005), mats.enamel, 0.168, 0.082, 0);
  g.add(left, right);

  const apron = mesh(roundedBox(0.32, 0.028, 0.03, 0.004), mats.enamel, 0, 0.05, 0.138);
  g.add(apron);

  const nameplate = mesh(
    new THREE.PlaneGeometry(0.1, 0.024),
    new THREE.MeshPhysicalMaterial({
      map: makeDecal(),
      transparent: true,
      roughness: 0.42,
      metalness: 0.55,
      envMapIntensity: 0.8,
    }),
    0,
    0.062,
    0.154,
  );
  nameplate.castShadow = false;
  g.add(nameplate);

  const rail = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.34, 12), mats.chrome, 0, 0.148, -0.078);
  rail.rotation.z = Math.PI / 2;
  const rail2 = rail.clone();
  rail2.position.z = -0.1;
  g.add(rail, rail2);

  const trim = mesh(new THREE.BoxGeometry(0.355, 0.003, 0.006), mats.chrome, 0, 0.05, 0.146);
  g.add(trim);

  const feet: [number, number][] = [
    [-0.145, 0.1],
    [0.145, 0.1],
    [-0.145, -0.1],
    [0.145, -0.1],
  ];
  for (const [x, z] of feet) {
    const collar = mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.006, 16), mats.chrome, x, 0.01, z);
    const pad = mesh(new THREE.CylinderGeometry(0.014, 0.015, 0.012, 16), mats.rubber, x, 0.006, z);
    g.add(collar, pad);
  }

  const felt = mesh(new THREE.BoxGeometry(0.2, 0.004, 0.06), mats.felt, 0, 0.068, 0.02);
  g.add(felt);

  const plate = mesh(new THREE.PlaneGeometry(0.09, 0.022), new THREE.MeshPhysicalMaterial({
    map: makeDecal(),
    transparent: true,
    roughness: 0.4,
    metalness: 0.6,
  }), 0, 0.132, -0.128);
  plate.castShadow = false;
  g.add(plate);

  const ridgeL = mesh(new THREE.BoxGeometry(0.003, 0.06, 0.16), mats.nickel, -0.157, 0.09, 0.01);
  const ridgeR = ridgeL.clone();
  ridgeR.position.x = 0.157;
  g.add(ridgeL, ridgeR);

  return g;
}

function layoutRows(): { spec: KeySpec; x: number; y: number; z: number }[] {
  const byRow = new Map<number, KeySpec[]>();
  for (const spec of KEYS) {
    const list = byRow.get(spec.row) ?? [];
    list.push(spec);
    byRow.set(spec.row, list);
  }
  const placed: { spec: KeySpec; x: number; y: number; z: number }[] = [];
  for (const [row, list] of byRow) {
    list.sort((a, b) => a.index - b.index);
    let cursor = 0;
    const centers: number[] = [];
    for (const spec of list) {
      const span = spec.span ?? 1;
      const w = span * KEY_PITCH;
      centers.push(cursor + w * 0.5);
      cursor += w;
    }
    const offset = cursor * 0.5;
    list.forEach((spec, i) => {
      placed.push({
        spec,
        x: centers[i] - offset,
        y: ROW_Y[row],
        z: ROW_Z[row],
      });
    });
  }
  return placed;
}

function buildKeyboard(mats: Materials, pickables: THREE.Object3D[]) {
  const root = new THREE.Group();
  root.name = "keyboard";
  const keys = new Map<string, KeyRig>();
  const restRot = 0.05;
  const pressRot = 0.18;

  for (const place of layoutRows()) {
    const { spec, x, y, z } = place;
    const span = spec.span ?? 1;
    const group = new THREE.Group();
    group.position.set(x, y - 0.01, z + 0.004);
    group.rotation.x = restRot;

    const isSpace = spec.kind === "space";
    const capW = isSpace ? span * KEY_PITCH * 0.92 : Math.min(0.017, span * KEY_PITCH * 0.86);
    const capD = isSpace ? 0.014 : 0.016;
    const capH = 0.0042;

    const rim = mesh(
      isSpace
        ? roundedBox(capW, capH, capD, 0.002)
        : new THREE.CylinderGeometry(0.0086, 0.009, capH, 22),
      mats.chrome,
      0,
      0.015,
      -0.006,
    );
    group.add(rim);

    const insertMat = mats.ivory.clone();
    insertMat.envMapIntensity = 0.25;
    insertMat.roughness = 0.58;
    if (spec.label) {
      insertMat.map = makeKeyCap(spec.label, spec.shiftLabel, Boolean(spec.dark));
      insertMat.color.set(0xffffff);
    } else if (spec.dark) {
      insertMat.color.set(0x1a1612);
    }
    const face = isSpace
      ? mesh(new THREE.PlaneGeometry(capW - 0.003, capD - 0.003), insertMat, 0, 0.0174, -0.006)
      : mesh(new THREE.CircleGeometry(0.0072, 24), insertMat, 0, 0.0174, -0.006);
    face.rotation.x = -Math.PI / 2;
    face.castShadow = false;
    group.add(face);

    const stem = mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.018, 8), mats.nickel, 0, 0.006, -0.006);
    group.add(stem);

    const lever = mesh(new THREE.BoxGeometry(0.003, 0.002, 0.055), mats.nickel, 0, 0.002, -0.03);
    group.add(lever);

    mark(face, { pick: "key", keyId: spec.id }, pickables);
    mark(rim, { pick: "key", keyId: spec.id }, pickables);

    root.add(group);
    keys.set(spec.id, { spec, group, restRot, pressRot });
  }

  return { root, keys };
}

function buildBasket(mats: Materials, pickables: THREE.Object3D[]) {
  const root = new THREE.Group();
  root.name = "basket";
  const bars = new Map<string, BarRig>();
  const chars = KEYS.filter((k) => k.kind === "char");
  const n = chars.length;
  const barLen = 0.09;

  const segment = mesh(
    new THREE.TorusGeometry(0.042, 0.005, 8, 28, Math.PI * 1.05),
    mats.chrome,
    0,
    0.128,
    -0.02,
  );
  segment.rotation.set(Math.PI / 2, 0, Math.PI);
  root.add(segment);

  const comb = mesh(roundedBox(0.14, 0.005, 0.008, 0.001), mats.enamel, 0, 0.12, 0.006);
  root.add(comb);

  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const theta = THREE.MathUtils.lerp(-1.12, 1.12, t);
    const r = 0.1;
    const pivot = new THREE.Group();
    pivot.position.set(Math.sin(theta) * r, 0.094, 0.018 + Math.cos(theta) * r * 0.18);
    pivot.rotation.y = -theta;

    const arm = mesh(new THREE.BoxGeometry(0.0032, 0.0026, barLen), mats.enamel);
    arm.position.z = barLen * 0.5;
    const slug = mesh(new THREE.BoxGeometry(0.0072, 0.0052, 0.0042), mats.nickel);
    slug.position.z = barLen;
    pivot.add(arm, slug);
    const rest = 0.62;
    const strike = -0.92;
    pivot.rotation.x = rest;
    root.add(pivot);
    bars.set(chars[i].id, { id: chars[i].id, pivot, rest, strike });
  }

  const guide = new THREE.Group();
  guide.position.copy(STRIKE);
  const forkL = mesh(new THREE.BoxGeometry(0.0016, 0.016, 0.012), mats.chrome, -0.006, 0, 0);
  const forkR = mesh(new THREE.BoxGeometry(0.0016, 0.016, 0.012), mats.chrome, 0.006, 0, 0);
  const forkB = mesh(new THREE.BoxGeometry(0.014, 0.002, 0.008), mats.chrome, 0, -0.008, 0);
  guide.add(forkL, forkR, forkB);
  root.add(guide);

  root.add(volume(0.2, 0.09, 0.12, 0, 0.11, 0.01, { pick: "focus", id: "typebars" }, pickables));

  return { root, bars };
}

function ribbonPath(): THREE.Curve<THREE.Vector3> {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.092, 0.136, -0.012),
    new THREE.Vector3(-0.028, 0.152, -0.038),
    new THREE.Vector3(0, 0.156, -0.044),
    new THREE.Vector3(0.028, 0.152, -0.038),
    new THREE.Vector3(0.092, 0.136, -0.012),
  ]);
}

function buildRibbon(mats: Materials, pickables: THREE.Object3D[]) {
  const root = new THREE.Group();
  root.name = "ribbon";

  const makeSpool = (x: number) => {
    const grp = new THREE.Group();
    grp.position.set(x, 0.132, -0.01);
    const core = mesh(knurledCylinder(0.012, 0.018, 18), mats.nickel);
    const flangeT = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.003, 20), mats.chrome, 0, 0.01, 0);
    const flangeB = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.003, 20), mats.chrome, 0, -0.01, 0);
    const wound = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.014, 20), mats.ribbon);
    const post = mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.04, 8), mats.chrome, 0, -0.02, 0);
    grp.add(core, flangeT, flangeB, wound, post);
    return grp;
  };

  const spoolL = makeSpool(-0.1);
  const spoolR = makeSpool(0.1);
  root.add(spoolL, spoolR);

  const ribbon = mesh(new THREE.TubeGeometry(ribbonPath(), 32, 0.0017, 5, false), mats.ribbon);
  ribbon.castShadow = false;
  root.add(ribbon);

  const vibrator = new THREE.Group();
  vibrator.position.set(0, 0.154, -0.042);
  const fork = mesh(new THREE.BoxGeometry(0.016, 0.008, 0.0022), mats.steel);
  const tineL = mesh(new THREE.BoxGeometry(0.0016, 0.012, 0.0016), mats.steel, -0.0065, 0.004, 0);
  const tineR = mesh(new THREE.BoxGeometry(0.0016, 0.012, 0.0016), mats.steel, 0.0065, 0.004, 0);
  vibrator.add(fork, tineL, tineR);
  root.add(vibrator);

  const colorLever = new THREE.Group();
  colorLever.position.set(0.132, 0.086, 0.092);
  const stick = mesh(new THREE.BoxGeometry(0.003, 0.018, 0.003), mats.chrome, 0, 0.008, 0);
  const knob = mesh(new THREE.SphereGeometry(0.005, 12, 10), mats.enamel, 0, 0.018, 0);
  colorLever.add(stick, knob);
  mark(knob, { pick: "color" }, pickables);
  mark(stick, { pick: "color" }, pickables);
  root.add(colorLever);

  root.add(volume(0.24, 0.06, 0.08, 0, 0.14, -0.02, { pick: "focus", id: "ribbon" }, pickables));

  return { root, spoolL, spoolR, vibrator, colorLever };
}

function buildCarriage(
  mats: Materials,
  paperTexture: THREE.CanvasTexture,
  lineTexture: THREE.CanvasTexture,
  pickables: THREE.Object3D[],
) {
  const root = new THREE.Group();
  root.name = "carriage";
  root.position.y = 0;

  const frame = mesh(roundedBox(0.3, 0.028, 0.072, 0.004), mats.enamel, 0, 0.168, -0.078);
  root.add(frame);

  const platenPivot = new THREE.Group();
  platenPivot.position.set(0, 0.172, -0.072);
  const platen = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.252, 32), mats.rubber);
  platen.rotation.z = Math.PI / 2;
  platenPivot.add(platen);

  const knobGeo = knurledCylinder(0.016, 0.018, 22);
  const knobL = mesh(knobGeo, mats.enamel, -0.148, 0, 0);
  knobL.rotation.z = Math.PI / 2;
  const knobR = mesh(knobGeo, mats.enamel, 0.148, 0, 0);
  knobR.rotation.z = Math.PI / 2;
  const ringL = mesh(new THREE.TorusGeometry(0.016, 0.0022, 8, 16), mats.chrome, -0.148, 0, 0);
  ringL.rotation.y = Math.PI / 2;
  const ringR = ringL.clone();
  ringR.position.x = 0.148;
  platenPivot.add(knobL, knobR, ringL, ringR);
  mark(knobL, { pick: "knob" }, pickables);
  mark(knobR, { pick: "knob" }, pickables);
  root.add(platenPivot);

  const table = mesh(roundedBox(0.26, 0.004, 0.07, 0.002), mats.enamel, 0, 0.198, -0.11);
  table.rotation.x = -0.35;
  root.add(table);

  const bail = mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.22, 8), mats.chrome, 0, 0.196, -0.055);
  bail.rotation.z = Math.PI / 2;
  const rollerA = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.012, 12), mats.rubber, -0.06, 0.196, -0.055);
  rollerA.rotation.z = Math.PI / 2;
  const rollerB = rollerA.clone();
  rollerB.position.x = 0.06;
  root.add(bail, rollerA, rollerB);

  const scaleMat = new THREE.MeshPhysicalMaterial({
    map: makeScale(),
    roughness: 0.45,
    metalness: 0.2,
  });
  const scale = mesh(new THREE.BoxGeometry(0.24, 0.004, 0.012), scaleMat, 0, 0.186, -0.04);
  root.add(scale);

  const returnLever = new THREE.Group();
  returnLever.position.set(-0.14, 0.188, -0.05);
  const shaft = mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.07, 8), mats.chrome);
  shaft.rotation.z = Math.PI / 2.6;
  shaft.position.set(-0.02, 0.018, 0.01);
  const handle = mesh(new THREE.SphereGeometry(0.008, 12, 10), mats.enamel, -0.052, 0.032, 0.018);
  returnLever.add(shaft, handle);
  mark(handle, { pick: "return" }, pickables);
  mark(shaft, { pick: "return" }, pickables);
  root.add(returnLever);

  const paperMat = mats.paper.clone();
  paperMat.map = paperTexture;
  paperMat.color.set(0xffffff);
  paperMat.envMapIntensity = 0.08;
  paperMat.roughness = 0.94;
  paperMat.metalness = 0;
  const paperGeo = new THREE.PlaneGeometry(0.216, 0.17, 12, 10);
  const pos = paperGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setZ(i, -y * y * 0.35);
  }
  paperGeo.computeVertexNormals();
  const paper = mesh(paperGeo, paperMat, 0, 0.255, -0.1);
  paper.rotation.x = -0.22;
  paper.castShadow = false;
  root.add(paper);

  const lineMat = mats.paper.clone();
  lineMat.map = lineTexture;
  lineMat.color.set(0xffffff);
  lineMat.envMapIntensity = 0.04;
  lineMat.roughness = 0.96;
  const lineStrip = mesh(new THREE.PlaneGeometry(0.2, 0.02), lineMat, 0, 0.188, -0.046);
  lineStrip.rotation.x = -0.12;
  lineStrip.castShadow = false;
  root.add(lineStrip);

  const wrap = mesh(
    new THREE.CylinderGeometry(0.0235, 0.0235, 0.21, 24, 1, true, Math.PI * 0.15, Math.PI * 0.7),
    paperMat,
    0,
    0.172,
    -0.072,
  );
  wrap.rotation.z = Math.PI / 2;
  wrap.castShadow = false;
  root.add(wrap);

  const marginL = mesh(new THREE.BoxGeometry(0.008, 0.014, 0.012), mats.nickel, -0.09, 0.2, -0.118);
  const marginR = mesh(new THREE.BoxGeometry(0.008, 0.014, 0.012), mats.nickel, 0.09, 0.2, -0.118);
  root.add(marginL, marginR);

  return { root, platen, platenPivot, returnLever, paper };
}

function buildExtras(mats: Materials, pickables: THREE.Object3D[]) {
  const root = new THREE.Group();

  const escapement = new THREE.Group();
  escapement.position.set(0.145, 0.132, -0.055);
  const ratchet = mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.005, 28), mats.nickel);
  ratchet.rotation.x = Math.PI / 2;
  const teeth = mesh(new THREE.TorusGeometry(0.016, 0.0018, 6, 28), mats.chrome);
  teeth.rotation.x = Math.PI / 2;
  const pawl = mesh(new THREE.BoxGeometry(0.004, 0.012, 0.003), mats.nickel, 0.012, 0.008, 0);
  escapement.add(ratchet, teeth, pawl);
  escapement.add(volume(0.05, 0.05, 0.05, 0, 0, 0, { pick: "focus", id: "carriage" }, pickables));
  root.add(escapement);

  const bell = mesh(new THREE.SphereGeometry(0.012, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), mats.brass, 0.12, 0.118, -0.09);
  bell.rotation.x = Math.PI;
  const hammer = new THREE.Group();
  hammer.position.set(0.1, 0.12, -0.09);
  const hrod = mesh(new THREE.BoxGeometry(0.02, 0.002, 0.002), mats.nickel, 0.008, 0, 0);
  const hhead = mesh(new THREE.SphereGeometry(0.0035, 8, 8), mats.nickel, 0.018, 0, 0);
  hammer.add(hrod, hhead);
  root.add(bell, hammer);
  root.add(volume(0.06, 0.04, 0.05, 0.12, 0.12, -0.09, { pick: "focus", id: "bell" }, pickables));

  const shiftArm = mesh(roundedBox(0.22, 0.008, 0.01, 0.002), mats.nickel, 0, 0.1, 0.028);
  root.add(shiftArm);
  root.add(volume(0.24, 0.03, 0.04, 0, 0.1, 0.03, { pick: "focus", id: "shift" }, pickables));

  root.add(volume(0.28, 0.06, 0.08, 0, 0.18, -0.08, { pick: "focus", id: "platen" }, pickables));

  return { root, escapement, ratchet, bell, hammer, shiftArm };
}

export function buildDesk(mats: Materials): THREE.Group {
  const g = new THREE.Group();
  const top = mesh(roundedBox(1.35, 0.045, 0.78, 0.008), mats.wood, 0, -0.022, 0.04);
  const apron = mesh(roundedBox(1.28, 0.06, 0.7, 0.004), mats.wood, 0, -0.07, 0.04);
  g.add(top, apron);
  const legs: [number, number][] = [
    [-0.58, 0.32],
    [0.58, 0.32],
    [-0.58, -0.24],
    [0.58, -0.24],
  ];
  for (const [x, z] of legs) {
    g.add(mesh(roundedBox(0.055, 0.62, 0.055, 0.004), mats.wood, x, -0.35, z));
  }
  const blotter = mesh(new THREE.BoxGeometry(0.55, 0.002, 0.38), mats.felt, 0.18, 0.002, 0.05);
  blotter.receiveShadow = true;
  g.add(blotter);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.22, 32),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.001, 0.01);
  shadow.scale.set(1.15, 0.7, 1);
  shadow.receiveShadow = false;
  shadow.castShadow = false;
  g.add(shadow);
  return g;
}
