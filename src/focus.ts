import gsap from "gsap";
import * as THREE from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FOCUS_COPY, type FocusId } from "./config";
import type { TypewriterRig } from "./model";

export const HOME = {
  position: new THREE.Vector3(0.32, 0.28, 0.46),
  target: new THREE.Vector3(0, 0.12, 0.02),
  fov: 32,
};

const VIEWS: Record<FocusId, { dir: THREE.Vector3; fit: number; fov: number }> = {
  typebars: { dir: new THREE.Vector3(0.15, 0.35, 0.7), fit: 1.8, fov: 28 },
  ribbon: { dir: new THREE.Vector3(0.2, 0.55, 0.45), fit: 2.1, fov: 26 },
  carriage: { dir: new THREE.Vector3(0.85, 0.35, 0.35), fit: 2.4, fov: 26 },
  platen: { dir: new THREE.Vector3(0.25, 0.15, 0.7), fit: 1.6, fov: 28 },
  shift: { dir: new THREE.Vector3(0.4, 0.15, 0.75), fit: 2.0, fov: 28 },
  bell: { dir: new THREE.Vector3(0.7, 0.3, 0.2), fit: 2.6, fov: 24 },
};

export class FocusControl {
  current: FocusId | null = null;
  private tween: gsap.core.Timeline | null = null;

  constructor(
    private camera: THREE.PerspectiveCamera,
    private controls: OrbitControls,
    private rig: TypewriterRig,
    private labels: HTMLElement,
    private placard: {
      root: HTMLElement;
      index: HTMLElement;
      title: HTMLElement;
      body: HTMLElement;
    },
    private onChange: (id: FocusId | null) => void,
  ) {}

  goHome(): void {
    this.current = null;
    this.placard.root.hidden = true;
    this.clearLabels();
    this.onChange(null);
    this.fly(HOME.position, HOME.target, HOME.fov, 1.45);
    this.controls.enabled = true;
  }

  focus(id: FocusId): void {
    if (this.current === id) {
      this.goHome();
      return;
    }
    this.current = id;
    const copy = FOCUS_COPY[id];
    this.placard.index.textContent = copy.index;
    this.placard.title.textContent = copy.title;
    this.placard.body.textContent = copy.body;
    this.placard.root.hidden = false;
    this.onChange(id);

    const obj = this.rig.hotspots[id];
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const view = VIEWS[id];
    const radius = Math.max(size.x, size.y, size.z, 0.04);
    const dist = radius * view.fit + 0.08;
    const pos = center.clone().add(view.dir.clone().normalize().multiplyScalar(dist));
    this.controls.enabled = false;
    this.fly(pos, center, view.fov, 1.55);
    this.placeLabels(id, center);
  }

  private fly(
    position: THREE.Vector3,
    target: THREE.Vector3,
    fov: number,
    duration: number,
  ): void {
    this.tween?.kill();
    const cam = this.camera;
    const ctl = this.controls;
    const fromFov = { v: cam.fov };
    this.tween = gsap.timeline({
      defaults: { duration, ease: "power3.inOut" },
    });
    this.tween.to(cam.position, { x: position.x, y: position.y, z: position.z }, 0);
    this.tween.to(ctl.target, { x: target.x, y: target.y, z: target.z }, 0);
    this.tween.to(
      fromFov,
      {
        v: fov,
        onUpdate: () => {
          cam.fov = fromFov.v;
          cam.updateProjectionMatrix();
        },
      },
      0,
    );
  }

  private placeLabels(id: FocusId, center: THREE.Vector3): void {
    this.clearLabels();
    const names: Record<FocusId, string[]> = {
      typebars: ["Segment", "Type bar", "Slug"],
      ribbon: ["Spool", "Vibrator", "Bichrome ribbon"],
      carriage: ["Ratchet", "Pawl", "Draw band"],
      platen: ["Rubber platen", "Paper bail", "Line space"],
      shift: ["Shift key", "Carriage lift"],
      bell: ["Margin stop", "Bell", "Hammer"],
    };
    names[id].forEach((name, i) => {
      const el = document.createElement("div");
      el.className = "label";
      el.textContent = name;
      this.labels.appendChild(el);
      const offset = new THREE.Vector3((i - 1) * 0.04, 0.03 + i * 0.01, 0);
      el.dataset.x = String(center.x + offset.x);
      el.dataset.y = String(center.y + offset.y);
      el.dataset.z = String(center.z + offset.z);
      requestAnimationFrame(() => el.classList.add("is-on"));
    });
  }

  projectLabels(camera: THREE.Camera, renderer: THREE.WebGLRenderer): void {
    const { width, height } = renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector3();
    for (const node of this.labels.children) {
      const el = node as HTMLElement;
      v.set(Number(el.dataset.x), Number(el.dataset.y), Number(el.dataset.z));
      v.project(camera);
      el.style.left = `${(v.x * 0.5 + 0.5) * width}px`;
      el.style.top = `${(-v.y * 0.5 + 0.5) * height}px`;
    }
  }

  private clearLabels(): void {
    this.labels.replaceChildren();
  }
}
