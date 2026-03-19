import { describe, it, expect } from "vitest";
import { buildContext } from "../rag/contextBuilder";
//Does not run these tests in nightly deep regression suit
describe.skipIf(process.env.NIGHTLY === "true")("Context Builder", () => {

  it("joins documents correctly", () => {
    const docs = [
      { content: "file content 1", metadata: { source: "../../data/readmes/Readme-ci-cd-performance-testing-k6.md", priority: "normal" } },
      { content: "file content 2", metadata: { source: "../../data/readmes/Readme-cypress-backend-automation.md", priority: "normal" } },
    ];

    const result = buildContext(docs);

    expect(result.context).toContain("../../data/readmes/Readme-ci-cd-performance-testing-k6.md");
    expect(result.context).toContain("../../data/readmes/Readme-cypress-backend-automation.md");
    expect(result.truncated).toBe(false);
  });

  it("truncates when exceeding maxChars", () => {
    const docs = [{ content: "a".repeat(8000), metadata: { priority: "normal" } }];
    const result = buildContext(docs, 6000);
    expect(result.truncated).toBe(true);
  });

  it("returns empty context for empty array", () => {
    const result = buildContext([]);
    expect(result.context).toBe("");
  });

});