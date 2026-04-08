import { test, expect } from "../fixtures/test";

test("landing page renders hero content", async ({ home }, testInfo) => {
  const start = Date.now();
  await home.goto();
  await testInfo.attach("interaction-metrics", {
    body: JSON.stringify({ load_ms: Date.now() - start }),
    contentType: "application/json",
  });
  await expect(home.heading(/automation engineered for reliability/i)).toBeVisible();
});

test("theme nav bar btn toggle works", async ({ home }) => {
  await home.goto();
  const initialTheme = await home.getTheme();
  const expectedAfterFirst = initialTheme === "dark" ? "light" : "dark";

  await home.toggleTheme();
  await home.waitForTheme(expectedAfterFirst);

  await home.toggleTheme();
  await home.waitForTheme(initialTheme);
});

test("chat bubble renders", async ({ home }) => {
  await home.goto();
  await expect(home.chatBubble()).toBeVisible();
});

test("chat opens and greeting appears", async ({ home }) => {
  await home.goto();
  await home.openChat();
  await home.waitForGreeting();
});

test("chatbot responds to user message", async ({ home, page }, testInfo) => {
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
  const start = Date.now();
  await home.sendChatMessage(message);
  await home.waitForAssistantReply();
  await testInfo.attach("interaction-metrics", {
    body: JSON.stringify({ interaction_ms: Date.now() - start }),
    contentType: "application/json",
  });
  await expect(home.userMessages().last()).toHaveText(`> ${message}`);
  await expect(home.assistantMessages().last())
    .toContainText("Mocked assistant response");
});
