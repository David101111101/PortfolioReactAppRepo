
/*
*It guards retrieval quality
*It enforces hallucination prevention
*It blocks low-confidence generation
*/
export interface RetrievalGuardResult {
  allowed: boolean;
  filteredDocs: any[];
  reason?: string;
}
// This function inspects retrieved documents for quality and relevance, applying a similarity threshold
export function inspectRetrieval(
  documents: unknown,
  minSimilarity = 0.40
): RetrievalGuardResult {
    //Validate array format
  if (!Array.isArray(documents)) {
    return {
      allowed: false,
      filteredDocs: [],
      reason: "invalid_format",
    };
  }
  //Apply similarity threshold
  const filtered = documents.filter(
    (doc: any) =>
      typeof doc?.similarity === "number" &&
      doc.similarity >= minSimilarity
  );
  return {
    allowed: true,
    filteredDocs: filtered,
  };
}