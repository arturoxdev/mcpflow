"use client"

import type { Effort } from "@/server"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { EffortGlyph } from "@/components/kanban/EffortGlyph"
import { EFFORT_OPTIONS } from "@/lib/schemas/task"

interface Props {
  value: Effort | undefined
  onChange: (value: Effort) => void
  invalid?: boolean
}

export function EffortPicker({ value, onChange, invalid }: Props) {
  return (
    <ToggleGroup
      value={value ? [value] : []}
      onValueChange={(values) => {
        const next = values[0] as Effort | undefined
        if (next) onChange(next)
      }}
      variant="outline"
      size="sm"
      aria-invalid={invalid}
      className="aria-invalid:border-destructive"
    >
      {EFFORT_OPTIONS.map((opt) => (
        <ToggleGroupItem
          key={opt.value}
          value={opt.value}
          aria-label={opt.label}
          className="gap-2"
        >
          <EffortGlyph effort={opt.value} />
          <span>{opt.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
