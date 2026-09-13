import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export function roundedBox(
  w: number,
  h: number,
  d: number,
  r = 0.004,
  segs = 3,
): THREE.BufferGeometry {
  return new RoundedBoxGeometry(w, h, d, segs, r);
}

export function knurledCylinder(
  radius: number,
  height: number,
  knurls = 28,
): THREE.CylinderGeometry {
  const geo = new THREE.CylinderGeometry(radius, radius, height, knurls * 2, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (Math.abs(y) > height * 0.48) continue;
    const a = Math.atan2(z, x);
    const ridge = 0.5 + 0.5 * Math.cos(a * knurls);
    const r = radius * (0.9 + 0.1 * ridge);
    pos.setXYZ(i, Math.cos(a) * r, y, Math.sin(a) * r);
  }
  geo.computeVertexNormals();
  return geo;
}

export function mesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
