import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { format, subDays, eachDayOfInterval, getDay } from "date-fns"

interface HeatmapDataPoint {
  date: string
  count: number
}

interface HeatmapProps {
  data: HeatmapDataPoint[]
  startDate?: Date
  endDate?: Date
  loading?: boolean
  className?: string
  colorScale?: string[]
  selectedDate?: string | null
  onDateSelect?: (date: string | null) => void
}

const DEFAULT_COLOR_SCALE = [
  "bg-muted/30",        // 0
  "bg-emerald-500/20",  // 1-2
  "bg-emerald-500/40",  // 3-5
  "bg-emerald-500/70",  // 6-9
  "bg-emerald-500",     // 10+
]

export function Heatmap({
  data,
  startDate = subDays(new Date(), 365),
  endDate = new Date(),
  loading = false,
  className,
  colorScale = DEFAULT_COLOR_SCALE,
  selectedDate,
  onDateSelect,
}: HeatmapProps) {
  const days = React.useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [startDate, endDate])

  const maxCount = React.useMemo(() => {
    return Math.max(...data.map((d) => d.count), 0)
  }, [data])

  const getColor = (count: number) => {
    if (count === 0) return colorScale[0]
    if (maxCount === 0) return colorScale[1]
    
    const percentage = count / maxCount
    if (percentage <= 0.25) return colorScale[1]
    if (percentage <= 0.5) return colorScale[2]
    if (percentage <= 0.75) return colorScale[3]
    return colorScale[4]
  }

  // Group days into weeks for the grid layout
  // GitHub heatmap starts with Sunday on top
  const weeks: Date[][] = []
  let currentWeek: Date[] = []

  // Padding for the first week
  const firstDayOfWeek = getDay(days[0])
  for (let i = 0; i < firstDayOfWeek; i++) {
    // We can't really "pad" with null easy in this structure, 
    // but we can just handle the rendering
  }

  days.forEach((day) => {
    if (getDay(day) === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(day)
  })
  if (currentWeek.length > 0) weeks.push(currentWeek)

  if (loading) {
    return (
      <div className={cn("flex flex-col gap-4 animate-pulse", className)}>
        <div className="h-4 w-48 bg-muted rounded" />
        <div className="flex gap-1 overflow-x-auto pb-2">
          {Array.from({ length: 52 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className="h-3 w-3 rounded-sm bg-muted" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-1.5 min-w-max">
          <TooltipProvider delayDuration={0}>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1.5">
                {/* 
                  To align correctly, if it's the first week, we might need 
                  to offset the items if it doesn't start on Sunday (index 0)
                */}
                {weekIndex === 0 && Array.from({ length: getDay(week[0]) }).map((_, i) => (
                   <div key={`empty-${i}`} className="h-3.5 w-3.5 rounded-[2px] opacity-0" />
                ))}
                
                {week.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd")
                  const point = data.find((d) => d.date === dateStr)
                  const count = point?.count || 0
                  
                  return (
                    <Tooltip key={dateStr}>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ 
                            duration: 0.2, 
                            delay: (weekIndex * 0.01) + (getDay(day) * 0.005) 
                          }}
                          onClick={() => onDateSelect?.(selectedDate === dateStr ? null : dateStr)}
                          className={cn(
                            "h-3.5 w-3.5 rounded-[2px] cursor-pointer transition-all hover:ring-2 hover:ring-ring hover:ring-offset-1",
                            getColor(count),
                            selectedDate === dateStr && "ring-2 ring-primary ring-offset-2 scale-110 z-20"
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {format(day, "yyyy.MM.dd")}-нд <span className="font-medium">{count}</span> идэвхжүүлэлт 
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            ))}
          </TooltipProvider>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground self-end">
        <span>Бага</span>
        <div className="flex gap-1">
          {colorScale.map((color, i) => (
            <div key={i} className={cn("h-2.5 w-2.5 rounded-[1px]", color)} />
          ))}
        </div>
        <span>Их</span>
      </div>
    </div>
  )
}
