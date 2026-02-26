import { expect, type Locator, type Page } from "@playwright/test";
//This page object is designed to abstract away details of how the Home page is implemented, providing a stable API for tests. It should not contain assertions or test logic, only methods for interacting with the page and querying its state.
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
type Theme = "dark" | "light";
export class HomePage {
  constructor(private readonly page: Page) {}
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
  async goto() {
  const basePath = (process.env.APP_BASE_PATH || "/").trim();
  const normalized = basePath.startsWith("/") ? basePath : `/${basePath}`;
  await this.page.goto(normalized);
  // Guard: wait for React app to actually render
  await this.page.waitForSelector("#root", { timeout: 10000 });
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

  resumeLink(): Locator {
    return this.page.getByRole('link', { name: 'Resume' });
  }

  async expectUrlHasSlug(slug: string) { 
    await expect(this.page).toHaveURL(new RegExp(`#${slug}$`)); 
  }

externalLink(name: RegExp, index = 0) {
  return this.page.getByRole("link", { name }).nth(index);
}

  // ================= CHATBOT =================

chatBubble() {
  return this.page.locator("#chatBubbleWidget");
}
chatWindow() {
  return this.page.locator("#chat-window-section");
}
chatInput() {
  return this.page.locator("#chat-window-section input");
}
assistantMessages() {
  return this.page.locator(".chat-assistant");
}
userMessages() {
  return this.page.locator(".chat-user");
}
async openChat() {
  await this.chatBubble().click();
  await expect(this.chatWindow()).toBeVisible();
}
async waitForGreeting() {
  // Wait until assistant message is non-empty
  await expect(this.assistantMessages().first()).not.toHaveText("");
}
async sendChatMessage(text: string) {
  await this.chatInput().fill(text);
  await this.chatInput().press("Enter");
}
async waitForAssistantReply() {
  // Wait until last assistant message stabilizes (stream finished)
  await expect(this.assistantMessages().last()).not.toHaveText("");
}


}
