import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { preventiveScheduleSchema, PreventiveScheduleFormData } from "../../schemas/preventiveMaintenance";
import { usePreventiveMutations } from "../../hooks/usePreventiveMutations";
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
  FormDescription,
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

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateScheduleModal({ isOpen, onClose }: CreateScheduleModalProps) {
  const { createSchedule } = usePreventiveMutations();

  const form = useForm<PreventiveScheduleFormData>({
    resolver: zodResolver(preventiveScheduleSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "general",
      frequency_type: "months",
      frequency_value: 3,
      property_ids: [], // TODO: Multi-select UI for properties
      unit_ids: [],
      next_due_date: new Date().toISOString().split("T")[0],
      estimated_duration_hours: 1,
    },
  });

  function onSubmit(data: PreventiveScheduleFormData) {
    createSchedule.mutate(data, {
      onSuccess: () => {
        form.reset();
        onClose();
      },
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Preventive Schedule</DialogTitle>
          <DialogDescription>
            Set up recurring maintenance tasks for properties or units.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Quarterly HVAC Inspection" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="hvac">HVAC</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="safety">Safety / Fire</SelectItem>
                        <SelectItem value="appliance">Appliance</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="next_due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="frequency_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency Value</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="frequency_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="years">Years</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* TODO: Add Property Multi-Select here. For now, we'll hardcode one to pass validation if user submits */}
            <FormField
              control={form.control}
              name="property_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Properties</FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange([val])} 
                    defaultValue={field.value?.[0]}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary property (Multi-select coming)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="S0021">Stanton Heights</SelectItem>
                      <SelectItem value="S0045">Riverside Commons</SelectItem>
                      <SelectItem value="all">All Properties</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select which properties this schedule applies to.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Checklist Summary</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List key tasks or instructions..." 
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
              <Button type="submit" disabled={createSchedule.isPending}>
                {createSchedule.isPending ? "Creating..." : "Create Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
