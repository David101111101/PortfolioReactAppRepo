import { test } from "../fixtures/test";

const cases = [ //Objects for test cases, each with a nav item and the expected heading it should scroll to
  { nav: "Projects", heading: "Projects" },
  { nav: "Diplomas", heading: "Diplomas" },
  { nav: "Experience", heading: "Experience" },
  { nav: "Contact", heading: "Contact" },
];

// Loop through each test case and create a test that checks if clicking the nav item scrolls to the correct heading
for (const c of cases) {
  test(`nav "${c.nav}" scrolls to "${c.heading}"`, async ({ home }) => {
    await home.goto();
    await home.navItem(c.nav).click();
    await home.expectHeadingInViewport(c.heading);
  });
}
