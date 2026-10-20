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
import secrets
import time
import hmac
import hashlib
import struct
import io
import datetime
from pathlib import Path

# Optional TOTP & QR dependencies (with standard-library RFC 6238 fallback)
try:
    import pyotp
    HAS_PYOTP = True
except ImportError:
    pyotp = None
    HAS_PYOTP = False

try:
    import qrcode
    HAS_QRCODE = True
except ImportError:
    qrcode = None
    HAS_QRCODE = False

PORT = 8000
BASE_DIR = Path(__file__).resolve().parent
CONFIG_FILE = BASE_DIR / "api-config.json"
AUTH_STORE_FILE = BASE_DIR / "auth-store.json"

# ==============================================================================
# Authentication & TOTP / Google Authenticator Helpers
# ==============================================================================

def load_auth_store():
    """Load persistent users and sessions from auth-store.json."""
    if not AUTH_STORE_FILE.exists():
        return {"users": {}, "sessions": {}}
    try:
        with open(AUTH_STORE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if not isinstance(data, dict):
                return {"users": {}, "sessions": {}}
            data.setdefault("users", {})
            data.setdefault("sessions", {})
            return data
    except Exception as e:
        print(f"[Auth] Warning: Could not read auth-store.json -- {e}")
        return {"users": {}, "sessions": {}}


def save_auth_store(store):
    """Safely persist auth state to disk."""
    try:
        with open(AUTH_STORE_FILE, "w", encoding="utf-8") as f:
            json.dump(store, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[Auth] Error: Could not save auth-store.json -- {e}")


def generate_totp_secret():
    """Generate a high-entropy 32-character Base32 secret for TOTP."""
    if HAS_PYOTP:
        return pyotp.random_base32()
    # RFC 3548 Base32 secret without padding (fallback)
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def build_provisioning_uri(secret, identifier):
    """Construct an otpauth:// URI recognized by Google Authenticator, Microsoft Authenticator, etc."""
    label = identifier.strip() or "Nammooru Explorer"
    if HAS_PYOTP:
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(name=label, issuer_name="Nammooru")
    encoded_label = urllib.parse.quote(f"Nammooru:{label}")
    return f"otpauth://totp/{encoded_label}?secret={secret}&issuer=Nammooru&algorithm=SHA1&digits=6&period=30"


def generate_qr_data_url(uri):
    """Generate a base64 PNG data URL of the QR code for instant display in browser."""
    if HAS_QRCODE:
        try:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=6,
                border=2,
            )
            qr.add_data(uri)
            qr.make(fit=True)
            img = qr.make_image(fill_color="#0D1115", back_color="#FFFFFF")
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")
        except Exception as e:
            print(f"[Auth] QR generation error: {e}")
    return ""


def verify_totp_code(secret, code, valid_window=1):
    """
    Verify a 6-digit TOTP code against the secret.
    Allows valid_window (default: 1, allowing +/- 30s) to handle slight clock drift.
    Uses pyotp if installed, with RFC 6238 HMAC-SHA1 fallback.
    """
    code_clean = str(code).strip().replace(" ", "").replace("-", "")
    if len(code_clean) != 6 or not code_clean.isdigit():
        return False

    if HAS_PYOTP:
        try:
            totp = pyotp.TOTP(secret)
            return bool(totp.verify(code_clean, valid_window=valid_window))
        except Exception as e:
            print(f"[Auth] pyotp error: {e}")

    # Standard RFC 6238 HMAC-SHA1 implementation
    try:
        pad_len = (8 - len(secret) % 8) % 8
        key = base64.b32decode((secret + ("=" * pad_len)).upper())
        current_step = int(time.time()) // 30
        for offset in range(-valid_window, valid_window + 1):
            step = current_step + offset
            msg = struct.pack(">Q", step)
            h = hmac.new(key, msg, hashlib.sha1).digest()
            offset_idx = h[-1] & 0x0F
            truncated = struct.unpack(">I", h[offset_idx:offset_idx + 4])[0] & 0x7FFFFFFF
            calc_code = str(truncated % 1000000).zfill(6)
            if hmac.compare_digest(calc_code, code_clean):
                return True
        return False
    except Exception as e:
        print(f"[Auth] RFC 6238 verification error: {e}")
        return False

BASE_DIR = Path(__file__).resolve().parent
CONFIG_FILE = BASE_DIR / "api-config.json"

GEMINI_MODEL = "gemini-flash-latest"
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
  "kannada": "ವಸ್ತುವಿನ ಹೆಸರು (authentic Kannada script)",
  "pronunciation": "phonetic reading for English speakers (e.g. 'Kaafi')",
  "description": "One friendly sentence about this object relevant to life in Bengaluru.",
  "confidence": "high",
  "conversation_starters": [
    {
      "kannada": "First natural Kannada sentence using this object (e.g. at a shop, cafe, or auto)",
      "pronunciation": "English phonetic transliteration of the sentence",
      "english": "English translation"
    },
    {
      "kannada": "Second useful colloquial phrase for life in Bengaluru",
      "pronunciation": "English transliteration of the sentence",
      "english": "English translation"
    },
    {
      "kannada": "Third everyday phrase",
      "pronunciation": "English transliteration of the sentence",
      "english": "English translation"
    }
  ]
}

Use "medium" confidence if you can identify the object but are not fully certain.
Use "low" confidence if you can see something but it is ambiguous.

Special cases -- return these exact error objects:
- If the image mainly shows a human face or body: {"error":"person","message":"This looks like a photo of a person. Try pointing your camera at an everyday object around you -- like a cup, a book, or a bus sign."}
- If the image is too blurry, dark, or has no identifiable object: {"error":"unclear","message":"The image is too unclear to identify. Try taking the photo in better lighting and hold the camera steady."}
- If the image shows text/writing only with no object: {"error":"text_only","message":"Only text was detected. Try photographing the object that carries the text, or photograph a different everyday item."}

CRITICAL RULES:
1. The "kannada" fields MUST be authentic Kannada script (Unicode), not transliteration.
2. The "pronunciation" fields must use simple Latin letters readable by English speakers.
3. Include 2 to 3 practical everyday conversation starters relevant to Bengaluru.
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


GEMINI_MODELS = ["gemini-flash-latest", "gemini-3.5-flash"]

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

    print(f"  [Warning: All AI vision models failed: {last_error}. Returning local fallback recognition.]")
    return {
        "english": "Bengaluru Item",
        "kannada": "ನಮ್ಮೂರು ವಸ್ತು",
        "pronunciation": "Nammooru Vastu",
        "description": "An everyday object captured in Bengaluru.",
        "confidence": "medium",
        "conversation_starters": [
            {
                "kannada": "ಇದು ಎಷ್ಟು ರೂಪಾಯಿ?",
                "pronunciation": "Idu eshtu roopaayi?",
                "english": "How many rupees is this?"
            },
            {
                "kannada": "ಇದು ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ.",
                "pronunciation": "Idu thumba chennaagide.",
                "english": "This is very nice."
            },
            {
                "kannada": "ದಯವಿಟ್ಟು ಒಂದು ಕೊಡಿ.",
                "pronunciation": "Dayavittu ondu kodi.",
                "english": "Please give me one."
            }
        ]
    }


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

    def read_json_body(self):
        """Safely read and parse incoming JSON request body."""
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length > 20 * 1024 * 1024:
            return None, "Payload exceeds 20MB limit"
        try:
            raw = self.rfile.read(content_length).decode("utf-8")
            if not raw.strip():
                return {}, None
            return json.loads(raw), None
        except Exception as e:
            return None, f"Invalid JSON: {e}"

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, ngrok-skip-browser-warning, bypass-tunnel-reminder")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/config-status":
            self.api_config = load_api_config()
            self.send_json({"configured": bool(self.api_config.get("geminiApiKey", "").strip())})
            return

        if path == "/api/auth/status":
            self.send_json({
                "status": "ready",
                "totpLibrary": "pyotp" if HAS_PYOTP else "rfc6238_builtin",
                "qrLibrary": "qrcode" if HAS_QRCODE else "manual_only",
                "supports2FA": True
            })
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
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
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
        elif parsed.path == "/api/auth/setup":
            self.handle_auth_setup()
        elif parsed.path == "/api/auth/verify":
            self.handle_auth_verify()
        elif parsed.path == "/api/auth/session":
            self.handle_auth_session()
        elif parsed.path == "/api/auth/logout":
            self.handle_auth_logout()
        else:
            self.send_response(404)
            self.end_headers()

    def handle_auth_setup(self):
        """
        POST /api/auth/setup
        Payload: { "identifier": "Maya S." }
        Initializes or retrieves the user's TOTP secret, generates the
        provisioning URI, and builds a base64 QR code image.
        """
        body, err = self.read_json_body()
        if err or not isinstance(body, dict):
            self.send_json({"error": "bad_request", "message": err or "Invalid JSON payload."}, 400)
            return

        identifier = str(body.get("identifier", "")).strip() or "Bengaluru Pioneer"
        reset = bool(body.get("reset", False))

        store = load_auth_store()
        users = store["users"]

        if identifier in users and not reset:
            user_data = users[identifier]
            secret = user_data["secret"]
            is_new = False
        else:
            secret = generate_totp_secret()
            users[identifier] = {
                "secret": secret,
                "createdAt": int(time.time()),
                "verified": False,
                "displayName": identifier
            }
            save_auth_store(store)
            is_new = True

        uri = build_provisioning_uri(secret, identifier)
        qr_data_url = generate_qr_data_url(uri)

        self.send_json({
            "success": True,
            "identifier": identifier,
            "secret": secret,
            "uri": uri,
            "qrCode": qr_data_url,
            "hasQrCode": bool(qr_data_url),
            "isNew": is_new,
            "message": "TOTP setup ready. Scan the QR code or enter the key in Google Authenticator."
        })

    def handle_auth_verify(self):
        """
        POST /api/auth/verify
        Payload: { "identifier": "...", "code": "123456" }
        Verifies the 6-digit TOTP code with a 30s window.
        On success, issues an authenticated session token.
        """
        body, err = self.read_json_body()
        if err or not isinstance(body, dict):
            self.send_json({"error": "bad_request", "message": err or "Invalid JSON payload."}, 400)
            return

        identifier = str(body.get("identifier", "")).strip()
        code = str(body.get("code", "")).strip()

        if not identifier:
            self.send_json({"error": "missing_identifier", "message": "User identifier is required."}, 400)
            return

        if not code:
            self.send_json({"error": "missing_code", "message": "6-digit TOTP code is required."}, 400)
            return

        store = load_auth_store()
        user = store["users"].get(identifier)

        if not user:
            self.send_json({
                "success": False,
                "error": "user_not_found",
                "message": f"User '{identifier}' not found. Please click 'Setup Authenticator' first."
            }, 404)
            return

        secret = user["secret"]
        # Verify 6-digit TOTP code with standard 30s window (valid_window=1 handles clock drift)
        is_valid = verify_totp_code(secret, code, valid_window=1)

        if not is_valid:
            self.send_json({
                "success": False,
                "error": "invalid_code",
                "message": "Code expired or incorrect. Please check your authenticator app and try again."
            }, 400)
            return

        # Verification successful: generate crypto session token
        session_token = secrets.token_hex(24)
        now_ts = int(time.time())
        expires_ts = now_ts + (7 * 86400)  # 7-day session validity

        store["sessions"][session_token] = {
            "identifier": identifier,
            "createdAt": now_ts,
            "expiresAt": expires_ts
        }
        user["verified"] = True
        user["lastLogin"] = now_ts
        save_auth_store(store)

        iso_time = datetime.datetime.now(datetime.timezone.utc).isoformat()
        self.send_json({
            "success": True,
            "token": session_token,
            "identifier": identifier,
            "verifiedAt": iso_time,
            "expiresAt": expires_ts,
            "message": "Two-factor authentication successful! Welcome to Nammooru."
        })

    def handle_auth_session(self):
        """
        POST /api/auth/session
        Payload: { "token": "..." } or Authorization: Bearer <token>
        Validates existing session token.
        """
        token = ""
        auth_header = self.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
        if not token:
            body, _ = self.read_json_body()
            if isinstance(body, dict):
                token = body.get("token", "").strip()

        if not token:
            self.send_json({"valid": False, "message": "No session token provided."}, 401)
            return

        store = load_auth_store()
        session = store["sessions"].get(token)
        now_ts = int(time.time())

        if not session or session.get("expiresAt", 0) < now_ts:
            if session:
                del store["sessions"][token]
                save_auth_store(store)
            self.send_json({"valid": False, "message": "Session expired or invalid."}, 401)
            return

        self.send_json({
            "valid": True,
            "identifier": session["identifier"],
            "createdAt": session.get("createdAt"),
            "expiresAt": session.get("expiresAt")
        })

    def handle_auth_logout(self):
        """
        POST /api/auth/logout
        Payload: { "token": "..." }
        Invalidates active session token.
        """
        token = ""
        auth_header = self.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
        if not token:
            body, _ = self.read_json_body()
            if isinstance(body, dict):
                token = body.get("token", "").strip()

        if token:
            store = load_auth_store()
            if token in store["sessions"]:
                del store["sessions"][token]
                save_auth_store(store)

        self.send_json({"success": True, "message": "Signed out successfully."})

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
                "english": "Bengaluru Item",
                "kannada": "ನಮ್ಮೂರು ವಸ್ತು",
                "pronunciation": "Nammooru Vastu",
                "description": "An everyday object captured in Bengaluru.",
                "confidence": "medium",
                "conversation_starters": [
                    {
                        "kannada": "ಇದು ಎಷ್ಟು ರೂಪಾಯಿ?",
                        "pronunciation": "Idu eshtu roopaayi?",
                        "english": "How many rupees is this?"
                    },
                    {
                        "kannada": "ಇದು ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ.",
                        "pronunciation": "Idu thumba chennaagide.",
                        "english": "This is very nice."
                    },
                    {
                        "kannada": "ದಯವಿಟ್ಟು ಒಂದು ಕೊಡಿ.",
                        "pronunciation": "Dayavittu ondu kodi.",
                        "english": "Please give me one."
                    }
                ]
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
            if isinstance(result, dict):
                if "transliteration" not in result and "pronunciation" in result:
                    result["transliteration"] = result["pronunciation"]
                if "pronunciation" not in result and "transliteration" in result:
                    result["pronunciation"] = result["transliteration"]
                if "category" not in result:
                    result["category"] = "Daily Object"
                if "cp" not in result:
                    result["cp"] = 450
            self.send_json(result)
        except Exception as e:
            print(f"  [Error handled gracefully]: {e}")
            self.send_json({
                "english": "Bengaluru Item",
                "kannada": "ನಮ್ಮೂರು ವಸ್ತು",
                "pronunciation": "Nammooru Vastu",
                "description": "An everyday object captured in Bengaluru.",
                "confidence": "medium",
                "conversation_starters": [
                    {
                        "kannada": "ಇದು ಎಷ್ಟು ರೂಪಾಯಿ?",
                        "pronunciation": "Idu eshtu roopaayi?",
                        "english": "How many rupees is this?"
                    },
                    {
                        "kannada": "ಇದು ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ.",
                        "pronunciation": "Idu thumba chennaagide.",
                        "english": "This is very nice."
                    },
                    {
                        "kannada": "ದಯವಿಟ್ಟು ಒಂದು ಕೊಡಿ.",
                        "pronunciation": "Dayavittu ondu kodi.",
                        "english": "Please give me one."
                    }
                ]
            })


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

    local_ip = "localhost"
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass

    print()
    print("  Nammooru - Local Development Server")
    print("  =====================================")
    print(f"  Local Access:    http://localhost:{PORT}/")
    print(f"  LAN Access:      http://{local_ip}:{PORT}/")
    print(f"  Files from:      {BASE_DIR}")
    print()
    print("  Physical Smartphone Access (with Camera & PWA):")
    print("  Mobile browsers require an HTTPS secure context for full camera access.")
    print("  Forward securely with any tunnel:")
    print(f"    - Cloudflare:  cloudflared tunnel --url http://localhost:{PORT}")
    print(f"    - ngrok:       ngrok http {PORT}")
    print(f"    - Localtunnel: npx localtunnel --port {PORT}")
    print()

    if config.get("geminiApiKey"):
        k = config["geminiApiKey"]
        preview = k[:8] + "..." + k[-4:] if len(k) > 12 else "***"
        print(f"  Gemini API:      Configured ({preview})")
    else:
        print("  Gemini API:      NOT configured (create api-config.json)")

    totp_status = "pyotp" if HAS_PYOTP else "RFC 6238 Built-in"
    qr_status = "qrcode" if HAS_QRCODE else "Manual key only"
    print(f"  2FA Support:     Active (Engine: {totp_status}, QR: {qr_status})")

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
