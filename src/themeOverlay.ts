
// Blink theme transition overlay effect
// Two panels slide from top/bottom, meet in center, fade out, reveal new theme (slow blink effect)

// Theme blink overlay module (Vite-safe, production-safe)
let overlay: HTMLDivElement | null = null;
function createOverlay() {
  if (overlay) return;
  overlay = document.createElement("div");
  overlay.id = "theme-fade-overlay";
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "9999",
    pointerEvents: "none",
    background: "none",
    opacity: "1",
    transition: "opacity 1s cubic-bezier(0.4,0,0.2,1)",
    display: "block",
  });

  const topPanel = document.createElement("div");
  topPanel.className = "theme-fade-panel top";

  Object.assign(topPanel.style, {
    position: "absolute",
    left: "0",
    top: "0",
    width: "100%",
    height: "66%",
    background: "linear-gradient(to bottom, #0b1020 80%, transparent 100%)",
    transition: "transform 2.2s cubic-bezier(0.4,0,0.2,1)",
    transform: "translateY(-100%)",
  });

  const bottomPanel = document.createElement("div");
  bottomPanel.className = "theme-fade-panel bottom";

  Object.assign(bottomPanel.style, {
    position: "absolute",
    left: "0",
    bottom: "0",
    width: "100%",
    height: "66%",
    background: "linear-gradient(to top, #0b1020 80%, transparent 100%)",
    transition: "transform 2.2s cubic-bezier(0.4,0,0.2,1)",
    transform: "translateY(100%)",
  });

  overlay.appendChild(topPanel);
  overlay.appendChild(bottomPanel);
  document.body.appendChild(overlay);
}
export function showThemeOverlay() {
  if (!overlay) createOverlay();
  if (!overlay) return;
  const topPanel = overlay.querySelector<HTMLDivElement>(".top");
  const bottomPanel = overlay.querySelector<HTMLDivElement>(".bottom");
  if (!topPanel || !bottomPanel) return;
  overlay.style.opacity = "1";
  topPanel.style.transform = "translateY(-100%)";
  bottomPanel.style.transform = "translateY(100%)";
  // Slide in
  setTimeout(() => {
    topPanel.style.transform = "translateY(0)";
    bottomPanel.style.transform = "translateY(0)";
  }, 10);
  // Slide out
  setTimeout(() => {
    topPanel.style.transform = "translateY(-100%)";
    bottomPanel.style.transform = "translateY(100%)";
  }, 2000);

  // Fade out
  setTimeout(() => {
    overlay!.style.opacity = "0";
  }, 4500);
}