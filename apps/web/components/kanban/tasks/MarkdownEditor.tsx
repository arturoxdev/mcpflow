"use client"

import ReactMarkdown from "react-markdown"

import { cn } from "@/lib/utils"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  mode?: "edit" | "view"
  placeholder?: string
  minHeight?: string
}

export function MarkdownEditor({
  value,
  onChange,
  mode = "edit",
  placeholder = "Escribe en markdown…",
  minHeight = "min-h-56",
}: MarkdownEditorProps) {
  if (mode === "edit") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "border-input bg-card focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-y rounded-lg border p-4 font-mono text-xs leading-relaxed outline-none transition-colors focus-visible:ring-3",
          minHeight
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        "border-input bg-card prose prose-invert prose-sm max-w-none rounded-lg border p-5",
        minHeight
      )}
    >
      {value ? (
        <ReactMarkdown>{value}</ReactMarkdown>
      ) : (
        <p className="text-muted-foreground italic">Nada que previsualizar</p>
      )}
    </div>
  )
}
