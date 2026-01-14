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
      <div className="flex min-w-full shrink-0 justify-around gap-8 relative">
        {/* First set - animates across screen */}
        <div
          className={cn(
            "flex gap-8 absolute left-0",
            "animate-marquee",
            reverse && "animate-marquee-reverse",
            pauseOnHover && "hover:[animation-play-state:paused]"
          )}
        >
          {children}
        </div>
        {/* Second set - duplicated for seamless loop */}
        <div
          className={cn(
            "flex gap-8 absolute left-full",
            "animate-marquee",
            reverse && "animate-marquee-reverse",
            pauseOnHover && "hover:[animation-play-state:paused]"
          )}
          aria-hidden="true"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
