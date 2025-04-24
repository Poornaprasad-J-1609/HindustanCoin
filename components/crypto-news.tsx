"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Newspaper, ExternalLink, Clock, Tag } from "lucide-react"
import { fetchCryptoNews } from "@/lib/api"

interface CryptoNewsProps {
  cryptoId: string
}

export default function CryptoNews({ cryptoId }: CryptoNewsProps) {
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "related">("all")

  useEffect(() => {
    if (cryptoId) {
      loadNews()
    }
  }, [cryptoId])

  const loadNews = async () => {
    setLoading(true)
    try {
      const newsData = await fetchCryptoNews(cryptoId)
      setNews(newsData)
    } catch (error) {
      console.error("Error loading news:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredNews = filter === "all" ? news : news.filter((item) => item.relatedCoins.includes(cryptoId))

  if (loading) {
    return (
      <div className="space-y-4">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-5 w-3/4 bg-gray-800 rounded"></div>
                  <div className="h-4 w-1/2 bg-gray-800 rounded"></div>
                  <div className="h-4 w-full bg-gray-800 rounded"></div>
                  <div className="h-4 w-full bg-gray-800 rounded"></div>
                  <div className="flex justify-between">
                    <div className="h-3 w-24 bg-gray-800 rounded"></div>
                    <div className="h-3 w-16 bg-gray-800 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Newspaper className="h-5 w-5" />
          Crypto News
        </h2>
        <div className="flex gap-2">
          <Badge
            className={`cursor-pointer ${filter === "all" ? "bg-purple-600" : "bg-gray-700"}`}
            onClick={() => setFilter("all")}
          >
            All News
          </Badge>
          <Badge
            className={`cursor-pointer ${filter === "related" ? "bg-purple-600" : "bg-gray-700"}`}
            onClick={() => setFilter("related")}
          >
            {cryptoId.charAt(0).toUpperCase() + cryptoId.slice(1)} News
          </Badge>
        </div>
      </div>

      {filteredNews.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 text-center">
            <p className="text-gray-400">No news articles found for this filter.</p>
          </CardContent>
        </Card>
      ) : (
        filteredNews.map((article, index) => (
          <Card key={index} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Badge variant="outline" className="bg-gray-800 text-xs">
                    {article.source}
                  </Badge>
                  <div className="flex items-center text-gray-400 text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {article.time}
                  </div>
                </div>
                <a
                  href="#"
                  className="text-lg font-medium hover:text-purple-400 transition-colors flex items-start gap-1"
                  onClick={(e) => e.preventDefault()}
                >
                  {article.title}
                  <ExternalLink className="h-4 w-4 mt-1 flex-shrink-0" />
                </a>
                <p className="text-gray-400 text-sm">{article.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {article.tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary" className="bg-gray-800 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {article.relatedCoins.map((coin: string, i: number) => (
                    <Badge key={i} className="bg-gray-800 text-xs text-purple-300">
                      <Tag className="h-3 w-3 mr-1" />
                      {coin}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
