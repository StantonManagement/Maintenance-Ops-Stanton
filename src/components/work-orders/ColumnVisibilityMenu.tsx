import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2 } from "lucide-react";

interface ColumnVisibilityMenuProps {
  columns: { id: string; label: string; visible: boolean }[];
  onChange: (columnId: string, visible: boolean) => void;
}

export function ColumnVisibilityMenu({ columns, onChange }: ColumnVisibilityMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex">
          <Settings2 className="mr-2 h-4 w-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <div key={column.id} className="flex items-center space-x-2 p-2">
            <Checkbox
              id={`col-${column.id}`}
              checked={column.visible}
              onCheckedChange={(checked) => onChange(column.id, !!checked)}
              disabled={column.id === 'deadline' || column.id === 'status'} // Prevent hiding critical columns
            />
            <label
              htmlFor={`col-${column.id}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {column.label}
            </label>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
