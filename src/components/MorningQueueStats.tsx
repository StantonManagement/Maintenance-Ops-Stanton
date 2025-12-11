import { Card } from "./ui/card";
import { MorningQueueStats as StatsType } from "../types";
import { AlertTriangle, Clock, AlertCircle, ArrowUpRight } from "lucide-react";

interface MorningQueueStatsProps {
  stats: StatsType;
}

export function MorningQueueStats({ stats }: MorningQueueStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <Card className="p-4 bg-white border-l-4 border-l-blue-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 font-medium">Queue Total</p>
            <h3 className="text-2xl font-bold mt-1">{stats.totalItems}</h3>
          </div>
          <div className="bg-blue-100 p-2 rounded-full">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Items requiring attention</p>
      </Card>

      <Card className="p-4 bg-white border-l-4 border-l-amber-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 font-medium">Incomplete Yesterday</p>
            <h3 className="text-2xl font-bold mt-1 text-amber-600">{stats.incompleteFromYesterday}</h3>
          </div>
          <div className="bg-amber-100 p-2 rounded-full">
            <ArrowUpRight className="h-4 w-4 text-amber-600" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Completion Rate: {(stats.yesterdayCompletionRate * 100).toFixed(0)}%</p>
      </Card>

      <Card className="p-4 bg-white border-l-4 border-l-red-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 font-medium">SLA Overdue</p>
            <h3 className="text-2xl font-bold mt-1 text-red-600">{stats.slaOverdue}</h3>
          </div>
          <div className="bg-red-100 p-2 rounded-full">
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Immediate action needed</p>
      </Card>

      <Card className="p-4 bg-white border-l-4 border-l-orange-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 font-medium">Stuck / Access</p>
            <h3 className="text-2xl font-bold mt-1 text-orange-600">
              {stats.stuckWorkOrders + stats.accessIssues}
            </h3>
          </div>
          <div className="bg-orange-100 p-2 rounded-full">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Blocked progress</p>
      </Card>
    </div>
  );
}
