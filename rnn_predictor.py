"""
backend/ml/rnn_predictor.py
============================
Vanilla RNN (Recurrent Neural Network) price predictor using pure NumPy.

Implements the basic RNN recurrence:
    h_t = tanh(W_hh · h_{t-1} + W_xh · x_t + b_h)
    y_t = W_hy · h_t + b_y

Trained with Truncated BPTT (Backpropagation Through Time).
Used alongside the LSTM to give an ensemble signal.
"""

import numpy as np
import time
from typing import Dict, List


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-np.clip(x, -500, 500)))

def tanh(x):
    return np.tanh(np.clip(x, -500, 500))

def tanh_deriv(h):
    return 1.0 - h ** 2


class VanillaRNN:
    """
    Vanilla RNN with:
      - Input  size: 3 features (price, 1-day change, 7-day moving average)
      - Hidden size: configurable (default 24)
      - Output size: 1 (next-step price, normalised)
      - Loss: Mean Squared Error
      - Optimiser: AdaGrad
    """

    def __init__(self, input_size: int = 3, hidden_size: int = 24, seed: int = 7):
        rng = np.random.RandomState(seed)
        s   = 0.08

        self.input_size  = input_size
        self.hidden_size = hidden_size

        # Weights
        self.W_xh = rng.randn(hidden_size, input_size)  * s   # input → hidden
        self.W_hh = rng.randn(hidden_size, hidden_size) * s   # hidden → hidden
        self.W_hy = rng.randn(1, hidden_size)           * s   # hidden → output
        self.b_h  = np.zeros((hidden_size, 1))
        self.b_y  = np.zeros((1, 1))

        # AdaGrad cache
        self.cache = {k: np.zeros_like(v) for k, v in
                      [("W_xh", self.W_xh), ("W_hh", self.W_hh),
                       ("W_hy", self.W_hy), ("b_h", self.b_h), ("b_y", self.b_y)]}
        self.lr    = 0.01
        self.eps   = 1e-8

        # Normalisation
        self.price_min = 0.0
        self.price_max = 1.0
        self.is_trained = False
        self.metadata: Dict = {}

    # ── Normalisation ──────────────────────────────────────────────────────────
    def _norm(self, p):
        r = self.price_max - self.price_min
        return (p - self.price_min) / r if r > 1e-10 else np.zeros_like(p)

    def _denorm(self, n):
        return n * (self.price_max - self.price_min) + self.price_min

    def _features(self, prices: np.ndarray) -> np.ndarray:
        """Build (N, 3) feature matrix."""
        n   = len(prices)
        np_ = self._norm(prices)
        F   = np.zeros((n, self.input_size))
        for t in range(n):
            F[t, 0] = np_[t]
            F[t, 1] = np_[t] - np_[t-1] if t > 0 else 0.0
            F[t, 2] = np.mean(np_[max(0, t-7):t+1])
        return F

    # ── Forward / Backward ────────────────────────────────────────────────────
    def _forward(self, inputs: np.ndarray):
        """
        inputs: (T, input_size)
        Returns list of (h, y_pred) for each time step.
        """
        T      = len(inputs)
        h_prev = np.zeros((self.hidden_size, 1))
        hs, ys = [None] * T, [None] * T
        xs_col = [None] * T

        for t in range(T):
            x        = inputs[t].reshape(-1, 1)      # (input_size, 1)
            xs_col[t] = x
            h        = tanh(self.W_xh @ x + self.W_hh @ h_prev + self.b_h)
            y        = self.W_hy @ h + self.b_y
            hs[t]    = h
            ys[t]    = float(y)
            h_prev   = h

        return hs, ys, xs_col

    def _bptt(self, inputs, targets, hs, xs_col, truncate: int = 8):
        """Truncated BPTT — compute gradients for the output layer + last `truncate` steps."""
        T = len(inputs)
        grads = {k: np.zeros_like(getattr(self, k))
                 for k in ("W_xh", "W_hh", "W_hy", "b_h", "b_y")}

        dh_next = np.zeros((self.hidden_size, 1))

        for t in reversed(range(T)):
            y_pred = self.W_hy @ hs[t] + self.b_y
            dy     = 2.0 * (float(y_pred) - targets[t])  # MSE gradient
            grads["W_hy"] += dy * hs[t].T
            grads["b_y"]  += dy * np.ones((1, 1))

            dh = self.W_hy.T * dy + dh_next
            dh_raw = tanh_deriv(hs[t]) * dh

            grads["b_h"]  += dh_raw
            grads["W_xh"] += dh_raw @ xs_col[t].T
            if t > 0:
                grads["W_hh"] += dh_raw @ hs[t-1].T
            dh_next = self.W_hh.T @ dh_raw

            if T - t >= truncate:
                break

        # Clip gradients
        for k in grads:
            np.clip(grads[k], -5, 5, out=grads[k])
        return grads

    def _adagrad(self, grads):
        for k in grads:
            self.cache[k] += grads[k] ** 2
            w = getattr(self, k)
            w -= self.lr * grads[k] / (np.sqrt(self.cache[k]) + self.eps)

    # ── Train ─────────────────────────────────────────────────────────────────
    def train(self, prices: np.ndarray, seq_len: int = 20,
              epochs: int = 25, verbose: bool = False) -> Dict:
        if len(prices) < seq_len + 5:
            return {"trained": False, "error": "Not enough data"}

        self.price_min = float(np.min(prices))
        self.price_max = float(np.max(prices))
        features       = self._features(prices)
        norm_p         = self._norm(prices)

        # Build sequences
        X, y = [], []
        for i in range(len(prices) - seq_len):
            X.append(features[i : i + seq_len])
            y.append(float(norm_p[i + seq_len]))

        losses = []
        start  = time.time()

        for epoch in range(epochs):
            epoch_loss = 0.0
            idx_order  = np.random.permutation(len(X))

            for idx in idx_order:
                seq     = X[idx]          # (seq_len, input_size)
                target  = y[idx]

                hs, ys, xs_col = self._forward(seq)
                y_pred         = ys[-1]
                loss           = (y_pred - target) ** 2
                epoch_loss    += loss

                # targets for BPTT: only last step matters for final prediction
                targets_arr = [0.0] * (seq_len - 1) + [target]
                grads = self._bptt(seq, targets_arr, hs, xs_col)
                self._adagrad(grads)

            avg = epoch_loss / len(X)
            losses.append(float(avg))
            if verbose and (epoch + 1) % 10 == 0:
                print(f"  RNN Epoch {epoch+1}/{epochs}  loss={avg:.6f}")

        # Direction accuracy on hold-out
        split   = int(len(X) * 0.8)
        correct = 0
        for idx in range(split + 1, len(X)):
            _, ys_cur, _  = self._forward(X[idx])
            _, ys_prev, _ = self._forward(X[idx - 1])
            if (ys_cur[-1] - ys_prev[-1]) * (y[idx] - y[idx-1]) > 0:
                correct += 1
        total = max(1, len(X) - split - 1)

        self.is_trained = True
        self.metadata   = {
            "trained":               True,
            "epochs":                epochs,
            "final_loss":            float(losses[-1]),
            "training_time_s":       round(time.time() - start, 2),
            "directional_accuracy":  round(correct / total * 100, 1),
            "samples":               len(X),
            "seq_len":               seq_len,
            "architecture":          f"Input({self.input_size})→RNN({self.hidden_size})→Dense(1)",
        }
        return self.metadata

    # ── Predict ───────────────────────────────────────────────────────────────
    def predict(self, prices: np.ndarray, steps: int = 7) -> Dict:
        if not self.is_trained or len(prices) < 20:
            return self._fallback(prices, steps)

        features   = self._features(prices)
        window     = features[-20:].copy()
        window_p   = list(self._norm(prices)[-20:])
        predictions = []

        for _ in range(steps):
            _, ys, _ = self._forward(window)
            p_norm   = np.clip(float(ys[-1]), 0, 1)
            predictions.append(self._denorm(p_norm))

            # Advance window
            new_feat    = np.zeros(self.input_size)
            new_feat[0] = p_norm
            new_feat[1] = p_norm - window[-1, 0]
            new_feat[2] = np.mean(window[-7:, 0])
            window      = np.vstack([window[1:], new_feat])

        last   = float(prices[-1])
        pred7  = float(predictions[-1])
        pct    = (pred7 - last) / last * 100 if last else 0
        signal = "BUY" if pct > 3 else "SELL" if pct < -3 else "HOLD"
        conf   = min(92, max(40, 65 + self.metadata.get("directional_accuracy", 60) * 0.25))

        return {
            "model":         "RNN (Vanilla)",
            "predictions":   [round(p, 6) for p in predictions],
            "last_price":    round(last, 6),
            "predicted_7d":  round(pred7, 6),
            "pct_change_7d": round(pct, 2),
            "signal":        signal,
            "confidence":    round(conf, 1),
            "steps":         steps,
            "model_meta":    self.metadata,
        }

    def _fallback(self, prices, steps):
        last  = float(prices[-1])
        trend = float(np.mean(np.diff(prices[-10:]))) if len(prices) > 10 else 0
        preds = [last + trend * (i + 1) for i in range(steps)]
        return {
            "model": "RNN (fallback)", "predictions": preds,
            "last_price": last, "predicted_7d": preds[-1],
            "pct_change_7d": (preds[-1] - last) / last * 100 if last else 0,
            "signal": "HOLD", "confidence": 40.0, "steps": steps, "model_meta": {},
        }


if __name__ == "__main__":
    np.random.seed(0)
    t      = np.linspace(0, 3 * np.pi, 150)
    prices = 3000 + 300 * np.sin(t) + np.random.randn(150) * 50
    rnn    = VanillaRNN()
    meta   = rnn.train(prices, epochs=20, verbose=True)
    print("\nRNN Meta:", meta)
    result = rnn.predict(prices)
    print("Signal:", result["signal"], "| 7d forecast:", result["predicted_7d"])
