"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, ComposedChart } from "recharts"
import { ChartTooltip } from "@/components/ui/chart"
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from "lucide-react"

interface VolumeAnalysisProps {
  cryptoData: any
  historicalData: any[]
  timeframe: string
}

export default function VolumeAnalysis({ cryptoData, historicalData, timeframe }: VolumeAnalysisProps) {
  const [volumeData, setVolumeData] = useState<any[]>([])
  const [volumeMetrics, setVolumeMetrics] = useState<{
    averageVolume: number
    volumeChange: number
    anomalies: any[]
    priceVolumeCorrelation: number
  }>({
    averageVolume: 0,
    volumeChange: 0,
    anomalies: [],
    priceVolumeCorrelation: 0,
  })
  const [volumeTimeframe, setVolumeTimeframe] = useState("7d")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (historicalData.length > 0) {
      generateVolumeData()
    }
  }, [historicalData, volumeTimeframe])

  const generateVolumeData = () => {
    setLoading(true)

    // In a real app, we would fetch actual volume data
    // For this demo, we'll simulate volume data based on price data
    const simulatedVolumeData = historicalData.map((pricePoint, index) => {
      const timestamp = pricePoint[0]
      const closePrice = pricePoint[4]

      // Generate volume that somewhat correlates with price movements
      // but has its own patterns
      const baseVolume = cryptoData.total_volume / 24 // Daily volume divided by hours

      // Add some randomness and correlation with price
      const priceVolatility =
        index > 0 ? Math.abs(closePrice - historicalData[index - 1][4]) / historicalData[index - 1][4] : 0

      // Volume tends to be higher when price volatility is higher
      const volumeMultiplier = 1 + priceVolatility * 10 + Math.random() * 0.5

      // Sometimes add volume spikes
      const isSpike = Math.random() > 0.95
      const spikeMultiplier = isSpike ? 2 + Math.random() * 3 : 1

      const volume = baseVolume * volumeMultiplier * spikeMultiplier

      return {
        timestamp,
        date: new Date(timestamp),
        price: closePrice,
        volume,
        isSpike,
      }
    })

    // Calculate volume metrics
    const totalVolume = simulatedVolumeData.reduce((sum, data) => sum + data.volume, 0)
    const averageVolume = totalVolume / simulatedVolumeData.length

    // Calculate volume change (comparing first half to second half)
    const halfIndex = Math.floor(simulatedVolumeData.length / 2)
    const firstHalfVolume = simulatedVolumeData.slice(0, halfIndex).reduce((sum, data) => sum + data.volume, 0)
    const secondHalfVolume = simulatedVolumeData.slice(halfIndex).reduce((sum, data) => sum + data.volume, 0)
    const volumeChange = ((secondHalfVolume - firstHalfVolume) / firstHalfVolume) * 100

    // Identify volume anomalies (significantly above average)
    const anomalyThreshold = averageVolume * 1.8
    const anomalies = simulatedVolumeData
      .filter((data) => data.volume > anomalyThreshold)
      .map((data) => ({
        date: data.date,
        volume: data.volume,
        percentAboveAverage: ((data.volume - averageVolume) / averageVolume) * 100,
      }))

    // Calculate price-volume correlation
    // This is a simplified correlation calculation
    const priceChanges = []
    const volumeChanges = []

    for (let i = 1; i < simulatedVolumeData.length; i++) {
      const priceChange =
        (simulatedVolumeData[i].price - simulatedVolumeData[i - 1].price) / simulatedVolumeData[i - 1].price
      const volumeChange =
        (simulatedVolumeData[i].volume - simulatedVolumeData[i - 1].volume) / simulatedVolumeData[i - 1].volume

      priceChanges.push(priceChange)
      volumeChanges.push(volumeChange)
    }

    // Calculate correlation coefficient
    const priceAvg = priceChanges.reduce((sum, val) => sum + val, 0) / priceChanges.length
    const volumeAvg = volumeChanges.reduce((sum, val) => sum + val, 0) / volumeChanges.length

    let numerator = 0
    let priceVariance = 0
    let volumeVariance = 0

    for (let i = 0; i < priceChanges.length; i++) {
      const priceDiff = priceChanges[i] - priceAvg
      const volumeDiff = volumeChanges[i] - volumeAvg

      numerator += priceDiff * volumeDiff
      priceVariance += priceDiff * priceDiff
      volumeVariance += volumeDiff * volumeDiff
    }

    const correlation = numerator / (Math.sqrt(priceVariance) * Math.sqrt(volumeVariance))

    setVolumeData(simulatedVolumeData)
    setVolumeMetrics({
      averageVolume,
      volumeChange,
      anomalies,
      priceVolumeCorrelation: correlation,
    })

    setLoading(false)
  }

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

  const formatVolume = (volume: number) => {
    if (volume >= 1_000_000_000) {
      return `$${(volume / 1_000_000_000).toFixed(1)}B`
    } else if (volume >= 1_000_000) {
      return `$${(volume / 1_000_000).toFixed(1)}M`
    } else if (volume >= 1_000) {
      return `$${(volume / 1_000).toFixed(1)}K`
    } else {
      return `$${volume.toFixed(0)}`
    }
  }

  if (loading || volumeData.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Trading Volume Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p>Loading volume data...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Trading Volume Analysis
        </CardTitle>
        <Select value={volumeTimeframe} onValueChange={setVolumeTimeframe}>
          <SelectTrigger className="w-[120px] bg-gray-800 border-gray-700">
            <SelectValue placeholder="Timeframe" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="24h">24 Hours</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Average Volume</div>
            <div className="text-xl font-bold">{formatVolume(volumeMetrics.averageVolume)}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Volume Trend</div>
            <div className="flex items-center">
              {volumeMetrics.volumeChange >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
              )}
              <span
                className={`text-xl font-bold ${volumeMetrics.volumeChange >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                {volumeMetrics.volumeChange >= 0 ? "+" : ""}
                {volumeMetrics.volumeChange.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Price-Volume Correlation</div>
            <div className="flex items-center">
              <span
                className={`text-xl font-bold ${
                  Math.abs(volumeMetrics.priceVolumeCorrelation) > 0.5
                    ? volumeMetrics.priceVolumeCorrelation > 0
                      ? "text-green-500"
                      : "text-red-500"
                    : "text-yellow-500"
                }`}
              >
                {volumeMetrics.priceVolumeCorrelation.toFixed(2)}
              </span>
              <span className="text-sm text-gray-400 ml-2">
                {Math.abs(volumeMetrics.priceVolumeCorrelation) > 0.7
                  ? "Strong"
                  : Math.abs(volumeMetrics.priceVolumeCorrelation) > 0.3
                    ? "Moderate"
                    : "Weak"}
              </span>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={volumeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatDate}
                tick={{ fill: "#888" }}
                axisLine={{ stroke: "#444" }}
                tickLine={{ stroke: "#444" }}
              />
              <YAxis
                yAxisId="volume"
                orientation="right"
                tickFormatter={formatVolume}
                tick={{ fill: "#888" }}
                axisLine={{ stroke: "#444" }}
                tickLine={{ stroke: "#444" }}
              />
              <YAxis
                yAxisId="price"
                orientation="left"
                tickFormatter={(value) => `$${value.toLocaleString()}`}
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
                          <p className="text-gray-400 text-sm">{formatDate(data.timestamp)}</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <p className="text-gray-400 text-sm">Price:</p>
                            <p className="font-medium">
                              ${data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-gray-400 text-sm">Volume:</p>
                            <p className="font-medium">{formatVolume(data.volume)}</p>
                            {data.isSpike && (
                              <>
                                <p className="text-gray-400 text-sm">Status:</p>
                                <p className="font-medium text-yellow-500">Volume Spike</p>
                              </>
                            )}
                          </div>
                        </div>
                      </ChartTooltip>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="volume" yAxisId="volume" fill="#8884d8" opacity={0.6} name="Volume" fillOpacity={0.5} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#82ca9d"
                yAxisId="price"
                dot={false}
                name="Price"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {volumeMetrics.anomalies.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
              Volume Anomalies Detected
            </h4>
            <div className="space-y-2">
              {volumeMetrics.anomalies.slice(0, 3).map((anomaly, index) => (
                <div key={index} className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                  <div>
                    <span className="text-sm">
                      {anomaly.date.toLocaleDateString()}{" "}
                      {anomaly.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div className="text-xs text-gray-400">
                      {anomaly.percentAboveAverage.toFixed(0)}% above average volume
                    </div>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30">
                    {formatVolume(anomaly.volume)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-400">
          <p>
            {volumeMetrics.priceVolumeCorrelation > 0.7
              ? "Strong positive correlation between price and volume indicates strong market conviction in the current trend."
              : volumeMetrics.priceVolumeCorrelation < -0.7
                ? "Strong negative correlation between price and volume may indicate a potential trend reversal."
                : volumeMetrics.priceVolumeCorrelation > 0.3
                  ? "Moderate positive correlation between price and volume suggests normal market behavior."
                  : volumeMetrics.priceVolumeCorrelation < -0.3
                    ? "Moderate negative correlation between price and volume could indicate market uncertainty."
                    : "Weak correlation between price and volume suggests mixed market signals."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
