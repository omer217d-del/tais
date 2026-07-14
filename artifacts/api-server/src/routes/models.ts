import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { aiModelsTable } from "@workspace/db";
import {
  RegisterModelBody,
  GetModelParams,
  DeleteModelParams,
  ActivateModelParams,
} from "@workspace/api-zod";

const router = Router();

const SUPPORTED_MODELS = [
  {
    id: "qwen2.5-0.5b-instruct-q4_k_m",
    name: "Qwen2.5 0.5B Instruct Q4_K_M",
    provider: "qwen",
    description: "Ultra-lightweight Qwen2.5 model, ideal for low-end devices. Fast inference.",
    downloadUrl: "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf",
    sizeBytes: 397000000,
    quantization: "Q4_K_M",
    contextLength: 4096,
    recommended: false,
  },
  {
    id: "qwen2.5-1.5b-instruct-q4_k_m",
    name: "Qwen2.5 1.5B Instruct Q4_K_M",
    provider: "qwen",
    description: "Balanced Qwen2.5 model for most Android devices. Good accuracy and speed.",
    downloadUrl: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
    sizeBytes: 986000000,
    quantization: "Q4_K_M",
    contextLength: 4096,
    recommended: true,
  },
  {
    id: "gemma-2-2b-it-q4_k_m",
    name: "Gemma 2 2B Instruct Q4_K_M",
    provider: "gemma",
    description: "Google's Gemma 2 2B instruction-tuned model. Excellent natural language understanding.",
    downloadUrl: "https://huggingface.co/google/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf",
    sizeBytes: 1580000000,
    quantization: "Q4_K_M",
    contextLength: 8192,
    recommended: true,
  },
  {
    id: "phi-3.5-mini-instruct-q4_k_m",
    name: "Phi-3.5 Mini Instruct Q4_K_M",
    provider: "phi",
    description: "Microsoft Phi-3.5 Mini, highly capable for its size. Excellent instruction following.",
    downloadUrl: "https://huggingface.co/microsoft/Phi-3.5-mini-instruct-gguf/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf",
    sizeBytes: 2390000000,
    quantization: "Q4_K_M",
    contextLength: 4096,
    recommended: false,
  },
  {
    id: "smollm2-360m-instruct-q4_k_m",
    name: "SmolLM2 360M Instruct Q4_K_M",
    provider: "smollm",
    description: "HuggingFace SmolLM2 360M, the smallest usable model. For very limited devices.",
    downloadUrl: "https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct-GGUF/resolve/main/smollm2-360m-instruct-q4_k_m.gguf",
    sizeBytes: 229000000,
    quantization: "Q4_K_M",
    contextLength: 2048,
    recommended: false,
  },
  {
    id: "tinyllama-1.1b-chat-q4_k_m",
    name: "TinyLlama 1.1B Chat Q4_K_M",
    provider: "tinyllama",
    description: "TinyLlama 1.1B, fast and efficient for basic automation tasks.",
    downloadUrl: "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
    sizeBytes: 669000000,
    quantization: "Q4_K_M",
    contextLength: 2048,
    recommended: false,
  },
];

function toApiModel(row: typeof aiModelsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    filename: row.filename,
    localPath: row.localPath ?? null,
    downloadUrl: row.downloadUrl ?? null,
    sizeBytes: row.sizeBytes ?? null,
    quantization: row.quantization ?? null,
    contextLength: row.contextLength ?? null,
    isActive: row.isActive,
    status: row.status,
    downloadProgress: row.downloadProgress ?? null,
    installedAt: row.installedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

// GET /api/models
router.get("/", async (_req, res) => {
  const rows = await db.select().from(aiModelsTable).orderBy(desc(aiModelsTable.createdAt));
  res.json(rows.map(toApiModel));
});

// GET /api/models/active
router.get("/active", async (_req, res) => {
  const [row] = await db
    .select()
    .from(aiModelsTable)
    .where(eq(aiModelsTable.isActive, true))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "No active model" });
    return;
  }
  res.json(toApiModel(row));
});

// GET /api/models/supported
router.get("/supported", async (_req, res) => {
  res.json(SUPPORTED_MODELS);
});

// GET /api/models/:id
router.get("/:id", async (req, res) => {
  const parseResult = GetModelParams.safeParse({ id: Number(req.params.id) });
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select()
    .from(aiModelsTable)
    .where(eq(aiModelsTable.id, parseResult.data.id))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Model not found" });
    return;
  }
  res.json(toApiModel(row));
});

// POST /api/models
router.post("/", async (req, res) => {
  const parseResult = RegisterModelBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const body = parseResult.data;

  const status = body.localPath ? "available" : "missing";

  const [created] = await db
    .insert(aiModelsTable)
    .values({
      name: body.name,
      provider: body.provider,
      filename: body.filename,
      localPath: body.localPath ?? null,
      downloadUrl: body.downloadUrl ?? null,
      sizeBytes: body.sizeBytes ?? null,
      quantization: body.quantization ?? null,
      contextLength: body.contextLength ?? null,
      status,
      installedAt: body.localPath ? new Date() : null,
    })
    .returning();

  res.status(201).json(toApiModel(created));
});

// DELETE /api/models/:id
router.delete("/:id", async (req, res) => {
  const parseResult = DeleteModelParams.safeParse({ id: Number(req.params.id) });
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(aiModelsTable).where(eq(aiModelsTable.id, parseResult.data.id));
  res.status(204).end();
});

// PATCH /api/models/:id/activate
router.patch("/:id/activate", async (req, res) => {
  const parseResult = ActivateModelParams.safeParse({ id: Number(req.params.id) });
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [target] = await db
    .select()
    .from(aiModelsTable)
    .where(eq(aiModelsTable.id, parseResult.data.id))
    .limit(1);

  if (!target) {
    res.status(404).json({ error: "Model not found" });
    return;
  }

  // Deactivate all
  await db.update(aiModelsTable).set({ isActive: false });

  // Activate target
  const [updated] = await db
    .update(aiModelsTable)
    .set({ isActive: true })
    .where(eq(aiModelsTable.id, parseResult.data.id))
    .returning();

  res.json(toApiModel(updated));
});

export default router;
