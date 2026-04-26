"use client"

import { Priority } from "@repo/core"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PRIORITY_OPTIONS } from "@/lib/schemas/task"

interface PrioritySelectProps {
  value: Priority | ""
  onChange: (value: Priority) => void
  invalid?: boolean
  id?: string
}

const items = [
  { value: null, label: "Seleccionar..." },
  ...PRIORITY_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
]

export function PrioritySelect({
  value,
  onChange,
  invalid,
  id,
}: PrioritySelectProps) {
  return (
    <Select
      items={items}
      value={value || null}
      onValueChange={(v) => v && onChange(v as Priority)}
    >
      <SelectTrigger id={id} aria-invalid={invalid} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {PRIORITY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
