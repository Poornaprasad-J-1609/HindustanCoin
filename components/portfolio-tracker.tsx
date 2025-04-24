"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, Plus, Trash2, PieChartIcon, TrendingUp, ArrowUpRight, ArrowDownRight, Bell } from "lucide-react"
import PriceAlerts from "@/components/price-alerts"
import PortfolioDiversification from "@/components/portfolio-diversification"

interface PortfolioHolding {
  id: string
  coin: string
  symbol: string
  amount: number
  purchasePrice: number
  purchaseDate: string
  image?: string
}

interface PortfolioTrackerProps {
  cryptoData: any[]
}

export default function PortfolioTracker({ cryptoData }: PortfolioTrackerProps) {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([])
  const [selectedCoin, setSelectedCoin] = useState("")
  const [amount, setAmount] = useState("")
  const [purchasePrice, setPurchasePrice] = useState("")
  const [purchaseDate, setPurchaseDate] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [portfolioValue, setPortfolioValue] = useState(0)
  const [initialInvestment, setInitialInvestment] = useState(0)
  const [totalProfit, setTotalProfit] = useState(0)
  const [profitPercentage, setProfitPercentage] = useState(0)
  const [activeTab, setActiveTab] = useState("holdings")

  // Load holdings from localStorage on component mount
  useEffect(() => {
    const savedHoldings = localStorage.getItem("portfolioHoldings")
    if (savedHoldings) {
      setHoldings(JSON.parse(savedHoldings))
    }
  }, [])

  // Save holdings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("portfolioHoldings", JSON.stringify(holdings))
  }, [holdings])

  // Calculate portfolio metrics whenever holdings or crypto data changes
  useEffect(() => {
    if (holdings.length === 0 || cryptoData.length === 0) {
      setPortfolioValue(0)
      setInitialInvestment(0)
      setTotalProfit(0)
      setProfitPercentage(0)
      return
    }

    let totalValue = 0
    let totalInvestment = 0

    holdings.forEach((holding) => {
      const coin = cryptoData.find((c) => c.id === holding.coin)
      if (coin) {
        totalValue += coin.current_price * holding.amount
        totalInvestment += holding.purchasePrice * holding.amount
      }
    })

    setPortfolioValue(totalValue)
    setInitialInvestment(totalInvestment)
    setTotalProfit(totalValue - totalInvestment)
    setProfitPercentage(totalInvestment > 0 ? ((totalValue - totalInvestment) / totalInvestment) * 100 : 0)
  }, [holdings, cryptoData])

  const handleAddHolding = () => {
    if (!selectedCoin || !amount || !purchasePrice || !purchaseDate) return

    const coin = cryptoData.find((c) => c.id === selectedCoin)
    if (!coin) return

    const newHolding: PortfolioHolding = {
      id: `${selectedCoin}-${Date.now()}`,
      coin: selectedCoin,
      symbol: coin.symbol,
      amount: Number.parseFloat(amount),
      purchasePrice: Number.parseFloat(purchasePrice),
      purchaseDate,
      image: coin.image,
    }

    setHoldings([...holdings, newHolding])
    resetForm()
    setIsDialogOpen(false)
  }

  const handleDeleteHolding = (id: string) => {
    setHoldings(holdings.filter((holding) => holding.id !== id))
  }

  const resetForm = () => {
    setSelectedCoin("")
    setAmount("")
    setPurchasePrice("")
    setPurchaseDate("")
  }

  // Prepare data for pie chart
  const pieChartData = holdings.map((holding) => {
    const coin = cryptoData.find((c) => c.id === holding.coin)
    const value = coin ? coin.current_price * holding.amount : 0
    return {
      name: holding.symbol.toUpperCase(),
      value,
    }
  })

  // Colors for pie chart
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#a4de6c"]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-purple-500" />
          <h2 className="text-2xl font-bold">Portfolio Tracker</h2>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Holding
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle>Add New Holding</DialogTitle>
              <DialogDescription>Add a cryptocurrency to your portfolio tracker.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="coin">Cryptocurrency</Label>
                <Select value={selectedCoin} onValueChange={setSelectedCoin}>
                  <SelectTrigger id="coin" className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select a cryptocurrency" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {cryptoData.map((coin) => (
                      <SelectItem key={coin.id} value={coin.id} className="focus:bg-gray-700">
                        <div className="flex items-center gap-2">
                          <img
                            src={coin.image || "/placeholder.svg"}
                            alt={coin.name}
                            className="w-5 h-5 rounded-full"
                          />
                          <span>{coin.name}</span>
                          <span className="text-gray-400">({coin.symbol.toUpperCase()})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="purchasePrice">Purchase Price (USD)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-gray-800">
                Cancel
              </Button>
              <Button onClick={handleAddHolding} className="bg-purple-600 hover:bg-purple-700">
                Add to Portfolio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-900 mb-6">
          <TabsTrigger value="holdings" className="data-[state=active]:bg-gray-800">
            <Wallet className="mr-2 h-4 w-4" />
            Holdings
          </TabsTrigger>
          <TabsTrigger value="diversification" className="data-[state=active]:bg-gray-800">
            <PieChartIcon className="mr-2 h-4 w-4" />
            Diversification
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-gray-800">
            <Bell className="mr-2 h-4 w-4" />
            Price Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="holdings">
          {holdings.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                <Wallet className="h-16 w-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-medium mb-2">Your Portfolio is Empty</h3>
                <p className="text-gray-400 mb-6">
                  Start tracking your cryptocurrency investments by adding your holdings.
                </p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Holding
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-sm">Total Portfolio Value</span>
                      <span className="text-2xl font-bold">
                        ${portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-sm">Initial Investment</span>
                      <span className="text-2xl font-bold">
                        ${initialInvestment.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-sm">Total Profit/Loss</span>
                      <span className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {totalProfit >= 0 ? "+" : ""}$
                        {totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-sm">Profit/Loss Percentage</span>
                      <div className="flex items-center">
                        {profitPercentage >= 0 ? (
                          <ArrowUpRight className="h-5 w-5 text-green-500 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-red-500 mr-1" />
                        )}
                        <span
                          className={`text-2xl font-bold ${profitPercentage >= 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          {profitPercentage >= 0 ? "+" : ""}
                          {profitPercentage.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Your Holdings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Asset</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Purchase Price</TableHead>
                            <TableHead>Current Price</TableHead>
                            <TableHead>Current Value</TableHead>
                            <TableHead>Profit/Loss</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {holdings.map((holding) => {
                            const coin = cryptoData.find((c) => c.id === holding.coin)
                            if (!coin) return null

                            const currentValue = coin.current_price * holding.amount
                            const initialValue = holding.purchasePrice * holding.amount
                            const profit = currentValue - initialValue
                            const profitPercentage = (profit / initialValue) * 100

                            return (
                              <TableRow key={holding.id} className="hover:bg-gray-800/50">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={holding.image || "/placeholder.svg"}
                                      alt={holding.coin}
                                      className="w-6 h-6 rounded-full"
                                    />
                                    <div>
                                      <div className="font-medium">{coin.name}</div>
                                      <div className="text-gray-400 text-xs">{holding.symbol.toUpperCase()}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {holding.amount.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                                </TableCell>
                                <TableCell>
                                  ${holding.purchasePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell>
                                  ${coin.current_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell>
                                  ${currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className={profit >= 0 ? "text-green-500" : "text-red-500"}>
                                      {profit >= 0 ? "+" : ""}$
                                      {profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </span>
                                    <span
                                      className={`text-xs ${profitPercentage >= 0 ? "text-green-500" : "text-red-500"}`}
                                    >
                                      {profitPercentage >= 0 ? "+" : ""}
                                      {profitPercentage.toFixed(2)}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteHolding(holding.id)}
                                    className="text-gray-400 hover:text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5" />
                      Portfolio Allocation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                      {pieChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              formatter={(value: number) => [
                                `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                                "Value",
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center text-gray-400">No data to display</div>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {pieChartData.map((entry, index) => (
                        <Badge key={index} className="bg-gray-800 text-white border-none">
                          <div
                            className="w-3 h-3 rounded-full mr-1"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          {entry.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="diversification">
          <PortfolioDiversification cryptoData={cryptoData} holdings={holdings} />
        </TabsContent>

        <TabsContent value="alerts">
          <PriceAlerts cryptoData={cryptoData} holdings={holdings} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
