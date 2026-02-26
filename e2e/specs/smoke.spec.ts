import { test, expect } from "../fixtures/test";

test("landing page renders hero content", async ({ home }) => {
  await home.goto();
  await expect(home.heading(/automation engineered for reliability/i)).toBeVisible();
});

test("theme nav bar btn toggle works", async ({ home }) => {
  await home.goto();
  const initialTheme = await home.getTheme();
  const expectedAfterFirst = initialTheme === "dark" ? "light" : "dark";

  await home.toggleTheme();
  await home.waitForTheme(expectedAfterFirst);
  
  await home.toggleTheme();
  type Theme = "dark" | "light";
  await home.waitForTheme(initialTheme);
});

//Chat Bubble Renders
test("chat bubble renders", async ({ home }) => {
  await home.goto();
  await expect(home.chatBubble()).toBeVisible();
});
//
test("chat opens and greeting appears", async ({ home }) => {
  await home.goto();
  await home.openChat();
  await home.waitForGreeting();
});
//User Can Send Message and Receive Reply (CI Safe)
test("chatbot responds to user message", async ({ home, page }) => {
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
});

