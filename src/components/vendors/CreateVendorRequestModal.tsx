import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vendorRequestSchema, VendorRequestFormData } from "../../schemas/vendor";
import { useVendorMutations } from "../../hooks/useVendorMutations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface CreateVendorRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  // In a real app, pass available vendors and work orders as props or fetch them
}

export function CreateVendorRequestModal({
  isOpen,
  onClose,
}: CreateVendorRequestModalProps) {
  const { createVendorRequest } = useVendorMutations();

  const form = useForm<VendorRequestFormData>({
    resolver: zodResolver(vendorRequestSchema),
    defaultValues: {
      work_order_id: "",
      vendor_ids: [],
      notes: "",
    },
  });

  function onSubmit(data: VendorRequestFormData) {
    createVendorRequest.mutate(data, {
      onSuccess: () => {
        form.reset();
        onClose();
      },
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Vendor Request (RFP)</DialogTitle>
          <DialogDescription>
            Send a request for proposal or service to external vendors.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="work_order_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Order</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select work order" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* TODO: Fetch real open work orders */}
                      <SelectItem value="WO-1234">WO-1234: Roof Leak</SelectItem>
                      <SelectItem value="WO-5678">WO-5678: HVAC Replacement</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vendor_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendors (Select 1 or more)</FormLabel>
                  <FormControl>
                    {/* Simplified for demo: Single select acting as multi-select input for now, 
                        or just a dropdown that sets array of 1. Real app needs MultiSelect component. */}
                    <Select 
                        onValueChange={(val) => field.onChange([val])} 
                        defaultValue={field.value?.[0]}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* TODO: Fetch real vendors */}
                        <SelectItem value="v1">Acme Plumbing</SelectItem>
                        <SelectItem value="v2">Reliable Electric</SelectItem>
                        <SelectItem value="v3">Top Notch HVAC</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                        placeholder="Details about scope of work, access instructions, etc." 
                        {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createVendorRequest.isPending}>
                {createVendorRequest.isPending ? "Sending..." : "Send Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
