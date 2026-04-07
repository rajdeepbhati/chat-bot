import json
import subprocess
import sys
import time
import urllib.request
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]


def wait_for_docs() -> None:
    last_error = "unknown error"
    for _ in range(20):
        try:
            with urllib.request.urlopen("http://127.0.0.1:8000/docs", timeout=1) as response:
                if response.status == 200:
                    print("DOCS 200 OK")
                    return
        except Exception as exc:  # pragma: no cover - helper script
            last_error = str(exc)
            time.sleep(0.5)
    raise RuntimeError(f"Backend did not start in time: {last_error}")


def login_check() -> None:
    request = urllib.request.Request(
        "http://127.0.0.1:8000/auth/login",
        data=json.dumps(
            {"email": "admin@eduflow.ai", "password": "Admin@123"}
        ).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=5) as response:
        body = response.read().decode("utf-8")
        print(f"LOGIN {response.status} {body}")


def main() -> None:
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=str(BACKEND_DIR),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        wait_for_docs()
        login_check()
    finally:
        process.terminate()
        process.wait(timeout=5)


if __name__ == "__main__":
    main()
