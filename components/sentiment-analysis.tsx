"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Smile, Meh, Frown, Twitter, MessageSquare } from "lucide-react"

interface SentimentAnalysisProps {
  cryptoId: string
}

export default function SentimentAnalysis({ cryptoId }: SentimentAnalysisProps) {
  const [sentiment, setSentiment] = useState<{
    score: number
    positive: number
    neutral: number
    negative: number
    posts: any[]
  }>({
    score: 0,
    positive: 0,
    neutral: 0,
    negative: 0,
    posts: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (cryptoId) {
      // Simulate fetching sentiment data
      setLoading(true)
      const timer = setTimeout(() => {
        generateSentimentData()
        setLoading(false)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [cryptoId])

  const generateSentimentData = () => {
    // This is a simulation of sentiment analysis
    // In a real app, this would use actual NLP and social media APIs

    // Generate random sentiment scores with some bias
    const positiveScore = 20 + Math.floor(Math.random() * 40)
    const negativeScore = 10 + Math.floor(Math.random() * 30)
    const neutralScore = 100 - positiveScore - negativeScore

    // Calculate overall sentiment score (-100 to 100)
    const overallScore = positiveScore - negativeScore

    // Generate fake social media posts
    const platforms = ["Twitter", "Reddit"]
    const sentiments = ["positive", "neutral", "negative"]
    const posts = Array(3)
      .fill(0)
      .map((_, i) => {
        const platform = platforms[Math.floor(Math.random() * platforms.length)]
        const postSentiment = sentiments[Math.floor(Math.random() * sentiments.length)]

        let content = ""
        if (postSentiment === "positive") {
          content = `${cryptoId} is looking bullish! Great time to buy in before the next rally! #crypto #bullish`
        } else if (postSentiment === "negative") {
          content = `Not feeling confident about ${cryptoId} right now. The market looks uncertain. #crypto #bearish`
        } else {
          content = `Watching ${cryptoId} closely. Waiting for more signals before making a move. #crypto #DYOR`
        }

        return {
          platform,
          content,
          sentiment: postSentiment,
          user: `user${Math.floor(Math.random() * 1000)}`,
          time: `${Math.floor(Math.random() * 12) + 1}h ago`,
        }
      })

    setSentiment({
      score: overallScore,
      positive: positiveScore,
      neutral: neutralScore,
      negative: negativeScore,
      posts,
    })
  }

  const getSentimentIcon = () => {
    if (sentiment.score > 20) {
      return <Smile className="h-6 w-6 text-green-500" />
    } else if (sentiment.score < -20) {
      return <Frown className="h-6 w-6 text-red-500" />
    } else {
      return <Meh className="h-6 w-6 text-yellow-500" />
    }
  }

  const getSentimentText = () => {
    if (sentiment.score > 20) {
      return "Bullish"
    } else if (sentiment.score < -20) {
      return "Bearish"
    } else {
      return "Neutral"
    }
  }

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Social Sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-full bg-gray-800 rounded"></div>
            <div className="h-4 w-full bg-gray-800 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-800 rounded"></div>
            <div className="space-y-2 mt-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-10 w-10 bg-gray-800 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 w-3/4 bg-gray-800 rounded"></div>
                    <div className="h-3 w-1/2 bg-gray-800 rounded mt-2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Social Sentiment</span>
          <div className="flex items-center gap-1">
            {getSentimentIcon()}
            <span
              className={
                sentiment.score > 20 ? "text-green-500" : sentiment.score < -20 ? "text-red-500" : "text-yellow-500"
              }
            >
              {getSentimentText()}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-green-500">Positive</span>
              <span className="text-sm">{sentiment.positive}%</span>
            </div>
            <Progress value={sentiment.positive} className="h-2 bg-gray-800" indicatorClassName="bg-green-500" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-yellow-500">Neutral</span>
              <span className="text-sm">{sentiment.neutral}%</span>
            </div>
            <Progress value={sentiment.neutral} className="h-2 bg-gray-800" indicatorClassName="bg-yellow-500" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-red-500">Negative</span>
              <span className="text-sm">{sentiment.negative}%</span>
            </div>
            <Progress value={sentiment.negative} className="h-2 bg-gray-800" indicatorClassName="bg-red-500" />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-medium">Recent Social Media Posts</h4>
          {sentiment.posts.map((post, index) => (
            <div key={index} className="flex gap-3 border-t border-gray-800 pt-3">
              {post.platform === "Twitter" ? (
                <Twitter className="h-5 w-5 text-blue-400" />
              ) : (
                <MessageSquare className="h-5 w-5 text-orange-400" />
              )}
              <div>
                <p className="text-sm">{post.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  @{post.user} · {post.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
