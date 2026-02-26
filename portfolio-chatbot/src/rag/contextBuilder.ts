/*
* Context Builder
* Responsible for constructing the final context string injected into the LLM prompt.
* Ensures deterministic truncation and safe document concatenation.
    This means it will take as many full documents as possible until it reaches the character limit, rather than cutting off in the middle of a document, which helps maintain coherence and relevance in the provided context. 
  The function also returns metadata about the total characters used and whether truncation occurred, which can be useful for logging and debugging purposes.
*/
export interface ContextBuildResult {
  context: string;
  totalChars: number;
  truncated: boolean;
}
export function buildContext(
  docs: any[],
  maxChars = 6000
): ContextBuildResult {

  if (!Array.isArray(docs) || docs.length === 0) {
    return { context: "", totalChars: 0, truncated: false };
  }
  const header = `Responses should emphasize impact reasoning, architecture decisions and system-level thinking rather than only tool usage`;
  const priority = [
    "high",
    "medium",
    "normal",
  ];
  const grouped = new Map<string, string[]>();
  for (const p of priority) grouped.set(p, []);
  for (const d of docs) {
    if (typeof d?.content !== "string") continue;
    const type = d?.metadata?.priority ?? "general";
    grouped.get(type)?.push(`[Source: ${d.metadata?.source}]\n${d.content.trim()}`);
  }
  let context = header;
  let truncated = false;
  for (const type of priority) {
    const section = grouped.get(type) ?? [];
    for (const doc of section) {
      const block = `\n\n[${type.toUpperCase()}]\n${doc}`;
      if ((context + block).length > maxChars) {
        truncated = true;
        break;
      }
      context += block;
    }
    if (truncated) break;
  }
  return {
    context,
    totalChars: context.length,
    truncated,
  };
}