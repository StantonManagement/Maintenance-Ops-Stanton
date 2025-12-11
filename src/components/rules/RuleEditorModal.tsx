import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { businessRuleSchema, BusinessRuleFormData } from "../../schemas/businessRule";
import { useRuleMutations } from "../../hooks/useRuleMutations";
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
import { Checkbox } from "../ui/checkbox";

interface RuleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RuleEditorModal({ isOpen, onClose }: RuleEditorModalProps) {
  const { createRule } = useRuleMutations();

  const form = useForm<BusinessRuleFormData>({
    resolver: zodResolver(businessRuleSchema),
    defaultValues: {
      rule_name: "",
      description: "",
      rule_type: "assignment",
      priority: 50,
      active: true,
      condition_field: "category",
      condition_operator: "equals",
      condition_value: "",
      action_type: "assign_to",
      action_value: "",
    },
  });

  function onSubmit(data: BusinessRuleFormData) {
    createRule.mutate(data, {
      onSuccess: () => {
        form.reset();
        onClose();
      },
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Create Business Rule</DialogTitle>
          <DialogDescription>
            Define automation logic for work orders.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rule_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Emergency HVAC Escalation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rule_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="assignment">Auto-Assignment</SelectItem>
                        <SelectItem value="priority">Priority Logic</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="financial">Cost Approval</SelectItem>
                        <SelectItem value="capacity">Workload Cap</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Explain what this rule does..." 
                      className="h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* IF Condition Section */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
              <h4 className="font-semibold text-sm">IF Condition Matches:</h4>
              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={form.control}
                  name="condition_field"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Field" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="category">Category</SelectItem>
                          <SelectItem value="priority">Priority</SelectItem>
                          <SelectItem value="property_code">Property</SelectItem>
                          <SelectItem value="description">Description</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="condition_operator"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Operator" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="greater_than">Greater Than</SelectItem>
                          <SelectItem value="less_than">Less Than</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="condition_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Value (e.g. hvac)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* THEN Action Section */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
              <h4 className="font-semibold text-sm">THEN Perform Action:</h4>
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="action_type"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Action" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="assign_to">Assign Technician</SelectItem>
                          <SelectItem value="set_priority">Set Priority</SelectItem>
                          <SelectItem value="notify">Send Notification</SelectItem>
                          <SelectItem value="require_approval">Require Approval</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="action_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Value (e.g. tech-123)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Activate this rule immediately
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRule.isPending}>
                {createRule.isPending ? "Saving..." : "Save Rule"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
