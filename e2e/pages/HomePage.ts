import { expect, type Locator, type Page } from "@playwright/test";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class HomePage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  // Works whether your nav item is implemented as <a> or <button>
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

  async expectHeadingInViewport(title: string, ratio = 0.2) {
    await expect(this.heading(title)).toBeInViewport({ ratio }); // viewport assertion
  }
}
