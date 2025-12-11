import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { PreventiveScheduleFormData } from "../schemas/preventiveMaintenance";
import { toast, handleApiError } from "../lib/toast";

export function usePreventiveMutations() {
  const queryClient = useQueryClient();

  const createSchedule = useMutation({
    mutationFn: async (data: PreventiveScheduleFormData) => {
      // In a real app, logic to expand to unit-level tasks would happen here or via DB triggers
      const payload = {
        name: data.name,
        description: data.description,
        category: data.category,
        frequency_type: data.frequency_type,
        frequency_value: data.frequency_value,
        property_ids: data.property_ids,
        unit_ids: data.unit_ids || [],
        next_due: data.next_due_date,
        assigned_technician_id: data.assigned_technician_id || null,
        estimated_duration_hours: data.estimated_duration_hours,
        is_active: true,
        // created_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from("preventive_schedules")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success("Maintenance schedule created");
      queryClient.invalidateQueries({ queryKey: ["preventiveSchedules"] });
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  return { createSchedule };
}
