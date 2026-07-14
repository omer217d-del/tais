import { Router } from "express";
import { desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { chatMessagesTable, automationsTable, logEntriesTable } from "@workspace/db";
import { SendChatMessageBody, ListChatMessagesQueryParams } from "@workspace/api-zod";

const router = Router();

function toApiMessage(row: typeof chatMessagesTable.$inferSelect) {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    automationJson: (row.automationJson as Record<string, unknown>) ?? null,
    processingTimeMs: row.processingTimeMs ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Natural language → automation parser.
 *
 * In production this would call a local llama.cpp process via socket/HTTP.
 * Here we implement a rule-based fallback that covers common patterns and
 * always returns a well-formed response the UI can display.
 */
function parseNaturalLanguage(input: string): {
  responseText: string;
  automation: {
    name: string;
    trigger: { type: string; parameters: Record<string, unknown> };
    action: { type: string; parameters: Record<string, unknown> };
  } | null;
} {
  const lower = input.toLowerCase();

  // Battery trigger patterns
  const batteryMatch = lower.match(/şarj\s*%?(\d+)|batarya\s*%?(\d+)|pil\s*%?(\d+)/);
  if (batteryMatch) {
    const level = batteryMatch[1] ?? batteryMatch[2] ?? batteryMatch[3];

    // Action: speak / notification
    const isSpeakAction = lower.includes("sesli") || lower.includes("söyle") || lower.includes("konuş");
    const actionType = isSpeakAction ? "speak" : "notification";
    const actionMsg = `Batarya seviyesi %${level}'ye düştü!`;

    return {
      responseText: `Anladım. Batarya %${level} seviyesine düştüğünde ${isSpeakAction ? "sesli bildirim" : "bildirim"} gönderecek bir otomasyon oluşturuyorum.`,
      automation: {
        name: `Batarya %${level} Uyarısı`,
        trigger: { type: "battery", parameters: { level: parseInt(level), comparison: "lte" } },
        action: { type: actionType, parameters: { message: actionMsg, title: "TAIS - Batarya Uyarısı" } },
      },
    };
  }

  // Shake / motion trigger
  if (lower.includes("salla") || lower.includes("shake")) {
    const isFlashlight = lower.includes("fener") || lower.includes("el feneri") || lower.includes("flashlight");
    return {
      responseText: `Anladım. Telefonu salladığınızda ${isFlashlight ? "el fenerini" : "aksiyonu"} tetikleyecek bir otomasyon oluşturuyorum.`,
      automation: {
        name: "Sallayınca Fener",
        trigger: { type: "shake", parameters: { sensitivity: "medium" } },
        action: { type: "flashlight", parameters: { state: "toggle" } },
      },
    };
  }

  // Time trigger
  const timeMatch = lower.match(/saat\s*(\d{1,2})[:\.]?(\d{2})?/);
  if (timeMatch) {
    const hour = timeMatch[1];
    const minute = timeMatch[2] ?? "00";
    const timeStr = `${hour.padStart(2, "0")}:${minute}`;

    const isDndAction = lower.includes("rahatsız etme") || lower.includes("dnd") || lower.includes("sessiz");
    const isWifiAction = lower.includes("wifi") || lower.includes("wi-fi");

    let actionType = "notification";
    let actionParams: Record<string, unknown> = { message: `Saat ${timeStr} oldu.`, title: "TAIS Zamanlaması" };

    if (isDndAction) {
      actionType = "notification";
      actionParams = { message: "Rahatsız Etme modu aktifleştiriliyor.", title: "TAIS" };
    } else if (isWifiAction) {
      actionType = "wifi";
      actionParams = { state: lower.includes("kapat") ? "off" : "on" };
    }

    return {
      responseText: `Anladım. Her gün saat ${timeStr}'de ${isDndAction ? "Rahatsız Etme modunu" : isWifiAction ? "Wi-Fi'ı" : "bildirimi"} tetikleyecek bir otomasyon oluşturuyorum.`,
      automation: {
        name: `Saat ${timeStr} Otomasyonu`,
        trigger: { type: "time", parameters: { time: timeStr, repeat: "daily" } },
        action: { type: actionType, parameters: actionParams },
      },
    };
  }

  // Location trigger (ev, işyeri)
  const locationMatch = lower.match(/eve\s*gel|evde|ev.*gel|işe\s*gel|işyeri/);
  if (locationMatch) {
    const isHomeArrival = lower.includes("ev");
    const isWifi = lower.includes("wifi") || lower.includes("wi-fi");
    const isBluetooth = lower.includes("bluetooth");

    let actionType = isWifi ? "wifi" : isBluetooth ? "bluetooth" : "notification";
    let actionParams: Record<string, unknown> = isWifi ? { state: "on" } : isBluetooth ? { state: "on" } : { message: `${isHomeArrival ? "Eve" : "İşe"} geldiniz.`, title: "TAIS Konum" };

    return {
      responseText: `Anladım. ${isHomeArrival ? "Eve" : "İşyerine"} gelince ${isWifi ? "Wi-Fi'ı açacak" : isBluetooth ? "Bluetooth'u açacak" : "bildirim gönderecek"} bir otomasyon oluşturuyorum.`,
      automation: {
        name: `${isHomeArrival ? "Eve" : "İşe"} Geliş Otomasyonu`,
        trigger: { type: "location", parameters: { label: isHomeArrival ? "Ev" : "İşyeri", radius: 100 } },
        action: { type: actionType, parameters: actionParams },
      },
    };
  }

  // Wi-Fi trigger
  if ((lower.includes("wifi") || lower.includes("wi-fi")) && (lower.includes("bağlan") || lower.includes("connect"))) {
    return {
      responseText: `Anladım. Wi-Fi'a bağlandığınızda tetiklenecek bir otomasyon oluşturuyorum.`,
      automation: {
        name: "Wi-Fi Bağlantısı Otomasyonu",
        trigger: { type: "wifi", parameters: { state: "connected" } },
        action: { type: "notification", parameters: { message: "Wi-Fi'a bağlandınız.", title: "TAIS" } },
      },
    };
  }

  // Charging trigger
  if (lower.includes("şarj") && (lower.includes("takıl") || lower.includes("başla") || lower.includes("connect"))) {
    return {
      responseText: `Anladım. Şarj cihazı takıldığında tetiklenecek bir otomasyon oluşturuyorum.`,
      automation: {
        name: "Şarj Başladığında",
        trigger: { type: "charging", parameters: { state: "charging" } },
        action: { type: "notification", parameters: { message: "Şarj başladı.", title: "TAIS" } },
      },
    };
  }

  // Flip trigger
  if (lower.includes("çevir") || lower.includes("flip") || lower.includes("ters çevir")) {
    return {
      responseText: `Anladım. Telefonu ters çevirdiğinizde tetiklenecek bir otomasyon oluşturuyorum.`,
      automation: {
        name: "Ters Çevirme Otomasyonu",
        trigger: { type: "flip", parameters: { direction: "face_down" } },
        action: { type: "volume", parameters: { stream: "ring", level: 0 } },
      },
    };
  }

  // No pattern matched — return helpful explanation
  return {
    responseText: `Komutunuzu anladım, ancak şu an için bu otomasyon türünü doğrudan ayrıştıramadım. Desteklenen tetikleyiciler: batarya seviyesi, sarsıntı, zaman, konum, Wi-Fi, şarj, Bluetooth, ters çevirme. Örnek: "Şarj %20 olunca sesli bildirim ver" veya "Eve gelince Wi-Fi aç" gibi net komutlar kullanın.`,
    automation: null,
  };
}

// GET /api/chat/messages
router.get("/messages", async (req, res) => {
  const parseResult = ListChatMessagesQueryParams.safeParse({
    limit: req.query.limit !== undefined ? Number(req.query.limit) : undefined,
  });

  const limit = parseResult.success ? (parseResult.data.limit ?? 50) : 50;

  const rows = await db
    .select()
    .from(chatMessagesTable)
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(limit);

  res.json(rows.reverse().map(toApiMessage));
});

// POST /api/chat/messages
router.post("/messages", async (req, res) => {
  const parseResult = SendChatMessageBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const startTime = Date.now();
  const { content } = parseResult.data;

  // Persist user message
  const [userMsg] = await db
    .insert(chatMessagesTable)
    .values({ role: "user", content })
    .returning();

  // Process with NLP
  const { responseText, automation } = parseNaturalLanguage(content);
  const processingTimeMs = Date.now() - startTime;

  let automationCreated = false;
  let createdAutomation: Record<string, unknown> | null = null;

  if (automation) {
    try {
      const [dbAuto] = await db
        .insert(automationsTable)
        .values({
          name: automation.name,
          naturalLanguageInput: content,
          triggerType: automation.trigger.type,
          triggerParams: automation.trigger.parameters,
          actionType: automation.action.type,
          actionParams: automation.action.parameters,
          enabled: true,
        })
        .returning();

      automationCreated = true;
      createdAutomation = {
        id: dbAuto.id,
        name: dbAuto.name,
        trigger: automation.trigger,
        action: automation.action,
        enabled: true,
      };

      await db.insert(logEntriesTable).values({
        level: "info",
        message: `Yeni otomasyon oluşturuldu: "${automation.name}"`,
        source: "chat-nlp",
        automationId: dbAuto.id,
      });
    } catch {
      // Log error but don't fail the response
      await db.insert(logEntriesTable).values({
        level: "error",
        message: `Otomasyon oluşturulurken hata oluştu: "${automation.name}"`,
        source: "chat-nlp",
      });
    }
  }

  // Persist assistant message
  const [assistantMsg] = await db
    .insert(chatMessagesTable)
    .values({
      role: "assistant",
      content: responseText,
      automationJson: createdAutomation,
      processingTimeMs,
    })
    .returning();

  res.status(201).json({
    userMessage: toApiMessage(userMsg),
    assistantMessage: toApiMessage(assistantMsg),
    parsedAutomation: createdAutomation,
    automationCreated,
  });
});

// DELETE /api/chat/messages
router.delete("/messages", async (_req, res) => {
  await db.delete(chatMessagesTable);
  res.status(204).end();
});

export default router;
