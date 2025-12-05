import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

interface TechnicianStat {
  id: string;
  name: string;
  completed: number;
  firstTimeFixRate: number;
  avgTime: string;
  rating: number;
}

interface TechnicianLeaderboardProps {
  data: TechnicianStat[];
}

export function TechnicianLeaderboard({ data }: TechnicianLeaderboardProps) {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Technician Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((tech, index) => (
            <div key={tech.id} className="flex items-center justify-between border-b pb-2 last:border-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {index + 1}
                </div>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${tech.name}`} alt="Avatar" />
                  <AvatarFallback>{tech.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{tech.name}</p>
                  <p className="text-xs text-muted-foreground">{tech.completed} Completed</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <p className="font-medium">{tech.firstTimeFixRate}%</p>
                  <p className="text-xs text-muted-foreground">Fix Rate</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="font-medium">{tech.avgTime}</p>
                  <p className="text-xs text-muted-foreground">Avg Time</p>
                </div>
                <Badge variant={tech.rating >= 4.5 ? "default" : "secondary"}>
                  {tech.rating.toFixed(1)} ★
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
