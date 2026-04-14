"""
backend/ml/llm_analyzer.py
============================
LLM (Large Language Model) powered crypto analysis.

Uses Groq API (free tier, very fast) to generate:
  - Natural-language price prediction commentary
  - Sentiment interpretation
  - Investment risk summary
  - Authenticity verdict explanation

Falls back gracefully to a rule-based analysis engine if no API key is set,
so the feature always works even without a Groq key.

Get a FREE Groq API key at: https://console.groq.com/
Set:  GROQ_API_KEY=your_key  in the .env file
"""

import os
import json
import time
import requests
import numpy as np
from typing import Dict, Optional

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama3-8b-8192"   # Free, fast, 8B param model


class LLMAnalyzer:
    """
    Wrapper around Groq's LLM API (llama3-8b) for financial commentary.
    Falls back to a deterministic rule-based commentary generator
    if no API key is configured.
    """

    def __init__(self):
        self.api_key  = os.getenv("GROQ_API_KEY", "")
        self.has_llm  = bool(self.api_key)
        self._cache: Dict[str, Dict] = {}
        self._cache_ttl = 300   # 5 minutes

    def _call_groq(self, prompt: str, max_tokens: int = 300) -> Optional[str]:
        """Call Groq API and return the assistant response text."""
        if not self.has_llm:
            return None
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type":  "application/json",
            }
            payload = {
                "model":      GROQ_MODEL,
                "messages":   [
                    {"role": "system", "content":
                     "You are a concise cryptocurrency analyst. Respond in 3–5 sentences max. "
                     "Be factual, mention specific numbers, avoid hype or fear."},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens":   max_tokens,
                "temperature":  0.4,
            }
            r = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=15)
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[LLM] Groq API error: {e}")
            return None

    # ── Price Prediction Commentary ───────────────────────────────────────────
    def generate_price_commentary(
        self,
        coin_name:     str,
        coin_id:       str,
        current_price: float,
        lstm_result:   Dict,
        rnn_result:    Dict,
        price_change:  float,
    ) -> Dict:
        cache_key = f"price_{coin_id}_{round(current_price, -2)}"
        if cache_key in self._cache:
            entry = self._cache[cache_key]
            if time.time() - entry["ts"] < self._cache_ttl:
                return entry["data"]

        lstm_pct  = lstm_result.get("pct_change_7d", 0)
        rnn_pct   = rnn_result.get("pct_change_7d", 0)
        ensemble  = (lstm_pct + rnn_pct) / 2
        ensemble_signal = "BUY" if ensemble > 3 else "SELL" if ensemble < -3 else "HOLD"

        if self.has_llm:
            prompt = (
                f"{coin_name} is currently priced at ${current_price:,.4f} "
                f"with a 24h change of {price_change:+.2f}%. "
                f"Our LSTM model predicts a {lstm_pct:+.2f}% change over 7 days "
                f"(signal: {lstm_result.get('signal')}). "
                f"Our RNN model predicts {rnn_pct:+.2f}% (signal: {rnn_result.get('signal')}). "
                f"The ensemble signal is {ensemble_signal}. "
                f"Provide a brief, balanced market commentary for a retail investor."
            )
            llm_text = self._call_groq(prompt)
        else:
            llm_text = None

        if not llm_text:
            llm_text = self._rule_based_commentary(
                coin_name, current_price, lstm_pct, rnn_pct, ensemble, price_change
            )

        result = {
            "commentary":       llm_text,
            "ensemble_signal":  ensemble_signal,
            "ensemble_pct":     round(ensemble, 2),
            "lstm_signal":      lstm_result.get("signal", "HOLD"),
            "rnn_signal":       rnn_result.get("signal", "HOLD"),
            "lstm_confidence":  lstm_result.get("confidence", 50),
            "rnn_confidence":   rnn_result.get("confidence", 50),
            "source":           "Groq LLaMA-3 8B" if self.has_llm else "Rule-Based Analysis Engine",
        }
        self._cache[cache_key] = {"data": result, "ts": time.time()}
        return result

    # ── Sentiment Commentary ──────────────────────────────────────────────────
    def generate_sentiment_commentary(
        self,
        coin_name: str,
        coin_id:   str,
        sentiment: Dict,
    ) -> str:
        cache_key = f"sent_{coin_id}_{sentiment.get('score', 0)}"
        if cache_key in self._cache:
            entry = self._cache[cache_key]
            if time.time() - entry["ts"] < self._cache_ttl:
                return entry["data"]

        score    = sentiment.get("score", 0)
        positive = sentiment.get("positive", 50)
        negative = sentiment.get("negative", 30)

        if self.has_llm:
            prompt = (
                f"{coin_name} has a social sentiment score of {score} "
                f"({positive}% positive, {negative}% negative). "
                f"Write a 2-sentence investor-friendly interpretation of what this sentiment means "
                f"for near-term price action."
            )
            result = self._call_groq(prompt, max_tokens=150)
        else:
            result = None

        if not result:
            if score > 20:
                result = (f"Market sentiment for {coin_name} is predominantly bullish at {positive}% positive. "
                          f"Strong community optimism often precedes upward price momentum, though investors should remain cautious of crowd euphoria.")
            elif score < -20:
                result = (f"Social sentiment for {coin_name} skews bearish with {negative}% negative signals. "
                          f"Widespread pessimism can create oversold conditions — contrarian investors may see opportunity, but confirm with on-chain data first.")
            else:
                result = (f"{coin_name} shows mixed sentiment at {positive}% positive and {negative}% negative. "
                          f"Neutral sentiment often indicates consolidation — wait for a clear directional catalyst before taking a position.")

        self._cache[cache_key] = {"data": result, "ts": time.time()}
        return result

    # ── Authenticity Commentary ───────────────────────────────────────────────
    def generate_authenticity_commentary(
        self,
        coin_name: str,
        score:     int,
        verdict:   str,
        checks:    list,
    ) -> str:
        failed = [c["name"] for c in checks if not c["passed"]]
        passed = [c["name"] for c in checks if c["passed"]]

        if self.has_llm:
            prompt = (
                f"{coin_name} received an authenticity score of {score}/100 ({verdict}). "
                f"Passed checks: {', '.join(passed) if passed else 'none'}. "
                f"Failed checks: {', '.join(failed) if failed else 'none'}. "
                f"Summarise the investment risk for a first-time investor in 3 sentences."
            )
            result = self._call_groq(prompt, max_tokens=180)
        else:
            result = None

        if not result:
            if score >= 80:
                result = (f"{coin_name} passes {len(passed)} out of {len(checks)} authenticity checks with a score of {score}/100, "
                          f"indicating a well-established asset with strong market presence and active development. "
                          f"While no cryptocurrency is risk-free, {coin_name} shows the characteristics of a legitimate, investable asset.")
            elif score >= 60:
                result = (f"{coin_name} scored {score}/100 with {len(failed)} concern(s): {', '.join(failed[:2]) if failed else 'minor issues'}. "
                          f"The coin shows some legitimate characteristics but has areas that warrant further due diligence before investing. "
                          f"Proceed cautiously and limit position size.")
            else:
                result = (f"{coin_name} scored only {score}/100 with significant red flags: {', '.join(failed[:3]) if failed else 'multiple failures'}. "
                          f"This coin exhibits characteristics commonly associated with low-quality or potentially fraudulent projects. "
                          f"Extreme caution is advised — consider avoiding until more credible data is available.")

        return result

    # ── Risk Summary ──────────────────────────────────────────────────────────
    def generate_portfolio_risk_summary(
        self,
        risk_score:    int,
        risk_level:    str,
        div_score:     int,
        recommendations: list,
    ) -> str:
        if self.has_llm:
            prompt = (
                f"Portfolio risk score: {risk_score}/100 ({risk_level}). "
                f"Diversification score: {div_score}/100. "
                f"Top issues: {'; '.join(recommendations[:2])}. "
                f"Write a 3-sentence portfolio risk assessment for a beginner crypto investor."
            )
            result = self._call_groq(prompt, max_tokens=200)
        else:
            result = None

        if not result:
            if risk_score < 35:
                result = (f"Your portfolio carries a conservative risk profile ({risk_score}/100) with a diversification score of {div_score}/100. "
                          f"This suggests a well-balanced approach with exposure across different market segments. "
                          f"Continue monitoring and consider rebalancing quarterly to maintain this healthy profile.")
            elif risk_score < 65:
                result = (f"Your portfolio shows a moderate-to-aggressive risk profile ({risk_score}/100). "
                          f"The diversification score of {div_score}/100 indicates room for improvement. "
                          f"Consider addressing: {recommendations[0] if recommendations else 'concentration risk'}.")
            else:
                result = (f"Your portfolio carries very high risk ({risk_score}/100) with a diversification score of only {div_score}/100. "
                          f"Concentration in volatile assets significantly increases drawdown risk. "
                          f"Priority action: {recommendations[0] if recommendations else 'diversify across asset classes'}.")

        return result

    # ── Rule-based commentary fallback ────────────────────────────────────────
    def _rule_based_commentary(
        self, name, price, lstm_pct, rnn_pct, ensemble, change_24h
    ) -> str:
        direction = "upward" if ensemble > 0 else "downward"
        magnitude = "significantly" if abs(ensemble) > 8 else "moderately" if abs(ensemble) > 3 else "slightly"
        consensus = "both models agree" if (lstm_pct > 0) == (rnn_pct > 0) else "models diverge"

        return (
            f"{name} is currently trading at ${price:,.4f} with a 24-hour change of {change_24h:+.2f}%. "
            f"Our LSTM and RNN ensemble models project a {magnitude} {direction} trend over the next 7 days, "
            f"with a combined forecast of {ensemble:+.2f}% ({consensus}). "
            f"LSTM confidence: {abs(lstm_pct):.1f}% directional move; RNN confidence: {abs(rnn_pct):.1f}% move. "
            f"Always combine these quantitative signals with your own fundamental analysis before investing."
        )


# ── Singleton ─────────────────────────────────────────────────────────────────
_analyzer: Optional[LLMAnalyzer] = None

def get_llm_analyzer() -> LLMAnalyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = LLMAnalyzer()
    return _analyzer


if __name__ == "__main__":
    llm = LLMAnalyzer()
    print("LLM mode:", "Groq API" if llm.has_llm else "Rule-Based Fallback")
    commentary = llm._rule_based_commentary("Bitcoin", 63852, 4.2, 3.1, 3.65, 1.25)
    print("\nCommentary:\n", commentary)
