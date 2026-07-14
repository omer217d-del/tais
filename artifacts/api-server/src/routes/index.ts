import { Router } from "express";
import health from "./health";
import automations from "./automations";
import plugins from "./plugins";
import models from "./models";
import logs from "./logs";
import permissions from "./permissions";
import settings from "./settings";
import chat from "./chat";

const router = Router();

// Health route is registered at root of /api — the handler itself contains /healthz
router.use("/", health);
router.use("/automations", automations);
router.use("/plugins", plugins);
router.use("/models", models);
router.use("/logs", logs);
router.use("/permissions", permissions);
router.use("/settings", settings);
router.use("/chat", chat);

export default router;
