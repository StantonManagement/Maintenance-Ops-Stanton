import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { TechnicianFormData } from "../schemas/technician";
import { toast, handleApiError } from "../lib/toast";

export function useTechnicianMutations() {
  const queryClient = useQueryClient();

  const createTechnician = useMutation({
    mutationFn: async (data: TechnicianFormData) => {
      const payload = {
        name: data.name,
        // email: data.email, // Assuming DB has these columns, if not they will be ignored or error
        // phone: data.phone,
        skills: data.skills,
        // certifications: data.certifications,
        status: data.status,
        max_daily_workload: data.max_daily_orders,
        current_load: 0,
        // created_at: new Date().toISOString() // Let DB handle default
      };

      const { data: result, error } = await supabase
        .from("technicians")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success("Technician added successfully");
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  return { createTechnician };
}
