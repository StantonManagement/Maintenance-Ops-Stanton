import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  warning: (message: string) => sonnerToast.warning(message),
  info: (message: string) => sonnerToast.info(message),
  loading: (message: string) => sonnerToast.loading(message),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
};

export function handleApiError(error: any): string {
  console.error("API Error:", error);

  if (typeof error === "string") return error;

  // Supabase errors
  if (error?.code === "23505") return "This record already exists.";
  if (error?.code === "PGRST116") return "No data returned from the server.";
  if (error?.code === "42P01") return "Database table missing (Development).";
  if (error?.message?.includes("JWT")) return "Your session has expired. Please login again.";
  
  return error?.message || "An unexpected error occurred. Please try again.";
}
