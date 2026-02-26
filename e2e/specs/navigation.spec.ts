
import { test, expect  } from "../fixtures/test";
import { assertExternalLinkOpensCorrectly } from "../utils/assertExternalLink";

const cases = [ //Objects for test cases, each with a nav item and the expected heading it should scroll to
  { nav: "Projects",   slug: "projects" },
  { nav: "Diplomas",   slug: "diplomas" },
  { nav: "Experience", slug: "experience" },
  { nav: "Contact",    slug: "contact" },
];

// Loop through each test case and create a test that checks if clicking the nav item scrolls to the correct heading
for (const c of cases) {
  test(`nav "${c.nav}" navigates to "#${c.slug}"`, async ({ home }) => {
    await home.goto();
    await home.navItem(c.nav).click();
    await home.expectUrlHasSlug(c.slug);
  });
}

test("Resume PDF is accessible", async ({ page, home }) => {
  await home.goto();
  const href = await home.resumeLink().getAttribute("href");
  expect(href).toBeTruthy();
  const url = href!.startsWith("http")
    ? href!
    : `https://www.daveautomation.dev${href}`;
  const response = await page.request.get(url);
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("pdf");
});


test('Email Button header work', async ({ home, page }) => {
  await home.goto();
  // Target only the button group in the main hero section (id='section')
  const heroSection = page.locator('section#section');
  await heroSection.scrollIntoViewIfNeeded();
  await expect(heroSection).toBeVisible();
  const btnGroup = heroSection.locator('.ContainerOfBtn');
  await expect(btnGroup).toBeVisible();

  // Email me button: should have correct mailto href
  const emailBtn = btnGroup.getByRole('link', { name: /^Email me$/i });
  await expect(emailBtn).toBeVisible();
  await expect(emailBtn).toBeEnabled();
  await expect(emailBtn).toHaveAttribute('href', /^mailto:/i);
});
test('Copy Email Header Button works', async ({ home, page }) => {
// Copy email button: should copy to clipboard and change text
await page.addInitScript(() => {
  // Mock clipboard API for testing since Playwright doesn't have native clipboard support. 
  //  This mock allows us to verify that the correct text is being "copied" when the button is clicked.
  const clipboardStore = { value: "" };
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: async (text: string) => {
        clipboardStore.value = text;
      },
      readText: async () => clipboardStore.value,
    },
    configurable: true,
  });
});

await home.goto();
const btnHeader = page
  .locator('section#section .ContainerOfBtn button');
await expect(btnHeader).toHaveText("Copy email");
await btnHeader.click();
// Assert UI change
await expect(btnHeader).toHaveText("Copied");
// Assert clipboard value
const clipboardText = await page.evaluate(() =>
  navigator.clipboard.readText()
);
expect(clipboardText).toBe("davidstevenabril@gmail.com");
// Assert revert
await expect(btnHeader).toHaveText("Copy email", { timeout: 4000 });
})
test("Home page external buttons work", async ({ home, page }) => {
  await home.goto();
    const btnLinkedInHeader = home.externalLink(/^LinkedIn$/i, 0);
    const btnGitHubHeader = home.externalLink(/^GitHub$/i, 0);
    const btnLinkedInFooter = home.externalLink(/^LinkedIn$/i, 1);
    const btnGitHubFooter = home.externalLink(/^GitHub$/i, 1);
    await assertExternalLinkOpensCorrectly(page, btnLinkedInHeader, {
      expectedHostname: "www.linkedin.com",
      expectedPathname: "",
    }); 

    await assertExternalLinkOpensCorrectly(page, btnGitHubHeader, {
      expectedHostname: "github.com",
      expectedPathname: "/David101111101",
    });

    await assertExternalLinkOpensCorrectly(page, btnLinkedInFooter, {
      expectedHostname: "www.linkedin.com",
      expectedPathname: "",
    });

    await assertExternalLinkOpensCorrectly(page, btnGitHubFooter, {
      expectedHostname: "github.com",
      expectedPathname: "/David101111101",
    });
});
test('Footer page contact buttons work', async ({ home, page }) => {
  await home.goto();

  // Scroll to the contact section to ensure visibility and avoid flakiness
  const contactSection = page.locator('section#contact');
  await contactSection.scrollIntoViewIfNeeded();
  await expect(contactSection).toBeVisible();

  // Find the button group inside the contact section (should be unique)
  const btnGroup = contactSection.locator('.ContainerOfBtn');
  await expect(btnGroup).toBeVisible();

  // Email me button: should have correct mailto href
  const emailBtn = btnGroup.getByRole('link', { name: /^Email me$/i });
  await expect(emailBtn).toBeVisible();
  await expect(emailBtn).toBeEnabled();
  await expect(emailBtn).toHaveAttribute('href', /^mailto:/i);
});
test('Copy Email Footer Button works', async ({ home, page }) => {
// Copy email button: should copy to clipboard and change text
await page.addInitScript(() => {
  // Mock clipboard API for testing since Playwright doesn't have native clipboard support. 
  //  This mock allows us to verify that the correct text is being "copied" when the button is clicked.
  const clipboardStore = { value: "" };
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: async (text: string) => {
        clipboardStore.value = text;
      },
      readText: async () => clipboardStore.value,
    },
    configurable: true,
  });
});

await home.goto();
const btnFooter = page
  .locator('section#contact .ContainerOfBtn button');
await expect(btnFooter).toHaveText("Copy email");
await btnFooter.click();
// Assert UI change
await expect(btnFooter).toHaveText("Copied");
// Assert clipboard value
const clipboardText = await page.evaluate(() =>
  navigator.clipboard.readText()
);
expect(clipboardText).toBe("davidstevenabril@gmail.com");
// Assert revert
await expect(btnFooter).toHaveText("Copy email", { timeout: 4000 });
})
