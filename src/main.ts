import gsap from "gsap";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { TypewriterAudio } from "./audio";
import { CODE_TO_KEY, type FocusId } from "./config";
import { FocusControl, HOME } from "./focus";
import { Machine } from "./machine";
import { createMaterials } from "./materials";
import { buildDesk, buildTypewriter } from "./model";
import { PaperSheet } from "./paper";

function requireEl<T extends Element>(selector: string): T {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`missing ${selector}`);
  return el as T;
}

const canvas = requireEl<HTMLCanvasElement>("#stage");

const loader = document.querySelector("#loader") as HTMLElement;
const masthead = document.querySelector("#masthead") as HTMLElement;
const systems = document.querySelector("#systems") as HTMLElement;
const dock = document.querySelector("#dock") as HTMLElement;
const hint = document.querySelector("#hint") as HTMLElement;
const placard = document.querySelector("#placard") as HTMLElement;
const labels = document.querySelector("#labels") as HTMLElement;
const pageInspect = document.querySelector("#page-inspect") as HTMLElement;
const pageView = document.querySelector("#page-view") as HTMLCanvasElement;
const btnColor = document.querySelector("#btn-color") as HTMLButtonElement;
const btnSound = document.querySelector("#btn-sound") as HTMLButtonElement;

const TYPE_SAMPLE =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:'\"!?-_/&$¢() ";
await Promise.race([
  Promise.all([
    document.fonts.ready,
    document.fonts.load('64px "Special Elite"', TYPE_SAMPLE),
    document.fonts.load('108px "Cormorant Garamond"'),
  ]),
  new Promise<void>((resolve) => setTimeout(resolve, 2500)),
]);
{
  const warm = document.createElement("canvas").getContext("2d");
  if (warm) {
    warm.font = '64px "Special Elite", "Courier New", monospace';
    warm.fillText(TYPE_SAMPLE, 0, 50);
  }
}

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0807);
scene.fog = new THREE.Fog(0x0a0807, 1.4, 3.6);

const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.02, 12);
camera.position.copy(HOME.position);

const controls = new OrbitControls(camera, canvas);
controls.target.copy(HOME.target);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 0.16;
controls.maxDistance = 1.35;
controls.minPolarAngle = 0.35;
controls.maxPolarAngle = 1.38;
controls.maxAzimuthAngle = 1.15;
controls.minAzimuthAngle = -0.85;
controls.enablePan = false;
controls.enabled = false;

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();

const mats = createMaterials();
const floor = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), mats.floor);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.66;
floor.receiveShadow = true;
scene.add(floor);

scene.add(buildDesk(mats));

const paper = new PaperSheet();
paper.texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
paper.lineTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
const rig = buildTypewriter(mats, paper.texture, paper.lineTexture);
scene.add(rig.root);

const keyLight = new THREE.DirectionalLight(0xffe2c4, 2.35);
keyLight.position.set(1.15, 2.2, 1.55);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.2;
keyLight.shadow.camera.far = 5;
keyLight.shadow.camera.left = -0.8;
keyLight.shadow.camera.right = 0.8;
keyLight.shadow.camera.top = 0.8;
keyLight.shadow.camera.bottom = -0.8;
keyLight.shadow.bias = -0.0008;
scene.add(keyLight);

const fill = new THREE.DirectionalLight(0x9aa8bb, 0.38);
fill.position.set(-1.6, 1.1, 0.9);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffd4a8, 0.85);
rim.position.set(0.15, 1.3, -1.7);
scene.add(rim);

const hemi = new THREE.HemisphereLight(0x2c3340, 0x1a120c, 0.35);
scene.add(hemi);

const audio = new TypewriterAudio();
const machine = new Machine(
  rig,
  paper,
  audio,
  (text) => {
    hint.textContent = text;
  },
  (color) => {
    btnColor.textContent = `Ribbon: ${color}`;
  },
);

const focus = new FocusControl(
  camera,
  controls,
  rig,
  labels,
  {
    root: placard,
    index: placard.querySelector(".placard-index") as HTMLElement,
    title: placard.querySelector(".placard-title") as HTMLElement,
    body: placard.querySelector(".placard-body") as HTMLElement,
  },
  (id) => {
    for (const btn of systems.querySelectorAll("button")) {
      btn.classList.toggle("is-active", btn.dataset.focus === id);
    }
  },
);

let demo: gsap.core.Timeline | null = null;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hoveringKey = false;

function setPointer(event: PointerEvent): void {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function hits(): THREE.Object3D | null {
  raycaster.setFromCamera(pointer, camera);
  const found = raycaster.intersectObjects(rig.pickables, true);
  const specific = found.find((h) => {
    const p = h.object.userData.pick;
    return p === "key" || p === "return" || p === "knob" || p === "color";
  });
  return (specific ?? found[0])?.object ?? null;
}

canvas.addEventListener("pointermove", (event) => {
  setPointer(event);
  const hit = hits();
  const pick = hit?.userData.pick as string | undefined;
  hoveringKey = pick === "key" || pick === "return" || pick === "knob" || pick === "color";
  document.body.classList.toggle("is-hovering-key", hoveringKey || pick === "focus");
});

canvas.addEventListener("pointerdown", (event) => {
  audio.unlock();
  setPointer(event);
  const hit = hits();
  if (!hit) return;
  const data = hit.userData;
  if (data.pick === "key") {
    const spec = machine.rig.keys.get(data.keyId as string)?.spec;
    if (spec) machine.handleKey(spec);
    return;
  }
  if (data.pick === "return") {
    machine.returnCarriage();
    return;
  }
  if (data.pick === "knob") {
    machine.lineFeed();
    return;
  }
  if (data.pick === "color") {
    machine.toggleRibbon();
    return;
  }
  if (data.pick === "focus") {
    focus.focus(data.id as FocusId);
  }
});

window.addEventListener("keydown", (event) => {
  audio.unlock();
  if (event.code === "Escape") {
    if (!pageInspect.hidden) closePage();
    else focus.goHome();
    return;
  }
  if (!pageInspect.hidden) return;
  if (event.code === "Enter") {
    event.preventDefault();
    machine.returnCarriage();
    return;
  }
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
    machine.setShift(true);
    return;
  }
  const spec = CODE_TO_KEY.get(event.code);
  if (!spec) return;
  event.preventDefault();
  if (event.shiftKey) machine.setShift(true);
  machine.handleKey(spec, event.key);
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
    machine.setShift(false);
  }
});

systems.addEventListener("click", (event) => {
  const btn = (event.target as HTMLElement).closest("button");
  const id = btn?.dataset.focus as FocusId | undefined;
  if (!id) return;
  audio.unlock();
  if (demo) {
    demo.kill();
    demo = null;
  }
  focus.focus(id);
  if (id === "typebars") demo = machine.demoBars();
});

document.querySelector("#placard-back")?.addEventListener("click", () => {
  demo?.kill();
  demo = null;
  focus.goHome();
});

document.querySelector("#btn-return")?.addEventListener("click", () => {
  audio.unlock();
  machine.returnCarriage();
});

btnColor.addEventListener("click", () => {
  audio.unlock();
  machine.toggleRibbon();
});

document.querySelector("#btn-page")?.addEventListener("click", () => {
  audio.unlock();
  audio.paper();
  paper.snapshotTo(pageView);
  pageInspect.hidden = false;
});

document.querySelector("#btn-close-page")?.addEventListener("click", closePage);

document.querySelector("#btn-download")?.addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = paper.canvas.toDataURL("image/png");
  a.download = "field-standard-page.png";
  a.click();
});

btnSound.addEventListener("click", () => {
  audio.setMuted(!audio.muted);
  btnSound.textContent = audio.muted ? "Sound off" : "Sound on";
  btnSound.setAttribute("aria-pressed", audio.muted ? "false" : "true");
});

function closePage(): void {
  pageInspect.hidden = true;
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

camera.position.set(0.08, 0.2, 0.18);
camera.lookAt(0, 0.16, -0.04);

loader.classList.add("is-gone");
masthead.classList.remove("ui-hidden");
systems.classList.remove("ui-hidden");
dock.classList.remove("ui-hidden");

gsap.to(camera.position, {
  x: HOME.position.x,
  y: HOME.position.y,
  z: HOME.position.z,
  duration: 2.4,
  ease: "power2.inOut",
  onUpdate: () => camera.lookAt(HOME.target),
  onComplete: () => {
    controls.target.copy(HOME.target);
    controls.enabled = true;
    controls.update();
  },
});

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  void dt;
  controls.update();
  focus.projectLabels(camera, renderer);
  renderer.render(scene, camera);
});
