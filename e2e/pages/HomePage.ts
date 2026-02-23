import { expect, type Locator, type Page } from "@playwright/test";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class HomePage {
  constructor(private readonly page: Page) {}

  async toggleTheme() {
    await this.page.locator('#theme-toggle').click();
  }

  async getTheme() {
    return await this.page.evaluate(() => document.documentElement.getAttribute('data-theme'));
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
    return this.page.getByRole("link", { name: /resume/i });
  }

  async expectUrlHasSlug(slug: string) { 
    await expect(this.page).toHaveURL(new RegExp(`#${slug}$`)); 
  }
}
