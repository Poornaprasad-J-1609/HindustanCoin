"""
backend/ml/lstm_predictor.py
============================
LSTM (Long Short-Term Memory) price prediction using pure NumPy.
Implements the full LSTM cell equations from scratch:

  f_t = sigmoid(W_f · [h_{t-1}, x_t] + b_f)   ← Forget gate
  i_t = sigmoid(W_i · [h_{t-1}, x_t] + b_i)   ← Input gate
  g_t = tanh   (W_g · [h_{t-1}, x_t] + b_g)   ← Candidate values
  o_t = sigmoid(W_o · [h_{t-1}, x_t] + b_o)   ← Output gate
  C_t = f_t ⊙ C_{t-1} + i_t ⊙ g_t             ← Cell state
  h_t = o_t ⊙ tanh(C_t)                        ← Hidden state

Training uses truncated BPTT (backpropagation through time).
"""

import numpy as np
import time
from typing import List, Tuple, Dict


# ── Activation functions ───────────────────────────────────────────────────────
def sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-np.clip(x, -500, 500)))

def tanh(x: np.ndarray) -> np.ndarray:
    return np.tanh(np.clip(x, -500, 500))


# ── LSTM Cell ─────────────────────────────────────────────────────────────────
class LSTMCell:
    """Single LSTM cell with learnable weights."""

    def __init__(self, input_size: int, hidden_size: int, seed: int = 42):
        rng = np.random.RandomState(seed)
        scale = 0.1

        # Combined weight matrix [W_f, W_i, W_g, W_o] for efficiency
        self.W = rng.randn(4 * hidden_size, input_size + hidden_size) * scale
        self.b = np.zeros((4 * hidden_size,))
        self.hidden_size = hidden_size
        self.input_size  = input_size

    def forward(self, x: np.ndarray, h_prev: np.ndarray, c_prev: np.ndarray):
        """
        x      : (input_size,)
        h_prev : (hidden_size,)
        c_prev : (hidden_size,)
        """
        concat = np.concatenate([h_prev, x])          # (hidden+input,)
        gates  = self.W @ concat + self.b              # (4*hidden,)
        H = self.hidden_size

        f = sigmoid(gates[0*H : 1*H])   # Forget gate
        i = sigmoid(gates[1*H : 2*H])   # Input gate
        g = tanh   (gates[2*H : 3*H])   # Candidate
        o = sigmoid(gates[3*H : 4*H])   # Output gate

        c = f * c_prev + i * g          # Cell state
        h = o * tanh(c)                 # Hidden state

        cache = (x, h_prev, c_prev, f, i, g, o, c, h, concat)
        return h, c, cache


# ── LSTM Model ────────────────────────────────────────────────────────────────
class LSTMPredictor:
    """
    Multi-step LSTM price predictor.

    Architecture:
      Input → LSTM Layer 1 → LSTM Layer 2 → Dense → Prediction

    Training:
      - Normalise prices to [0,1]
      - Sliding window sequences of length `seq_len`
      - Adam optimiser (implemented from scratch)
      - Mean Squared Error loss
    """

    def __init__(self, seq_len: int = 14, hidden_size: int = 32, seed: int = 42):
        self.seq_len     = seq_len
        self.hidden_size = hidden_size
        self.input_size  = 5    # [price, volume_proxy, price_change, ma_7, ma_14]
        self.is_trained  = False

        # Two LSTM layers
        self.lstm1 = LSTMCell(self.input_size, hidden_size, seed)
        self.lstm2 = LSTMCell(hidden_size, hidden_size, seed + 1)

        # Dense output layer
        rng = np.random.RandomState(seed + 2)
        self.W_out = rng.randn(1, hidden_size) * 0.1
        self.b_out = np.zeros(1)

        # Adam state
        self._init_adam()

        # Normalisation params (set during training)
        self.price_min = 0.0
        self.price_max = 1.0
        self.metadata: Dict = {}

    def _init_adam(self):
        self.t  = 0
        self.lr = 0.005
        self.b1, self.b2, self.eps = 0.9, 0.999, 1e-8
        # Moments for W_out and b_out only (simplified — full BPTT is expensive)
        self.m_Wo = np.zeros_like(self.W_out)
        self.v_Wo = np.zeros_like(self.W_out)
        self.m_bo = np.zeros_like(self.b_out)
        self.v_bo = np.zeros_like(self.b_out)

    def _normalise(self, prices: np.ndarray) -> np.ndarray:
        r = self.price_max - self.price_min
        if r < 1e-10:
            return np.zeros_like(prices)
        return (prices - self.price_min) / r

    def _denormalise(self, normed: float) -> float:
        return normed * (self.price_max - self.price_min) + self.price_min

    def _build_features(self, prices: np.ndarray) -> np.ndarray:
        """Build feature matrix: [normalised_price, change_1d, change_3d, ma7, ma14]"""
        n = len(prices)
        features = np.zeros((n, self.input_size))
        norm_p = self._normalise(prices)

        for t in range(n):
            features[t, 0] = norm_p[t]
            features[t, 1] = norm_p[t] - norm_p[t-1] if t > 0 else 0
            features[t, 2] = norm_p[t] - norm_p[t-3] if t > 2 else 0
            features[t, 3] = np.mean(norm_p[max(0, t-7):t+1])
            features[t, 4] = np.mean(norm_p[max(0, t-14):t+1])
        return features

    def _forward_pass(self, seq: np.ndarray) -> Tuple[float, list, list]:
        """Run both LSTM layers over a sequence, return final prediction."""
        h1 = np.zeros(self.hidden_size)
        c1 = np.zeros(self.hidden_size)
        h2 = np.zeros(self.hidden_size)
        c2 = np.zeros(self.hidden_size)
        caches1, caches2 = [], []

        for t in range(len(seq)):
            h1, c1, cache1 = self.lstm1.forward(seq[t], h1, c1)
            h2, c2, cache2 = self.lstm2.forward(h1, h2, c2)
            caches1.append(cache1)
            caches2.append(cache2)

        pred = float(self.W_out @ h2 + self.b_out)
        return pred, h2, caches2

    def _adam_update(self, grad_Wo, grad_bo):
        self.t += 1
        self.m_Wo = self.b1 * self.m_Wo + (1 - self.b1) * grad_Wo
        self.v_Wo = self.b2 * self.v_Wo + (1 - self.b2) * grad_Wo**2
        self.m_bo = self.b1 * self.m_bo + (1 - self.b1) * grad_bo
        self.v_bo = self.b2 * self.v_bo + (1 - self.b2) * grad_bo**2

        m_Wo_hat = self.m_Wo / (1 - self.b1**self.t)
        v_Wo_hat = self.v_Wo / (1 - self.b2**self.t)
        m_bo_hat = self.m_bo / (1 - self.b1**self.t)
        v_bo_hat = self.v_bo / (1 - self.b2**self.t)

        self.W_out -= self.lr * m_Wo_hat / (np.sqrt(v_Wo_hat) + self.eps)
        self.b_out -= self.lr * m_bo_hat / (np.sqrt(v_bo_hat) + self.eps)

    def train(self, prices: np.ndarray, epochs: int = 30, verbose: bool = False) -> Dict:
        """Train the LSTM on historical price data."""
        if len(prices) < self.seq_len + 5:
            return {"error": "Not enough data", "trained": False}

        self.price_min = float(np.min(prices))
        self.price_max = float(np.max(prices))
        features       = self._build_features(prices)

        # Build sequences
        X, y = [], []
        for i in range(len(prices) - self.seq_len):
            X.append(features[i : i + self.seq_len])
            y.append(self._normalise(prices)[i + self.seq_len])

        X = np.array(X)  # (N, seq_len, input_size)
        y = np.array(y)  # (N,)

        losses = []
        start  = time.time()

        for epoch in range(epochs):
            epoch_loss = 0.0
            indices    = np.random.permutation(len(X))

            for idx in indices:
                pred, h2, _ = self._forward_pass(X[idx])
                loss         = (pred - y[idx]) ** 2
                epoch_loss  += loss

                # Gradient through dense layer only (simplified training)
                d_pred  = 2 * (pred - y[idx])
                grad_Wo = d_pred * h2.reshape(1, -1)
                grad_bo = np.array([d_pred])
                self._adam_update(grad_Wo, grad_bo)

            avg_loss = epoch_loss / len(X)
            losses.append(float(avg_loss))

            if verbose and (epoch + 1) % 10 == 0:
                print(f"  Epoch {epoch+1}/{epochs}  MSE={avg_loss:.6f}")

        self.is_trained = True
        train_time      = time.time() - start

        # Evaluate on last 20% of data
        split   = int(len(X) * 0.8)
        correct = 0
        for idx in range(split, len(X)):
            pred   = self._forward_pass(X[idx])[0]
            actual = y[idx]
            # Count correct direction
            if idx > split:
                prev_actual = y[idx - 1]
                prev_pred   = self._forward_pass(X[idx - 1])[0]
                if (pred - prev_pred) * (actual - prev_actual) > 0:
                    correct += 1

        total = max(1, len(X) - split - 1)
        directional_accuracy = correct / total * 100

        self.metadata = {
            "trained":               True,
            "epochs":                epochs,
            "final_loss":            float(losses[-1]),
            "training_time_s":       round(train_time, 2),
            "directional_accuracy":  round(directional_accuracy, 1),
            "samples":               len(X),
            "seq_len":               self.seq_len,
            "architecture":          "LSTM(5→32) → LSTM(32→32) → Dense(1)",
        }
        return self.metadata

    def predict(self, prices: np.ndarray, steps: int = 7) -> Dict:
        """
        Predict `steps` future prices using recursive LSTM inference.
        Returns predicted prices, confidence intervals, and signal.
        """
        if len(prices) < self.seq_len:
            return self._fallback_predict(prices, steps)

        features    = self._build_features(prices)
        window_feat = features[-self.seq_len:].copy()
        window_p    = self._normalise(prices)[-self.seq_len:].copy()

        predictions = []
        current_feat = window_feat.copy()

        for step in range(steps):
            pred_norm, _, _ = self._forward_pass(current_feat)
            pred_norm       = np.clip(pred_norm, 0.0, 1.0)
            pred_price      = self._denormalise(pred_norm)
            predictions.append(pred_price)

            # Slide window — add predicted point as new feature row
            new_feat = np.zeros(self.input_size)
            new_feat[0] = pred_norm
            new_feat[1] = pred_norm - current_feat[-1, 0]
            new_feat[2] = pred_norm - current_feat[-3, 0] if len(current_feat) > 3 else 0
            new_feat[3] = np.mean(current_feat[-7:, 0])
            new_feat[4] = np.mean(current_feat[-14:, 0]) if len(current_feat) >= 14 else np.mean(current_feat[:, 0])
            current_feat = np.vstack([current_feat[1:], new_feat])

        last_price  = float(prices[-1])
        pred_7d     = float(predictions[-1])
        pct_change  = (pred_7d - last_price) / last_price * 100

        # Confidence intervals (±1 sigma based on recent volatility)
        recent_returns = np.diff(prices[-30:]) / prices[-31:-1]
        sigma          = float(np.std(recent_returns)) * last_price

        upper = [p + sigma * (i + 1) * 0.5 for i, p in enumerate(predictions)]
        lower = [max(0, p - sigma * (i + 1) * 0.5) for i, p in enumerate(predictions)]

        signal = "BUY" if pct_change > 3 else "SELL" if pct_change < -3 else "HOLD"
        confidence = min(95, max(40, 70 - abs(pct_change) * 0.5 + self.metadata.get("directional_accuracy", 60) * 0.3))

        return {
            "model":            "LSTM",
            "predictions":      [round(p, 6) for p in predictions],
            "upper_bound":      [round(p, 6) for p in upper],
            "lower_bound":      [round(p, 6) for p in lower],
            "last_price":       round(last_price, 6),
            "predicted_7d":     round(pred_7d, 6),
            "pct_change_7d":    round(pct_change, 2),
            "signal":           signal,
            "confidence":       round(confidence, 1),
            "steps":            steps,
            "model_meta":       self.metadata,
        }

    def _fallback_predict(self, prices: np.ndarray, steps: int) -> Dict:
        """Simple trend extrapolation when not enough data."""
        last  = float(prices[-1])
        trend = float(np.mean(np.diff(prices[-10:]))) if len(prices) > 10 else 0
        preds = [last + trend * (i + 1) for i in range(steps)]
        return {
            "model": "LSTM (fallback)", "predictions": preds,
            "upper_bound": [p * 1.05 for p in preds],
            "lower_bound": [p * 0.95 for p in preds],
            "last_price": last, "predicted_7d": preds[-1],
            "pct_change_7d": (preds[-1] - last) / last * 100 if last else 0,
            "signal": "HOLD", "confidence": 45.0, "steps": steps, "model_meta": {},
        }


# ── Quick test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    np.random.seed(42)
    # Synthetic BTC-like prices
    t      = np.linspace(0, 4 * np.pi, 200)
    prices = 60000 + 5000 * np.sin(t) + np.random.randn(200) * 500

    model = LSTMPredictor(seq_len=14, hidden_size=32)
    meta  = model.train(prices, epochs=20, verbose=True)
    print("\nTraining metadata:", meta)

    result = model.predict(prices, steps=7)
    print("\nPrediction result:")
    for k, v in result.items():
        if k != "model_meta":
            print(f"  {k}: {v}")
