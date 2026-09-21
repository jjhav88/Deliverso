import { z } from "zod";

export const adminProfileSchema = z.object({
  displayName: z.string().trim().max(80),
});
