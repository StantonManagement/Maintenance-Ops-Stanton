import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { Loader2, User, Wrench, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AssignTechnicianModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderId: string;
  workOrderCategory?: string;
  currentTechnicianId?: string;
  onAssigned?: () => void;
}

export function AssignTechnicianModal({
  open,
  onOpenChange,
  workOrderId,
  workOrderCategory,
  currentTechnicianId,
  onAssigned
}: AssignTechnicianModalProps) {
  const { technicians, loading: techsLoading } = useTechnicians();
  const { assignWorkOrder } = useWorkOrders();
  const [selectedTechId, setSelectedTechId] = useState<string | null>(currentTechnicianId || null);
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedTechId) {
      toast.error('Please select a technician');
      return;
    }

    const selectedTech = technicians.find(t => t.id === selectedTechId);
    if (!selectedTech) {
      toast.error('Selected technician not found');
      return;
    }

    setAssigning(true);
    try {
      await assignWorkOrder(workOrderId, selectedTechId, selectedTech.name);
      toast.success('Technician assigned successfully');
      onOpenChange(false);
      onAssigned?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign technician');
    } finally {
      setAssigning(false);
    }
  };

  // Check if technician has matching skills for the work order category
  const hasMatchingSkill = (techSkills: string[], category?: string) => {
    if (!category) return false;
    const categoryLower = category.toLowerCase();
    return techSkills.some(skill => 
      skill.toLowerCase().includes(categoryLower) || 
      categoryLower.includes(skill.toLowerCase())
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Technician</DialogTitle>
          <DialogDescription>
            Select a technician to assign to this work order.
            {workOrderCategory && (
              <span className="block mt-1">
                Category: <Badge variant="outline">{workOrderCategory}</Badge>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {techsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : technicians.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No technicians available
            </div>
          ) : (
            <div className="space-y-2">
              {technicians.map((tech) => {
                const isSelected = selectedTechId === tech.id;
                const skillMatch = hasMatchingSkill(tech.skills || [], workOrderCategory);
                const isAvailable = tech.status === 'available' || tech.status === null;

                return (
                  <button
                    key={tech.id}
                    onClick={() => setSelectedTechId(tech.id)}
                    className={cn(
                      "w-full p-4 rounded-lg border text-left transition-all",
                      isSelected 
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                        : "border-border hover:border-primary/50 hover:bg-muted/50",
                      !isAvailable && "opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          {tech.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {tech.name}
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span className={cn(
                              isAvailable ? "text-green-600" : "text-amber-600"
                            )}>
                              {tech.status || 'Available'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {skillMatch && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          <Wrench className="h-3 w-3 mr-1" />
                          Skill Match
                        </Badge>
                      )}
                    </div>

                    {tech.skills && tech.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {tech.skills.slice(0, 5).map((skill, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              workOrderCategory && skill.toLowerCase().includes(workOrderCategory.toLowerCase()) 
                                ? "border-green-500 text-green-700" 
                                : ""
                            )}
                          >
                            {skill}
                          </Badge>
                        ))}
                        {tech.skills.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{tech.skills.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedTechId || assigning}>
            {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentTechnicianId ? 'Reassign' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
