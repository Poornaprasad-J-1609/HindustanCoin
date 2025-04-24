"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import { ChartTooltip } from "@/components/ui/chart"
import { PieChartIcon, ShieldAlert, Lightbulb, Layers, Percent } from "lucide-react"

interface PortfolioDiversificationProps {
  cryptoData: any[]
  holdings: any[]
}

// Define cryptocurrency categories
const CATEGORIES = {
  "Layer 1": ["bitcoin", "ethereum", "solana", "cardano", "avalanche", "near", "polkadot"],
  "Layer 2": ["polygon", "arbitrum", "optimism"],
  DeFi: ["uniswap", "aave", "maker", "chainlink", "the-graph"],
  Stablecoins: ["tether", "usd-coin", "binance-usd", "dai"],
  "Exchange Tokens": ["binancecoin", "ftx-token", "kucoin-shares"],
  "Meme Coins": ["dogecoin", "shiba-inu", "pepe", "floki"],
  Privacy: ["monero", "zcash", "dash"],
  "Metaverse & Gaming": ["decentraland", "the-sandbox", "apecoin", "axie-infinity"],
  "Storage & Computing": ["filecoin", "arweave", "theta-network"],
  Other: [], // Default category
}

// Risk scores for different categories (1-10 scale, 10 being highest risk)
const CATEGORY_RISK = {
  "Layer 1": 6,
  "Layer 2": 7,
  DeFi: 8,
  Stablecoins: 3,
  "Exchange Tokens": 6,
  "Meme Coins": 10,
  Privacy: 7,
  "Metaverse & Gaming": 9,
  "Storage & Computing": 7,
  Other: 8,
}

// Correlation matrix between categories (simplified)
// Higher values mean higher correlation (0-1)
const CORRELATION_MATRIX: Record<string, Record<string, number>> = {
  "Layer 1": {
    "Layer 1": 1.0,
    "Layer 2": 0.8,
    DeFi: 0.7,
    Stablecoins: 0.3,
    "Exchange Tokens": 0.6,
    "Meme Coins": 0.5,
    Privacy: 0.4,
    "Metaverse & Gaming": 0.6,
    "Storage & Computing": 0.5,
    Other: 0.5,
  },
  "Layer 2": {
    "Layer 1": 0.8,
    "Layer 2": 1.0,
    DeFi: 0.7,
    Stablecoins: 0.3,
    "Exchange Tokens": 0.5,
    "Meme Coins": 0.4,
    Privacy: 0.3,
    "Metaverse & Gaming": 0.5,
    "Storage & Computing": 0.4,
    Other: 0.4,
  },
  // Simplified for brevity - in a real app, this would be more comprehensive
}

export default function PortfolioDiversification({ cryptoData, holdings }: PortfolioDiversificationProps) {
  const [diversificationData, setDiversificationData] = useState<any>({
    byCategory: [],
    riskScore: 0,
    correlationScore: 0,
    diversificationScore: 0,
    recommendations: [],
  })

  useEffect(() => {
    if (holdings.length > 0 && cryptoData.length > 0) {
      analyzePortfolioDiversification()
    }
  }, [holdings, cryptoData])

  const getCoinCategory = (coinId: string): string => {
    for (const [category, coins] of Object.entries(CATEGORIES)) {
      if (coins.includes(coinId)) {
        return category
      }
    }
    return "Other"
  }

  const analyzePortfolioDiversification = () => {
    // Calculate portfolio value by category
    const categoriesMap: Record<string, { value: number; coins: string[] }> = {}
    let totalPortfolioValue = 0

    holdings.forEach((holding) => {
      const coin = cryptoData.find((c) => c.id === holding.coin)
      if (!coin) return

      const currentValue = coin.current_price * holding.amount
      totalPortfolioValue += currentValue

      const category = getCoinCategory(holding.coin)

      if (!categoriesMap[category]) {
        categoriesMap[category] = { value: 0, coins: [] }
      }

      categoriesMap[category].value += currentValue
      if (!categoriesMap[category].coins.includes(holding.coin)) {
        categoriesMap[category].coins.push(holding.coin)
      }
    })

    // Convert to array and calculate percentages
    const byCategory = Object.entries(categoriesMap).map(([category, data]) => ({
      name: category,
      value: data.value,
      percentage: (data.value / totalPortfolioValue) * 100,
      coins: data.coins,
      riskScore: CATEGORY_RISK[category as keyof typeof CATEGORY_RISK] || 5,
    }))

    // Calculate risk score (weighted average of category risk scores)
    const riskScore = byCategory.reduce((score, category) => {
      return score + category.riskScore * (category.percentage / 100)
    }, 0)

    // Calculate correlation score
    // Higher score means higher correlation (less diversification)
    let correlationScore = 0
    let pairCount = 0

    // Simplified correlation calculation
    for (let i = 0; i < byCategory.length; i++) {
      for (let j = i + 1; j < byCategory.length; j++) {
        const cat1 = byCategory[i].name
        const cat2 = byCategory[j].name

        // Use correlation matrix if available, otherwise use default value
        const correlation = CORRELATION_MATRIX[cat1]?.[cat2] || CORRELATION_MATRIX[cat2]?.[cat1] || 0.5

        // Weight by the combined percentage of both categories
        correlationScore += correlation * ((byCategory[i].percentage + byCategory[j].percentage) / 200)

        pairCount++
      }
    }

    // Normalize correlation score
    correlationScore = pairCount > 0 ? correlationScore / pairCount : 0.5

    // Calculate overall diversification score (0-100)
    // Lower risk and lower correlation means better diversification
    const diversificationScore = 100 - ((riskScore / 10) * 50 + correlationScore * 50)

    // Generate recommendations
    const recommendations = []

    // Check if portfolio is too concentrated
    const largestCategory = byCategory.sort((a, b) => b.percentage - a.percentage)[0]
    if (largestCategory && largestCategory.percentage > 50) {
      recommendations.push({
        type: "high_concentration",
        message: `Your portfolio is heavily concentrated in ${largestCategory.name} (${largestCategory.percentage.toFixed(1)}%). Consider diversifying into other categories.`,
      })
    }

    // Check for missing important categories
    const missingCategories = Object.keys(CATEGORIES).filter(
      (category) =>
        !byCategory.some((c) => c.name === category) &&
        category !== "Other" &&
        category !== "Meme Coins" &&
        category !== "Privacy",
    )

    if (missingCategories.length > 0) {
      recommendations.push({
        type: "missing_categories",
        message: `Consider adding exposure to these categories: ${missingCategories.slice(0, 3).join(", ")}`,
      })
    }

    // Check for high risk
    if (riskScore > 7) {
      recommendations.push({
        type: "high_risk",
        message: "Your portfolio has a high risk profile. Consider adding some lower-risk assets for balance.",
      })
    }

    // Check for high correlation
    if (correlationScore > 0.7) {
      recommendations.push({
        type: "high_correlation",
        message:
          "Your assets are highly correlated. Consider adding uncorrelated assets to reduce overall portfolio risk.",
      })
    }

    // Check if too few assets
    if (holdings.length < 3) {
      recommendations.push({
        type: "few_assets",
        message: "Your portfolio contains few assets. Consider adding more diverse cryptocurrencies.",
      })
    }

    setDiversificationData({
      byCategory,
      riskScore,
      correlationScore,
      diversificationScore,
      recommendations,
    })
  }

  // Colors for different categories
  const CATEGORY_COLORS: Record<string, string> = {
    "Layer 1": "#8884d8",
    "Layer 2": "#82ca9d",
    DeFi: "#ffc658",
    Stablecoins: "#0088FE",
    "Exchange Tokens": "#00C49F",
    "Meme Coins": "#FFBB28",
    Privacy: "#FF8042",
    "Metaverse & Gaming": "#a4de6c",
    "Storage & Computing": "#d0ed57",
    Other: "#ffc0cb",
  }

  const getDiversificationScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getRiskScoreColor = (score: number) => {
    if (score <= 4) return "text-green-500"
    if (score <= 7) return "text-yellow-500"
    return "text-red-500"
  }

  if (holdings.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Portfolio Diversification
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <Layers className="h-16 w-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-medium mb-2">No Portfolio Data</h3>
          <p className="text-gray-400">Add holdings to your portfolio to see diversification analysis.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Portfolio Diversification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Diversification Score</div>
            <div
              className={`text-2xl font-bold ${getDiversificationScoreColor(diversificationData.diversificationScore)}`}
            >
              {diversificationData.diversificationScore.toFixed(1)}/100
            </div>
            <Progress
              value={diversificationData.diversificationScore}
              className="h-1.5 mt-2 bg-gray-700"
              indicatorClassName={
                diversificationData.diversificationScore >= 80
                  ? "bg-green-500"
                  : diversificationData.diversificationScore >= 60
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }
            />
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Risk Profile</div>
            <div className={`text-2xl font-bold ${getRiskScoreColor(diversificationData.riskScore)}`}>
              {diversificationData.riskScore.toFixed(1)}/10
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {diversificationData.riskScore <= 4
                ? "Conservative"
                : diversificationData.riskScore <= 7
                  ? "Moderate"
                  : "Aggressive"}
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Asset Correlation</div>
            <div
              className={`text-2xl font-bold ${
                diversificationData.correlationScore <= 0.4
                  ? "text-green-500"
                  : diversificationData.correlationScore <= 0.7
                    ? "text-yellow-500"
                    : "text-red-500"
              }`}
            >
              {(diversificationData.correlationScore * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {diversificationData.correlationScore <= 0.4
                ? "Low Correlation"
                : diversificationData.correlationScore <= 0.7
                  ? "Moderate Correlation"
                  : "High Correlation"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-4">Category Allocation</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diversificationData.byCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {diversificationData.byCategory.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || "#8884d8"} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <ChartTooltip>
                            <div className="flex flex-col gap-2">
                              <p className="font-medium">{data.name}</p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <p className="text-gray-400 text-sm">Value:</p>
                                <p className="font-medium">
                                  ${data.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-gray-400 text-sm">Allocation:</p>
                                <p className="font-medium">{data.percentage.toFixed(1)}%</p>
                                <p className="text-gray-400 text-sm">Risk Score:</p>
                                <p className="font-medium">{data.riskScore}/10</p>
                              </div>
                              <div className="mt-1">
                                <p className="text-gray-400 text-sm">Assets:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {data.coins.map((coinId: string) => {
                                    const coin = cryptoData.find((c) => c.id === coinId)
                                    return coin ? (
                                      <Badge key={coinId} className="bg-gray-700">
                                        {coin.symbol.toUpperCase()}
                                      </Badge>
                                    ) : null
                                  })}
                                </div>
                              </div>
                            </div>
                          </ChartTooltip>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4 flex items-center">
              <Lightbulb className="h-4 w-4 text-yellow-500 mr-2" />
              Diversification Recommendations
            </h4>
            <div className="space-y-3">
              {diversificationData.recommendations.length > 0 ? (
                diversificationData.recommendations.map((rec: any, index: number) => (
                  <div key={index} className="bg-gray-800 p-3 rounded-md">
                    <div className="flex items-start gap-2">
                      {rec.type === "high_concentration" && <Percent className="h-4 w-4 text-yellow-500 mt-0.5" />}
                      {rec.type === "high_risk" && <ShieldAlert className="h-4 w-4 text-red-500 mt-0.5" />}
                      {rec.type === "missing_categories" && <Layers className="h-4 w-4 text-blue-500 mt-0.5" />}
                      {rec.type === "high_correlation" && <PieChartIcon className="h-4 w-4 text-purple-500 mt-0.5" />}
                      {rec.type === "few_assets" && <Lightbulb className="h-4 w-4 text-green-500 mt-0.5" />}
                      <span className="text-sm">{rec.message}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-800 p-4 rounded-md text-center">
                  <p className="text-green-500 font-medium">Your portfolio is well diversified!</p>
                  <p className="text-sm text-gray-400 mt-1">Continue monitoring as market conditions change.</p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">Category Risk Levels</h4>
              <div className="space-y-2">
                {Object.entries(CATEGORY_RISK)
                  .filter(([category]) => diversificationData.byCategory.some((c: any) => c.name === category))
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, risk]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: CATEGORY_COLORS[category] || "#8884d8" }}
                        ></div>
                        <span className="text-sm">{category}</span>
                      </div>
                      <div className="flex items-center">
                        <Progress
                          value={risk * 10}
                          className="w-24 h-1.5 mr-2 bg-gray-700"
                          indicatorClassName={risk <= 4 ? "bg-green-500" : risk <= 7 ? "bg-yellow-500" : "bg-red-500"}
                        />
                        <span className="text-xs w-6 text-right">{risk}/10</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-400">
          <p className="mb-2">
            {diversificationData.diversificationScore >= 80
              ? "Your portfolio has excellent diversification across different cryptocurrency categories, helping to minimize risk while maintaining growth potential."
              : diversificationData.diversificationScore >= 60
                ? "Your portfolio has good diversification but could be improved by following the recommendations above."
                : "Your portfolio could benefit from better diversification to reduce risk and improve long-term performance."}
          </p>
          <p>
            <span className="text-yellow-500 font-medium">Note:</span> Diversification within crypto assets alone may
            not provide complete protection against market-wide downturns. Consider diversifying across different asset
            classes for optimal risk management.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
