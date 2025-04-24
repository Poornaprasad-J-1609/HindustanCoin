// This is a simulated API service that fetches cryptocurrency data
// In a real application, you would use actual API endpoints

// Fetch top cryptocurrencies
export async function fetchCryptoData() {
  try {
    // In a real app, you would use:
    // const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1');
    // return await response.json();

    // For this demo, we'll simulate the API response
    return simulateCryptoData()
  } catch (error) {
    console.error("Error fetching crypto data:", error)
    return []
  }
}

// Fetch historical data for a specific cryptocurrency
export async function fetchCryptoHistory(id: string, days = 7) {
  try {
    // In a real app, you would use:
    // const response = await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`);
    // const data = await response.json();
    // return data.prices;

    // For this demo, we'll simulate the API response with different patterns for different coins
    return simulateHistoricalData(days, id)
  } catch (error) {
    console.error("Error fetching historical data:", error)
    return []
  }
}

// Fetch cryptocurrency news
export async function fetchCryptoNews(cryptoId: string) {
  try {
    // In a real app, you would use:
    // const response = await fetch(`https://some-crypto-news-api.com/news?coin=${cryptoId}`);
    // return await response.json();

    // For this demo, we'll simulate the API response
    return simulateCryptoNews(cryptoId)
  } catch (error) {
    console.error("Error fetching crypto news:", error)
    return []
  }
}

// Update the simulateCryptoData function to include more accurate prices and additional cryptocurrencies

// Simulate cryptocurrency data with accurate prices
function simulateCryptoData() {
  const cryptos = [
    {
      id: "bitcoin",
      symbol: "btc",
      name: "Bitcoin",
      image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
      current_price: 63852.41,
      market_cap: 1254678901234,
      total_volume: 32456789012,
      price_change_percentage_24h: 1.25,
    },
    {
      id: "ethereum",
      symbol: "eth",
      name: "Ethereum",
      image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
      current_price: 3078.92,
      market_cap: 369890123456,
      total_volume: 15678901234,
      price_change_percentage_24h: 0.83,
    },
    {
      id: "solana",
      symbol: "sol",
      name: "Solana",
      image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
      current_price: 137.65,
      market_cap: 62345678901,
      total_volume: 3456789012,
      price_change_percentage_24h: -1.42,
    },
    {
      id: "cardano",
      symbol: "ada",
      name: "Cardano",
      image: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
      current_price: 0.45,
      market_cap: 15678901234,
      total_volume: 789012345,
      price_change_percentage_24h: -0.76,
    },
    {
      id: "binancecoin",
      symbol: "bnb",
      name: "Binance Coin",
      image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
      current_price: 552.37,
      market_cap: 84654321098,
      total_volume: 2345678901,
      price_change_percentage_24h: 0.24,
    },
    {
      id: "ripple",
      symbol: "xrp",
      name: "XRP",
      image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
      current_price: 0.51,
      market_cap: 29876543210,
      total_volume: 1234567890,
      price_change_percentage_24h: -0.33,
    },
    {
      id: "polkadot",
      symbol: "dot",
      name: "Polkadot",
      image: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png",
      current_price: 6.23,
      market_cap: 8765432109,
      total_volume: 567890123,
      price_change_percentage_24h: 2.15,
    },
    {
      id: "dogecoin",
      symbol: "doge",
      name: "Dogecoin",
      image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
      current_price: 0.14,
      market_cap: 16789012345,
      total_volume: 987654321,
      price_change_percentage_24h: 3.27,
    },
    {
      id: "shiba-inu",
      symbol: "shib",
      name: "Shiba Inu",
      image: "https://assets.coingecko.com/coins/images/11939/large/shiba.png",
      current_price: 0.000023,
      market_cap: 13567890123,
      total_volume: 876543210,
      price_change_percentage_24h: 2.32,
    },
    {
      id: "avalanche",
      symbol: "avax",
      name: "Avalanche",
      image: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
      current_price: 33.76,
      market_cap: 12345678901,
      total_volume: 765432109,
      price_change_percentage_24h: 1.87,
    },
    {
      id: "chainlink",
      symbol: "link",
      name: "Chainlink",
      image: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png",
      current_price: 13.92,
      market_cap: 8765432109,
      total_volume: 543210987,
      price_change_percentage_24h: 0.98,
    },
    {
      id: "polygon",
      symbol: "matic",
      name: "Polygon",
      image: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png",
      current_price: 0.58,
      market_cap: 5654321098,
      total_volume: 432109876,
      price_change_percentage_24h: -0.45,
    },
    {
      id: "uniswap",
      symbol: "uni",
      name: "Uniswap",
      image: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png",
      current_price: 7.76,
      market_cap: 4543210987,
      total_volume: 321098765,
      price_change_percentage_24h: -1.23,
    },
    {
      id: "litecoin",
      symbol: "ltc",
      name: "Litecoin",
      image: "https://assets.coingecko.com/coins/images/2/large/litecoin.png",
      current_price: 72.9,
      market_cap: 5432109876,
      total_volume: 210987654,
      price_change_percentage_24h: 0.89,
    },
    {
      id: "tron",
      symbol: "trx",
      name: "TRON",
      image: "https://assets.coingecko.com/coins/images/1094/large/tron-logo.png",
      current_price: 0.11,
      market_cap: 7765432109,
      total_volume: 654321098,
      price_change_percentage_24h: 1.45,
    },
    {
      id: "stellar",
      symbol: "xlm",
      name: "Stellar",
      image: "https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png",
      current_price: 0.1,
      market_cap: 3010987654,
      total_volume: 109876543,
      price_change_percentage_24h: -0.67,
    },
    // Adding more cryptocurrencies with accurate prices
    {
      id: "bitcoin-cash",
      symbol: "bch",
      name: "Bitcoin Cash",
      image: "https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png",
      current_price: 362.48,
      market_cap: 7123456789,
      total_volume: 198765432,
      price_change_percentage_24h: 0.53,
    },
    {
      id: "monero",
      symbol: "xmr",
      name: "Monero",
      image: "https://assets.coingecko.com/coins/images/69/large/monero_logo.png",
      current_price: 163.21,
      market_cap: 2987654321,
      total_volume: 87654321,
      price_change_percentage_24h: 1.12,
    },
    {
      id: "cosmos",
      symbol: "atom",
      name: "Cosmos",
      image: "https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png",
      current_price: 8.42,
      market_cap: 3245678901,
      total_volume: 123456789,
      price_change_percentage_24h: -0.89,
    },
    {
      id: "filecoin",
      symbol: "fil",
      name: "Filecoin",
      image: "https://assets.coingecko.com/coins/images/12817/large/filecoin.png",
      current_price: 4.87,
      market_cap: 2345678901,
      total_volume: 98765432,
      price_change_percentage_24h: -1.34,
    },
    {
      id: "near",
      symbol: "near",
      name: "NEAR Protocol",
      image: "https://assets.coingecko.com/coins/images/10365/large/near.jpg",
      current_price: 5.76,
      market_cap: 5876543210,
      total_volume: 234567890,
      price_change_percentage_24h: 2.45,
    },
    {
      id: "aave",
      symbol: "aave",
      name: "Aave",
      image: "https://assets.coingecko.com/coins/images/12645/large/AAVE.png",
      current_price: 92.34,
      market_cap: 1345678901,
      total_volume: 76543210,
      price_change_percentage_24h: 0.76,
    },
    {
      id: "maker",
      symbol: "mkr",
      name: "Maker",
      image: "https://assets.coingecko.com/coins/images/1364/large/Mark_Maker.png",
      current_price: 1876.23,
      market_cap: 1687654321,
      total_volume: 54321098,
      price_change_percentage_24h: 1.23,
    },
    {
      id: "algorand",
      symbol: "algo",
      name: "Algorand",
      image: "https://assets.coingecko.com/coins/images/4380/large/download.png",
      current_price: 0.17,
      market_cap: 1345678901,
      total_volume: 65432109,
      price_change_percentage_24h: -0.54,
    },
    {
      id: "vechain",
      symbol: "vet",
      name: "VeChain",
      image: "https://assets.coingecko.com/coins/images/1167/large/VeChain-Logo-768x725.png",
      current_price: 0.026,
      market_cap: 1876543210,
      total_volume: 87654321,
      price_change_percentage_24h: 0.32,
    },
    {
      id: "apecoin",
      symbol: "ape",
      name: "ApeCoin",
      image: "https://assets.coingecko.com/coins/images/24383/large/apecoin.jpg",
      current_price: 1.42,
      market_cap: 876543210,
      total_volume: 43210987,
      price_change_percentage_24h: -2.13,
    },
    {
      id: "the-graph",
      symbol: "grt",
      name: "The Graph",
      image: "https://assets.coingecko.com/coins/images/13397/large/Graph_Token.png",
      current_price: 0.14,
      market_cap: 1345678901,
      total_volume: 54321098,
      price_change_percentage_24h: -0.87,
    },
    {
      id: "decentraland",
      symbol: "mana",
      name: "Decentraland",
      image: "https://assets.coingecko.com/coins/images/878/large/decentraland-mana.png",
      current_price: 0.42,
      market_cap: 987654321,
      total_volume: 43210987,
      price_change_percentage_24h: -1.23,
    },
    {
      id: "the-sandbox",
      symbol: "sand",
      name: "The Sandbox",
      image: "https://assets.coingecko.com/coins/images/12129/large/sandbox_logo.jpg",
      current_price: 0.46,
      market_cap: 876543210,
      total_volume: 32109876,
      price_change_percentage_24h: -0.76,
    },
    {
      id: "optimism",
      symbol: "op",
      name: "Optimism",
      image: "https://assets.coingecko.com/coins/images/25244/large/Optimism.png",
      current_price: 2.34,
      market_cap: 2345678901,
      total_volume: 98765432,
      price_change_percentage_24h: 1.45,
    },
    {
      id: "arbitrum",
      symbol: "arb",
      name: "Arbitrum",
      image: "https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg",
      current_price: 1.12,
      market_cap: 3456789012,
      total_volume: 123456789,
      price_change_percentage_24h: 0.87,
    },
  ]

  // Add small randomness to the prices to simulate market movement
  return cryptos.map((crypto) => ({
    ...crypto,
    current_price: crypto.current_price * (1 + (Math.random() * 0.01 - 0.005)),
    price_change_percentage_24h: crypto.price_change_percentage_24h + (Math.random() * 0.5 - 0.25),
  }))
}

// Update the simulateHistoricalData function to match the accurate price ranges
function simulateHistoricalData(days: number, coinId = "bitcoin") {
  const data = []
  const now = Date.now()

  // Different base prices for different coins - updated to match current prices
  let basePrice = 63852 // Default for Bitcoin
  let volatility = 0.01 // Default volatility

  // Set different base prices and volatility for different coins
  switch (coinId) {
    case "ethereum":
      basePrice = 3078
      volatility = 0.015
      break
    case "solana":
      basePrice = 137
      volatility = 0.025
      break
    case "cardano":
      basePrice = 0.45
      volatility = 0.02
      break
    case "binancecoin":
      basePrice = 552
      volatility = 0.012
      break
    case "ripple":
      basePrice = 0.51
      volatility = 0.018
      break
    case "polkadot":
      basePrice = 6.23
      volatility = 0.022
      break
    case "dogecoin":
      basePrice = 0.14
      volatility = 0.035
      break
    case "shiba-inu":
      basePrice = 0.000023
      volatility = 0.04
      break
    case "avalanche":
      basePrice = 33.76
      volatility = 0.023
      break
    case "chainlink":
      basePrice = 13.92
      volatility = 0.019
      break
    case "polygon":
      basePrice = 0.58
      volatility = 0.021
      break
    case "uniswap":
      basePrice = 7.76
      volatility = 0.017
      break
    case "litecoin":
      basePrice = 72.9
      volatility = 0.014
      break
    case "tron":
      basePrice = 0.11
      volatility = 0.02
      break
    case "stellar":
      basePrice = 0.1
      volatility = 0.016
      break
    case "bitcoin-cash":
      basePrice = 362.48
      volatility = 0.018
      break
    case "monero":
      basePrice = 163.21
      volatility = 0.02
      break
    case "cosmos":
      basePrice = 8.42
      volatility = 0.022
      break
    case "filecoin":
      basePrice = 4.87
      volatility = 0.025
      break
    case "near":
      basePrice = 5.76
      volatility = 0.023
      break
    case "aave":
      basePrice = 92.34
      volatility = 0.02
      break
    case "maker":
      basePrice = 1876.23
      volatility = 0.015
      break
    case "algorand":
      basePrice = 0.17
      volatility = 0.025
      break
    case "vechain":
      basePrice = 0.026
      volatility = 0.03
      break
    case "apecoin":
      basePrice = 1.42
      volatility = 0.035
      break
    case "the-graph":
      basePrice = 0.14
      volatility = 0.028
      break
    case "decentraland":
      basePrice = 0.42
      volatility = 0.03
      break
    case "the-sandbox":
      basePrice = 0.46
      volatility = 0.032
      break
    case "optimism":
      basePrice = 2.34
      volatility = 0.025
      break
    case "arbitrum":
      basePrice = 1.12
      volatility = 0.027
      break
    default:
      basePrice = 63852 // Bitcoin updated price
      volatility = 0.01
  }

  // Generate data points
  for (let i = 0; i < days * 24; i++) {
    const timestamp = now - (days * 24 - i) * 3600 * 1000

    // Create some realistic price movements
    const hourOfDay = new Date(timestamp).getHours()
    const dayOfWeek = new Date(timestamp).getDay()

    // Add some patterns based on time of day and day of week
    let modifier = 1.0
    if (hourOfDay >= 9 && hourOfDay <= 17) {
      modifier += 0.005 // Slightly higher during "trading hours"
    }
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      modifier -= 0.003 // Slightly lower on weekends
    }

    // Add some randomness and trends
    const timeProgress = i / (days * 24)

    // Different trend patterns for different coins
    let trend = 0
    if (coinId === "bitcoin" || coinId === "ethereum") {
      // Upward trend with some corrections
      trend = timeProgress * 0.15 + Math.sin(timeProgress * Math.PI * 3) * 0.05
    } else if (coinId === "solana" || coinId === "avalanche") {
      // Volatile with sharp movements
      trend = Math.sin(timeProgress * Math.PI * 4) * 0.15
    } else if (coinId === "dogecoin" || coinId === "shiba-inu") {
      // Very volatile with pump and dump pattern
      trend = Math.sin(timeProgress * Math.PI * 2) * 0.2 + (Math.random() > 0.95 ? 0.1 : 0)
    } else {
      // Default cyclical trend
      trend = Math.sin(timeProgress * Math.PI * 2) * 0.1
    }

    const random = (Math.random() - 0.5) * 0.03 // Random noise

    // Calculate OHLC values
    const baseForThisCandle = basePrice * (1 + trend + random) * modifier

    // Generate realistic candle data
    const candleVolatility = volatility * (1 + Math.random()) // More volatility for some candles

    // Randomly decide if candle is bullish (close > open) or bearish (close < open)
    const isBullish = Math.random() > 0.5

    // Calculate open, high, low, close
    const open = baseForThisCandle
    const close = isBullish
      ? baseForThisCandle * (1 + Math.random() * candleVolatility * 0.8)
      : baseForThisCandle * (1 - Math.random() * candleVolatility * 0.8)

    // High is the maximum of open and close, plus some extra
    const highExtra = Math.random() * candleVolatility * baseForThisCandle
    const high = Math.max(open, close) + highExtra

    // Low is the minimum of open and close, minus some extra
    const lowExtra = Math.random() * candleVolatility * baseForThisCandle
    const low = Math.min(open, close) - lowExtra

    data.push([timestamp, open, high, low, close])
  }

  return data
}

// Simulate cryptocurrency news data
function simulateCryptoNews(cryptoId: string) {
  // Common news sources
  const sources = ["CryptoNews", "CoinDesk", "Cointelegraph", "Bloomberg", "CNBC", "Reuters", "The Block"]

  // Common news tags
  const commonTags = ["Cryptocurrency", "Market", "Trading", "Blockchain", "DeFi", "NFT", "Regulation"]

  // Time periods
  const times = [
    "10 minutes ago",
    "30 minutes ago",
    "1 hour ago",
    "2 hours ago",
    "3 hours ago",
    "5 hours ago",
    "8 hours ago",
    "12 hours ago",
    "Yesterday",
    "2 days ago",
  ]

  // Generate news specific to the selected cryptocurrency
  const specificNews = [
    {
      title: `${capitalizeFirstLetter(cryptoId)} Price Analysis: Technical Indicators Point to Potential Breakout`,
      description: `Recent price action for ${capitalizeFirstLetter(cryptoId)} shows a consolidation pattern that could lead to a significant move. Technical analysts are closely watching key support and resistance levels.`,
      source: sources[Math.floor(Math.random() * sources.length)],
      time: times[Math.floor(Math.random() * 3)], // More recent
      tags: ["Technical Analysis", "Price Prediction", "Trading"],
      relatedCoins: [cryptoId],
    },
    {
      title: `Major Exchange Announces New ${capitalizeFirstLetter(cryptoId)} Trading Pairs`,
      description: `One of the leading cryptocurrency exchanges has announced the addition of new trading pairs for ${capitalizeFirstLetter(cryptoId)}, potentially increasing liquidity and accessibility for traders.`,
      source: sources[Math.floor(Math.random() * sources.length)],
      time: times[Math.floor(Math.random() * 5)],
      tags: ["Exchange", "Trading Pairs", "Liquidity"],
      relatedCoins: [cryptoId],
    },
    {
      title: `${capitalizeFirstLetter(cryptoId)} Development Team Announces Major Protocol Upgrade`,
      description: `The development team behind ${capitalizeFirstLetter(cryptoId)} has announced a significant protocol upgrade scheduled for next month, promising improved scalability and new features.`,
      source: sources[Math.floor(Math.random() * sources.length)],
      time: times[Math.floor(Math.random() * times.length)],
      tags: ["Development", "Protocol", "Technology", "Upgrade"],
      relatedCoins: [cryptoId],
    },
  ]

  // Generate general crypto news
  const generalNews = [
    {
      title: "Regulatory Developments: New Cryptocurrency Framework Proposed by G20 Nations",
      description:
        "G20 nations are working on a comprehensive regulatory framework for cryptocurrencies, aiming to establish global standards for digital asset oversight while balancing innovation and consumer protection.",
      source: sources[Math.floor(Math.random() * sources.length)],
      time: times[Math.floor(Math.random() * times.length)],
      tags: ["Regulation", "G20", "Policy", "Global"],
      relatedCoins: ["bitcoin", "ethereum"],
    },
    {
      title: "Institutional Adoption: Major Investment Firm Allocates $500M to Crypto Assets",
      description:
        "A leading investment management firm has announced a $500 million allocation to cryptocurrency assets, citing long-term growth potential and portfolio diversification benefits.",
      source: sources[Math.floor(Math.random() * sources.length)],
      time: times[Math.floor(Math.random() * times.length)],
      tags: ["Institutional", "Investment", "Adoption"],
      relatedCoins: ["bitcoin", "ethereum", "solana"],
    },
    {
      title: "DeFi Market Cap Surpasses $100 Billion as New Projects Gain Traction",
      description:
        "The total market capitalization of decentralized finance (DeFi) protocols has exceeded $100 billion, driven by growing user adoption and innovative new projects entering the space.",
      source: sources[Math.floor(Math.random() * sources.length)],
      time: times[Math.floor(Math.random() * times.length)],
      tags: ["DeFi", "Market Cap", "Growth"],
      relatedCoins: ["ethereum", "solana", "avalanche", "polygon"],
    },
    {
      title: "NFT Sales Volume Reaches New Monthly High Despite Market Volatility",
      description:
        "Non-fungible token (NFT) sales have reached a new monthly high, demonstrating resilience in the face of broader cryptocurrency market volatility and suggesting continued strong demand.",
      source: sources[Math.floor(Math.random() * sources.length)],
      time: times[Math.floor(Math.random() * times.length)],
      tags: ["NFT", "Sales", "Digital Art", "Collectibles"],
      relatedCoins: ["ethereum", "solana"],
    },
    {
      title: "Central Bank Digital Currencies: Five More Countries Begin CBDC Pilot Programs",
      description:
        "Five additional countries have announced pilot programs for central bank digital currencies (CBDCs), joining the growing global trend of exploring government-backed digital money.",
      source: sources[Math.floor(Math.random() * sources.length)],
      time: times[Math.floor(Math.random() * times.length)],
      tags: ["CBDC", "Central Bank", "Digital Currency", "Government"],
      relatedCoins: ["ripple", "stellar"],
    },
    {
      title: "Crypto Mining Industry Shifts Toward Renewable Energy Sources",
      description:
        "The cryptocurrency mining industry is increasingly adopting renewable energy sources, with several major mining operations announcing transitions to solar, wind, and hydroelectric power.",
      source: sources[Math.floor(Math.random() * sources.length)],
      time: times[Math.floor(Math.random() * times.length)],
      tags: ["Mining", "Renewable Energy", "Sustainability", "ESG"],
      relatedCoins: ["bitcoin", "ethereum", "litecoin"],
    },
    {
      title: "Layer 2 Solutions See Record User Growth as Gas Fees Remain High",
      description:
        "Layer 2 scaling solutions for Ethereum and other blockchains are experiencing record user growth as high gas fees on mainnet continue to drive users toward more cost-effective alternatives.",
      source: sources[Math.floor(Math.random() * sources.length)],
      time: times[Math.floor(Math.random() * times.length)],
      tags: ["Layer 2", "Scaling", "Gas Fees", "Adoption"],
      relatedCoins: ["ethereum", "polygon", "arbitrum"],
    },
  ]

  // Add some randomized related coins to make the data more interesting
  const allCoins = [
    "bitcoin",
    "ethereum",
    "solana",
    "cardano",
    "binancecoin",
    "ripple",
    "polkadot",
    "dogecoin",
    "shiba-inu",
    "avalanche",
    "chainlink",
    "polygon",
    "uniswap",
    "litecoin",
    "tron",
    "stellar",
  ]

  generalNews.forEach((news) => {
    // Add the current crypto as related if it's not already there and with some probability
    if (!news.relatedCoins.includes(cryptoId) && Math.random() > 0.7) {
      news.relatedCoins.push(cryptoId)
    }

    // Add some random related coins
    allCoins.forEach((coin) => {
      if (!news.relatedCoins.includes(coin) && Math.random() > 0.9) {
        news.relatedCoins.push(coin)
      }
    })
  })

  // Combine and shuffle the news
  const allNews = [...specificNews, ...generalNews]
  return shuffleArray(allNews)
}

// Helper function to capitalize the first letter of a string
function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

// Helper function to shuffle an array
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}
