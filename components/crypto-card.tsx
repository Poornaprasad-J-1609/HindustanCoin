"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface CryptoCardProps {
  crypto: any
  selected: boolean
  onSelect: () => void
}

export default function CryptoCard({ crypto, selected, onSelect }: CryptoCardProps) {
  const priceChange = crypto.price_change_percentage_24h
  const isPositive = priceChange >= 0

  return (
    <Card
      className={`cursor-pointer transition-all hover:scale-105 ${
        selected ? "bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500" : "bg-gray-900 border-gray-800"
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src={crypto.image || "/placeholder.svg"} alt={crypto.name} className="w-8 h-8 rounded-full" />
            <div>
              <h3 className="font-medium">{crypto.name}</h3>
              <p className="text-xs text-gray-400">{crypto.symbol.toUpperCase()}</p>
            </div>
          </div>
          <div className={`flex items-center text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}>
            {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span>{Math.abs(priceChange).toFixed(2)}%</span>
          </div>
        </div>
        <div className="text-xl font-bold">${crypto.current_price.toLocaleString()}</div>
      </CardContent>
    </Card>
  )
}
