"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowUpCircle, ArrowDownCircle, MinusCircle, AlertTriangle } from "lucide-react"

interface TradingSignalsProps {
  cryptoData: any
  historicalData: any[]
}

export default function TradingSignals({ cryptoData, historicalData }: TradingSignalsProps) {
  const [signal, setSignal] = useState<"buy" | "sell" | "hold" | null>(null)
  const [confidence, setConfidence] = useState(0)
  const [indicators, setIndicators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (cryptoData && historicalData.length > 0) {
      // Simulate AI analysis with a delay
      setLoading(true)
      const timer = setTimeout(() => {
        generateSignals()
        setLoading(false)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [cryptoData, historicalData])

  const generateSignals = () => {
    // This is a simplified simulation of trading signals
    // In a real app, this would use actual ML algorithms

    // Calculate price change percentage
    const priceChange = cryptoData.price_change_percentage_24h

    // Generate random technical indicators with a bias based on price change
    const macdSignal = priceChange > 0 ? Math.random() > 0.3 : Math.random() > 0.7
    const rsiValue = priceChange > 0 ? 30 + Math.random() * 40 : 40 + Math.random() * 40
    const maValue = priceChange > 0 ? Math.random() > 0.4 : Math.random() > 0.6

    // Set indicators
    const generatedIndicators = [
      {
        name: "MACD",
        value: macdSignal ? "Bullish" : "Bearish",
        signal: macdSignal ? "buy" : "sell",
        description: macdSignal
          ? "MACD line is above the signal line, indicating upward momentum"
          : "MACD line is below the signal line, indicating downward momentum",
      },
      {
        name: "RSI",
        value: rsiValue.toFixed(2),
        signal: rsiValue < 30 ? "buy" : rsiValue > 70 ? "sell" : "hold",
        description:
          rsiValue < 30
            ? "RSI indicates oversold conditions"
            : rsiValue > 70
              ? "RSI indicates overbought conditions"
              : "RSI is in neutral territory",
      },
      {
        name: "Moving Averages",
        value: maValue ? "Bullish" : "Bearish",
        signal: maValue ? "buy" : "sell",
        description: maValue
          ? "Price is above key moving averages, suggesting uptrend"
          : "Price is below key moving averages, suggesting downtrend",
      },
      {
        name: "Volume Analysis",
        value: Math.random() > 0.5 ? "High" : "Low",
        signal: Math.random() > 0.5 ? "buy" : "hold",
        description:
          Math.random() > 0.5 ? "Increasing volume supports price movement" : "Low volume suggests weak conviction",
      },
    ]

    setIndicators(generatedIndicators)

    // Determine overall signal
    const buySignals = generatedIndicators.filter((i) => i.signal === "buy").length
    const sellSignals = generatedIndicators.filter((i) => i.signal === "sell").length

    let overallSignal: "buy" | "sell" | "hold"
    let signalConfidence: number

    if (buySignals > sellSignals && buySignals >= 2) {
      overallSignal = "buy"
      signalConfidence = (buySignals / generatedIndicators.length) * 100
    } else if (sellSignals > buySignals && sellSignals >= 2) {
      overallSignal = "sell"
      signalConfidence = (sellSignals / generatedIndicators.length) * 100
    } else {
      overallSignal = "hold"
      signalConfidence = 50 + Math.random() * 20
    }

    setSignal(overallSignal)
    setConfidence(signalConfidence)
  }

  const getSignalIcon = () => {
    switch (signal) {
      case "buy":
        return <ArrowUpCircle className="h-12 w-12 text-green-500" />
      case "sell":
        return <ArrowDownCircle className="h-12 w-12 text-red-500" />
      case "hold":
        return <MinusCircle className="h-12 w-12 text-yellow-500" />
      default:
        return <AlertTriangle className="h-12 w-12 text-gray-500" />
    }
  }

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "buy":
        return "bg-green-500/20 text-green-500 hover:bg-green-500/30"
      case "sell":
        return "bg-red-500/20 text-red-500 hover:bg-red-500/30"
      case "hold":
        return "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
      default:
        return "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30"
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>AI Trading Signal</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-48">
            <div className="animate-pulse flex flex-col items-center space-y-4">
              <div className="h-12 w-12 bg-gray-800 rounded-full"></div>
              <div className="h-6 w-32 bg-gray-800 rounded"></div>
              <div className="h-4 w-48 bg-gray-800 rounded"></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Technical Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-gray-800 rounded"></div>
                  <div className="h-4 w-16 bg-gray-800 rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>AI Trading Signal</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {getSignalIcon()}
          <h3 className="text-2xl font-bold mt-4 capitalize">{signal} Signal</h3>
          <p className="text-gray-400 mt-2">AI confidence: {confidence.toFixed(1)}%</p>
          <Progress
            value={confidence}
            className="mt-4 h-2 bg-gray-800"
            indicatorClassName={signal === "buy" ? "bg-green-500" : signal === "sell" ? "bg-red-500" : "bg-yellow-500"}
          />
          <p className="text-sm text-gray-400 mt-6 text-center">
            This signal is based on technical analysis and AI pattern recognition. Always do your own research before
            making investment decisions.
          </p>
        </CardContent>
      </Card>
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Technical Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {indicators.map((indicator, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{indicator.name}</p>
                  <p className="text-sm text-gray-400">{indicator.description}</p>
                </div>
                <Badge className={getSignalColor(indicator.signal)}>{indicator.value}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
