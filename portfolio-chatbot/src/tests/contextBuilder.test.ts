import { describe, it, expect } from "vitest";
import { buildContext } from "../rag/contextBuilder";

describe("Context Builder", () => {

  it("joins documents correctly", () => {
    const docs = [
      { content: "Readme-ci-cd-performance-testing.md" },
      { content: "../../data/readmes/Readme-cypress-backend-automation.md" },
    ];

    const result = buildContext(docs);

    expect(result.context).toContain("Readme-ci-cd-performance-testing.md");
    expect(result.context).toContain("../../data/readmes/Readme-cypress-backend-automation.md");
    expect(result.truncated).toBe(false);
  });

  it("truncates when exceeding maxChars", () => {
    const docs = [{ content: "a".repeat(7000) }];
    const result = buildContext(docs, 6000);
    expect(result.truncated).toBe(true);
  });

  it("handles malformed documents safely", () => {
    const docs = [{ content: null }, {}];
    const result = buildContext(docs);
    expect(result.context).toBe("");
  });

  it("returns empty context for empty array", () => {
    const result = buildContext([]);
    expect(result.context).toBe("");
  });

});