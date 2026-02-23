import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import dotenv from "dotenv";
import * as pdfParseModule from "pdf-parse";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
/* ========================
   Utilities
======================== */
function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}
function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function chunkCV(text: string, maxLength = 800): string[] {
  const normalized = normalizeText(text);

  // Split by common CV section headers
  const sections = normalized.split(
    /(Skills|Technical Skills|Experience|Projects|Education|Certifications)/gi
  );

  const chunks: string[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;

    if (section.length <= maxLength) {
      chunks.push(section);
    } else {
      for (let j = 0; j < section.length; j += maxLength) {
        chunks.push(section.slice(j, j + maxLength));
      }
    }
  }

  return chunks.filter(c => c.length > 50);
}


/* ========================
   File Loaders
======================== */

function loadMarkdownFiles(dir: string) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(".md"))
    .map(file => ({
      source: file,
      content: fs.readFileSync(path.join(dir, file), "utf-8"),
    }));
}

async function loadPdfFiles(dir: string) {
  const pdfParseModule = await import("pdf-parse");
  const { PDFParse } = pdfParseModule as any;

  const results = [];

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".pdf")) continue;

    try {
      const buffer = fs.readFileSync(path.join(dir, file));
      const uint8Array = new Uint8Array(buffer);

      const pdf = new PDFParse({ data: uint8Array });
      const parsed = await pdf.getText();

      results.push({
        source: file,
        content: parsed.text,
      });

    } catch (err) {
      console.error(`Failed to parse ${file}`, err);
      continue;
    }
  }

  return results;
}
/* ========================
   Idempotent Check
======================== */

async function fileAlreadyIngested(fileHash: string) {
  const { data } = await supabase
    .from("documents")
    .select("id")
    .eq("file_hash", fileHash)
    .limit(1);

  return data && data.length > 0;
}
/* ========================
   Main Ingestion
======================== */
async function ingest() {
  const markdownDocs = loadMarkdownFiles("./data/readmes");
  const pdfDocs = await loadPdfFiles("./data/pdfs");
  const allDocs = [...markdownDocs, ...pdfDocs];
  
  for (const doc of allDocs) {
    const fileHash = sha256(doc.content);
    
    const exists = await fileAlreadyIngested(fileHash);
    if (exists) {
      console.log(`Skipping ${doc.source} (already ingested)`);
      continue;   
    }

    console.log(`Processing ${doc.source}`);
    const chunks = chunkCV(doc.content);
    const embeddingsBatchSize = 50; // safe batch size

    for (let i = 0; i < chunks.length; i += embeddingsBatchSize) {
      const batchChunks = chunks.slice(i, i + embeddingsBatchSize);

      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: batchChunks,
      });

      const rows = embeddingResponse.data.map((item, index) => ({
        id: sha256(fileHash + (i + index).toString()),
        content: batchChunks[index],
        embedding: item.embedding,
        file_hash: fileHash,
        metadata: {
          source: doc.source,
          chunk_index: i + index,
          type: doc.source.endsWith(".pdf") ? "pdf" : "markdown",
        },
      }));

     const { error } = await supabase
      .from("documents")
      .upsert(rows);

    if (error) {
      console.error("Supabase insert error:", error);
    }
    }
  }

  console.log("Ingestion complete.");
}

ingest();