import * as THREE from "three";
import {
  makeBrushed,
  makeEnamelRoughness,
  makeFloor,
  makeRibbon,
  makeRubber,
  makeWood,
} from "./textures";

export type Materials = {
  enamel: THREE.MeshPhysicalMaterial;
  enamelGloss: THREE.MeshPhysicalMaterial;
  chrome: THREE.MeshPhysicalMaterial;
  nickel: THREE.MeshPhysicalMaterial;
  brass: THREE.MeshPhysicalMaterial;
  rubber: THREE.MeshPhysicalMaterial;
  ivory: THREE.MeshPhysicalMaterial;
  wood: THREE.MeshPhysicalMaterial;
  floor: THREE.MeshPhysicalMaterial;
  ribbon: THREE.MeshPhysicalMaterial;
  paper: THREE.MeshPhysicalMaterial;
  felt: THREE.MeshStandardMaterial;
  steel: THREE.MeshPhysicalMaterial;
};

export function createMaterials(): Materials {
  const enamelRough = makeEnamelRoughness();
  enamelRough.repeat.set(2, 2);
  const brushed = makeBrushed();
  brushed.repeat.set(3, 1);
  const wood = makeWood();
  wood.repeat.set(3, 2);
  const floor = makeFloor();
  floor.repeat.set(6, 6);
  const rubber = makeRubber();
  rubber.repeat.set(4, 1);
  const ribbon = makeRibbon();

  const enamel = new THREE.MeshPhysicalMaterial({
    color: 0x161310,
    roughness: 0.38,
    metalness: 0.18,
    clearcoat: 0.82,
    clearcoatRoughness: 0.28,
    roughnessMap: enamelRough,
    envMapIntensity: 1.15,
  });

  const enamelGloss = enamel.clone();
  enamelGloss.roughness = 0.28;
  enamelGloss.clearcoat = 1;

  const chrome = new THREE.MeshPhysicalMaterial({
    color: 0xd4d7dc,
    roughness: 0.16,
    metalness: 1,
    roughnessMap: brushed,
    envMapIntensity: 1.6,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
  });

  const nickel = new THREE.MeshPhysicalMaterial({
    color: 0xb7b3a8,
    roughness: 0.32,
    metalness: 0.95,
    envMapIntensity: 1.2,
  });

  const brass = new THREE.MeshPhysicalMaterial({
    color: 0xc4a056,
    roughness: 0.38,
    metalness: 1,
    envMapIntensity: 1.1,
  });

  const rubberMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: rubber,
    roughness: 0.88,
    metalness: 0.02,
  });

  const ivory = new THREE.MeshPhysicalMaterial({
    color: 0xe8dcc4,
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0.55,
    clearcoatRoughness: 0.16,
  });

  const woodMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: wood,
    roughness: 0.62,
    metalness: 0.04,
    envMapIntensity: 0.6,
  });

  const floorMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: floor,
    roughness: 0.45,
    metalness: 0.08,
    envMapIntensity: 0.5,
  });

  const ribbonMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: ribbon,
    roughness: 0.7,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const paper = new THREE.MeshPhysicalMaterial({
    color: 0xf0e6d4,
    roughness: 0.78,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const felt = new THREE.MeshStandardMaterial({
    color: 0x3a1c1c,
    roughness: 0.95,
    metalness: 0,
  });

  const steel = new THREE.MeshPhysicalMaterial({
    color: 0x4a4642,
    roughness: 0.48,
    metalness: 0.78,
    envMapIntensity: 0.65,
  });

  paper.envMapIntensity = 0.12;
  paper.roughness = 0.92;

  ivory.envMapIntensity = 0.35;

  return {
    enamel,
    enamelGloss,
    chrome,
    nickel,
    brass,
    rubber: rubberMat,
    ivory,
    wood: woodMat,
    floor: floorMat,
    ribbon: ribbonMat,
    paper,
    felt,
    steel,
  };
}
