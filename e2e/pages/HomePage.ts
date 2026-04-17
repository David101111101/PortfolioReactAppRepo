/// <reference types="node" />
import { expect, type Locator, type Page } from "@playwright/test";
//This page object is designed to abstract away details of how the Home page is implemented, providing a stable API for tests. It should not contain assertions or test logic, only methods for interacting with the page and querying its state.
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
type Theme = "dark" | "light";
export class HomePage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }
  // This disables all animations and transitions to have a deterministic testing suite
  async enableTestMode() {
    await this.page.addInitScript(() => {
      document.documentElement.setAttribute("data-test-mode", "true");
    });
  }
  async toggleTheme() {
    await this.page.locator('#theme-toggle').click();
  }
  async getTheme(): Promise<Theme> {
    const theme = await this.page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );
    if (theme !== "dark" && theme !== "light") {
      throw new Error(`Unexpected theme value: ${theme}`);
    }
    return theme;
  }

  async waitForTheme(theme: string) {
  await expect(this.page.locator("html")).toHaveAttribute("data-theme", theme);
  }
  // ================= NAVIGATION =================
  // The project now uses advanced animations and dynamic content, so we need to ensure the page is fully loaded and stable before running tests, to make it deterministic we disable animations and wait for a key UI element to be visible. This makes tests more reliable and less flaky.
  async goto() {
  const basePath = (process.env.APP_BASE_PATH || "/").trim();
  const normalized = basePath.startsWith("/") ? basePath : `/${basePath}`;
  await this.enableTestMode();
  await this.page.goto(normalized,{ waitUntil: "domcontentloaded" });
  await this.page.evaluate(() => {
    document.documentElement.setAttribute("data-test-mode", "true");
  });
  await this.page.emulateMedia({ reducedMotion: "reduce" });
  // disable animations AFTER document exists
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
        }
        html, body {
          scroll-behavior: auto !important;
        }
      `
    });
    // Wait for actual UI landmarks that proves app mounted
    await this.page.evaluate(() => document.fonts.ready);
    await expect(this.heading(/automation engineered for reliability/i)).toBeVisible();
  }

  // Works whether nav item is implemented as <a> or <button>
  navItem(name: string): Locator {
    return this.page
      .getByRole("link", { name: new RegExp(`^${escapeRegExp(name)}$`, "i") })
      .or(this.page.getByRole("button", { name: new RegExp(`^${escapeRegExp(name)}$`, "i") }));
  }

  heading(nameOrRegex: string | RegExp): Locator {
    const name =
      typeof nameOrRegex === "string"
        ? new RegExp(`^${escapeRegExp(nameOrRegex)}$`, "i")
        : nameOrRegex;

    return this.page.getByRole("heading", { name });
  }


  async expectUrlHasSlug(slug: string) { 
    await expect(this.page).toHaveURL(new RegExp(`#${slug}$`)); 
  }

externalLink(name: RegExp, index = 0) {
  return this.page.getByRole("link", { name }).nth(index);
}

  // ================= HAMBURGER / RESPONSIVE NAV =================

  /** The hamburger toggle button (exists in DOM at all viewports, CSS hides it on desktop) */
  hamburgerBtn(): Locator {
    return this.page.locator("#hamburger-btn");
  }

  /** The mobile nav dropdown panel (only in DOM when menu is open) */
  mobilePanel(): Locator {
    return this.page.locator("#nav-mobile-panel");
  }

  /** The desktop horizontal nav wrapper */
  desktopNav(): Locator {
    return this.page.locator(".nav-desktop");
  }

  /** Set viewport to a mobile size (below 768px breakpoint) */
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 400, height: 844 });
  }

  /** Set viewport back to a standard desktop size */
  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  /** Open the mobile menu (asserts it was closed first) */
  async openMobileMenu() {
    await expect(this.hamburgerBtn()).toHaveAttribute("aria-expanded", "false");
    await this.hamburgerBtn().click();
    await expect(this.mobilePanel()).toBeVisible();
  }

  /** Close the mobile menu by clicking the hamburger again */
  async closeMobileMenu() {
    await expect(this.hamburgerBtn()).toHaveAttribute("aria-expanded", "true");
    await this.hamburgerBtn().click();
    await expect(this.mobilePanel()).not.toBeVisible();
  }

  // ================= CHATBOT =================

chatBubble() {
  return this.page.locator("#chat-bubble-widget");
}
chatWindow() {
  return this.page.locator("#chat-window-section");
}
chatInput() {
  return this.page.locator("#chat-window-section textarea");
}
assistantMessages() {
  return this.page.locator(".chat-assistant");
}
userMessages() {
  return this.page.locator(".chat-user");
}
private async waitForStableText(locator: Locator, stableChecks = 3, timeoutMs = 20000) {
  // Poll message content until it stops changing for several consecutive checks.
  let last = "";
  let stableCount = 0;

  await expect
    .poll(
      async () => {
        const current = (await locator.textContent())?.trim() ?? "";
        if (!current) {
          stableCount = 0;
          last = current;
          return false;
        }
        if (current === last) {
          stableCount += 1;
        } else {
          stableCount = 1;
          last = current;
        }
        return stableCount >= stableChecks;
      },
      {
        timeout: timeoutMs,
        intervals: [150, 300, 500],
        message: "Assistant message did not stabilize before timeout",
      }
    )
    .toBe(true);
}
async openChat() {
  const bubble = this.chatBubble();
  await expect(bubble).toBeVisible();
  await bubble.click();
  await expect(this.chatWindow()).toBeVisible();
}
async closeChat() {
  await this.page.keyboard.press("Escape");
  await expect(this.chatWindow()).not.toBeVisible();
}
async waitForGreeting() {
  const firstAssistant = this.assistantMessages().first();
  await firstAssistant.waitFor({ state: "visible" });
  await this.waitForStableText(firstAssistant);
}
async sendChatMessage(text: string) {
  await this.chatInput().fill(text);
  await this.chatInput().press("Enter");
}
async waitForAssistantReply() {
  await this.waitForStableText(this.assistantMessages().last());
}


}
