import { Router } from "express";
import { entryController } from "../controllers/entryController.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../validators/common.js";
import { createEntrySchema, listEntriesQuerySchema, updateEntrySchema } from "../validators/entries.js";

export const entriesRouter = Router();

entriesRouter.use(requireAuth);
entriesRouter.get("/", validate(listEntriesQuerySchema, "query"), asyncHandler(entryController.list));
entriesRouter.get("/:id", validate(idParamSchema, "params"), asyncHandler(entryController.getById));
entriesRouter.post("/", validate(createEntrySchema), asyncHandler(entryController.create));
entriesRouter.patch("/:id", validate(idParamSchema, "params"), validate(updateEntrySchema), asyncHandler(entryController.update));
entriesRouter.delete("/:id", validate(idParamSchema, "params"), asyncHandler(entryController.remove));
