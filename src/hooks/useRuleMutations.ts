import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { BusinessRuleFormData } from "../schemas/businessRule";
import { toast, handleApiError } from "../lib/toast";

export function useRuleMutations() {
  const queryClient = useQueryClient();

  const createRule = useMutation({
    mutationFn: async (data: BusinessRuleFormData) => {
      // Transform simplified form data into JSON structures for DB
      const conditions = {
        field: data.condition_field,
        operator: data.condition_operator,
        value: data.condition_value,
      };

      const actions = {
        type: data.action_type,
        value: data.action_value,
      };

      const payload = {
        name: data.rule_name,
        description: data.description,
        type: data.rule_type,
        priority: data.priority,
        is_active: data.active,
        conditions: conditions, // JSONB in DB
        actions: actions,       // JSONB in DB
        version: 1,
        fire_count: 0,
        override_count: 0,
        created_by: "Admin", // Auth context
      };

      const { data: result, error } = await supabase
        .from("business_rules")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success("Business rule created");
      queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  return { createRule };
}
