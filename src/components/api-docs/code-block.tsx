"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CodeBlockProps = {
  code: string
  language?: string
  className?: string
}

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <div className={cn("group relative", className)}>
      <pre className="bg-muted text-foreground overflow-x-auto rounded-md p-3 pr-12 font-mono text-xs leading-relaxed">
        <code data-language={language}>{code}</code>
      </pre>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={copied ? "Copiado" : "Copiar"}
        onClick={handleCopy}
        className="absolute top-2 right-2 size-7 opacity-70 transition-opacity hover:opacity-100"
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </Button>
    </div>
  )
}
