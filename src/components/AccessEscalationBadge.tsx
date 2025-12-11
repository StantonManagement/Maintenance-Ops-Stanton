import { Badge } from "./ui/badge";
import { UserX, FileText, Briefcase, Scale } from "lucide-react";
import type { EscalationStage } from "../types";

interface AccessEscalationBadgeProps {
  stage: EscalationStage;
  className?: string;
}

const STAGE_CONFIG: Record<EscalationStage, { color: string; icon: any; label: string }> = {
  not_started: {
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: UserX,
    label: "No Access"
  },
  initial_attempt: {
    color: "bg-blue-50 text-blue-600 border-blue-200",
    icon: UserX,
    label: "Attempt 1: Call"
  },
  written_notice: {
    color: "bg-yellow-50 text-yellow-600 border-yellow-200",
    icon: FileText,
    label: "Attempt 2: Notice"
  },
  caseworker_contact: {
    color: "bg-orange-50 text-orange-600 border-orange-200",
    icon: Briefcase,
    label: "Attempt 3: Caseworker"
  },
  legal_escalation: {
    color: "bg-red-50 text-red-600 border-red-200 animate-pulse",
    icon: Scale,
    label: "LEGAL ACTION"
  }
};

export function AccessEscalationBadge({ stage, className = "" }: AccessEscalationBadgeProps) {
  const config = STAGE_CONFIG[stage] || STAGE_CONFIG.not_started;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1.5 h-6 px-2 ${config.color} ${className}`}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  );
}
