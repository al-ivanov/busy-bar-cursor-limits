import type { CursorUsage } from "./cursor";

export type DisplayMode = "remaining" | "used" | "reset";

export interface AppState {
  mode: DisplayMode;
  usage: CursorUsage | null;
  loading: boolean;
  error: string | null;
  hasToken: boolean;
}

// Colors (#RRGGBBAA)
const PURPLE_LOGO = "#7952FFFF";
const WHITE = "#FFFFFFFF";
const MUTED = "#8E8E93FF";
const BAR_BG = "#2C2C2EFF";
const GREEN = "#30D158FF";
const YELLOW = "#FFD60AFF";
const RED = "#FF453AFF";
const CYAN = "#00D2FFFF";

export function getStatusColor(remainingPercent: number): string {
  if (remainingPercent > 40) return GREEN;
  if (remainingPercent > 15) return YELLOW;
  return RED;
}

export function buildFrames(state: AppState): unknown[] {
  const elements: Record<string, unknown>[] = [];

  // ==========================================
  // 1. FRONT SCREEN (72x16 RGB LED Matrix)
  // ==========================================

  // Always show Cursor brand badge on the left (x: 1, y: 2, 13x12 px)
  elements.push({
    id: "f_badge_bg",
    type: "rectangle",
    display: "front",
    x: 1,
    y: 2,
    width: 13,
    height: 12,
    radius: 2,
    fill: "solid",
    fill_colors: [PURPLE_LOGO],
  });

  elements.push({
    id: "f_badge_glyph",
    type: "text",
    display: "front",
    x: 4,
    y: 3,
    text: ">",
    font: "bold",
    color: WHITE,
  });

  if (!state.hasToken) {
    // Prompt to set token
    elements.push({
      id: "f_val",
      type: "text",
      display: "front",
      x: 17,
      y: 1,
      text: "SET TOKEN",
      font: "bold",
      color: YELLOW,
    });
    elements.push({
      id: "f_sub",
      type: "text",
      display: "front",
      x: 17,
      y: 9,
      text: "IN CONFIG",
      font: "small",
      color: MUTED,
    });
  } else if (state.loading && !state.usage) {
    // Initial loading
    elements.push({
      id: "f_val",
      type: "text",
      display: "front",
      x: 17,
      y: 1,
      text: "CURSOR",
      font: "bold",
      color: WHITE,
    });
    elements.push({
      id: "f_sub",
      type: "text",
      display: "front",
      x: 17,
      y: 9,
      text: "SYNCING...",
      font: "small",
      color: PURPLE_LOGO,
    });
  } else if (state.error && !state.usage) {
    // Error without cached data
    elements.push({
      id: "f_val",
      type: "text",
      display: "front",
      x: 17,
      y: 1,
      text: "AUTH ERR",
      font: "bold",
      color: RED,
    });
    elements.push({
      id: "f_sub",
      type: "text",
      display: "front",
      x: 17,
      y: 9,
      text: "CHECK TOKEN",
      font: "small",
      color: MUTED,
    });
  } else if (state.usage) {
    const { usage, mode } = state;

    let mainText = "";
    let mainColor = WHITE;
    let fillRatio = 0;
    let barColor = GREEN;

    if (mode === "remaining") {
      mainText = `${Math.round(usage.remainingPercent)}% LEFT`;
      mainColor = getStatusColor(usage.remainingPercent);
      fillRatio = Math.max(0, Math.min(1, usage.remainingPercent / 100));
      barColor = mainColor;
    } else if (mode === "used") {
      mainText = `${Math.round(usage.usedPercent)}% USED`;
      if (usage.usedPercent < 50) {
        mainColor = GREEN;
      } else if (usage.usedPercent < 80) {
        mainColor = YELLOW;
      } else {
        mainColor = RED;
      }
      fillRatio = Math.max(0, Math.min(1, usage.usedPercent / 100));
      barColor = mainColor;
    } else if (mode === "reset") {
      mainText = `${usage.daysToReset ?? "?"}D RESET`;
      mainColor = CYAN;

      // Cycle days progress ratio
      let daysRatio = 0.5;
      if (usage.billingCycleStart && usage.billingCycleEnd) {
        const startMs = new Date(usage.billingCycleStart).getTime();
        const endMs = new Date(usage.billingCycleEnd).getTime();
        const now = Date.now();
        if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
          daysRatio = Math.max(0, Math.min(1, (endMs - now) / (endMs - startMs)));
        }
      } else if (usage.daysToReset !== null) {
        daysRatio = Math.max(0, Math.min(1, usage.daysToReset / 30));
      }

      fillRatio = daysRatio;
      barColor = CYAN;
    }

    elements.push({
      id: "f_val",
      type: "text",
      display: "front",
      x: 17,
      y: 1,
      text: mainText,
      font: "bold",
      color: mainColor,
    });

    // Progress Bar (width: 53 px, height: 3 px, from x: 17 to x: 70)
    elements.push({
      id: "f_bar_bg",
      type: "rectangle",
      display: "front",
      x: 17,
      y: 11,
      width: 53,
      height: 3,
      radius: 1,
      fill: "solid",
      fill_colors: [BAR_BG],
    });

    const fillWidth = Math.max(2, Math.round(fillRatio * 53));

    elements.push({
      id: "f_bar_fg",
      type: "rectangle",
      display: "front",
      x: 17,
      y: 11,
      width: fillWidth,
      height: 3,
      radius: 1,
      fill: "solid",
      fill_colors: [barColor],
    });
  }

  // ==========================================
  // 2. BACK SCREEN (160x80 OLED Screen)
  // ==========================================

  // Header
  elements.push({
    id: "b_title",
    type: "text",
    display: "back",
    x: 4,
    y: 3,
    text: "CURSOR PRO USAGE",
    font: "bold",
    color: PURPLE_LOGO,
  });

  elements.push({
    id: "b_divider",
    type: "rectangle",
    display: "back",
    x: 4,
    y: 15,
    width: 152,
    height: 1,
    fill: "solid",
    fill_colors: ["#3A3A3CFF"],
  });

  if (!state.hasToken) {
    elements.push({
      id: "b_msg1",
      type: "text",
      display: "back",
      x: 4,
      y: 22,
      text: "No session token configured.",
      font: "small",
      color: YELLOW,
    });
    elements.push({
      id: "b_msg2",
      type: "text",
      display: "back",
      x: 4,
      y: 36,
      text: "Paste token in src/config.ts",
      font: "small",
      color: WHITE,
    });
    elements.push({
      id: "b_msg3",
      type: "text",
      display: "back",
      x: 4,
      y: 50,
      text: "Run: npm run set-token <token>",
      font: "small",
      color: MUTED,
    });
  } else if (state.usage) {
    const { usage } = state;
    const color = getStatusColor(usage.remainingPercent);

    elements.push({
      id: "b_row1",
      type: "text",
      display: "back",
      x: 4,
      y: 20,
      text: `Plan: ${usage.plan.toUpperCase()}  [${state.mode.toUpperCase()}]`,
      font: "small",
      color: WHITE,
    });

    elements.push({
      id: "b_row2",
      type: "text",
      display: "back",
      x: 4,
      y: 33,
      text: `Remaining: ${usage.remainingPercent.toFixed(1)}%`,
      font: "small",
      color,
    });

    elements.push({
      id: "b_row3",
      type: "text",
      display: "back",
      x: 4,
      y: 46,
      text: `Used: ${usage.usedPercent.toFixed(1)}% (Auto pool)`,
      font: "small",
      color: MUTED,
    });

    const resetStr = usage.daysToReset !== null ? `${usage.daysToReset} days` : "N/A";
    elements.push({
      id: "b_row4",
      type: "text",
      display: "back",
      x: 4,
      y: 59,
      text: `Reset in: ${resetStr}`,
      font: "small",
      color: WHITE,
    });

    elements.push({
      id: "b_hint",
      type: "text",
      display: "back",
      x: 4,
      y: 71,
      text: "[START: Mode] [OK: Sync]",
      font: "tiny",
      color: MUTED,
    });
  }

  return elements;
}
