import { IconCircleCheckFilled, IconLoader } from '@tabler/icons-react';
import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { Edit, EllipsisVertical, Trash } from 'lucide-react';
import type z from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TodoSchema } from '@/queries/todo/type';

const columnHelper = createColumnHelper<z.infer<typeof TodoSchema>>();

export const todoColumns = [
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  }),
  columnHelper.accessor('id', {
    header: () => <h2>ID</h2>,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('userId', {
    header: () => <h2>User ID</h2>,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('title', {
    header: () => <h2>Todo</h2>,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('completed', {
    header: () => <h2>Status</h2>,
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.completed === true ? (
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
        ) : (
          <IconLoader />
        )}
        {row.original.completed ? 'completed' : 'in progress'}
      </Badge>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <EllipsisVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>
            <Edit />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <Trash />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
    enableHiding: false,
  }),
] as ColumnDef<z.infer<typeof TodoSchema>, unknown>[];
