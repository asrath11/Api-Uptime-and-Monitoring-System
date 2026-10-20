import { z } from "zod";

export const createMonitorSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  url: z.url("Invalid URL"),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]),
  intervalSeconds: z
    .number()
    .int()
    .min(1, "Interval must be at least 1 second"),
  timeoutSeconds: z.number().int().min(1, "Timeout must be at least 1 second"),
  expectedStatusCode: z
    .number()
    .int()
    .min(100, "Expected status code must be at least 100")
    .max(599, "Expected status code must be at most 599"),
});

export const partialUpdateMonitorSchema = createMonitorSchema
  .partial()
  .extend({
    isPaused: z.boolean().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided",
  );

export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;

export type PartialUpdateMonitorInput = z.infer<
  typeof partialUpdateMonitorSchema
>;
