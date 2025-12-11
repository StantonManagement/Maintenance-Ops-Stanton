import { z } from "zod";

export const technicianSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  certifications: z.array(z.string()).optional(),
  status: z.enum(["available", "busy", "off_duty", "in-transit", "unavailable"]),
  max_daily_orders: z.number().min(1).max(20).default(6),
});

export type TechnicianFormData = z.infer<typeof technicianSchema>;
