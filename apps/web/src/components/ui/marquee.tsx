"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  pauseOnHover?: boolean
  reverse?: boolean
  className?: string
}

export function Marquee({
  children,
  className,
  pauseOnHover = false,
  reverse = false,
  ...props
}: MarqueeProps) {
  return (
    <div
      className={cn("flex overflow-hidden", className)}
      {...props}
    >
      <div
        className={cn(
          "flex w-max",
          "animate-marquee",
          reverse && "animate-marquee-reverse",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {children}
        {children}
        {children}
      </div>
    </div>
  )
}
