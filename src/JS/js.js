
// Blink theme transition overlay effect
// Two panels slide from top/bottom, meet in center, fade out, reveal new theme (slow blink effect)
document.addEventListener("DOMContentLoaded", function () {
	// Create overlay container if not present
	let overlay = document.getElementById("theme-fade-overlay");
	if (!overlay) {
		overlay = document.createElement("div");
		overlay.id = "theme-fade-overlay";
		overlay.style.position = "fixed";
		overlay.style.inset = "0";
		overlay.style.zIndex = "9999";
		overlay.style.pointerEvents = "none";
		overlay.style.background = "none";
		overlay.style.opacity = "1";
		overlay.style.transition = "opacity 1s cubic-bezier(0.4,0,0.2,1)";
		overlay.style.display = "block";

		// Top panel
		const topPanel = document.createElement("div");
		topPanel.className = "theme-fade-panel top";
		topPanel.style.position = "absolute";
		topPanel.style.left = "0";
		topPanel.style.top = "0";
		topPanel.style.width = "100%";
		topPanel.style.height = "66%";
		topPanel.style.background = "linear-gradient(to bottom, #0b1020 80%, transparent 100%)";
		topPanel.style.transition = "transform 2.2s cubic-bezier(0.4,0,0.2,1)";
		topPanel.style.transform = "translateY(-100%)";

		// Bottom panel
		const bottomPanel = document.createElement("div");
		bottomPanel.className = "theme-fade-panel bottom";
		bottomPanel.style.position = "absolute";
		bottomPanel.style.left = "0";
		bottomPanel.style.bottom = "0";
		bottomPanel.style.width = "100%";
		bottomPanel.style.height = "66%";
		bottomPanel.style.background = "linear-gradient(to top, #0b1020 80%, transparent 100%)";
		bottomPanel.style.transition = "transform 2.2s cubic-bezier(0.4,0,0.2,1)";
		bottomPanel.style.transform = "translateY(100%)";

		overlay.appendChild(topPanel);
		overlay.appendChild(bottomPanel);
		document.body.appendChild(overlay);
	}

	window.showThemeOverlay = function () {
		// Reset panels
		const topPanel = overlay.querySelector(".theme-fade-panel.top");
		const bottomPanel = overlay.querySelector(".theme-fade-panel.bottom");
		overlay.style.opacity = "1";
		topPanel.style.transform = "translateY(-100%)";
		bottomPanel.style.transform = "translateY(100%)";

		// Panels always #0b1020
		topPanel.style.background = `linear-gradient(to bottom, #0b1020 80%, transparent 100%)`;
		bottomPanel.style.background = `linear-gradient(to top, #0b1020 80%, transparent 100%)`;

		// Step 1: panels slide to center (3s)
		setTimeout(() => {
			topPanel.style.transform = "translateY(0)";
			bottomPanel.style.transform = "translateY(0)";
		}, 10);
		// Step 2: panels slide back out (2.5s)
		setTimeout(() => {
			topPanel.style.transform = "translateY(-100%)";
			bottomPanel.style.transform = "translateY(100%)";
		}, 2000);

		// Step 3: fade out overlay after 5.5s
		setTimeout(() => {
			overlay.style.opacity = "0";
		}, 4500);

		// Step 6: reset overlay after fade
		setTimeout(() => {
			overlay.style.opacity = "1";
		}, 4500);
	};
});
