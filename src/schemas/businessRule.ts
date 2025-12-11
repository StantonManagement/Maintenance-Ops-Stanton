import { z } from "zod";

export const businessRuleSchema = z.object({
  rule_name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  rule_type: z.enum(["assignment", "priority", "notification", "financial", "capacity"], {
    required_error: "Select a rule type",
  }),
  priority: z.coerce.number().min(1).max(100).default(50),
  active: z.boolean().default(true),
  // Simplified condition builder for prototype
  condition_field: z.string().min(1, "Select a field to check"),
  condition_operator: z.enum(["equals", "contains", "greater_than", "less_than"]),
  condition_value: z.string().min(1, "Value is required"),
  // Simplified action builder
  action_type: z.enum(["assign_to", "set_priority", "notify", "require_approval"]),
  action_value: z.string().min(1, "Action value is required"),
});

export type BusinessRuleFormData = z.infer<typeof businessRuleSchema>;
