import { test } from "../fixtures/test";

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

