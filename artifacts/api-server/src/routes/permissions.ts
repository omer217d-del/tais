import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { appPermissionsTable } from "@workspace/db";
import { UpdatePermissionParams, UpdatePermissionBody } from "@workspace/api-zod";

const router = Router();

const DEFAULT_PERMISSIONS = [
  { name: "Batarya", androidPermission: "android.permission.BATTERY_STATS", description: "Cihazın batarya seviyesini okur ve şarj durumunu izler.", category: "sensor", required: true },
  { name: "Bluetooth", androidPermission: "android.permission.BLUETOOTH_CONNECT", description: "Bluetooth cihazlarına bağlanır ve durumunu izler.", category: "connectivity", required: false },
  { name: "Wi-Fi Durumu", androidPermission: "android.permission.ACCESS_WIFI_STATE", description: "Wi-Fi bağlantı durumunu okur.", category: "connectivity", required: false },
  { name: "Wi-Fi Değiştirme", androidPermission: "android.permission.CHANGE_WIFI_STATE", description: "Wi-Fi bağlantısını açıp kapatır.", category: "connectivity", required: false },
  { name: "NFC", androidPermission: "android.permission.NFC", description: "NFC etiketlerini okur ve NFC tetikleyicilerini kullanır.", category: "connectivity", required: false },
  { name: "Hassas Konum", androidPermission: "android.permission.ACCESS_FINE_LOCATION", description: "Konum tabanlı otomasyonlar için GPS kullanır.", category: "location", required: false },
  { name: "Arka Plan Konum", androidPermission: "android.permission.ACCESS_BACKGROUND_LOCATION", description: "Arka planda konum değişikliklerini izler.", category: "location", required: false },
  { name: "Kamera", androidPermission: "android.permission.CAMERA", description: "Flaş kontrolü ve kamera tabanlı tetikleyiciler için kullanılır.", category: "media", required: false },
  { name: "Mikrofon", androidPermission: "android.permission.RECORD_AUDIO", description: "Ses tanıma tetikleyicileri için mikrofon erişimi.", category: "media", required: false },
  { name: "Depolama Okuma", androidPermission: "android.permission.READ_EXTERNAL_STORAGE", description: "Dosya tabanlı işlemler ve model dosyası okuma.", category: "storage", required: true },
  { name: "Depolama Yazma", androidPermission: "android.permission.WRITE_EXTERNAL_STORAGE", description: "Dosyalara yazma ve log kaydetme.", category: "storage", required: false },
  { name: "Bildirim Gönderme", androidPermission: "android.permission.POST_NOTIFICATIONS", description: "Kullanıcıya bildirim gönderir.", category: "system", required: true },
  { name: "Ön Plan Servis", androidPermission: "android.permission.FOREGROUND_SERVICE", description: "Arka planda çalışmaya devam etmek için ön plan servisi.", category: "system", required: true },
  { name: "Alarm Yöneticisi", androidPermission: "android.permission.SCHEDULE_EXACT_ALARM", description: "Tam zamanında alarm tetikleyicileri için.", category: "system", required: false },
  { name: "Sarsıntı Sensörü", androidPermission: "android.permission.BODY_SENSORS", description: "Cihaz sarsılma ve hareket algılama.", category: "sensor", required: false },
  { name: "Ağ Durumu", androidPermission: "android.permission.ACCESS_NETWORK_STATE", description: "Ağ bağlantısı durumunu izler.", category: "connectivity", required: true },
  { name: "İnternet", androidPermission: "android.permission.INTERNET", description: "HTTP istek aksiyonları için internet erişimi.", category: "connectivity", required: false },
  { name: "Titreşim", androidPermission: "android.permission.VIBRATE", description: "Titreşim aksiyonu için.", category: "system", required: false },
];

async function ensureDefaultPermissions() {
  const existing = await db.select().from(appPermissionsTable);
  if (existing.length > 0) return;

  await db.insert(appPermissionsTable).values(
    DEFAULT_PERMISSIONS.map((p) => ({
      ...p,
      granted: false,
    }))
  );
}

function toApiPermission(row: typeof appPermissionsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    androidPermission: row.androidPermission,
    description: row.description,
    category: row.category,
    granted: row.granted,
    required: row.required,
    updatedAt: row.updatedAt.toISOString(),
  };
}

// GET /api/permissions
router.get("/", async (_req, res) => {
  await ensureDefaultPermissions();
  const rows = await db.select().from(appPermissionsTable).orderBy(appPermissionsTable.category, appPermissionsTable.name);
  res.json(rows.map(toApiPermission));
});

// PATCH /api/permissions/:id
router.patch("/:id", async (req, res) => {
  const paramResult = UpdatePermissionParams.safeParse({ id: Number(req.params.id) });
  if (!paramResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyResult = UpdatePermissionBody.safeParse(req.body);
  if (!bodyResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [existing] = await db
    .select()
    .from(appPermissionsTable)
    .where(eq(appPermissionsTable.id, paramResult.data.id))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Permission not found" });
    return;
  }

  const [updated] = await db
    .update(appPermissionsTable)
    .set({ granted: bodyResult.data.granted, updatedAt: new Date() })
    .where(eq(appPermissionsTable.id, paramResult.data.id))
    .returning();

  res.json(toApiPermission(updated));
});

export default router;
