import { cn } from "@/lib/utils"

interface Props {
  className?: string
}

export function BrandMark({ className }: Props) {
  return (
    <>
      <img
        src="/torii-mono-black.svg"
        alt=""
        aria-hidden
        className={cn("block dark:hidden", className)}
      />
      <img
        src="/torii-mono-white.svg"
        alt=""
        aria-hidden
        className={cn("hidden dark:block", className)}
      />
    </>
  )
}
