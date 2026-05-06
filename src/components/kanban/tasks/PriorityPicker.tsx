"use client"

import type { Priority } from "@/server"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { PriorityGlyph } from "@/components/kanban/PriorityGlyph"
import { PRIORITY_OPTIONS } from "@/lib/schemas/task"

interface Props {
  value: Priority | undefined
  onChange: (value: Priority) => void
  invalid?: boolean
}

export function PriorityPicker({ value, onChange, invalid }: Props) {
  return (
    <ToggleGroup
      value={value ? [value] : []}
      onValueChange={(values) => {
        const next = values[0] as Priority | undefined
        if (next) onChange(next)
      }}
      variant="outline"
      size="sm"
      aria-invalid={invalid}
      className="aria-invalid:border-destructive"
    >
      {PRIORITY_OPTIONS.map((opt) => (
        <ToggleGroupItem
          key={opt.value}
          value={opt.value}
          aria-label={opt.label}
          className="gap-2"
        >
          <PriorityGlyph priority={opt.value} />
          <span>{opt.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
