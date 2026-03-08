import { z } from "zod";

export const upgradePlanSchema = z.object({
  plan: z.enum(["MONTHLY", "YEARLY"]),
});

export type UpgradePlanInput = z.infer<typeof upgradePlanSchema>;
