import gsap from "gsap";
import { TypewriterAudio } from "./audio";
import {
  BELL_COL,
  CHAR_PITCH,
  COLS,
  KEYS,
  LINE_PITCH,
  MARGIN_LEFT,
  MARGIN_RIGHT,
  PAPER,
  ROWS,
  type KeySpec,
} from "./config";
import type { TypewriterRig } from "./model";
import type { PaperSheet, RibbonColor } from "./paper";

export class Machine {
  col = MARGIN_LEFT;
  row = 2;
  shifted = false;
  shiftLocked = false;
  ribbon: RibbonColor = "black";
  marginReleased = false;
  bellRang = false;
  returning = false;
  typed = 0;

  private barIndex = new Map<string, number>();
  private startX: number;

  constructor(
    readonly rig: TypewriterRig,
    readonly paper: PaperSheet,
    readonly audio: TypewriterAudio,
    readonly onHint: (text: string) => void,
    readonly onColor: (color: RibbonColor) => void,
  ) {
    KEYS.filter((k) => k.kind === "char").forEach((k, i) => this.barIndex.set(k.id, i));
    this.startX = PAPER.width / 2 - CHAR_PITCH * (MARGIN_LEFT + 0.5);
    this.rig.carriage.position.x = this.carriageX();
  }

  get shiftOn(): boolean {
    return this.shifted || this.shiftLocked;
  }

  handleKey(spec: KeySpec, typedChar?: string): void {
    if (this.returning) return;
    switch (spec.kind) {
      case "char":
        this.stroke(spec, typedChar);
        break;
      case "space":
        this.space(spec);
        break;
      case "back":
        this.backspace(spec);
        break;
      case "tab":
        this.tab(spec);
        break;
      case "shift":
        break;
      case "lock":
        this.toggleLock(spec);
        break;
      case "margin":
        this.marginReleased = true;
        this.pressKey(spec);
        this.audio.keyDown();
        break;
    }
  }

  setShift(on: boolean): void {
    if (this.shifted === on) return;
    this.shifted = on;
    this.animateShift();
  }

  toggleLock(spec?: KeySpec): void {
    this.shiftLocked = !this.shiftLocked;
    if (spec) this.pressKey(spec);
    this.animateShift();
    this.audio.shift();
  }

  toggleRibbon(): void {
    this.ribbon = this.ribbon === "black" ? "red" : "black";
    const lever = this.rig.colorLever;
    gsap.to(lever.rotation, {
      z: this.ribbon === "red" ? 0.55 : 0,
      duration: 0.28,
      ease: "power2.out",
    });
    this.onColor(this.ribbon);
    this.audio.keyDown();
  }

  returnCarriage(): void {
    if (this.returning) return;
    if (this.row >= ROWS - 1) {
      this.onHint("The page is full. Lift it, or keep going into the platen.");
    }
    this.returning = true;
    this.flickReturnLever();
    const duration = 0.42 + Math.min(0.45, this.col * 0.008);
    this.audio.carriageReturn(duration);
    this.col = MARGIN_LEFT;
    this.row = Math.min(ROWS - 1, this.row + 1);
    this.bellRang = false;
    this.marginReleased = false;
    this.paper.showLine(this.row);

    gsap.to(this.rig.carriage.position, {
      x: this.carriageX(),
      duration,
      ease: "power2.inOut",
    });
    gsap.to(this.rig.platenPivot.rotation, {
      x: this.rig.platenPivot.rotation.x + LINE_PITCH / 0.022,
      duration: 0.28,
      ease: "power2.out",
    });
    gsap.to(this.rig.returnLever.rotation, {
      y: 0,
      duration: 0.35,
      delay: duration * 0.55,
      ease: "power2.out",
      onComplete: () => {
        this.returning = false;
      },
    });
  }

  lineFeed(): void {
    this.audio.keyDown();
    this.row = Math.min(ROWS - 1, this.row + 1);
    gsap.to(this.rig.platenPivot.rotation, {
      x: this.rig.platenPivot.rotation.x + LINE_PITCH / 0.022,
      duration: 0.22,
      ease: "power2.out",
    });
  }

  private stroke(spec: KeySpec, typedChar?: string): void {
    if (this.atMargin()) {
      this.audio.keyDown();
      this.pressKey(spec);
      this.onHint("Margin. Return the carriage, or release it.");
      return;
    }
    const glyph =
      typedChar && typedChar.length === 1
        ? typedChar
        : this.shiftOn
          ? spec.shifted
          : spec.unshifted;
    const col = this.col;
    const row = this.row;
    this.paper.imprint(glyph, col, row, this.ribbon);
    this.advance();
    this.pressKey(spec);
    this.swingBar(spec.id);
    this.pulseVibrator();
    const idx = this.barIndex.get(spec.id) ?? 0;
    gsap.delayedCall(0.05, () => {
      this.audio.strike(idx);
      this.tickRibbon();
      this.tickEscapement();
    });
    this.typed += 1;
  }

  private space(spec: KeySpec): void {
    if (this.atMargin()) {
      this.pressKey(spec);
      return;
    }
    this.pressKey(spec);
    this.audio.space();
    this.advance();
  }

  private backspace(spec: KeySpec): void {
    this.pressKey(spec);
    this.audio.keyDown();
    this.col = Math.max(MARGIN_LEFT, this.col - 1);
    this.slideCarriage();
  }

  private tab(spec: KeySpec): void {
    this.pressKey(spec);
    this.audio.space();
    this.col = Math.min(MARGIN_RIGHT, this.col + 5);
    this.maybeBell();
    this.slideCarriage();
  }

  private advance(): void {
    this.col += 1;
    if (this.col > COLS - 1) this.col = COLS - 1;
    this.maybeBell();
    this.slideCarriage();
    this.paper.showLine(this.row);
  }

  private atMargin(): boolean {
    return this.col >= MARGIN_RIGHT && !this.marginReleased;
  }

  private maybeBell(): void {
    if (!this.bellRang && this.col >= BELL_COL) {
      this.bellRang = true;
      this.audio.bell();
      this.flickBell();
      this.onHint("End of the line.");
    }
  }

  private carriageX(): number {
    return this.startX - this.col * CHAR_PITCH;
  }

  private slideCarriage(): void {
    gsap.to(this.rig.carriage.position, {
      x: this.carriageX(),
      duration: 0.045,
      ease: "power2.out",
    });
  }

  private pressKey(spec: KeySpec): void {
    const key = this.rig.keys.get(spec.id);
    if (!key) return;
    gsap.killTweensOf(key.group.rotation);
    gsap.to(key.group.rotation, {
      x: key.pressRot,
      duration: 0.04,
      ease: "power2.in",
      onComplete: () => {
        gsap.to(key.group.rotation, {
          x: key.restRot,
          duration: 0.09,
          ease: "power1.out",
        });
      },
    });
  }

  private swingBar(id: string): void {
    const bar = this.rig.bars.get(id);
    if (!bar) return;
    gsap.killTweensOf(bar.pivot.rotation);
    gsap.to(bar.pivot.rotation, {
      x: bar.strike,
      duration: 0.048,
      ease: "power3.in",
      onComplete: () => {
        gsap.to(bar.pivot.rotation, {
          x: bar.rest,
          duration: 0.1,
          ease: "back.out(2.1)",
        });
      },
    });
  }

  private pulseVibrator(): void {
    const v = this.rig.vibrator;
    const lift = this.ribbon === "red" ? 0.007 : 0.0045;
    gsap.killTweensOf(v.position);
    const y = 0.154;
    gsap.to(v.position, {
      y: y + lift,
      duration: 0.04,
      ease: "power2.out",
      onComplete: () => {
        gsap.to(v.position, { y, duration: 0.08, ease: "power1.in" });
      },
    });
  }

  private tickRibbon(): void {
    const dir = this.col % 40 < 20 ? 1 : -1;
    this.rig.spoolL.rotation.y += 0.05 * dir;
    this.rig.spoolR.rotation.y += 0.05 * dir;
  }

  private tickEscapement(): void {
    this.rig.ratchet.rotation.z -= (Math.PI * 2) / 84;
  }

  private flickReturnLever(): void {
    gsap.to(this.rig.returnLever.rotation, {
      y: 0.7,
      duration: 0.12,
      ease: "power2.out",
    });
  }

  private flickBell(): void {
    gsap.fromTo(
      this.rig.bellHammer.rotation,
      { z: 0 },
      { z: -0.6, duration: 0.05, yoyo: true, repeat: 1, ease: "power2.inOut" },
    );
    gsap.fromTo(
      this.rig.bell.rotation,
      { z: 0 },
      { z: 0.12, duration: 0.05, yoyo: true, repeat: 3, ease: "sine.inOut" },
    );
  }

  private animateShift(): void {
    const on = this.shiftOn;
    this.audio.shift();
    gsap.to(this.rig.carriage.position, {
      y: on ? 0.007 : 0,
      duration: 0.16,
      ease: "power2.out",
    });
    const left = this.rig.keys.get("ShiftLeft");
    const right = this.rig.keys.get("ShiftRight");
    for (const key of [left, right]) {
      if (!key) continue;
      gsap.to(key.group.rotation, {
        x: on ? key.pressRot : key.restRot,
        duration: 0.12,
        ease: "power2.out",
      });
    }
  }

  demoBars(): gsap.core.Timeline {
    const ids = ["a", "s", "d", "f", "j", "k", "l"];
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
    ids.forEach((id, i) => {
      const bar = this.rig.bars.get(id);
      if (!bar) return;
      tl.to(
        bar.pivot.rotation,
        { x: bar.strike, duration: 0.22, ease: "power2.inOut", yoyo: true, repeat: 1 },
        i * 0.18,
      );
    });
    return tl;
  }
}
