"use client"

import { useState, useEffect } from "react"
import { Search, TrendingUp, BarChart3, RefreshCw, Newspaper, Wallet, BarChart2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CryptoCard from "@/components/crypto-card"
import CryptoChart from "@/components/crypto-chart"
import TradingSignals from "@/components/trading-signals"
import SentimentAnalysis from "@/components/sentiment-analysis"
import CryptoNews from "@/components/crypto-news"
import PortfolioTracker from "@/components/portfolio-tracker"
import VolumeAnalysis from "@/components/volume-analysis"
import { fetchCryptoData, fetchCryptoHistory } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CryptoDashboard() {
  const [cryptoData, setCryptoData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCrypto, setSelectedCrypto] = useState<string>("bitcoin")
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [timeframe, setTimeframe] = useState("7d")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [chartLoading, setChartLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("market")
  const [chartTab, setChartTab] = useState("price")

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      refreshData()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedCrypto) {
      fetchHistoricalData()
    }
  }, [selectedCrypto, timeframe])

  useEffect(() => {
    if (searchQuery) {
      const filtered = cryptoData.filter(
        (crypto) =>
          crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredData(filtered)
    } else {
      setFilteredData(cryptoData)
    }
  }, [searchQuery, cryptoData])

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await fetchCryptoData()
      setCryptoData(data)
      setFilteredData(data)
      if (!selectedCrypto && data.length > 0) {
        setSelectedCrypto(data[0].id)
      }
      setLoading(false)
    } catch (error) {
      console.error("Error fetching crypto data:", error)
      setLoading(false)
    }
  }

  const refreshData = async () => {
    try {
      setRefreshing(true)
      const data = await fetchCryptoData()
      setCryptoData(data)
      if (searchQuery) {
        const filtered = data.filter(
          (crypto) =>
            crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        setFilteredData(filtered)
      } else {
        setFilteredData(data)
      }
      setRefreshing(false)
    } catch (error) {
      console.error("Error refreshing crypto data:", error)
      setRefreshing(false)
    }
  }

  const handleCryptoSelect = (id: string) => {
    setSelectedCrypto(id)
    // Show loading state for chart
    setChartLoading(true)
    // Fetch historical data for the newly selected crypto
    fetchHistoricalData(id)
  }

  const fetchHistoricalData = async (cryptoId = selectedCrypto) => {
    try {
      setChartLoading(true)
      const days = timeframe === "24h" ? 1 : timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : 365
      const data = await fetchCryptoHistory(cryptoId, days)
      setHistoricalData(data)
      setChartLoading(false)
    } catch (error) {
      console.error("Error fetching historical data:", error)
      setChartLoading(false)
    }
  }

  const selectedCryptoData = cryptoData.find((crypto) => crypto.id === selectedCrypto)

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-900 mb-6">
          <TabsTrigger value="market" className="data-[state=active]:bg-gray-800">
            <BarChart3 className="mr-2 h-4 w-4" />
            Market
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="data-[state=active]:bg-gray-800">
            <Wallet className="mr-2 h-4 w-4" />
            Portfolio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search cryptocurrencies..."
                className="pl-10 bg-gray-900 border-gray-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700"
              onClick={refreshData}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={`${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {loading
              ? Array(8)
                  .fill(0)
                  .map((_, i) => <Skeleton key={i} className="h-32 bg-gray-800" />)
              : filteredData
                  .slice(0, 12)
                  .map((crypto) => (
                    <CryptoCard
                      key={crypto.id}
                      crypto={crypto}
                      selected={selectedCrypto === crypto.id}
                      onSelect={() => handleCryptoSelect(crypto.id)}
                    />
                  ))}
          </div>

          {selectedCryptoData && (
            <div className="mt-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                <div className="flex items-center gap-3 mb-4 md:mb-0">
                  <img
                    src={selectedCryptoData.image || "/placeholder.svg"}
                    alt={selectedCryptoData.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h2 className="text-2xl font-bold">{selectedCryptoData.name}</h2>
                    <p className="text-gray-400">{selectedCryptoData.symbol.toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger className="w-[120px] bg-gray-900 border-gray-700">
                      <SelectValue placeholder="Timeframe" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="24h">24 Hours</SelectItem>
                      <SelectItem value="7d">7 Days</SelectItem>
                      <SelectItem value="30d">30 Days</SelectItem>
                      <SelectItem value="1y">1 Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Tabs value={chartTab} onValueChange={setChartTab} className="w-full">
                <TabsList className="bg-gray-900 mb-6">
                  <TabsTrigger value="price" className="data-[state=active]:bg-gray-800">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Price Chart
                  </TabsTrigger>
                  <TabsTrigger value="volume" className="data-[state=active]:bg-gray-800">
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Volume Analysis
                  </TabsTrigger>
                  <TabsTrigger value="signals" className="data-[state=active]:bg-gray-800">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Trading Signals
                  </TabsTrigger>
                  <TabsTrigger value="news" className="data-[state=active]:bg-gray-800">
                    <Newspaper className="mr-2 h-4 w-4" />
                    News
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="price" className="space-y-6">
                  <div className="bg-gray-900 p-4 rounded-lg">
                    {chartLoading ? (
                      <div className="h-[400px] flex items-center justify-center">
                        <div className="flex flex-col items-center">
                          <RefreshCw size={32} className="animate-spin text-purple-500 mb-4" />
                          <p>Loading chart data for {selectedCryptoData.name}...</p>
                        </div>
                      </div>
                    ) : (
                      <CryptoChart data={historicalData} timeframe={timeframe} />
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Market Stats</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Current Price</span>
                          <span className="font-medium">${selectedCryptoData.current_price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Market Cap</span>
                          <span className="font-medium">${selectedCryptoData.market_cap.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">24h Volume</span>
                          <span className="font-medium">${selectedCryptoData.total_volume.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">24h Change</span>
                          <span
                            className={`font-medium ${selectedCryptoData.price_change_percentage_24h >= 0 ? "text-green-500" : "text-red-500"}`}
                          >
                            {selectedCryptoData.price_change_percentage_24h.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <SentimentAnalysis cryptoId={selectedCrypto} />
                  </div>
                </TabsContent>
                <TabsContent value="volume">
                  <VolumeAnalysis
                    cryptoData={selectedCryptoData}
                    historicalData={historicalData}
                    timeframe={timeframe}
                  />
                </TabsContent>
                <TabsContent value="signals">
                  <TradingSignals cryptoData={selectedCryptoData} historicalData={historicalData} />
                </TabsContent>
                <TabsContent value="news">
                  <CryptoNews cryptoId={selectedCrypto} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </TabsContent>

        <TabsContent value="portfolio">
          <PortfolioTracker cryptoData={cryptoData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
