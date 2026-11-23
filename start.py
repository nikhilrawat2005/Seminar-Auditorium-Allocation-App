import subprocess
import sys
import os
import webbrowser
import time
import socket

def free_port(port=8000):
    """Automatically kill any process occupying the port on Windows/Linux."""
    try:
        if sys.platform == "win32":
            output = subprocess.check_output(f"netstat -ano | findstr :{port}", shell=True, text=True)
            for line in output.strip().splitlines():
                parts = line.split()
                if len(parts) >= 5 and f":{port}" in parts[1]:
                    pid = parts[-1]
                    if pid != "0" and int(pid) != os.getpid():
                        print(f"[INFO] Freeing occupied port {port} (PID: {pid})...")
                        subprocess.run(f"taskkill /F /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        time.sleep(0.5)
    except Exception:
        pass

def main():
    root = os.path.dirname(os.path.abspath(__file__))
    port = 8000
    free_port(port)

    python_exe = os.path.join(root, "backend", "venv", "Scripts", "python.exe")
    if not os.path.exists(python_exe):
        python_exe = sys.executable

    env = os.environ.copy()
    env["PYTHONPATH"] = os.path.join(root, "backend")

    url = f"http://127.0.0.1:{port}"
    print("=" * 55)
    print("  College Venue Booking System")
    print(f"  Live at: {url}")
    print("  Press Ctrl+C to stop.")
    print("=" * 55)

    def open_browser():
        time.sleep(1.2)
        webbrowser.open(url)

    import threading
    threading.Thread(target=open_browser, daemon=True).start()

    cmd = [python_exe, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(port)]
    subprocess.run(cmd, env=env, cwd=root)

if __name__ == "__main__":
    main()
