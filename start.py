import subprocess
import sys
import os
import webbrowser
import time

def main():
    root = os.path.dirname(os.path.abspath(__file__))
    python_exe = os.path.join(root, "backend", "venv", "Scripts", "python.exe")
    if not os.path.exists(python_exe):
        python_exe = sys.executable

    env = os.environ.copy()
    env["PYTHONPATH"] = os.path.join(root, "backend")

    url = "http://127.0.0.1:8000"
    print("=" * 55)
    print("  College Venue Booking System")
    print(f"  Starting at: {url}")
    print("  Press Ctrl+C to stop.")
    print("=" * 55)

    # Automatically open browser after 1.5 seconds
    def open_browser():
        time.sleep(1.5)
        webbrowser.open(url)

    import threading
    threading.Thread(target=open_browser, daemon=True).start()

    cmd = [python_exe, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"]
    subprocess.run(cmd, env=env, cwd=root)

if __name__ == "__main__":
    main()
