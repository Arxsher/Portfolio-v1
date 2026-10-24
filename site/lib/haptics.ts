// A light haptic tick on phones. Android has navigator.vibrate; iOS Safari
// has no vibration API, but toggling a native switch (<input switch>, iOS
// 18+) through its label makes the Taptic Engine click, so the tick toggles
// a hidden one twice. Elsewhere it does nothing.

let label: HTMLLabelElement | null = null;

function ensureSwitch() {
  if (label?.isConnected) return label;
  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = "haptic-switch";
  input.setAttribute("switch", "");
  input.setAttribute("aria-hidden", "true");
  input.tabIndex = -1;
  input.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-99px;top:0";
  label = document.createElement("label");
  label.htmlFor = input.id;
  label.setAttribute("aria-hidden", "true");
  label.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-99px;top:0";
  document.body.append(input, label);
  return label;
}

/** One short tick (call from a gesture or while one is under way). */
export function haptic() {
  if (typeof window === "undefined") return;
  try {
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      navigator.vibrate(10);
      return;
    }
    if (!matchMedia("(pointer: coarse)").matches) return;
    const el = ensureSwitch();
    el.click();
  } catch {}
}
