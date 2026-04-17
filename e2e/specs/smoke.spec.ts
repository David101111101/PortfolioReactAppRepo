import { test, expect } from "../fixtures/test";

test("landing page renders hero content", async ({ home }, testInfo) => {
  const start = Date.now();
  await home.goto();
  await testInfo.attach("interaction-metrics", {
    body: JSON.stringify({ load_ms: Date.now() - start }),
    contentType: "application/json",
  });
  await expect(home.heading(/automation engineered for reliability/i)).toBeVisible();
});

test("theme nav bar btn toggle works", async ({ home }) => {
  await home.goto();
  const initialTheme = await home.getTheme();
  const expectedAfterFirst = initialTheme === "dark" ? "light" : "dark";

  await home.toggleTheme();
  await home.waitForTheme(expectedAfterFirst);

  await home.toggleTheme();
  await home.waitForTheme(initialTheme);
});

test("chat bubble renders", async ({ home }) => {
  await home.goto();
  await expect(home.chatBubble()).toBeVisible();
});

test("chat opens and greeting appears", async ({ home }) => {
  await home.goto();
  await home.openChat();
  await home.waitForGreeting();
});

test("chatbot responds to user message", async ({ home, page }, testInfo) => {
  await home.goto();

  // Mock backend for deterministic CI behavior
  await page.route("**portfolio-chatbot**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/plain",
      body: "Mocked assistant response"
    });
  });

  await home.openChat();
  await home.waitForGreeting();
  const message = "Test message";
  const start = Date.now();
  await home.sendChatMessage(message);
  await home.waitForAssistantReply();
  await testInfo.attach("interaction-metrics", {
    body: JSON.stringify({ interaction_ms: Date.now() - start }),
    contentType: "application/json",
  });
  await expect(home.userMessages().last()).toHaveText(`> ${message}`);
  await expect(home.assistantMessages().last())
    .toContainText("Mocked assistant response");
});

// ── Responsive hamburger menu ──────────────────────────────────────────────

test.describe("Responsive hamburger menu", () => {

  test("hamburger button is hidden on desktop and desktop nav is visible", async ({ home }) => {
    await home.goto();
    // Default Playwright viewport is 1280×720 — well above the 768px breakpoint
    await expect(home.hamburgerBtn()).not.toBeVisible();
    await expect(home.desktopNav()).toBeVisible();
  });

  test("hamburger button is visible on mobile and desktop nav is hidden", async ({ home }) => {
    await home.goto();
    await home.setMobileViewport();
    await expect(home.hamburgerBtn()).toBeVisible();
    await expect(home.desktopNav()).not.toBeVisible();
  });

  test("mobile menu opens and closes via hamburger button", async ({ home }) => {
    await home.goto();
    await home.setMobileViewport();

    // Panel absent before first open
    await expect(home.mobilePanel()).not.toBeVisible();
    await expect(home.hamburgerBtn()).toHaveAttribute("aria-expanded", "false");
    await expect(home.hamburgerBtn()).toHaveAttribute("aria-label", "Open menu");

    await home.openMobileMenu();

    await expect(home.hamburgerBtn()).toHaveAttribute("aria-expanded", "true");
    await expect(home.hamburgerBtn()).toHaveAttribute("aria-label", "Close menu");

    await home.closeMobileMenu();

    await expect(home.hamburgerBtn()).toHaveAttribute("aria-expanded", "false");
    await expect(home.hamburgerBtn()).toHaveAttribute("aria-label", "Open menu");
  });

  test("clicking outside the mobile menu closes it", async ({ home, page }) => {
    await home.goto();
    await home.setMobileViewport();
    await home.openMobileMenu();

    // Click on the page title — outside both the panel and hamburger button
    await page.locator("#title-name").click();
    await expect(home.mobilePanel()).not.toBeVisible();
    await expect(home.hamburgerBtn()).toHaveAttribute("aria-expanded", "false");
  });

  test("mobile menu auto-closes when viewport resizes to desktop", async ({ home }) => {
    await home.goto();
    await home.setMobileViewport();
    await home.openMobileMenu();

    // Resize to desktop — matchMedia listener in Header closes the menu
    await home.setDesktopViewport();
    await expect(home.mobilePanel()).not.toBeVisible();
  });

  test("all nav links including AI Dashboard are present in mobile panel", async ({ home }) => {
    await home.goto();
    await home.setMobileViewport();
    await home.openMobileMenu();

    const panel = home.mobilePanel();
    for (const label of ["Projects", "Diplomas", "Experience", "Contact", "AI Dashboard"]) {
      await expect(panel.getByRole("link", { name: label })).toBeVisible();
    }
  });

  test("clicking a nav link in mobile panel closes the menu and navigates", async ({ home, page }) => {
    await home.goto();
    await home.setMobileViewport();
    await home.openMobileMenu();

    await home.mobilePanel().getByRole("link", { name: "Projects" }).click();
    await expect(home.mobilePanel()).not.toBeVisible();
    await expect(page.locator("#projects")).toBeInViewport();
  });

});
