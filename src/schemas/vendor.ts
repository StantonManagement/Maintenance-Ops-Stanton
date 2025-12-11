import { z } from "zod";

export const vendorSchema = z.object({
  company_name: z.string().min(2, "Company name is required"),
  contact_name: z.string().min(2, "Contact name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  category: z.enum(["emergency", "specialized", "seasonal", "project", "standard"], {
    required_error: "Please select a category",
  }),
  specialties: z.array(z.string()).default([]),
  hourly_rate: z.coerce.number().min(0, "Rate must be positive").optional(),
  response_time_hours: z.coerce.number().min(0).default(24),
  status: z.enum(["active", "inactive", "pending"]).default("active"),
});

export const vendorRequestSchema = z.object({
  work_order_id: z.string().min(1, "Select a work order"),
  vendor_ids: z.array(z.string()).min(1, "Select at least one vendor"),
  deadline: z.string().optional(),
  notes: z.string().optional(),
});

export type VendorFormData = z.infer<typeof vendorSchema>;
export type VendorRequestFormData = z.infer<typeof vendorRequestSchema>;
