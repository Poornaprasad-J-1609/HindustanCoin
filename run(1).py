#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════╗
║         🪙  HindustanCoin — One-Click Launcher           ║
║   LSTM + RNN + LLM Crypto Analysis Dashboard             ║
╠══════════════════════════════════════════════════════════╣
║  HOW TO RUN:                                             ║
║    python run.py                                         ║
║                                                          ║
║  REQUIREMENTS:                                           ║
║    Python 3.8+  →  https://www.python.org/downloads/    ║
║    Node.js 18+  →  https://nodejs.org/                   ║
╚══════════════════════════════════════════════════════════╝

This script will:
  1. Check Python 3.8+ and Node.js 18+ are installed
  2. Install Python packages from backend/requirements.txt
  3. Install Node packages from frontend/package.json
  4. Start the Python Flask backend on  http://localhost:5000
  5. Start the Next.js frontend on       http://localhost:3000
  6. Open your browser at               http://localhost:3000
  7. Press Ctrl+C to stop both servers cleanly
"""

import os
import sys
import time
import shutil
import platform
import threading
import webbrowser
import subprocess

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT     = os.path.dirname(os.path.abspath(__file__))
BACKEND  = os.path.join(ROOT, "backend")
FRONTEND = os.path.join(ROOT, "frontend")
BACKEND_PORT  = 5000
FRONTEND_PORT = 3000
IS_WIN   = platform.system() == "Windows"

# ── Colours ───────────────────────────────────────────────────────────────────
if IS_WIN:
    G=Y=C=R=B=RST = ""
else:
    G   = "\033[92m"
    Y   = "\033[93m"
    C   = "\033[96m"
    R   = "\033[91m"
    B   = "\033[1m"
    RST = "\033[0m"

def banner():
    print(f"\n{C}{B}")
    print("  ╔══════════════════════════════════════════════════════╗")
    print("  ║       🪙  HindustanCoin Dashboard v2.0               ║")
    print("  ║   LSTM + RNN + LLM Crypto Analysis Platform          ║")
    print("  ╚══════════════════════════════════════════════════════╝")
    print(RST)

def ok(m):   print(f"  {G}✔{RST}  {m}")
def info(m): print(f"  {C}ℹ{RST}  {m}")
def warn(m): print(f"  {Y}⚠{RST}  {m}")
def err(m):  print(f"  {R}✖{RST}  {m}")
def step(m): print(f"\n  {B}{Y}▶ {m}{RST}")

# ── Checks ────────────────────────────────────────────────────────────────────
def check_python():
    step("Checking Python version...")
    v = sys.version_info
    if v.major < 3 or (v.major == 3 and v.minor < 8):
        err(f"Python 3.8+ required. You have {v.major}.{v.minor}")
        err("Download from: https://www.python.org/downloads/")
        sys.exit(1)
    ok(f"Python {v.major}.{v.minor}.{v.micro}")

def check_node():
    step("Checking Node.js version...")
    node = shutil.which("node") or shutil.which("node.exe")
    if not node:
        err("Node.js not found!")
        err("Install Node.js 18+ from: https://nodejs.org/")
        sys.exit(1)
    try:
        res = subprocess.run(["node", "--version"], capture_output=True, text=True, timeout=10)
        ver = res.stdout.strip()
        maj = int(ver.lstrip("v").split(".")[0])
        if maj < 18:
            err(f"Node.js 18+ required. You have {ver}")
            err("Download from: https://nodejs.org/")
            sys.exit(1)
        ok(f"Node.js {ver}")
    except Exception as e:
        err(f"Node.js check failed: {e}")
        sys.exit(1)

def detect_pkg():
    if shutil.which("pnpm") or shutil.which("pnpm.cmd"):
        return "pnpm"
    if shutil.which("npm") or shutil.which("npm.cmd"):
        return "npm"
    err("No npm or pnpm found. Install Node.js from https://nodejs.org/")
    sys.exit(1)

# ── Installs ──────────────────────────────────────────────────────────────────
def install_python_deps():
    step("Installing Python backend dependencies...")
    req = os.path.join(BACKEND, "requirements.txt")
    cmds = [
        [sys.executable, "-m", "pip", "install", "-r", req, "-q"],
        [sys.executable, "-m", "pip", "install", "-r", req, "-q", "--break-system-packages"],
        [sys.executable, "-m", "pip", "install", "-r", req, "-q", "--user"],
    ]
    for cmd in cmds:
        try:
            subprocess.run(cmd, check=True, timeout=120)
            ok("Python dependencies installed")
            return
        except subprocess.CalledProcessError:
            continue
    err("pip install failed. Try manually: pip install flask flask-cors requests python-dotenv numpy")
    sys.exit(1)

def install_node_deps(pkg: str):
    step("Installing Node.js frontend dependencies...")
    nm = os.path.join(FRONTEND, "node_modules")
    if os.path.isdir(nm):
        ok("Node.js dependencies already installed")
        return
    try:
        subprocess.run([pkg, "install"], cwd=FRONTEND, check=True, timeout=300)
        ok("Node.js dependencies installed")
    except subprocess.CalledProcessError as e:
        err(f"Node install failed: {e}")
        sys.exit(1)

# ── Subprocess runners ────────────────────────────────────────────────────────
def _stream(proc, prefix, color):
    try:
        for line in iter(proc.stdout.readline, b""):
            txt = line.decode("utf-8", errors="replace").rstrip()
            if txt:
                print(f"  {color}[{prefix}]{RST} {txt}", flush=True)
    except Exception:
        pass
    proc.wait()

def start_backend():
    info(f"Starting Python Flask backend  (port {BACKEND_PORT})...")
    env = {**os.environ, "BACKEND_PORT": str(BACKEND_PORT)}
    proc = subprocess.Popen(
        [sys.executable, "app.py"],
        cwd=BACKEND, env=env,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
    )
    threading.Thread(target=_stream, args=(proc, "BACKEND", C), daemon=True).start()
    return proc

def start_frontend(pkg: str):
    info(f"Starting Next.js frontend      (port {FRONTEND_PORT})...")
    env = {**os.environ, "PORT": str(FRONTEND_PORT)}

    # Build command for npm vs pnpm
    if pkg == "npm":
        cmd = ["npm", "run", "dev", "--", "--port", str(FRONTEND_PORT)]
    else:
        cmd = ["pnpm", "dev", "--port", str(FRONTEND_PORT)]

    if IS_WIN:
        cmd[0] += ".cmd" if not cmd[0].endswith(".cmd") else ""

    proc = subprocess.Popen(
        cmd, cwd=FRONTEND, env=env,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        shell=IS_WIN,
    )
    threading.Thread(target=_stream, args=(proc, "FRONTEND", G), daemon=True).start()
    return proc

def open_browser():
    url = f"http://localhost:{FRONTEND_PORT}"
    time.sleep(10)   # Give Next.js compile time
    info(f"Opening browser at {url}")
    try:
        webbrowser.open(url)
    except Exception:
        pass

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    banner()

    # Pre-flight
    check_python()
    check_node()
    pkg = detect_pkg()
    ok(f"Package manager: {pkg}")

    # Dependencies
    install_python_deps()
    install_node_deps(pkg)

    # Start servers
    print(f"\n  {B}Starting servers...{RST}")
    backend_proc  = start_backend()
    time.sleep(2)
    frontend_proc = start_frontend(pkg)

    # Open browser in background
    threading.Thread(target=open_browser, daemon=True).start()

    # Print URLs
    print(f"\n  {G}{B}{'═'*52}{RST}")
    print(f"  {G}{B}  🚀  HindustanCoin is LIVE!{RST}")
    print(f"  {G}{B}{'═'*52}{RST}")
    print(f"\n  {G}Frontend :{RST}  http://localhost:{FRONTEND_PORT}")
    print(f"  {C}Backend  :{RST}  http://localhost:{BACKEND_PORT}/api/health")
    print(f"\n  {Y}ML Models: LSTM + Vanilla RNN + LLM (Groq/Rule-Based){RST}")
    print(f"  {Y}Press Ctrl+C to stop both servers{RST}\n")

    # Keep alive + auto-restart
    try:
        while True:
            if backend_proc.poll() is not None:
                warn("Backend stopped — restarting...")
                backend_proc = start_backend()
            if frontend_proc.poll() is not None:
                warn("Frontend stopped — restarting...")
                frontend_proc = start_frontend(pkg)
            time.sleep(3)
    except KeyboardInterrupt:
        print(f"\n\n  {Y}Shutting down...{RST}")
        try: backend_proc.terminate()
        except: pass
        try: frontend_proc.terminate()
        except: pass
        print(f"  {G}✔  Stopped. Goodbye!{RST}\n")
        sys.exit(0)

if __name__ == "__main__":
    main()
