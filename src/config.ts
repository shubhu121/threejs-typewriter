export const CHAR_PITCH = 0.00254;
export const LINE_PITCH = 0.00423;
export const COLS = 70;
export const ROWS = 28;
export const MARGIN_LEFT = 4;
export const MARGIN_RIGHT = 64;
export const BELL_COL = 57;

export const PAPER = {
  width: 0.216,
  height: 0.28,
  canvasW: 1536,
  canvasH: 1984,
} as const;

export type KeyKind =
  | "char"
  | "shift"
  | "lock"
  | "space"
  | "back"
  | "tab"
  | "margin";

export type KeySpec = {
  id: string;
  kind: KeyKind;
  label: string;
  shiftLabel?: string;
  codes: string[];
  unshifted: string;
  shifted: string;
  row: number;
  index: number;
  span?: number;
  dark?: boolean;
};

const char = (
  id: string,
  label: string,
  shiftLabel: string,
  codes: string[],
  unshifted: string,
  shifted: string,
  row: number,
  index: number,
): KeySpec => ({
  id,
  kind: "char",
  label,
  shiftLabel,
  codes,
  unshifted,
  shifted,
  row,
  index,
});

export const KEYS: KeySpec[] = [
  char("1", "1", "!", ["Digit1"], "1", "!", 0, 0),
  char("2", "2", "@", ["Digit2"], "2", "@", 0, 1),
  char("3", "3", "#", ["Digit3"], "3", "#", 0, 2),
  char("4", "4", "$", ["Digit4"], "4", "$", 0, 3),
  char("5", "5", "%", ["Digit5"], "5", "%", 0, 4),
  char("6", "6", "¢", ["Digit6"], "6", "¢", 0, 5),
  char("7", "7", "&", ["Digit7"], "7", "&", 0, 6),
  char("8", "8", "*", ["Digit8"], "8", "*", 0, 7),
  char("9", "9", "(", ["Digit9"], "9", "(", 0, 8),
  char("0", "0", ")", ["Digit0"], "0", ")", 0, 9),
  char("-", "-", "_", ["Minus"], "-", "_", 0, 10),

  {
    id: "Backspace",
    kind: "back",
    label: "BACK\nSPACE",
    codes: ["Backspace"],
    unshifted: "",
    shifted: "",
    row: 0,
    index: 11,
    span: 1.45,
    dark: true,
  },

  {
    id: "Tab",
    kind: "tab",
    label: "TAB",
    codes: ["Tab"],
    unshifted: "",
    shifted: "",
    row: 1,
    index: 0,
    span: 1.25,
    dark: true,
  },
  char("q", "Q", "", ["KeyQ"], "q", "Q", 1, 1),
  char("w", "W", "", ["KeyW"], "w", "W", 1, 2),
  char("e", "E", "", ["KeyE"], "e", "E", 1, 3),
  char("r", "R", "", ["KeyR"], "r", "R", 1, 4),
  char("t", "T", "", ["KeyT"], "t", "T", 1, 5),
  char("y", "Y", "", ["KeyY"], "y", "Y", 1, 6),
  char("u", "U", "", ["KeyU"], "u", "U", 1, 7),
  char("i", "I", "", ["KeyI"], "i", "I", 1, 8),
  char("o", "O", "", ["KeyO"], "o", "O", 1, 9),
  char("p", "P", "", ["KeyP"], "p", "P", 1, 10),
  char(";", ";", ":", ["Semicolon"], ";", ":", 1, 11),

  {
    id: "Lock",
    kind: "lock",
    label: "SHIFT\nLOCK",
    codes: ["CapsLock"],
    unshifted: "",
    shifted: "",
    row: 2,
    index: 0,
    span: 1.35,
    dark: true,
  },
  char("a", "A", "", ["KeyA"], "a", "A", 2, 1),
  char("s", "S", "", ["KeyS"], "s", "S", 2, 2),
  char("d", "D", "", ["KeyD"], "d", "D", 2, 3),
  char("f", "F", "", ["KeyF"], "f", "F", 2, 4),
  char("g", "G", "", ["KeyG"], "g", "G", 2, 5),
  char("h", "H", "", ["KeyH"], "h", "H", 2, 6),
  char("j", "J", "", ["KeyJ"], "j", "J", 2, 7),
  char("k", "K", "", ["KeyK"], "k", "K", 2, 8),
  char("l", "L", "", ["KeyL"], "l", "L", 2, 9),
  char("'", "'", '"', ["Quote"], "'", '"', 2, 10),
  {
    id: "Margin",
    kind: "margin",
    label: "MAR\nREL",
    codes: ["Backslash"],
    unshifted: "",
    shifted: "",
    row: 2,
    index: 11,
    span: 1.15,
    dark: true,
  },

  {
    id: "ShiftLeft",
    kind: "shift",
    label: "SHIFT",
    codes: ["ShiftLeft"],
    unshifted: "",
    shifted: "",
    row: 3,
    index: 0,
    span: 1.7,
    dark: true,
  },
  char("z", "Z", "", ["KeyZ"], "z", "Z", 3, 1),
  char("x", "X", "", ["KeyX"], "x", "X", 3, 2),
  char("c", "C", "", ["KeyC"], "c", "C", 3, 3),
  char("v", "V", "", ["KeyV"], "v", "V", 3, 4),
  char("b", "B", "", ["KeyB"], "b", "B", 3, 5),
  char("n", "N", "", ["KeyN"], "n", "N", 3, 6),
  char("m", "M", "", ["KeyM"], "m", "M", 3, 7),
  char(",", ",", ",", ["Comma"], ",", ",", 3, 8),
  char(".", ".", ".", ["Period"], ".", ".", 3, 9),
  char("/", "/", "?", ["Slash"], "/", "?", 3, 10),
  {
    id: "ShiftRight",
    kind: "shift",
    label: "SHIFT",
    codes: ["ShiftRight"],
    unshifted: "",
    shifted: "",
    row: 3,
    index: 11,
    span: 1.7,
    dark: true,
  },

  {
    id: "Space",
    kind: "space",
    label: "",
    codes: ["Space"],
    unshifted: " ",
    shifted: " ",
    row: 4,
    index: 3,
    span: 6.4,
  },
];

export const CODE_TO_KEY = new Map<string, KeySpec>();
for (const key of KEYS) {
  for (const code of key.codes) CODE_TO_KEY.set(code, key);
}

export type FocusId =
  | "typebars"
  | "ribbon"
  | "carriage"
  | "platen"
  | "shift"
  | "bell";

export const FOCUS_COPY: Record<
  FocusId,
  { index: string; title: string; body: string }
> = {
  typebars: {
    index: "01  Basket",
    title: "Type bars",
    body: "Forty-odd bars rest in a slotted segment, fanned toward one striking point. A key throws its bar up through the ribbon. A spring brings it home before the next one flies.",
  },
  ribbon: {
    index: "02  Inking",
    title: "Ribbon & vibrator",
    body: "A two-color ribbon rides a pair of vertical spools. On each stroke a fork lifts it into the path of the type, then drops it so the line stays visible. Flip the selector for red.",
  },
  carriage: {
    index: "03  Spacing",
    title: "Carriage & escapement",
    body: "A mainspring pulls the carriage left. The escapement holds it, then lets go one tooth at a time, a letter-space per stroke. That ratchet is the machine's clock.",
  },
  platen: {
    index: "04  Paper",
    title: "Platen & feed",
    body: "The rubber roller is the anvil. Type hits it through ink and paper. The return lever both dumps the carriage home and turns the platen to the next line.",
  },
  shift: {
    index: "05  Case",
    title: "Shift",
    body: "Each slug carries two characters, one above the other. Shift lifts the whole carriage so the capital strikes the same point. Shift lock holds it there.",
  },
  bell: {
    index: "06  End of line",
    title: "Margin & bell",
    body: "A stop on the rear rack trips a hammer a few spaces before the right margin. The ding means return the carriage, or the letters will start to pile.",
  },
};
