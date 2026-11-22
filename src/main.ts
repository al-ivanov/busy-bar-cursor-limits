import { device } from "@shared/device";
import { loadValues } from "@shared/settings";
import manifest from "./appmeta/manifest.json";
import { config } from "./config";
import { fetchCursorUsage, type CursorUsage } from "./cursor";
import { buildFrames, type AppState, type DisplayMode } from "./frame";

/** App ID from manifest */
const APP = manifest.id;

/** How often to poll Cursor API by default */
const DEFAULT_REFRESH_MIN = config.refreshIntervalMin || 5;

/** Application state */
const state: AppState = {
  mode: config.defaultMode || "remaining",
  usage: null,
  loading: false,
  error: null,
  hasToken: Boolean(config.sessionToken?.trim()),
};

let stopped = false;
let sessionToken = config.sessionToken?.trim() || "";
let pollTimer: ReturnType<typeof setInterval> | null = null;
let lastDrawnIds: Set<string> = new Set();

const report = (err: unknown) =>
  console.error(`${APP}: ${err instanceof Error ? err.message : String(err)}`);

/** Sends the current frame state to the device */
async function redraw(): Promise<void> {
  if (stopped) return;
  try {
    const elements = buildFrames(state);
    const currentIds = new Set(elements.map((e) => (e as { id: string }).id));
    const removedIds = [...lastDrawnIds].filter((id) => !currentIds.has(id));

    // Remove any elements that disappeared between states (e.g. "SYNCING..." text)
    if (removedIds.length > 0) {
      await device.DisplayClear({
        application_name: APP,
        element_ids: removedIds,
      });
    }

    await device.DisplayDraw({
      application_name: APP,
      priority: 50,
      elements: elements as never,
    });

    lastDrawnIds = currentIds;
  } catch (err) {
    report(err);
  }
}

/** Fetches data from Cursor API and triggers redraw */
async function syncData(): Promise<void> {
  if (stopped) return;

  // Check config token
  sessionToken = config.sessionToken?.trim() || "";

  // Load custom settings (display mode / refresh interval) from web UI
  try {
    const settings = await loadValues();
    if (settings) {
      if (
        typeof settings.display_mode === "string" &&
        ["remaining", "used", "reset"].includes(settings.display_mode)
      ) {
        state.mode = settings.display_mode as DisplayMode;
      }
    }
  } catch {
    // Ignore settings load error and keep current
  }

  state.hasToken = Boolean(sessionToken);

  if (!state.hasToken) {
    state.loading = false;
    state.error = "No session token";
    await redraw();
    return;
  }

  state.loading = true;
  state.error = null;
  await redraw();

  try {
    const usage: CursorUsage = await fetchCursorUsage(sessionToken);
    state.usage = usage;
    state.loading = false;
    state.error = null;
  } catch (err) {
    state.loading = false;
    state.error = err instanceof Error ? err.message : String(err);
    report(err);
  }

  await redraw();
}

/** Cycles through display modes (remaining -> used -> reset -> remaining) */
function cycleMode(): void {
  const modes: DisplayMode[] = ["remaining", "used", "reset"];
  const nextIdx = (modes.indexOf(state.mode) + 1) % modes.length;
  state.mode = modes[nextIdx]!;
  void redraw().catch(report);
}

/** Entry point called at the end of script */
function main(): void {
  // Start initial sync and redraw
  void syncData().catch(report);

  // Set up periodic sync (every 5 minutes by default)
  pollTimer = setInterval(() => {
    void syncData().catch(report);
  }, DEFAULT_REFRESH_MIN * 60 * 1000);

  // Input event handler
  const unbind = listen("input", (event) => {
    if (stopped) return;

    // Exit on 'back' button short press
    if (event.key === "back" && event.action === "short") {
      stopped = true;
      if (pollTimer !== null) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      void device.DisplayClear({ application_name: APP }).catch(report);
      // Detach unbind asynchronously so this callback can finish cleanly
      setTimeout(unbind, 0);
      return;
    }

    // Toggle display mode with 'start' button
    if (event.key === "start" && event.action === "short") {
      cycleMode();
      return;
    }

    // Force refresh with 'ok' button
    if (event.key === "ok" && event.action === "short") {
      void syncData().catch(report);
      return;
    }

    // Cycle modes with encoder rotation
    if (event.key === "encoder" && (event.action === "clockwise" || event.action === "counterclockwise")) {
      cycleMode();
      return;
    }
  });
}

main();
