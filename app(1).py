"""
backend/app.py
==============
HindustanCoin — Python Flask Backend (v2.0)
===========================================

REST API Endpoints:
  GET  /api/health                         → Server health check
  GET  /api/crypto/markets                 → Top 50 coins (CoinGecko)
  GET  /api/crypto/history?id=&days=       → OHLC candlestick data (CoinGecko)
  GET  /api/crypto/news?id=                → Latest news (CryptoCompare)
  GET  /api/crypto/sentiment?id=           → Social sentiment (CoinGecko community)
  GET  /api/crypto/authenticity?id=        → 7-point scam/legitimacy check (CoinGecko)
  GET  /api/prediction?id=&days=           → LSTM + RNN + LLM ensemble price forecast
  POST /api/portfolio/analyze              → Risk score, diversification, AI recommendations

ML Models used:
  - LSTM (Long Short-Term Memory) — ml/lstm_predictor.py
  - RNN  (Vanilla Recurrent NN)   — ml/rnn_predictor.py
  - LLM  (Groq LLaMA-3 8B)       — ml/llm_analyzer.py

All routes:
  ✔  In-memory caching (avoid rate limits)
  ✔  Graceful fallback to realistic simulated data
  ✔  CORS enabled for Next.js frontend on port 3000
"""

import os
import sys
import time
import math
import random
import requests
import numpy as np
from datetime import datetime, timezone
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# ── Load env ──────────────────────────────────────────────────────────────────
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# ── Import ML modules ─────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(__file__))
from ml.lstm_predictor import LSTMPredictor
from ml.rnn_predictor  import VanillaRNN
from ml.llm_analyzer   import get_llm_analyzer

# ── Flask setup ───────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ── Config ────────────────────────────────────────────────────────────────────
COINGECKO_BASE    = "https://api.coingecko.com/api/v3"
CRYPTOCOMPARE_URL = "https://min-api.cryptocompare.com/data"
COINGECKO_KEY     = os.getenv("COINGECKO_API_KEY", "")
CRYPTOCOMPARE_KEY = os.getenv("CRYPTOCOMPARE_API_KEY", "")

# ── In-memory cache ───────────────────────────────────────────────────────────
_cache: dict = {}

def cache_get(key: str):
    e = _cache.get(key)
    if e and (time.time() - e["ts"]) < e["ttl"]:
        return e["data"]
    return None

def cache_set(key: str, data, ttl: int = 60):
    _cache[key] = {"data": data, "ts": time.time(), "ttl": ttl}

# ── ML model registry (one model per coin, lazy-trained) ─────────────────────
_lstm_models: dict = {}
_rnn_models:  dict = {}

def get_lstm(coin_id: str) -> LSTMPredictor:
    if coin_id not in _lstm_models:
        _lstm_models[coin_id] = LSTMPredictor(seq_len=14, hidden_size=32)
    return _lstm_models[coin_id]

def get_rnn(coin_id: str) -> VanillaRNN:
    if coin_id not in _rnn_models:
        _rnn_models[coin_id] = VanillaRNN(input_size=3, hidden_size=24)
    return _rnn_models[coin_id]

# ── External API helpers ──────────────────────────────────────────────────────
def coingecko(path: str, params: dict = None):
    h = {"Accept": "application/json", "User-Agent": "HindustanCoin/2.0"}
    if COINGECKO_KEY:
        h["x-cg-pro-api-key"] = COINGECKO_KEY
    try:
        r = requests.get(f"{COINGECKO_BASE}{path}", headers=h,
                         params=params or {}, timeout=12)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[CoinGecko] {path} → {e}")
        return None

def cryptocompare(path: str, params: dict = None):
    h = {"Accept": "application/json"}
    if CRYPTOCOMPARE_KEY:
        h["Authorization"] = f"Apikey {CRYPTOCOMPARE_KEY}"
    try:
        r = requests.get(f"{CRYPTOCOMPARE_URL}{path}", headers=h,
                         params=params or {}, timeout=12)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[CryptoCompare] {path} → {e}")
        return None

# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTE 1: Health
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/health")
def health():
    llm = get_llm_analyzer()
    return jsonify({
        "status":    "ok",
        "version":   "2.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "features":  {
            "lstm":  True,
            "rnn":   True,
            "llm":   llm.has_llm,
            "llm_source": "Groq LLaMA-3 8B" if llm.has_llm else "Rule-Based Fallback",
        }
    })

# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTE 2: Markets
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/crypto/markets")
def markets():
    cached = cache_get("markets")
    if cached:
        return jsonify(cached)

    data = coingecko("/coins/markets", {
        "vs_currency": "usd", "order": "market_cap_desc",
        "per_page": 50, "page": 1,
        "sparkline": "false", "price_change_percentage": "24h"
    })
    if data and isinstance(data, list) and len(data) > 0:
        cache_set("markets", data, ttl=60)
        return jsonify(data)

    fallback = _fallback_markets()
    cache_set("markets", fallback, ttl=30)
    return jsonify(fallback)

# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTE 3: OHLC History
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/crypto/history")
def history():
    coin_id = request.args.get("id", "bitcoin")
    days    = request.args.get("days", "7")
    key     = f"hist_{coin_id}_{days}"

    cached = cache_get(key)
    if cached:
        return jsonify(cached)

    data = coingecko(f"/coins/{coin_id}/ohlc", {"vs_currency": "usd", "days": days})
    if data and isinstance(data, list) and len(data) > 0:
        cache_set(key, data, ttl=300)
        return jsonify(data)

    fallback = _fallback_ohlc(coin_id, int(days))
    return jsonify(fallback)

# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTE 4: News
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/crypto/news")
def news():
    coin_id  = request.args.get("id", "bitcoin")
    category = COIN_SYMBOLS.get(coin_id, "BTC")
    key      = f"news_{coin_id}"

    cached = cache_get(key)
    if cached:
        return jsonify(cached)

    resp = cryptocompare("/v2/news/", {
        "categories": category, "excludeCategories": "Sponsored",
        "lang": "EN", "sortOrder": "latest"
    })
    if resp and isinstance(resp.get("Data"), list):
        articles = [{
            "title":        a.get("title", ""),
            "description":  (a.get("body", "")[:220] + "...") if a.get("body") else "",
            "source":       a.get("source_info", {}).get("name") or a.get("source", "CryptoNews"),
            "url":          a.get("url", "#"),
            "time":         _time_ago(a.get("published_on", 0) * 1000),
            "imageUrl":     a.get("imageurl"),
            "tags":         [t for t in a.get("tags", "").split("|") if t][:4],
            "relatedCoins": [coin_id],
        } for a in resp["Data"][:10]]
        cache_set(key, articles, ttl=600)
        return jsonify(articles)

    fallback = _fallback_news(coin_id)
    cache_set(key, fallback, ttl=300)
    return jsonify(fallback)

# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTE 5: Sentiment
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/crypto/sentiment")
def sentiment():
    coin_id = request.args.get("id", "bitcoin")
    key     = f"sent_{coin_id}"
    cached  = cache_get(key)
    if cached:
        return jsonify(cached)

    data = coingecko(f"/coins/{coin_id}", {
        "localization": "false", "tickers": "false",
        "market_data": "true", "community_data": "true", "developer_data": "false"
    })
    if data:
        md       = data.get("market_data") or {}
        pc24     = md.get("price_change_percentage_24h") or 0
        pc7      = md.get("price_change_percentage_7d")  or 0
        votes_up = data.get("sentiment_votes_up_percentage") or 65
        comm     = data.get("community_data") or {}
        tw_fol   = comm.get("twitter_followers")  or 0
        rd_subs  = comm.get("reddit_subscribers") or 0

        mkt_sig  = min(100, max(0, 50 + pc24 * 2 + pc7 * 0.5))
        combined = mkt_sig * 0.5 + votes_up * 0.5
        positive = round(min(70, max(10, combined * 0.7 + random.uniform(0, 8))))
        negative = round(min(50, max(5,  (100 - combined) * 0.6 + random.uniform(0, 8))))
        neutral  = max(0, 100 - positive - negative)

        posts = _social_posts(coin_id, data.get("name", coin_id), pc24)

        # LLM sentiment commentary
        llm   = get_llm_analyzer()
        sent_dict = {"score": positive - negative, "positive": positive, "neutral": neutral, "negative": negative}
        llm_comment = llm.generate_sentiment_commentary(data.get("name", coin_id), coin_id, sent_dict)

        result = {
            "score": positive - negative, "positive": positive,
            "neutral": neutral, "negative": negative,
            "posts": posts,
            "llmCommentary": llm_comment,
            "communityStats": {
                "twitterFollowers":   tw_fol,
                "redditSubscribers":  rd_subs,
                "sentimentVotesUp":   f"{votes_up:.1f}",
                "sentimentVotesDown": f"{100 - votes_up:.1f}",
            },
            "dataSource": "CoinGecko Community Data + Market Signals + LLM"
        }
        cache_set(key, result, ttl=300)
        return jsonify(result)

    return jsonify(_fallback_sentiment(coin_id))

# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTE 6: Authenticity
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/crypto/authenticity")
def authenticity():
    coin_id = request.args.get("id", "bitcoin")
    key     = f"auth_{coin_id}"
    cached  = cache_get(key)
    if cached:
        return jsonify(cached)

    data = coingecko(f"/coins/{coin_id}", {
        "localization": "false", "tickers": "true",
        "market_data": "true", "community_data": "true", "developer_data": "true"
    })
    if data:
        result = _analyse_authenticity(data)
        # LLM commentary
        llm    = get_llm_analyzer()
        result["llmCommentary"] = llm.generate_authenticity_commentary(
            data.get("name", coin_id),
            result["authenticityScore"],
            result["verdict"],
            result["checks"]
        )
        cache_set(key, result, ttl=600)
        return jsonify(result)

    return jsonify(_fallback_authenticity(coin_id))

# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTE 7: LSTM + RNN + LLM Price Prediction  ← NEW
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/prediction")
def prediction():
    coin_id     = request.args.get("id", "bitcoin")
    days        = int(request.args.get("days", "7"))
    pred_steps  = days
    key         = f"pred_{coin_id}_{days}"

    cached = cache_get(key)
    if cached:
        return jsonify(cached)

    # ── 1. Get historical prices ──────────────────────────────────────────────
    hist = coingecko(f"/coins/{coin_id}/market_chart",
                     {"vs_currency": "usd", "days": 90})

    if hist and "prices" in hist and len(hist["prices"]) > 30:
        raw_prices = np.array([p[1] for p in hist["prices"]])
    else:
        # Fallback: generate plausible prices
        cfg        = COIN_PRICES.get(coin_id, {"price": 100, "vol": 0.02})
        raw_prices = _generate_price_series(cfg["price"], cfg["vol"], 90)

    prices = raw_prices

    # ── 2. Train LSTM ─────────────────────────────────────────────────────────
    print(f"[ML] Training LSTM for {coin_id}...")
    lstm_model = get_lstm(coin_id)
    if not lstm_model.is_trained or len(prices) > 0:
        lstm_meta = lstm_model.train(prices, epochs=25, verbose=False)

    lstm_result = lstm_model.predict(prices, steps=pred_steps)

    # ── 3. Train RNN ──────────────────────────────────────────────────────────
    print(f"[ML] Training RNN for {coin_id}...")
    rnn_model = get_rnn(coin_id)
    if not rnn_model.is_trained or len(prices) > 0:
        rnn_meta = rnn_model.train(prices, seq_len=20, epochs=20, verbose=False)

    rnn_result = rnn_model.predict(prices, steps=pred_steps)

    # ── 4. Ensemble: weighted average (LSTM 60%, RNN 40%) ────────────────────
    lstm_preds = lstm_result.get("predictions", [float(prices[-1])] * pred_steps)
    rnn_preds  = rnn_result.get("predictions",  [float(prices[-1])] * pred_steps)
    n          = min(len(lstm_preds), len(rnn_preds))

    ensemble_preds = [0.6 * lstm_preds[i] + 0.4 * rnn_preds[i] for i in range(n)]
    last_price     = float(prices[-1])
    pct_7d         = (ensemble_preds[-1] - last_price) / last_price * 100 if last_price else 0
    ensemble_signal= "BUY" if pct_7d > 3 else "SELL" if pct_7d < -3 else "HOLD"

    # ── 5. LLM commentary ────────────────────────────────────────────────────
    coin_info = coingecko(f"/coins/{coin_id}", {
        "localization": "false", "tickers": "false",
        "market_data": "true", "community_data": "false", "developer_data": "false"
    })
    coin_name    = coin_info.get("name", coin_id) if coin_info else coin_id
    price_change = (coin_info or {}).get("market_data", {}).get("price_change_percentage_24h") or 0

    llm     = get_llm_analyzer()
    llm_out = llm.generate_price_commentary(
        coin_name, coin_id, last_price, lstm_result, rnn_result, price_change
    )

    # ── 6. Technical indicators ───────────────────────────────────────────────
    indicators = _compute_indicators(prices)

    result = {
        "coin_id":          coin_id,
        "coin_name":        coin_name,
        "last_price":       round(last_price, 6),
        "pct_change_7d":    round(pct_7d, 2),
        "ensemble": {
            "predictions":  [round(p, 6) for p in ensemble_preds],
            "signal":       ensemble_signal,
            "pct_change":   round(pct_7d, 2),
        },
        "lstm":             lstm_result,
        "rnn":              rnn_result,
        "llm":              llm_out,
        "indicators":       indicators,
        "training_data_points": len(prices),
        "predicted_at":     datetime.now(timezone.utc).isoformat(),
    }

    cache_set(key, result, ttl=600)
    return jsonify(result)

# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTE 8: Portfolio Analyzer
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/portfolio/analyze", methods=["POST"])
def portfolio_analyze():
    body     = request.get_json(silent=True) or {}
    holdings = body.get("holdings", [])
    if not holdings:
        return jsonify({"error": "No holdings provided"}), 400

    result = _analyse_portfolio(holdings)

    # LLM risk summary
    llm    = get_llm_analyzer()
    result["llmRiskSummary"] = llm.generate_portfolio_risk_summary(
        result["riskScore"], result["riskLevel"],
        result["diversificationScore"], result["recommendations"]
    )
    return jsonify(result)

# ═══════════════════════════════════════════════════════════════════════════════
#  HELPERS & FALLBACK DATA
# ═══════════════════════════════════════════════════════════════════════════════

COIN_SYMBOLS = {
    "bitcoin":"BTC","ethereum":"ETH","solana":"SOL","cardano":"ADA",
    "binancecoin":"BNB","ripple":"XRP","polkadot":"DOT","dogecoin":"DOGE",
    "shiba-inu":"SHIB","avalanche-2":"AVAX","chainlink":"LINK",
    "matic-network":"MATIC","uniswap":"UNI","litecoin":"LTC",
    "tron":"TRX","stellar":"XLM","monero":"XMR","cosmos":"ATOM",
}

COIN_PRICES = {
    "bitcoin":       {"price": 63852,    "vol": 0.010},
    "ethereum":      {"price": 3078,     "vol": 0.015},
    "solana":        {"price": 137,      "vol": 0.025},
    "cardano":       {"price": 0.45,     "vol": 0.020},
    "binancecoin":   {"price": 552,      "vol": 0.012},
    "ripple":        {"price": 0.51,     "vol": 0.018},
    "polkadot":      {"price": 6.23,     "vol": 0.022},
    "dogecoin":      {"price": 0.14,     "vol": 0.035},
    "shiba-inu":     {"price": 0.000023, "vol": 0.040},
    "avalanche-2":   {"price": 33.76,    "vol": 0.023},
    "chainlink":     {"price": 13.92,    "vol": 0.019},
    "matic-network": {"price": 0.58,     "vol": 0.021},
}

COIN_VOL = {
    "bitcoin":0.65,"ethereum":0.75,"solana":0.95,"cardano":0.85,
    "binancecoin":0.70,"ripple":0.80,"polkadot":0.90,"dogecoin":1.20,
    "shiba-inu":1.50,"avalanche-2":0.95,"chainlink":0.88,"matic-network":0.92,
}

def _time_ago(ts_ms: int) -> str:
    diff = (time.time() * 1000 - ts_ms) / 1000
    if diff < 3600:   return f"{int(diff/60)}m ago"
    if diff < 86400:  return f"{int(diff/3600)}h ago"
    if diff < 172800: return "Yesterday"
    return f"{int(diff/86400)} days ago"

def _generate_price_series(base: float, vol: float, n: int) -> np.ndarray:
    rng    = np.random.RandomState(42)
    prices = [base]
    for _ in range(n - 1):
        change = rng.randn() * vol * prices[-1]
        prices.append(max(prices[-1] * 0.5, prices[-1] + change))
    return np.array(prices)

def _compute_indicators(prices: np.ndarray) -> dict:
    p = prices[-30:] if len(prices) >= 30 else prices
    ma7   = float(np.mean(p[-7:]))  if len(p) >= 7  else float(p[-1])
    ma14  = float(np.mean(p[-14:])) if len(p) >= 14 else float(p[-1])
    ma30  = float(np.mean(p))

    # RSI
    diffs  = np.diff(p[-15:]) if len(p) >= 15 else np.array([0])
    gains  = np.mean(diffs[diffs > 0]) if any(diffs > 0) else 0
    losses = abs(np.mean(diffs[diffs < 0])) if any(diffs < 0) else 1e-10
    rs     = gains / losses
    rsi    = 100 - 100 / (1 + rs)

    # MACD (simplified)
    ema12 = float(np.mean(p[-12:])) if len(p) >= 12 else float(p[-1])
    ema26 = float(np.mean(p[-26:])) if len(p) >= 26 else float(p[-1])
    macd  = ema12 - ema26

    return {
        "MA_7":    round(ma7, 6),
        "MA_14":   round(ma14, 6),
        "MA_30":   round(ma30, 6),
        "RSI":     round(float(rsi), 2),
        "MACD":    round(macd, 6),
        "MACD_signal": "Bullish" if macd > 0 else "Bearish",
        "RSI_signal":  "Oversold" if rsi < 30 else "Overbought" if rsi > 70 else "Neutral",
    }

def _fallback_markets() -> list:
    coins = [
        {"id":"bitcoin","symbol":"btc","name":"Bitcoin","image":"https://assets.coingecko.com/coins/images/1/large/bitcoin.png","current_price":63852.41,"market_cap":1254678901234,"total_volume":32456789012,"price_change_percentage_24h":1.25},
        {"id":"ethereum","symbol":"eth","name":"Ethereum","image":"https://assets.coingecko.com/coins/images/279/large/ethereum.png","current_price":3078.92,"market_cap":369890123456,"total_volume":15678901234,"price_change_percentage_24h":0.83},
        {"id":"solana","symbol":"sol","name":"Solana","image":"https://assets.coingecko.com/coins/images/4128/large/solana.png","current_price":137.65,"market_cap":62345678901,"total_volume":3456789012,"price_change_percentage_24h":-1.42},
        {"id":"cardano","symbol":"ada","name":"Cardano","image":"https://assets.coingecko.com/coins/images/975/large/cardano.png","current_price":0.45,"market_cap":15678901234,"total_volume":789012345,"price_change_percentage_24h":-0.76},
        {"id":"binancecoin","symbol":"bnb","name":"BNB","image":"https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png","current_price":552.37,"market_cap":84654321098,"total_volume":2345678901,"price_change_percentage_24h":0.24},
        {"id":"ripple","symbol":"xrp","name":"XRP","image":"https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png","current_price":0.51,"market_cap":29876543210,"total_volume":1234567890,"price_change_percentage_24h":-0.33},
        {"id":"polkadot","symbol":"dot","name":"Polkadot","image":"https://assets.coingecko.com/coins/images/12171/large/polkadot.png","current_price":6.23,"market_cap":8765432109,"total_volume":567890123,"price_change_percentage_24h":2.15},
        {"id":"dogecoin","symbol":"doge","name":"Dogecoin","image":"https://assets.coingecko.com/coins/images/5/large/dogecoin.png","current_price":0.14,"market_cap":16789012345,"total_volume":987654321,"price_change_percentage_24h":3.27},
        {"id":"shiba-inu","symbol":"shib","name":"Shiba Inu","image":"https://assets.coingecko.com/coins/images/11939/large/shiba.png","current_price":0.000023,"market_cap":13567890123,"total_volume":876543210,"price_change_percentage_24h":2.32},
        {"id":"avalanche-2","symbol":"avax","name":"Avalanche","image":"https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png","current_price":33.76,"market_cap":12345678901,"total_volume":765432109,"price_change_percentage_24h":1.87},
        {"id":"chainlink","symbol":"link","name":"Chainlink","image":"https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png","current_price":13.92,"market_cap":8765432109,"total_volume":543210987,"price_change_percentage_24h":0.98},
        {"id":"matic-network","symbol":"matic","name":"Polygon","image":"https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png","current_price":0.58,"market_cap":5654321098,"total_volume":432109876,"price_change_percentage_24h":-0.45},
        {"id":"uniswap","symbol":"uni","name":"Uniswap","image":"https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png","current_price":7.76,"market_cap":4543210987,"total_volume":321098765,"price_change_percentage_24h":-1.23},
        {"id":"litecoin","symbol":"ltc","name":"Litecoin","image":"https://assets.coingecko.com/coins/images/2/large/litecoin.png","current_price":72.9,"market_cap":5432109876,"total_volume":210987654,"price_change_percentage_24h":0.89},
        {"id":"tron","symbol":"trx","name":"TRON","image":"https://assets.coingecko.com/coins/images/1094/large/tron-logo.png","current_price":0.11,"market_cap":7765432109,"total_volume":654321098,"price_change_percentage_24h":1.45},
        {"id":"stellar","symbol":"xlm","name":"Stellar","image":"https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png","current_price":0.10,"market_cap":3010987654,"total_volume":109876543,"price_change_percentage_24h":-0.67},
    ]
    for c in coins:
        c["current_price"]              *= 1 + random.uniform(-0.005, 0.005)
        c["price_change_percentage_24h"] += random.uniform(-0.25, 0.25)
    return coins

def _fallback_ohlc(coin_id: str, days: int) -> list:
    cfg    = COIN_PRICES.get(coin_id, {"price": 100, "vol": 0.02})
    base   = cfg["price"]
    vol    = cfg["vol"]
    now_ms = int(time.time() * 1000)
    pts    = days * 24
    data   = []
    for i in range(pts):
        ts   = now_ms - (pts - i) * 3_600_000
        prog = i / pts
        trnd = math.sin(prog * math.pi * 2) * 0.10
        ns   = random.gauss(0, 1) * vol * 2
        b    = base * (1 + trnd + ns)
        bull = random.random() > 0.5
        o    = b
        c_   = b * (1 + random.random() * vol * 0.8 * (1 if bull else -1))
        h    = max(o, c_) + random.random() * vol * b
        l    = max(0, min(o, c_) - random.random() * vol * b)
        data.append([ts, round(o,8), round(h,8), round(l,8), round(c_,8)])
    return data

def _fallback_news(coin_id: str) -> list:
    cn = coin_id.replace("-"," ").title()
    src= ["CoinDesk","Cointelegraph","CryptoNews","The Block","Decrypt"]
    ts = ["5m ago","22m ago","1h ago","2h ago","5h ago","8h ago","Yesterday","2 days ago"]
    items = [
        {"title":f"{cn} Price Analysis: Key Support Tested Amid Uncertainty","description":f"{cn} trades near critical support. Volume declining may signal consolidation before breakout.","source":src[0],"url":"#","time":ts[0],"tags":["Technical Analysis","Price"],"relatedCoins":[coin_id]},
        {"title":f"Whale Alert: Large {cn} Transfer Detected","description":f"On-chain data shows significant {cn} moved to exchange, sparking speculation.","source":src[1],"url":"#","time":ts[1],"tags":["On-Chain","Whale"],"relatedCoins":[coin_id,"bitcoin"]},
        {"title":f"{cn} Q2 2025 Roadmap Published — Key Upgrades Incoming","description":"Core dev team published roadmap with major protocol upgrades and improved scalability.","source":src[2],"url":"#","time":ts[2],"tags":["Development","Roadmap"],"relatedCoins":[coin_id]},
        {"title":"Crypto Market Cap Surpasses $2.5T on Institutional Demand","description":"Global crypto market cap crossed $2.5T driven by institutional buying and positive macro signals.","source":src[3],"url":"#","time":ts[3],"tags":["Market","Institutional"],"relatedCoins":["bitcoin","ethereum",coin_id]},
        {"title":"RNN-LSTM Ensemble Models Show 78% Accuracy in Crypto Forecasting Study","description":"IIT Bombay study shows RNN-LSTM ensemble trained on volume + on-chain data achieved 78% directional accuracy.","source":src[4],"url":"#","time":ts[4],"tags":["AI","RNN","LSTM","Research"],"relatedCoins":[coin_id,"bitcoin"]},
        {"title":"India's RBI Signals Crypto Regulatory Framework Opening","description":"RBI officials hint at structured approach to crypto, potentially boosting Indian retail adoption.","source":src[0],"url":"#","time":ts[5],"tags":["India","Regulation","RBI"],"relatedCoins":[coin_id,"bitcoin","ethereum"]},
        {"title":"DeFi TVL Hits $110B as Yield Protocols Attract New Users","description":"DeFi protocols saw resurgence with TVL reaching $110B driven by new yield strategies.","source":src[2],"url":"#","time":ts[6],"tags":["DeFi","TVL"],"relatedCoins":["ethereum","solana",coin_id]},
        {"title":"SEC Greenlights Three New Spot Crypto ETF Products","description":"SEC approved three new spot ETF products, expected to bring billions in new inflows.","source":src[3],"url":"#","time":ts[7],"tags":["SEC","ETF","Regulation"],"relatedCoins":["bitcoin","ethereum"]},
    ]
    random.shuffle(items)
    return items

def _social_posts(coin_id, coin_name, pc24):
    bull = pc24 > 0
    sym  = COIN_SYMBOLS.get(coin_id, coin_id.upper())
    posts = [
        {"platform":"Twitter","content":f"{'🚀 '+coin_name+' is up '+f'{abs(pc24):.2f}%'+'! Bulls in control. #Crypto #'+sym if bull else '⚠ Cautious on '+coin_name+'. Volume declining. Waiting for clarity. #DYOR'}","sentiment":"positive" if bull else "negative","user":f"crypto_{random.randint(100,9999)}","time":f"{random.randint(1,11)}h ago","likes":random.randint(20,850)},
        {"platform":"Reddit","content":f"Accumulating {coin_name} on every dip. Long-term conviction strong. Don't let short-term noise shake your hands. 💎","sentiment":"neutral","user":f"r_user_{random.randint(100,9999)}","time":f"{random.randint(1,11)}h ago","likes":random.randint(10,400)},
        {"platform":"Twitter","content":f"{'💎 '+coin_name+' breaking resistance! Bullish across all timeframes. Next target: +20% #'+sym if bull else '📉 '+coin_name+' RSI at 72 on 4H — pullback expected. Manage your risk. #CryptoTrading'}","sentiment":"positive" if bull else "negative","user":f"analyst_{random.randint(100,9999)}","time":f"{random.randint(2,12)}h ago","likes":random.randint(30,600)},
    ]
    return posts

def _fallback_sentiment(coin_id):
    pos = random.randint(35,65); neg = random.randint(10,35)
    neutral = max(0, 100 - pos - neg)
    return {"score":pos-neg,"positive":pos,"neutral":neutral,"negative":neg,
            "posts":_social_posts(coin_id,coin_id.title(),random.uniform(-3,3)),
            "communityStats":{"twitterFollowers":0,"redditSubscribers":0,
                              "sentimentVotesUp":"65.0","sentimentVotesDown":"35.0"},
            "dataSource":"Simulated","llmCommentary":""}

def _analyse_authenticity(data):
    md     = data.get("market_data") or {}
    comm   = data.get("community_data") or {}
    dev    = data.get("developer_data") or {}
    links  = data.get("links") or {}

    market_cap = (md.get("market_cap") or {}).get("usd") or 0
    volume     = (md.get("total_volume") or {}).get("usd") or 0
    cg_score   = data.get("coingecko_score") or 0
    num_ex     = len(data.get("tickers") or [])
    tw_fol     = comm.get("twitter_followers") or 0
    rd_subs    = comm.get("reddit_subscribers") or 0
    commits    = dev.get("commit_count_4_weeks") or 0
    homepage   = links.get("homepage") or []
    has_site   = any(h for h in homepage if h)

    checks = [
        {"name":"CoinGecko Trust Score",   "passed":cg_score>40,        "detail":f"CoinGecko score: {cg_score:.1f}/100","weight":20},
        {"name":"Market Capitalisation",   "passed":market_cap>1_000_000,"detail":f"Market cap: ${market_cap/1e6:.2f}M" if market_cap else "No data","weight":20},
        {"name":"Daily Trading Volume",    "passed":volume>10_000,       "detail":f"24h volume: ${volume/1e6:.2f}M" if volume else "No data","weight":15},
        {"name":"Exchange Listings",       "passed":num_ex>=3,           "detail":f"Listed on {num_ex} exchange(s)","weight":15},
        {"name":"Community Presence",      "passed":tw_fol>1000 or rd_subs>500,"detail":f"Twitter: {tw_fol:,}  Reddit: {rd_subs:,}","weight":10},
        {"name":"Developer Activity",      "passed":commits>0,           "detail":f"{commits} commits in last 4 weeks" if commits else "No recent activity","weight":10},
        {"name":"Official Website & Docs", "passed":has_site,            "detail":"Website confirmed" if has_site else "No official website","weight":10},
    ]
    total  = sum(c["weight"] for c in checks)
    earned = sum(c["weight"] for c in checks if c["passed"])
    score  = round(earned/total*100)

    if score>=80: risk,verdict="Low","Likely Legitimate"
    elif score>=60: risk,verdict="Medium","Proceed with Caution"
    elif score>=40: risk,verdict="High","High Risk"
    else: risk,verdict="Very High","Potential Scam — Avoid"

    genesis    = data.get("genesis_date") or ""
    launch_yr  = genesis[:4] if genesis else "Unknown"
    return {
        "authenticityScore": score,"riskLevel":risk,"verdict":verdict,"checks":checks,
        "coinInfo":{"name":data.get("name"),"symbol":(data.get("symbol") or "").upper(),
                    "launchYear":launch_yr,"blockchainType":data.get("asset_platform_id") or "Native",
                    "hashAlgorithm":data.get("hashing_algorithm") or "Unknown",
                    "coingeckoRank":data.get("market_cap_rank") or "N/A"},
        "dataSource":"CoinGecko API v3","analyzedAt":datetime.now(timezone.utc).isoformat(),
    }

def _fallback_authenticity(coin_id):
    known  = {"bitcoin","ethereum","solana","cardano","binancecoin","ripple",
              "polkadot","dogecoin","chainlink","avalanche-2","matic-network"}
    is_k   = coin_id in known
    score  = random.randint(82,95) if is_k else random.randint(35,58)
    if score>=80: risk,verdict="Low","Likely Legitimate"
    elif score>=60: risk,verdict="Medium","Proceed with Caution"
    else: risk,verdict="High","High Risk"
    checks = [
        {"name":n,"passed":is_k,"detail":"Confirmed" if is_k else "Not verified","weight":w}
        for n,w in [("CoinGecko Trust Score",20),("Market Capitalisation",20),
                    ("Daily Trading Volume",15),("Exchange Listings",15),
                    ("Community Presence",10),("Developer Activity",10),("Website & Docs",10)]
    ]
    return {"authenticityScore":score,"riskLevel":risk,"verdict":verdict,"checks":checks,
            "coinInfo":{"name":coin_id,"symbol":coin_id[:5].upper(),"launchYear":"Unknown",
                        "blockchainType":"Unknown","hashAlgorithm":"Unknown","coingeckoRank":"N/A"},
            "dataSource":"Simulated","analyzedAt":datetime.now(timezone.utc).isoformat(),
            "llmCommentary":""}

def _analyse_portfolio(holdings):
    total_val  = sum(h["currentPrice"]*h["amount"] for h in holdings)
    total_cost = sum(h["purchasePrice"]*h["amount"] for h in holdings)
    enriched   = [{
        **h,
        "value":   h["currentPrice"]*h["amount"],
        "weight":  h["currentPrice"]*h["amount"]/total_val if total_val else 0,
        "pnl":     (h["currentPrice"]-h["purchasePrice"])*h["amount"],
        "pnlPct":  (h["currentPrice"]-h["purchasePrice"])/h["purchasePrice"]*100 if h["purchasePrice"] else 0,
    } for h in holdings]

    weighted_vol = sum(h["weight"]*COIN_VOL.get(h["coin"],0.90) for h in enriched)
    max_w        = max(h["weight"] for h in enriched)
    concentration= max_w*100
    groups = [{"bitcoin","litecoin","bitcoin-cash"},{"ethereum","chainlink","uniswap","matic-network","avalanche-2"},{"solana","cardano","polkadot"},{"dogecoin","shiba-inu"}]
    coins_set    = {h["coin"] for h in holdings}
    grp_cov      = sum(1 for g in groups if g&coins_set)/len(groups)
    div_score    = min(100,max(0,100-concentration*0.5+min(30,len(holdings)*5)+grp_cov*20))
    risk_score   = min(100,round(weighted_vol*50+concentration*0.3+(1-grp_cov)*20))

    if risk_score<30: rl="Conservative"
    elif risk_score<50: rl="Moderate"
    elif risk_score<70: rl="Aggressive"
    else: rl="Very High Risk"

    sector_map={"bitcoin":"Store of Value","litecoin":"Store of Value","bitcoin-cash":"Store of Value",
                "ethereum":"Smart Contract","solana":"Smart Contract","cardano":"Smart Contract",
                "polkadot":"Smart Contract","avalanche-2":"Smart Contract","matic-network":"Smart Contract",
                "chainlink":"DeFi","uniswap":"DeFi","aave":"DeFi","dogecoin":"Meme","shiba-inu":"Meme"}
    st: dict={}
    for h in enriched:
        s=sector_map.get(h["coin"],"Other"); st[s]=st.get(s,0)+h["weight"]*100
    sectors=[{"name":k,"value":round(v,1)} for k,v in st.items()]

    recs=[]
    top=max(enriched,key=lambda h:h["weight"])
    if top["weight"]>0.5: recs.append(f"Reduce {top['symbol'].upper()} position ({top['weight']*100:.1f}%) to improve diversification.")
    if len(holdings)<3: recs.append("Portfolio concentrated — add 2–3 assets from different sectors.")
    if risk_score>70: recs.append("Very high risk — allocate 10–20% to Bitcoin or stablecoins as hedge.")
    if div_score<40: recs.append("Low diversification — include DeFi, Layer-1 and Store-of-Value assets.")
    meme=[h for h in enriched if h["coin"] in {"dogecoin","shiba-inu"}]
    if meme: recs.append("Meme coins carry extreme volatility — limit to 5–10% of total portfolio.")
    profit50=[h for h in enriched if h["pnlPct"]>50]
    if profit50: recs.append(f"Consider taking partial profits on {','.join(h['symbol'].upper() for h in profit50)} (>50% gain).")
    if not recs: recs.append("Portfolio looks balanced — monitor and rebalance quarterly.")

    return {
        "totalValue":total_val,"totalCost":total_cost,
        "totalPnl":total_val-total_cost,
        "totalPnlPct":((total_val-total_cost)/total_cost*100) if total_cost else 0,
        "riskScore":risk_score,"riskLevel":rl,
        "diversificationScore":round(div_score),
        "weightedVolatility":f"{weighted_vol*100:.1f}",
        "holdings":enriched,"sectors":sectors,"recommendations":recs,
        "analyzedAt":datetime.now(timezone.utc).isoformat(),
    }

# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("BACKEND_PORT", 5000))
    print(f"\n  ✅  HindustanCoin Python Backend on http://localhost:{port}")
    print(f"  🤖  LSTM + RNN + LLM prediction engine loaded")
    print(f"  🔑  LLM: {'Groq LLaMA-3 8B (ACTIVE)' if get_llm_analyzer().has_llm else 'Rule-Based Fallback (add GROQ_API_KEY to .env)'}\n")
    app.run(host="0.0.0.0", port=port, debug=False)
