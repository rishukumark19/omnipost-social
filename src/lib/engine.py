import os
import sys
import json
import traceback
from typing import Dict, Any, List
from instagrapi import Client
from instagrapi.exceptions import (
    BadPassword,
    TwoFactorRequired,
    ChallengeRequired,
    LoginRequired
)

SESSIONS_DIR = os.path.join(os.getcwd(), "data", "sessions")
os.makedirs(SESSIONS_DIR, exist_ok=True)

def get_instagram_client(account: Dict[str, Any]) -> Client:
    cl = Client()
    cl.delay_range = [1, 3]

    creds = account.get("credentials", {})
    username = creds.get("username", "").strip().replace("@", "")
    password = creds.get("password", "")
    session_file = creds.get("sessionFile")
    session_data = creds.get("sessionData")

    # Path to custom saved session
    custom_session_path = os.path.join(SESSIONS_DIR, f"{username}_session.json") if username else None
    default_session_path = r"D:\ai video editing with image\insta_session.json"

    # Try 1: Load from direct sessionData string
    if session_data:
        try:
            cl.set_settings(session_data if isinstance(session_data, dict) else json.loads(session_data))
            return cl
        except Exception as e:
            print(f"[{username}] Session data error: {e}", file=sys.stderr)

    # Try 2: Load from account sessionFile
    if session_file and os.path.exists(session_file):
        try:
            cl.load_settings(session_file)
            return cl
        except Exception as e:
            print(f"[{username}] Session file error: {e}", file=sys.stderr)

    # Try 3: Load from data/sessions/{username}_session.json
    if custom_session_path and os.path.exists(custom_session_path):
        try:
            cl.load_settings(custom_session_path)
            return cl
        except Exception as e:
            print(f"[{username}] Custom session load error: {e}", file=sys.stderr)

    # Try 4: Fallback to default session in D:\ai video editing with image
    if os.path.exists(default_session_path):
        try:
            cl.load_settings(default_session_path)
            return cl
        except Exception as e:
            print(f"[{username}] Default session error: {e}", file=sys.stderr)

    # Try 5: Username & Password Login
    if username and password:
        print(f"[{username}] Logging in with credentials...", file=sys.stderr)
        cl.login(username, password)
        if custom_session_path:
            cl.dump_settings(custom_session_path)
        return cl

    raise Exception(f"No valid session or credentials found for @{username}")


def publish_to_instagram(account: Dict[str, Any], file_path: str, caption: str) -> Dict[str, Any]:
    username = account.get("username", account.get("name", "instagram"))
    
    # If simulated
    if account.get("isSimulated", False):
        import time
        time.sleep(1.2)
        mock_id = f"sim_{int(time.time())}"
        return {
            "status": "success",
            "postId": mock_id,
            "postUrl": f"https://www.instagram.com/reel/{mock_id}/",
            "username": username
        }

    if not file_path or not os.path.exists(file_path):
        return {
            "status": "failed",
            "error": f"Media file not found at: {file_path}",
            "username": username
        }

    try:
        cl = get_instagram_client(account)
        is_video = file_path.lower().endswith(('.mp4', '.mov', '.avi', '.webm'))

        if is_video:
            print(f"[@{username}] Uploading Reel: {file_path}", file=sys.stderr)
            media = cl.clip_upload(file_path, caption=caption)
            reel_url = f"https://www.instagram.com/reel/{media.code}/"
            print(f"[@{username}] Reel live at: {reel_url}", file=sys.stderr)
            return {
                "status": "success",
                "postId": str(media.pk),
                "postUrl": reel_url,
                "code": media.code,
                "username": username
            }
        else:
            print(f"[@{username}] Uploading Photo: {file_path}", file=sys.stderr)
            media = cl.photo_upload(file_path, caption=caption)
            post_url = f"https://www.instagram.com/p/{media.code}/"
            return {
                "status": "success",
                "postId": str(media.pk),
                "postUrl": post_url,
                "code": media.code,
                "username": username
            }
    except Exception as e:
        err_msg = str(e)
        print(f"[@{username}] Error: {err_msg}", file=sys.stderr)
        return {
            "status": "failed",
            "error": err_msg,
            "username": username
        }


def test_login(account: Dict[str, Any]) -> Dict[str, Any]:
    username = account.get("username", "").strip().replace("@", "")
    password = account.get("password", "")
    
    cl = Client()
    try:
        cl.login(username, password)
        session_path = os.path.join(SESSIONS_DIR, f"{username}_session.json")
        cl.dump_settings(session_path)
        
        info = cl.account_info()
        return {
            "status": "success",
            "username": info.username,
            "fullName": info.full_name,
            "avatarUrl": str(info.profile_pic_url),
            "sessionFile": session_path
        }
    except Exception as e:
        return {"status": "failed", "error": str(e)}


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No arguments provided"}))
        sys.exit(1)

    payload_raw = sys.argv[1]
    if os.path.exists(payload_raw):
        with open(payload_raw, "r", encoding="utf-8") as f:
            payload = json.load(f)
    else:
        payload = json.loads(payload_raw)

    action = payload.get("action", "publish")

    if action == "test_login":
        res = test_login(payload.get("account", {}))
        print(json.dumps(res))
        return

    if action == "publish":
        file_path = payload.get("filePath", "")
        caption = payload.get("caption", "")
        accounts = payload.get("accounts", [])

        results = []
        for acc in accounts:
            acc_id = acc.get("id")
            res = publish_to_instagram(acc, file_path, caption)
            res["accountId"] = acc_id
            results.append(res)

        print(json.dumps({"results": results}))

if __name__ == "__main__":
    main()
