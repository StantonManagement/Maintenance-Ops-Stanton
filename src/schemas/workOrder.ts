import { z } from "zod";

export const workOrderSchema = z.object({
  description: z
    .string()
    .min(10, "Description must be at least 10 characters long")
    .max(1000, "Description must not exceed 1000 characters"),
  priority: z.enum(["emergency", "high", "medium", "low", "cosmetic"], {
    required_error: "Please select a priority",
  }),
  property_code: z.string().min(1, "Please select a property"),
  unit_number: z.string().min(1, "Please enter a unit number"),
  resident_name: z.string().optional(),
  category: z.enum(
    ["plumbing", "electrical", "hvac", "appliance", "general", "other"],
    {
      required_error: "Please select a category",
    }
  ),
});

export type WorkOrderFormData = z.infer<typeof workOrderSchema>;
