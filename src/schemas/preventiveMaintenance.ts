import { z } from "zod";

export const preventiveScheduleSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  category: z.enum(
    ["hvac", "plumbing", "electrical", "appliance", "safety", "general", "compliance"],
    { required_error: "Please select a category" }
  ),
  frequency_type: z.enum(["days", "weeks", "months", "years"], {
    required_error: "Select frequency type",
  }),
  frequency_value: z.coerce.number().min(1, "Must be at least 1"),
  property_ids: z.array(z.string()).min(1, "Select at least one property"),
  unit_ids: z.array(z.string()).optional(), // Empty means all units in selected properties
  next_due_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date",
  }),
  assigned_technician_id: z.string().optional(),
  estimated_duration_hours: z.coerce.number().min(0.5).optional(),
});

export type PreventiveScheduleFormData = z.infer<typeof preventiveScheduleSchema>;
