import * as THREE from "three";
import { COLS, PAPER, ROWS } from "./config";
import { makePaperSheet } from "./textures";

export type RibbonColor = "black" | "red";

export class PaperSheet {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly texture: THREE.CanvasTexture;
  readonly lineTexture: THREE.CanvasTexture;
  readonly charW: number;
  readonly charH: number;
  readonly padX: number;
  readonly padY: number;

  constructor() {
    const sheet = makePaperSheet(PAPER.canvasW, PAPER.canvasH);
    this.canvas = sheet.canvas;
    this.ctx = sheet.ctx;
    this.texture = sheet.texture;
    this.lineTexture = sheet.texture.clone();
    this.lineTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.lineTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.padX = 96;
    this.padY = 120;
    this.charW = (PAPER.canvasW - this.padX * 2) / COLS;
    this.charH = (PAPER.canvasH - this.padY * 2) / ROWS;
    this.showLine(2);
  }

  showLine(row: number): void {
    const y0 = (this.padY + row * this.charH - this.charH * 0.4) / PAPER.canvasH;
    const h = (this.charH * 2.4) / PAPER.canvasH;
    this.lineTexture.repeat.set(1, h);
    this.lineTexture.offset.set(0, 1 - y0 - h);
    this.lineTexture.needsUpdate = true;
  }

  imprint(ch: string, col: number, row: number, color: RibbonColor): void {
    const x = this.padX + col * this.charW + this.charW * 0.5;
    const y = this.padY + row * this.charH + this.charH * 0.72;
    const ctx = this.ctx;
    ctx.save();
    const jitterX = (Math.random() - 0.5) * 1.2;
    const jitterY = (Math.random() - 0.5) * 1.1;
    const rot = (Math.random() - 0.5) * 0.035;
    ctx.translate(x + jitterX, y + jitterY);
    ctx.rotate(rot);
    ctx.globalAlpha = 0.82 + Math.random() * 0.16;
    ctx.fillStyle = color === "red" ? "#6a1212" : "#161310";
    ctx.font = `${Math.max(16, Math.floor(this.charW * 1.55))}px "Special Elite", "Courier New", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    this.texture.needsUpdate = true;
    this.lineTexture.needsUpdate = true;
  }

  snapshotTo(target: HTMLCanvasElement): void {
    target.width = this.canvas.width;
    target.height = this.canvas.height;
    const ctx = target.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(this.canvas, 0, 0);
  }

  get empty(): boolean {
    return false;
  }
}
