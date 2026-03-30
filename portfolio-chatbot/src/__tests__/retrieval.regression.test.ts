/**
 * LLM Retrieval Regression Test (Artifact-Based - AI Reliability Generator)
 * 
 * It produces structured metrics and enforces behavioral contracts for a probabilistic AI system.
 * Runs only in scheduled NIGHTLY mode  # 1 AM UTC every Wednesday
 *
 * Validates:
 * - Multilingual retrieval invariance
 * - Doc Ranking stability (not just overlap)
 * - Retrieval → Answer grounding alignment
 * - Confidence calibration vs retrieval strength
 * - Drift-ready metrics for dashboarding and alerting
 *
 */
import { describe, it, expect, afterAll } from "vitest";
import dotenv from "dotenv";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
dotenv.config();

const BASE_URL =
  process.env.API_BASE_URL ??
  "http://127.0.0.1:8787";
// --- Thresholds
const MIN_SIMILARITY_EXPECTED = 0.35;
const MIN_OVERLAP = 0.5;
const MAX_RANK_SHIFT = 3;
const RUN_ID = process.env.RUN_ID ?? randomUUID();
const ARCH_QUESTION = {
  en: "¿What architectural decisions were made in the portfolio chatbot assistant?",
  es: "¿Qué decisiones arquitectónicas se tomaron en el asistente de portafolio?",
  fr: "¿Quelles décisions architecturales ont été prises dans l'assistant chatbot du portfolio ?",
  de: "¿Welche Architekturentscheidungen wurden im Portfolio-Chatbot getroffen?"
};
/**
 * Known grounded keywords expected in the response based on current portfolio content and architecture.
 */
const EXPECTED_CONCEPTS = [
  "rag",
  "vector",
  "retrieval",
  "cloudflare",
  "security",
  "testing",
];

interface RetrievalDocument {
  id: string;
  [key: string]: unknown;
}

interface AssistantResponse {
  answer: string;
  retrieval: {
    documents: RetrievalDocument[];
    passedCount: number;
    maxSimilarity: number;
    avgSimilarity: number;
  };
  confidence: number;
}

interface AskResponse extends AssistantResponse {
  latency: number;
  lang: string;
}

interface RetrieverRegressionMetric {
  run_id: string;
  test_id: "retrieval_regression" | "retrieval_hallucination_guard";
  language: string;
  avg_similarity: number;
  max_similarity: number;
  passed_count: number;
  overlap_ratio: number | null;
  rank_shift: number | null;
  concept_score: number;
  latency_ms: number;
  confidence: number;
}

function testHeaders(ip: string) {
  return {
    "Content-Type": "application/json",
    "x-test-ip": ip,
    "x-test-namespace": "retrieval"
  };
} 

/**
 * Compute overlap ratio between two retrieval sets
 * This is a simple proxy for ranking stability, as we expect the top results to be mostly consistent across languages due to shared architecture documentation, even if embedding variance causes some shuffling. A high overlap ratio indicates that the core relevant documents are consistently retrieved, which is crucial for grounding and answer quality. We set a minimum threshold to allow for some variance while still enforcing stability.
 */

function overlapRatio(base: string[], other: string[]) {
  const overlap = other.filter(id => base.includes(id)).length;
  return overlap / Math.min(base.length, other.length);
}

/**
 * Compute ranking drift (average positional shift)
 * This metric captures not just whether the same documents are retrieved, but how much their order changes. Even if the same docs are retrieved, a significant rank shift could indicate instability in relevance scoring, which can impact answer quality. By setting a maximum average rank shift, we enforce that not only are the same documents retrieved, but they also maintain a relatively stable order of relevance across languages.
 */
function rankShift(base: string[], other: string[]) {
  let totalShift = 0;
  let count = 0;

  base.forEach((id, index) => {
    const otherIndex = other.indexOf(id);
    if (otherIndex !== -1) {
      totalShift += Math.abs(index - otherIndex);
      count++;
    }
  });

  return count === 0 ? Infinity : totalShift / count;
}

describe.runIf(process.env.NIGHTLY === "true")(
  "Multilingual Retrieval Regression (Artifact Based AI Reliability)",
  () => {
    //Central artifact collector
    const metrics: RetrieverRegressionMetric[] = [];
    async function ask(question: string, lang: string): Promise<AskResponse> {
      const start = Date.now();

      const res = await fetch(BASE_URL, {
        method: "POST",
        headers: testHeaders("203.0.113.13"),
        body: JSON.stringify({ question })
      });

      const latency = Date.now() - start;

      expect(res.status).toBe(200);
      const payload = await res.json() as AssistantResponse;
      return { ...payload, latency, lang };
    }

    it("should maintain retrieval invariance and grounding across languages", async () => {

     const resultsArray = await Promise.all([
      ask(ARCH_QUESTION.en, "en"),
      ask(ARCH_QUESTION.es, "es"),
      ask(ARCH_QUESTION.fr, "fr"),
      ask(ARCH_QUESTION.de, "de"),
    ]);
    // run in parallel
    const results: Record<string, AskResponse> = {};
    resultsArray.forEach(r => results[r.lang] = r);
    const base = results.en.retrieval.documents.map((d: RetrievalDocument) => d.id);

      for (const [lang, r] of Object.entries(results)) {
        const docIds = r.retrieval.documents.map((d: RetrievalDocument) => d.id);
        /**
       * 1️⃣ Basic retrieval validity Assertion
       */
        expect(typeof r.answer).toBe("string");
        expect(r.answer.length).toBeGreaterThan(40);
        expect(r.retrieval.passedCount).toBeGreaterThan(0);
        expect(r.retrieval.maxSimilarity)
          .toBeGreaterThan(MIN_SIMILARITY_EXPECTED);
      
        // --- 2. Overlap invariance
        const overlap = overlapRatio(base, docIds);
        expect(overlap).toBeGreaterThanOrEqual(
          lang === "fr" ? 0.25 : MIN_OVERLAP
        );

        // --- 3. Ranking stability
        const shift = rankShift(base, docIds);
        expect(shift).toBeLessThan(MAX_RANK_SHIFT);

        // --- 4. Concept grounding (answer must reflect retrieved knowledge)
        const conceptScore = EXPECTED_CONCEPTS.reduce((acc, c) => {
          return r.answer.toLowerCase().includes(c) ? acc + 1 : acc;
        }, 0);

        expect(conceptScore).toBeGreaterThanOrEqual(2);

        // --- 5. Confidence calibration
        if (r.retrieval.passedCount >= 5) {
          expect(r.confidence).toBeGreaterThan(50);
        } else {
          expect(r.confidence).toBeLessThan(70);
        }

        // --- 6. Persist metrics (🚀 enables dashboard)
        metrics.push({
          run_id: RUN_ID,
          test_id: "retrieval_regression",
          language: lang,
          avg_similarity: r.retrieval.avgSimilarity,
          max_similarity: r.retrieval.maxSimilarity,
          passed_count: r.retrieval.passedCount,
          overlap_ratio: overlap,
          rank_shift: shift,
          concept_score: conceptScore,
          latency_ms: r.latency,
          confidence: r.confidence
        });

        // --- Observability logs (CI readable)
        console.log({
          lang,
          overlap,
          rank_shift: shift,
          concept_score: conceptScore,
          latency: r.latency,
          confidence: r.confidence
        });
      }
}, 45000);

it("should not hallucinate when knowledge is absent", async () => {
    const probe = await ask("What Kubernetes clusters were used in the chatbot architecture?","en");
    const answerLower = probe.answer.toLowerCase();

      // --- Must explicitly deny unsupported knowledge
      expect(answerLower).toMatch(/(not|no|does not|did not).*kubernetes/);

      // --- Must not hallucinate usage
      expect(answerLower).not.toContain("kubernetes cluster was used");

      // --- Retrieval should still function regardless, but with low similarity and confidence
      expect(probe.retrieval.maxSimilarity).toBeGreaterThan(MIN_SIMILARITY_EXPECTED);

      // --- Confidence should drop appropriately
      expect(probe.confidence).toBeLessThan(80);

      // --- Persist failure-resistance metric
      metrics.push({
        run_id: RUN_ID,
        test_id: "retrieval_hallucination_guard",
        language: "en",
        avg_similarity: probe.retrieval.avgSimilarity,
        max_similarity: probe.retrieval.maxSimilarity,
        passed_count: probe.retrieval.passedCount,
        overlap_ratio: null,
        rank_shift: null,
        concept_score: 0,
        latency_ms: probe.latency,
        confidence: probe.confidence
      });

    }, 20000);

    /**
     * AFTER ALL TESTS → write artifact ONCE
     */
    afterAll(() => {
      const dir = path.join(process.cwd(), "artifacts");

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      const filePath = path.join(
        dir,
        `retrieval-metrics-${RUN_ID}.json`
      );

      fs.writeFileSync(
        filePath,
        JSON.stringify(
          {
            run_id: RUN_ID,
            suite: "retrieval_regression",
            metrics
          },
          null,
          2
        )
      );

      console.log("📦 Retrieval metrics artifact saved:", filePath);
    });
  }
);
