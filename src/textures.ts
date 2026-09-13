import * as THREE from "three";
import { fbm, hash2 } from "./lib/noise";

function canvasTexture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  colorSpace: THREE.ColorSpace = THREE.SRGBColorSpace,
): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("canvas");
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = colorSpace;
  tex.anisotropy = 8;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function makeWood(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const n = fbm(x / 70, y / 14, 3, 5);
        const ring = Math.sin((x / w) * 18 + n * 6.5);
        const v = 0.22 + n * 0.18 + ring * 0.04;
        const i = (y * w + x) * 4;
        d[i] = (v * 92 + 18) | 0;
        d[i + 1] = (v * 58 + 10) | 0;
        d[i + 2] = (v * 32 + 6) | 0;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
}

export function makeEnamelRoughness(): THREE.CanvasTexture {
  return canvasTexture(
    256,
    256,
    (ctx, w, h) => {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const n = fbm(x / 40, y / 40, 11, 4);
          const scratch =
            Math.abs(Math.sin((x + y * 0.15) / 3.2 + n * 8)) > 0.992 ? 0.35 : 0;
          const v = 0.28 + n * 0.22 + scratch;
          const g = Math.min(255, (v * 255) | 0);
          const i = (y * w + x) * 4;
          d[i] = d[i + 1] = d[i + 2] = g;
          d[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    THREE.NoColorSpace,
  );
}

export function makeBrushed(): THREE.CanvasTexture {
  return canvasTexture(
    256,
    256,
    (ctx, w, h) => {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let y = 0; y < h; y++) {
        const row = fbm(0.2, y / 8, 21, 3);
        for (let x = 0; x < w; x++) {
          const n = hash2(x, y, 4) * 0.12 + row * 0.25;
          const g = (140 + n * 80) | 0;
          const i = (y * w + x) * 4;
          d[i] = d[i + 1] = d[i + 2] = g;
          d[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    THREE.NoColorSpace,
  );
}

export function makeRubber(): THREE.CanvasTexture {
  return canvasTexture(256, 128, (ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const n = fbm(x / 18, y / 18, 7, 4);
        const groove = Math.sin((y / h) * Math.PI * 18) * 0.08;
        const v = 0.12 + n * 0.1 + groove;
        const i = (y * w + x) * 4;
        d[i] = (v * 40 + 12) | 0;
        d[i + 1] = (v * 32 + 10) | 0;
        d[i + 2] = (v * 28 + 8) | 0;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
}

export function makeRibbon(): THREE.CanvasTexture {
  return canvasTexture(64, 128, (ctx, w, h) => {
    ctx.fillStyle = "#141210";
    ctx.fillRect(0, 0, w, h * 0.5);
    ctx.fillStyle = "#7a1c1c";
    ctx.fillRect(0, h * 0.5, w, h * 0.5);
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (hash2(i, 3, 9) - 0.5) * 18;
      d[i] = Math.max(0, d[i] + n);
      d[i + 1] = Math.max(0, d[i + 1] + n);
      d[i + 2] = Math.max(0, d[i + 2] + n);
    }
    ctx.putImageData(img, 0, 0);
  });
}

export function makePaperSheet(
  w: number,
  h: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; texture: THREE.CanvasTexture } {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("paper canvas");
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = fbm(x / 90, y / 90, 13, 4);
      const fiber = hash2(x, y, 2) * 8;
      const i = (y * w + x) * 4;
      d[i] = 232 + n * 10 + fiber * 0.2;
      d[i + 1] = 222 + n * 8;
      d[i + 2] = 198 + n * 6;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  ctx.fillStyle = "rgba(160,140,110,0.05)";
  ctx.font = '120px "Cormorant Garamond", serif';
  ctx.textAlign = "center";
  ctx.save();
  ctx.translate(w * 0.5, h * 0.42);
  ctx.rotate(-0.15);
  ctx.fillText("FIELD", 0, 0);
  ctx.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return { canvas, ctx, texture };
}

export function makeKeyCap(
  label: string,
  shiftLabel: string | undefined,
  dark: boolean,
): THREE.CanvasTexture {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w * 0.45, h * 0.4, 10, w * 0.5, h * 0.5, w * 0.52);
    if (dark) {
      g.addColorStop(0, "#2a2420");
      g.addColorStop(1, "#12100e");
    } else {
      g.addColorStop(0, "#f0e4cc");
      g.addColorStop(0.7, "#e2d2b0");
      g.addColorStop(1, "#c8b48c");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = dark ? "rgba(200,180,140,0.18)" : "rgba(90,70,40,0.18)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 112, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = dark ? "#e8dcc4" : "#2a2118";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lines = label.split("\n");
    if (shiftLabel) {
      ctx.font = '500 52px "Cormorant Garamond", Georgia, serif';
      ctx.fillText(shiftLabel, w / 2, h * 0.34);
      ctx.font = '600 92px "Cormorant Garamond", Georgia, serif';
      ctx.fillText(label, w / 2, h * 0.62);
    } else if (lines.length > 1) {
      ctx.font = '600 36px "Cormorant Garamond", Georgia, serif';
      ctx.fillText(lines[0], w / 2, h * 0.42);
      ctx.fillText(lines[1], w / 2, h * 0.6);
    } else {
      ctx.font = '600 108px "Cormorant Garamond", Georgia, serif';
      ctx.fillText(label, w / 2, h * 0.54);
    }
  });
}

export function makeDecal(): THREE.CanvasTexture {
  return canvasTexture(512, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#c4a056";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = 'italic 56px "Cormorant Garamond", serif';
    ctx.fillText("FIELD", w / 2, h * 0.38);
    ctx.font = '500 22px "EB Garamond", serif';
    ctx.letterSpacing = "6px";
    ctx.fillText("STANDARD  NO.  8", w / 2, h * 0.72);
  });
}

export function makeScale(): THREE.CanvasTexture {
  return canvasTexture(1024, 64, (ctx, w, h) => {
    ctx.fillStyle = "#d8d4cc";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#1a1612";
    for (let i = 0; i <= 80; i++) {
      const x = 20 + i * ((w - 40) / 80);
      const tall = i % 10 === 0;
      ctx.fillRect(x, tall ? 8 : 20, 2, tall ? 48 : 24);
      if (tall) {
        ctx.font = "12px Georgia";
        ctx.textAlign = "center";
        ctx.fillText(String(i), x, 14);
      }
    }
  });
}

export function makeFloor(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const n = fbm(x / 80, y / 80, 17, 4);
        const v = 0.08 + n * 0.05;
        const i = (y * w + x) * 4;
        d[i] = (v * 70) | 0;
        d[i + 1] = (v * 52) | 0;
        d[i + 2] = (v * 38) | 0;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
}
