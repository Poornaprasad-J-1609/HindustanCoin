"use client"

import { useState, useEffect } from "react"
import { ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, Line, CartesianGrid } from "recharts"
import { ChartTooltip } from "@/components/ui/chart"

interface CryptoChartProps {
  data: any[]
  timeframe: string
}

export default function CryptoChart({ data, timeframe }: CryptoChartProps) {
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    if (data && data.length > 0) {
      const formattedData = data.map((item) => ({
        date: new Date(item[0]),
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
        color: item[4] >= item[1] ? "#22c55e" : "#ef4444", // green if close >= open, red otherwise
      }))
      setChartData(formattedData)
    }
  }, [data])

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    if (timeframe === "24h") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (timeframe === "7d") {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`
    } else if (value < 0.01) {
      return `$${value.toExponential(2)}`
    }
    return `$${value.toFixed(2)}`
  }

  const formatTooltipValue = (value: number) => {
    if (value < 0.01) {
      return value.toFixed(8)
    } else if (value < 1) {
      return value.toFixed(4)
    } else if (value < 10) {
      return value.toFixed(3)
    } else if (value < 1000) {
      return value.toFixed(2)
    } else {
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
    }
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <p>Loading chart data...</p>
      </div>
    )
  }

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: "#888" }}
            axisLine={{ stroke: "#444" }}
            tickLine={{ stroke: "#444" }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fill: "#888" }}
            axisLine={{ stroke: "#444" }}
            tickLine={{ stroke: "#444" }}
            domain={["auto", "auto"]}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <ChartTooltip>
                    <div className="flex flex-col gap-2">
                      <p className="text-gray-400 text-sm">{formatDate(data.date)}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <p className="text-gray-400 text-sm">Open:</p>
                        <p className="font-medium">${formatTooltipValue(data.open)}</p>
                        <p className="text-gray-400 text-sm">High:</p>
                        <p className="font-medium">${formatTooltipValue(data.high)}</p>
                        <p className="text-gray-400 text-sm">Low:</p>
                        <p className="font-medium">${formatTooltipValue(data.low)}</p>
                        <p className="text-gray-400 text-sm">Close:</p>
                        <p className={`font-medium ${data.close >= data.open ? "text-green-500" : "text-red-500"}`}>
                          ${formatTooltipValue(data.close)}
                        </p>
                      </div>
                    </div>
                  </ChartTooltip>
                )
              }
              return null
            }}
          />
          {/* Candlestick body */}
          <Bar
            dataKey="size"
            fill="#8884d8"
            stroke="#8884d8"
            barSize={8}
            shape={(props: any) => {
              const { x, y, width, height, fill } = props
              const data = props.payload
              const color = data.color

              // Calculate the y positions for open and close
              const openY = data.open > data.close ? y : y + height

              const closeY = data.open > data.close ? y + height : y

              return (
                <rect
                  x={x - width / 2}
                  y={Math.min(openY, closeY)}
                  width={width}
                  height={Math.abs(closeY - openY) || 1}
                  fill={color}
                  stroke={color}
                />
              )
            }}
          />
          {/* High-Low wicks */}
          <Line
            dataKey="high"
            stroke="#8884d8"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            legendType="none"
            strokeWidth={1}
            shape={(props: any) => {
              const { points } = props
              const data = points[0].payload
              const x = points[0].x
              const color = data.color

              // Calculate y positions
              const highY = points[0].y
              const openY =
                data.open > data.close
                  ? points[0].y + ((data.high - data.open) / (data.high - data.low)) * (points[1].y - points[0].y)
                  : points[0].y + ((data.high - data.close) / (data.high - data.low)) * (points[1].y - points[0].y)
              const closeY =
                data.open > data.close
                  ? points[0].y + ((data.high - data.close) / (data.high - data.low)) * (points[1].y - points[0].y)
                  : points[0].y + ((data.high - data.open) / (data.high - data.low)) * (points[1].y - points[0].y)
              const lowY = points[1].y

              return (
                <g>
                  {/* High to Open/Close wick */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={data.open > data.close ? openY : closeY}
                    stroke={color}
                    strokeWidth={1}
                  />
                  {/* Open/Close to Low wick */}
                  <line
                    x1={x}
                    y1={data.open > data.close ? closeY : openY}
                    x2={x}
                    y2={lowY}
                    stroke={color}
                    strokeWidth={1}
                  />
                </g>
              )
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
