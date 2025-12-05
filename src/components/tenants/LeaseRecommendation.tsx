import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { AlertCircle, CheckCircle2, FileText } from "lucide-react";

interface RecommendationProps {
  type: 'renew' | 'review' | 'non-renew';
  confidence: number;
  factors: string[];
}

export function LeaseRecommendation({ type, confidence, factors }: RecommendationProps) {
  const getHeader = () => {
    switch (type) {
      case 'renew':
        return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', text: 'Recommend Renewal' };
      case 'non-renew':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', text: 'Suggest Non-Renewal' };
      default:
        return { icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', text: 'Review Required' };
    }
  };

  const { icon: Icon, color, bg, text } = getHeader();

  return (
    <Card>
      <CardHeader className={`${bg} border-b pb-3`}>
        <CardTitle className={`flex items-center gap-2 ${color}`}>
          <Icon className="h-5 w-5" />
          {text}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="mb-4">
          <div className="text-sm text-muted-foreground mb-1">AI Confidence Score</div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className={`h-full ${type === 'renew' ? 'bg-green-500' : type === 'non-renew' ? 'bg-red-500' : 'bg-amber-500'}`} 
              style={{ width: `${confidence}%` }}
            />
          </div>
          <div className="text-right text-xs text-muted-foreground mt-1">{confidence}%</div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Key Factors:</div>
          <ul className="text-sm space-y-1">
            {factors.map((factor, idx) => (
              <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {factor}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
