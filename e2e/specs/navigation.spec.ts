
import { test, expect  } from "../fixtures/test";

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

test('Home page contact buttons work', async ({ home, page }) => {
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
/*
  // Copy email button: should copy to clipboard and show alert
    const btn = btnGroup.getByRole('button', { name: /^Copy email$/i });
    await btn.click();
  // Immediately after click, text should be "Copied" 
    await expect(btn).toHaveText("Copied", { timeout: 4000 });
  // Within 3s, it should revert back to "Copy email" 
    await expect(btn).toHaveText("Copy email", { timeout: 4000 });
*/
  // LinkedIn button: should open correct link in new tab
  const [linkedin] = await Promise.all([
    page.waitForEvent('popup'),
    btnGroup.getByRole('link', { name: /^LinkedIn$/i }).click(),
  ]);
  expect(linkedin.url()).toMatch(/linkedin\.com/i);
  await linkedin.close();

  // GitHub button: should open correct link in new tab
  const [github] = await Promise.all([
    page.waitForEvent('popup'),
    btnGroup.getByRole('link', { name: /^GitHub$/i }).click(),
  ]);
  expect(github.url()).toMatch(/github\.com/i);
  await github.close();
});

test('Home Footer page contact buttons work', async ({ home, page }) => {
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
/*
  // Copy email button: should copy to clipboard and show alert
    const btn = btnGroup.getByRole('button', { name: /^Copy email$/i });
    await btn.click();
  // Immediately after click, text should be "Copied" 
    await expect(btn).toHaveText("Copied", { timeout: 3000 });
  // Within 3s, it should revert back to "Copy email" 
    await expect(btn).toHaveText("Copy email", { timeout: 3000 });
*/
  // LinkedIn button: should open correct link in new tab
  const [linkedin] = await Promise.all([
    page.waitForEvent('popup'),
    btnGroup.getByRole('link', { name: /^LinkedIn$/i }).click(),
  ]);
  expect(linkedin.url()).toMatch(/linkedin\.com/i);
  await linkedin.close();

  // GitHub button: should open correct link in new tab
  const [github] = await Promise.all([
    page.waitForEvent('popup'),
    btnGroup.getByRole('link', { name: /^GitHub$/i }).click(),
  ]);
  expect(github.url()).toMatch(/github\.com/i);
  await github.close();
});

