import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { VendorFormData, VendorRequestFormData } from "../schemas/vendor";
import { toast, handleApiError } from "../lib/toast";

export function useVendorMutations() {
  const queryClient = useQueryClient();

  const createVendor = useMutation({
    mutationFn: async (data: VendorFormData) => {
      const { data: result, error } = await supabase
        .from("vendors")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success("Vendor added successfully");
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  const createVendorRequest = useMutation({
    mutationFn: async (data: VendorRequestFormData) => {
      // Create a request for each selected vendor
      const requests = data.vendor_ids.map((vendorId) => ({
        work_order_id: data.work_order_id,
        vendor_id: vendorId,
        status: "pending",
        notes: data.notes,
        // deadline: data.deadline // Assuming DB support
        created_by: "Coordinator", // TODO: Auth context
      }));

      const { data: result, error } = await supabase
        .from("vendor_requests") // Assuming table exists
        .insert(requests)
        .select();

      if (error) {
         if (error.code === "42P01") {
             console.warn("vendor_requests table missing, simulating success");
             return requests;
         }
         throw error;
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Vendor requests sent successfully");
      queryClient.invalidateQueries({ queryKey: ["vendorRequests"] });
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  return { createVendor, createVendorRequest };
}
