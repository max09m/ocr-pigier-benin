"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
  UsersRoundIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatFieldValue } from "@/lib/format"
import { entryHasIssues } from "@/lib/validations/entry"
import { EditEntryDialog } from "./edit-entry-dialog"
import { ConfirmEntryButton } from "./confirm-entry-button"
import { DeleteEntryButton } from "./delete-entry-button"
import type { Entry, Field as FieldModel } from "@/app/generated/prisma/client"

const PAGE_SIZES = [12, 20, 30, 50, 100, 200]

export function EntriesTable({
  sessionId,
  fields,
  entries,
}: {
  sessionId: string
  fields: FieldModel[]
  entries: Entry[]
}) {
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: PAGE_SIZES[0],
  })

  const columns = React.useMemo<ColumnDef<Entry>[]>(
    () => [
      {
        id: "ligne",
        header: "N°",
        cell: ({ row }) => row.original.ligne,
      },
      ...fields.map((field): ColumnDef<Entry> => ({
        id: field.key,
        header: field.label,
        cell: ({ row }) => {
          const valeurs = (row.original.valeurs ?? {}) as Record<
            string,
            unknown
          >
          return formatFieldValue(field, valeurs[field.key])
        },
      })),
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1.5">
            {row.original.statut === "a_verifier" && (
              <ConfirmEntryButton
                sessionId={sessionId}
                entryId={row.original.id}
              />
            )}
            <EditEntryDialog
              sessionId={sessionId}
              fields={fields}
              entry={row.original}
            />
            <DeleteEntryButton
              sessionId={sessionId}
              entryId={row.original.id}
            />
          </div>
        ),
      },
    ],
    [fields, sessionId]
  )

  const table = useReactTable({
    data: entries,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  if (entries.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersRoundIcon />
          </EmptyMedia>
          <EmptyTitle>Aucune entrée</EmptyTitle>
          <EmptyDescription>
            Ajoute la première ligne avec le formulaire ci-dessus.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  entryHasIssues(
                    fields,
                    (row.original.valeurs ?? {}) as Record<string, unknown>
                  ) && "border-l-2 border-l-destructive bg-destructive/5"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="entries-page-size" className="text-sm font-medium">
            Lignes par page
          </Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger size="sm" className="w-20" id="entries-page-size">
              <SelectValue>{(value: string) => value}</SelectValue>
            </SelectTrigger>
            <SelectContent side="top">
              <SelectGroup>
                {PAGE_SIZES.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} sur{" "}
            {Math.max(table.getPageCount(), 1)}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Première page</span>
              <ChevronsLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Page précédente</span>
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Page suivante</span>
              <ChevronRightIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Dernière page</span>
              <ChevronsRightIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
