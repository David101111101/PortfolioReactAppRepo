
import { test, expect  } from "../fixtures/test";
import { assertExternalLinkOpensCorrectly } from "../utils/assertExternalLink";

test('Copy Email Header Button works', async ({ home, page }) => {
await home.goto();
const btnHeader = page.getByRole('button', { name: /^Copy email$/i }).first();
await expect(btnHeader).toHaveText("Copy email");
await btnHeader.scrollIntoViewIfNeeded();
await btnHeader.click();
await expect.poll(async () => (await btnHeader.textContent())?.trim()).toMatch(
  /^(Copied|Copy email)$/
);
})

test('Copy Email Footer Button works', async ({ home, page }) => {
await home.goto();
const btnFooter = page.getByRole("button", { name: /^Copy email$/i }).nth(1);
await expect(btnFooter).toHaveText("Copy email");
await btnFooter.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
await btnFooter.click();
await expect.poll(async () => (await btnFooter.textContent())?.trim()).toMatch(
  /^(Copied|Copy email)$/
);
})

const cases = [ //Objects for test cases, each with a nav item and the expected heading it should scroll to
  { nav: "Projects",   slug: "projects" },
  { nav: "Diplomas",   slug: "diplomas" },
  { nav: "Experience", slug: "experience" },
  { nav: "Contact",    slug: "contact" },
];

// Loop through each test case and create a test that checks if clicking the nav item scrolls to the correct heading
for (const c of cases) {
  test(`nav "${c.nav}" navigates to "#${c.slug}"`, async ({ home, page}, testInfo) => {
    await home.goto();
    const navItem = home.navItem(c.nav);
    await navItem.scrollIntoViewIfNeeded();
    const start = Date.now();
    await navItem.click();
    await testInfo.attach("interaction-metrics", {
      body: JSON.stringify({ interaction_ms: Date.now() - start }),
      contentType: "application/json",
    });
    await expect(page.locator(`#${c.slug}`)).toBeInViewport();
  });
}

test('Email Button header work', async ({ home, page }) => {
  await home.goto();
  // Target only the button group in the main hero section (id='section')
  const heroSection = page.locator('section#section');
  await heroSection.scrollIntoViewIfNeeded();
  await expect(heroSection).toBeVisible();
  const btnGroup = heroSection.locator('.container-of-btn');
  await expect(btnGroup).toBeVisible();

  // Email me button: should have correct mailto href
  const emailBtn = btnGroup.getByRole('link', { name: /^Email me$/i });
  await expect(emailBtn).toBeVisible();
  await expect(emailBtn).toBeEnabled();
  await expect(emailBtn).toHaveAttribute('href', /^mailto:/i);
});
test('nav "AI Dashboard" navigates to "#/dashboard"', async ({ home, page }) => {
  await home.goto();
  await home.navItem("AI Dashboard").first().click();
  await expect(page).toHaveURL(/#\/dashboard/);
});

test("Home page external buttons work", async ({ home, page }) => {
  await home.goto();
    const btnLinkedInHeader = home.externalLink(/^LinkedIn$/i, 0);
    const btnLinkedInFooter = home.externalLink(/^LinkedIn$/i, 1);
    const btnGitHubHeader = home.externalLink(/^GitHub$/i, 0);
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
  const btnGroup = contactSection.locator('.container-of-btn');
  await expect(btnGroup).toBeVisible();

  // Email me button: should have correct mailto href
  const emailBtn = btnGroup.getByRole('link', { name: /^Email me$/i });
  await expect(emailBtn).toBeVisible();
  await expect(emailBtn).toBeEnabled();
  await expect(emailBtn).toHaveAttribute('href', /^mailto:/i);
});
test("chatbot opens and responds to mocked user message", async ({ home, page }) => {
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
  await home.sendChatMessage(message);
  await expect(home.userMessages().last()).toHaveText(`> ${message}`);
  await home.waitForAssistantReply();
  await expect(home.assistantMessages().last())
    .toContainText("Mocked assistant response");
  await home.closeChat();

});
