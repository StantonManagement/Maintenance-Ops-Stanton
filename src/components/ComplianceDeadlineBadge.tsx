import { Badge } from "./ui/badge";
import { AlertTriangle, Calendar, Clock } from "lucide-react";
import type { ComplianceDeadlineType } from "../types";

interface ComplianceDeadlineBadgeProps {
  daysUntil?: number;
  type?: ComplianceDeadlineType;
  className?: string;
}

export function ComplianceDeadlineBadge({ daysUntil, type, className = "" }: ComplianceDeadlineBadgeProps) {
  if (daysUntil === undefined) return null;

  let colorClass = "bg-gray-100 text-gray-700 border-gray-200";
  let icon = <Calendar className="h-3 w-3" />;
  let text = `${daysUntil} days`;

  if (daysUntil < 0) {
    colorClass = "bg-red-100 text-red-700 border-red-200 animate-pulse";
    icon = <AlertTriangle className="h-3 w-3" />;
    text = `Overdue by ${Math.abs(daysUntil)} days`;
  } else if (daysUntil <= 7) {
    colorClass = "bg-red-50 text-red-600 border-red-200";
    icon = <AlertTriangle className="h-3 w-3" />;
    text = `Due in ${daysUntil} days`;
  } else if (daysUntil <= 14) {
    colorClass = "bg-amber-50 text-amber-600 border-amber-200";
    icon = <Clock className="h-3 w-3" />;
    text = `${daysUntil} days away`;
  } else if (daysUntil <= 30) {
    colorClass = "bg-blue-50 text-blue-600 border-blue-200";
    icon = <Calendar className="h-3 w-3" />;
    text = `${daysUntil} days`;
  }

  const label = type ? type.replace(/_/g, ' ').replace('section 8', 'Sec. 8').toUpperCase() : 'INSPECTION';

  return (
    <Badge variant="outline" className={`gap-1.5 h-6 px-2 ${colorClass} ${className}`}>
      {icon}
      <span className="font-semibold text-[10px]">{label}:</span>
      <span>{text}</span>
    </Badge>
  );
}
