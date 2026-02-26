import { expect, Locator, Page } from "@playwright/test";

type ExternalLinkOptions = {
  expectedHostname: string;
  expectedPathname?: string;
};

export async function assertExternalLinkOpensCorrectly(
  page: Page,
  link: Locator,
  { expectedHostname, expectedPathname }: ExternalLinkOptions
) {
  // Ensure link opens in new tab (UX contract)
  await expect(link).toHaveAttribute("target", "_blank");
  // Ensure security best practice is enforced
  await expect(link).toHaveAttribute("rel", /noreferrer/);
  // Capture popup event + click simultaneously
  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    link.click(),
  ]);

  // Wait until DOM is ready (avoid networkidle flakiness)
  await popup.waitForURL("**", { timeout: 10000 });

  const url = new URL(popup.url());

  // Validate hostname
  expect(url.hostname).toContain(expectedHostname);

  // Validate pathname if provided
  if (expectedPathname) {
    expect(url.pathname).toBe(expectedPathname);
  }

  await popup.close();
}