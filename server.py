#!/usr/bin/env python3
"""
Nammooru — Local Development Server with Gemini Vision API Proxy
================================================================
Serves static files for the Nammooru website AND provides a secure
/api/identify endpoint that calls Google Gemini Vision API without
exposing the API key in frontend JavaScript.

Usage:
  python server.py

Config:
  Create api-config.json in this directory with:
  { "geminiApiKey": "YOUR_KEY_HERE" }

Port: 8000
"""

import http.server
import json
import os
import sys
import base64
import urllib.request
import urllib.error
import urllib.parse
import re
from pathlib import Path

PORT = 8000
BASE_DIR = Path(__file__).resolve().parent
CONFIG_FILE = BASE_DIR / "api-config.json"

GEMINI_MODEL = "gemini-3.8-flash"
GEMINI_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)

MIME_MAP = {
    ".html": "text/html; charset=utf-8",
    ".css":  "text/css; charset=utf-8",
    ".js":   "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png":  "image/png",
    ".webp": "image/webp",
    ".svg":  "image/svg+xml",
    ".ico":  "image/x-icon",
    ".woff2":"font/woff2",
    ".woff": "font/woff",
    ".gif":  "image/gif",
    ".mp3":  "audio/mpeg",
}

TTS_CACHE = {}

GEMINI_PROMPT = """You are a Kannada language learning assistant helping newcomers settle into Bengaluru (Bangalore), India.

Look at this image and identify the main everyday object shown.

Return ONLY valid JSON -- no markdown, no code fences, no explanation text, nothing else.

If you can identify the object clearly, return this exact structure:
{
  "english": "Object Name (capitalize first letter, keep it short -- 1-3 words)",
  "kannada": "ವಸ್ತುವಿನ ಹೆಸರು",
  "pronunciation": "phonetic reading for English speakers (e.g. 'kup-pay')",
  "description": "One friendly sentence about this object relevant to life in Bengaluru.",
  "confidence": "high"
}

Use "medium" confidence if you can identify the object but are not fully certain.
Use "low" confidence if you can see something but it is ambiguous.

Special cases -- return these exact error objects:
- If the image mainly shows a human face or body: {"error":"person","message":"This looks like a photo of a person. Try pointing your camera at an everyday object around you -- like a cup, a book, or a bus sign."}
- If the image is too blurry, dark, or has no identifiable object: {"error":"unclear","message":"The image is too unclear to identify. Try taking the photo in better lighting and hold the camera steady."}
- If the image shows text/writing only with no object: {"error":"text_only","message":"Only text was detected. Try photographing the object that carries the text, or photograph a different everyday item."}

CRITICAL RULES:
1. The "kannada" field MUST be authentic Kannada script (Unicode), not transliteration.
2. The "pronunciation" field must use simple Latin letters readable by English speakers.
3. Never invent or guess Kannada if you are not confident -- use the error format instead.
4. Return NOTHING except the JSON object."""


def load_api_config():
    if not CONFIG_FILE.exists():
        return {}
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        print(f"[Config] Warning: Could not read api-config.json -- {e}")
        return {}


GEMINI_MODELS = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"]

def call_gemini(image_base64, mime_type, api_key):
    payload = {
        "contents": [{
            "parts": [
                {
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": image_base64
                    }
                },
                {"text": GEMINI_PROMPT}
            ]
        }],
        "generationConfig": {
            "temperature": 0.05,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json"
        }
    }
    body = json.dumps(payload).encode("utf-8")

    last_error = None
    for model_name in GEMINI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8")
                gemini_resp = json.loads(raw)
                text = gemini_resp["candidates"][0]["content"]["parts"][0]["text"]
                text = text.strip()
                # Strip markdown code blocks e.g. ```json ... ```
                text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
                text = re.sub(r"\s*```$", "", text)
                text = text.strip()

                try:
                    return json.loads(text)
                except json.JSONDecodeError:
                    match = re.search(r'\{[\s\S]*\}', text)
                    if match:
                        try:
                            return json.loads(match.group(0))
                        except json.JSONDecodeError:
                            pass
                    raise RuntimeError(f"Could not parse Gemini output as JSON: {text[:200]}")
        except urllib.error.HTTPError as e:
            err_text = e.read().decode("utf-8", errors="replace")
            last_error = f"HTTP {e.code}: {err_text[:200]}"
            print(f"  [Model {model_name} failed with {last_error}, trying next model...]")
            continue
        except urllib.error.URLError as e:
            last_error = f"Network error: {e.reason}"
            print(f"  [Model {model_name} network error: {e.reason}, trying next...]")
            continue
        except Exception as e:
            last_error = str(e)
            print(f"  [Model {model_name} error: {e}, trying next...]")
            continue

    raise RuntimeError(f"All AI vision models were unreachable. Last error: {last_error}")


class NammooruHandler(http.server.BaseHTTPRequestHandler):
    api_config = {}

    def log_message(self, format, *args):
        status = args[1] if len(args) > 1 else "?"
        print(f"  [{self.command:4}] {self.path:<40} {status}")

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/config-status":
            self.api_config = load_api_config()
            self.send_json({"configured": bool(self.api_config.get("geminiApiKey", "").strip())})
            return

        if path == "/api/tts":
            self.handle_tts(parsed)
            return

        if path == "/" or path == "":
            path = "/index.html"

        try:
            requested = (BASE_DIR / path.lstrip("/")).resolve()
            if not str(requested).startswith(str(BASE_DIR)):
                self.send_response(403)
                self.end_headers()
                return
        except Exception:
            self.send_response(400)
            self.end_headers()
            return

        if not requested.is_file():
            self.send_response(404)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"404 Not Found")
            return

        ext = requested.suffix.lower()
        mime = MIME_MAP.get(ext, "application/octet-stream")
        data = requested.read_bytes()

        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def handle_tts(self, parsed):
        qs = urllib.parse.parse_qs(parsed.query)
        text = qs.get("text", [""])[0].strip()
        if not text:
            self.send_json({"error": "missing_text", "message": "Text query parameter is required."}, 400)
            return

        cache_key = text[:200]
        if cache_key in TTS_CACHE:
            audio_bytes = TTS_CACHE[cache_key]
        else:
            try:
                encoded = urllib.parse.quote(text[:250])
                url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={encoded}&tl=kn&client=tw-ob"
                req = urllib.request.Request(
                    url,
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    audio_bytes = resp.read()
                    if len(TTS_CACHE) < 300:
                        TTS_CACHE[cache_key] = audio_bytes
            except Exception as e:
                print(f"  [TTS Error] {e}")
                self.send_json({"error": "tts_unavailable", "message": "Kannada speech generation is temporarily unavailable."}, 502)
                return

        self.send_response(200)
        self.send_header("Content-Type", "audio/mpeg")
        self.send_header("Content-Length", str(len(audio_bytes)))
        self.send_header("Cache-Control", "public, max-age=86400")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(audio_bytes)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/identify":
            self.handle_identify()
        else:
            self.send_response(404)
            self.end_headers()

    def handle_identify(self):
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length > 20 * 1024 * 1024:
            self.send_json({"error": "too_large", "message": "Image payload too large."}, 413)
            return

        try:
            body = json.loads(self.rfile.read(content_length).decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json({"error": "bad_request", "message": "Invalid JSON body."}, 400)
            return

        self.api_config = load_api_config()
        api_key = self.api_config.get("geminiApiKey", "").strip()
        if not api_key:
            self.send_json({
                "error": "no_api_key",
                "message": "API key not configured."
            })
            return

        image_b64 = body.get("imageBase64", "")
        mime_type = body.get("mimeType", "image/jpeg")

        if not image_b64:
            self.send_json({"error": "bad_request", "message": "Missing imageBase64 field."}, 400)
            return

        allowed_mimes = {"image/jpeg", "image/png", "image/webp", "image/gif"}
        if mime_type not in allowed_mimes:
            mime_type = "image/jpeg"

        try:
            result = call_gemini(image_b64, mime_type, api_key)
            self.send_json(result)
        except RuntimeError as e:
            print(f"  [API Error] {e}")
            self.send_json({"error": "api_error", "message": str(e)})
        except Exception as e:
            print(f"  [Unexpected Error] {e}")
            self.send_json({"error": "server_error", "message": "An unexpected error occurred. Please try again."})


def main():
    config = load_api_config()
    NammooruHandler.api_config = config

    try:
        http.server.HTTPServer.allow_reuse_address = True
        server = http.server.HTTPServer(("", PORT), NammooruHandler)
    except OSError as e:
        if e.errno == 10048 or "address already in use" in str(e).lower():
            print(f"\n  ERROR: Port {PORT} is already in use.")
            print(f"  Please close the other application using port {PORT} and try again.\n")
        else:
            print(f"\n  ERROR starting server: {e}\n")
        sys.exit(1)

    print()
    print("  Nammooru - Local Development Server")
    print("  =====================================")
    print(f"  Running at:  http://localhost:{PORT}/")
    print(f"  Files from:  {BASE_DIR}")

    if config.get("geminiApiKey"):
        k = config["geminiApiKey"]
        preview = k[:8] + "..." + k[-4:] if len(k) > 12 else "***"
        print(f"  Gemini API:  Configured ({preview})")
    else:
        print("  Gemini API:  NOT configured (create api-config.json)")

    print()
    print("  Press Ctrl+C to stop.")
    print()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.\n")
        server.server_close()
        sys.exit(0)


if __name__ == "__main__":
    main()
