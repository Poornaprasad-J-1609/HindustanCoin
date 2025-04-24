"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Bell, Plus, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"

interface PriceAlert {
  id: string
  coin: string
  symbol: string
  condition: "above" | "below"
  price: number
  createdAt: string
  triggered: boolean
  image?: string
}

interface PriceAlertsProps {
  cryptoData: any[]
  holdings: any[]
}

export default function PriceAlerts({ cryptoData, holdings }: PriceAlertsProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [selectedCoin, setSelectedCoin] = useState("")
  const [alertPrice, setAlertPrice] = useState("")
  const [alertCondition, setAlertCondition] = useState<"above" | "below">("above")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [triggeredAlerts, setTriggeredAlerts] = useState<PriceAlert[]>([])
  const { toast } = useToast()

  // Load alerts from localStorage on component mount
  useEffect(() => {
    const savedAlerts = localStorage.getItem("priceAlerts")
    if (savedAlerts) {
      setAlerts(JSON.parse(savedAlerts))
    }
  }, [])

  // Save alerts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("priceAlerts", JSON.stringify(alerts))
  }, [alerts])

  // Check for triggered alerts whenever crypto data changes
  useEffect(() => {
    if (alerts.length === 0 || cryptoData.length === 0) return

    const newTriggeredAlerts: PriceAlert[] = []
    const updatedAlerts = [...alerts]
    let alertsUpdated = false

    alerts.forEach((alert, index) => {
      const coin = cryptoData.find((c) => c.id === alert.coin)
      if (!coin) return

      const currentPrice = coin.current_price
      const isTriggered =
        (alert.condition === "above" && currentPrice >= alert.price) ||
        (alert.condition === "below" && currentPrice <= alert.price)

      if (isTriggered && !alert.triggered) {
        // Mark as triggered
        updatedAlerts[index] = { ...alert, triggered: true }
        alertsUpdated = true
        newTriggeredAlerts.push(alert)
      }
    })

    if (alertsUpdated) {
      setAlerts(updatedAlerts)
    }

    // Show toast notifications for newly triggered alerts
    newTriggeredAlerts.forEach((alert) => {
      const coin = cryptoData.find((c) => c.id === alert.coin)
      if (!coin) return

      toast({
        title: `Price Alert Triggered!`,
        description: `${coin.name} is now ${alert.condition === "above" ? "above" : "below"} $${alert.price.toLocaleString()}`,
        variant: "default",
      })
    })

    if (newTriggeredAlerts.length > 0) {
      setTriggeredAlerts((prev) => [...prev, ...newTriggeredAlerts])
    }
  }, [cryptoData, alerts, toast])

  const handleAddAlert = () => {
    if (!selectedCoin || !alertPrice) return

    const coin = cryptoData.find((c) => c.id === selectedCoin)
    if (!coin) return

    const price = Number.parseFloat(alertPrice)
    if (isNaN(price) || price <= 0) return

    const newAlert: PriceAlert = {
      id: `${selectedCoin}-${Date.now()}`,
      coin: selectedCoin,
      symbol: coin.symbol,
      condition: alertCondition,
      price: price,
      createdAt: new Date().toISOString(),
      triggered: false,
      image: coin.image,
    }

    setAlerts([...alerts, newAlert])
    resetForm()
    setIsDialogOpen(false)

    toast({
      title: "Alert Created",
      description: `You'll be notified when ${coin.name} goes ${alertCondition} $${price.toLocaleString()}`,
    })
  }

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== id))
  }

  const handleResetAlert = (id: string) => {
    setAlerts(
      alerts.map((alert) => {
        if (alert.id === id) {
          return { ...alert, triggered: false }
        }
        return alert
      }),
    )
    setTriggeredAlerts(triggeredAlerts.filter((alert) => alert.id !== id))
  }

  const resetForm = () => {
    setSelectedCoin("")
    setAlertPrice("")
    setAlertCondition("above")
  }

  // Filter cryptoData to show only holdings if there are any
  const coinOptions =
    holdings.length > 0 ? cryptoData.filter((coin) => holdings.some((holding) => holding.coin === coin.id)) : cryptoData

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-purple-500" />
          <h2 className="text-2xl font-bold">Price Alerts</h2>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle>Create Price Alert</DialogTitle>
              <DialogDescription>Get notified when a cryptocurrency reaches your target price.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="coin">Cryptocurrency</Label>
                <Select value={selectedCoin} onValueChange={setSelectedCoin}>
                  <SelectTrigger id="coin" className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select a cryptocurrency" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {coinOptions.map((coin) => (
                      <SelectItem key={coin.id} value={coin.id} className="focus:bg-gray-700">
                        <div className="flex items-center gap-2">
                          <img
                            src={coin.image || "/placeholder.svg"}
                            alt={coin.name}
                            className="w-5 h-5 rounded-full"
                          />
                          <span>{coin.name}</span>
                          <span className="text-gray-400">({coin.symbol.toUpperCase()})</span>
                          <span className="text-gray-400 ml-auto">${coin.current_price.toLocaleString()}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Alert Condition</Label>
                <RadioGroup
                  value={alertCondition}
                  onValueChange={(value) => setAlertCondition(value as "above" | "below")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="above" id="above" className="border-purple-500 text-purple-500" />
                    <Label htmlFor="above" className="flex items-center gap-1">
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                      Price goes above
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="below" id="below" className="border-purple-500 text-purple-500" />
                    <Label htmlFor="below" className="flex items-center gap-1">
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                      Price goes below
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="price">Target Price (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              {selectedCoin && (
                <div className="text-sm text-gray-400">
                  Current price:{" "}
                  <span className="font-medium text-white">
                    $
                    {cryptoData
                      .find((c) => c.id === selectedCoin)
                      ?.current_price.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                  </span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-gray-800">
                Cancel
              </Button>
              <Button onClick={handleAddAlert} className="bg-purple-600 hover:bg-purple-700">
                Create Alert
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {alerts.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <Bell className="h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-medium mb-2">No Price Alerts Set</h3>
            <p className="text-gray-400 mb-6">
              Create alerts to get notified when cryptocurrencies reach your target prices.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Alert
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <>
          {triggeredAlerts.length > 0 && (
            <Card className="bg-gray-900 border-gray-800 border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-purple-500" />
                  Triggered Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {triggeredAlerts.map((alert) => {
                    const coin = cryptoData.find((c) => c.id === alert.coin)
                    if (!coin) return null

                    return (
                      <div
                        key={alert.id}
                        className="flex items-center justify-between bg-gray-800 p-3 rounded-md border border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={alert.image || "/placeholder.svg"}
                            alt={coin.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <div className="font-medium">{coin.name}</div>
                            <div className="text-sm text-gray-400">
                              {alert.condition === "above" ? "Went above" : "Went below"} $
                              {alert.price.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-medium">Current: ${coin.current_price.toLocaleString()}</div>
                            <div
                              className={`text-sm ${
                                coin.price_change_percentage_24h >= 0 ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {coin.price_change_percentage_24h >= 0 ? "+" : ""}
                              {coin.price_change_percentage_24h.toFixed(2)}%
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetAlert(alert.id)}
                            className="ml-2"
                          >
                            Reset
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Your Price Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Asset</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Target Price</TableHead>
                      <TableHead>Current Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => {
                      const coin = cryptoData.find((c) => c.id === alert.coin)
                      if (!coin) return null

                      const currentPrice = coin.current_price
                      const percentToTarget = Math.abs(((currentPrice - alert.price) / alert.price) * 100).toFixed(2)
                      const isClose =
                        (alert.condition === "above" &&
                          currentPrice < alert.price &&
                          alert.price - currentPrice < alert.price * 0.05) ||
                        (alert.condition === "below" &&
                          currentPrice > alert.price &&
                          currentPrice - alert.price < alert.price * 0.05)

                      return (
                        <TableRow key={alert.id} className="hover:bg-gray-800/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <img
                                src={alert.image || "/placeholder.svg"}
                                alt={alert.coin}
                                className="w-6 h-6 rounded-full"
                              />
                              <div>
                                <div className="font-medium">{coin.name}</div>
                                <div className="text-gray-400 text-xs">{alert.symbol.toUpperCase()}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {alert.condition === "above" ? (
                                <ArrowUpRight className="h-4 w-4 text-green-500" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 text-red-500" />
                              )}
                              <span>
                                {alert.condition === "above" ? "Above" : "Below"} $
                                {alert.price.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>${alert.price.toLocaleString(undefined, { maximumFractionDigits: 8 })}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 8 })}</span>
                              <span
                                className={`text-xs ${
                                  coin.price_change_percentage_24h >= 0 ? "text-green-500" : "text-red-500"
                                }`}
                              >
                                {coin.price_change_percentage_24h >= 0 ? "+" : ""}
                                {coin.price_change_percentage_24h.toFixed(2)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {alert.triggered ? (
                              <Badge className="bg-purple-500">Triggered</Badge>
                            ) : isClose ? (
                              <Badge className="bg-yellow-500">
                                {percentToTarget}% {alert.condition === "above" ? "Below" : "Above"} Target
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-700">
                                {percentToTarget}% {alert.condition === "above" ? "Below" : "Above"} Target
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {alert.triggered && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResetAlert(alert.id)}
                                  className="h-8 px-2 text-xs"
                                >
                                  Reset
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteAlert(alert.id)}
                                className="h-8 w-8 text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
