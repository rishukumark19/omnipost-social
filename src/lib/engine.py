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

def login_with_credentials(cl: Client, username: str, password: str, session_save_path: str = None) -> bool:
    if not username or not password:
        return False
    try:
        print(f"[{username}] Attempting direct login with credentials...", file=sys.stderr)
        cl.login(username, password)
        if session_save_path:
            cl.dump_settings(session_save_path)
            print(f"[{username}] Fresh session dumped to {session_save_path}", file=sys.stderr)
        return True
    except Exception as e:
        print(f"[{username}] Direct login failed: {e}", file=sys.stderr)
        raise

def get_instagram_client(account: Dict[str, Any]) -> Client:
    cl = Client()
    cl.delay_range = [1, 3]

    creds = account.get("credentials", {})
    username = creds.get("username", account.get("username", "")).strip().replace("@", "")
    password = creds.get("password", "")
    sessionid = creds.get("sessionid", "").strip()
    session_file = creds.get("sessionFile")
    session_data = creds.get("sessionData")

    custom_session_path = os.path.join(SESSIONS_DIR, f"{username}_session.json") if username else None
    default_session_path = r"D:\ai video editing with image\insta_session.json"

    # Try 1: Login by sessionid cookie (100% bypass 2FA & checkpoints)
    if sessionid:
        try:
            print(f"[{username}] Logging in via sessionid cookie...", file=sys.stderr)
            cl.login_by_sessionid(sessionid)
            if custom_session_path:
                cl.dump_settings(custom_session_path)
            return cl
        except Exception as e:
            print(f"[{username}] sessionid login error: {e}", file=sys.stderr)

    # Try 2: Direct sessionData
    if session_data:
        try:
            cl.set_settings(session_data if isinstance(session_data, dict) else json.loads(session_data))
            return cl
        except Exception as e:
            print(f"[{username}] Session data error: {e}", file=sys.stderr)

    # Try 3: Account sessionFile
    if session_file and os.path.exists(session_file):
        try:
            cl.load_settings(session_file)
            return cl
        except Exception as e:
            print(f"[{username}] Session file error: {e}", file=sys.stderr)

    # Try 4: data/sessions/{username}_session.json
    if custom_session_path and os.path.exists(custom_session_path):
        try:
            cl.load_settings(custom_session_path)
            return cl
        except Exception as e:
            print(f"[{username}] Custom session error: {e}", file=sys.stderr)

    # Try 5: Fallback to default session
    if os.path.exists(default_session_path):
        try:
            cl.load_settings(default_session_path)
            return cl
        except Exception as e:
            print(f"[{username}] Default session error: {e}", file=sys.stderr)

    # Try 6: Credentials login
    if username and password:
        login_with_credentials(cl, username, password, custom_session_path)
        return cl

    raise Exception(f"No valid session, sessionid, or credentials found for @{username}")


def verify_account(account: Dict[str, Any]) -> Dict[str, Any]:
    username = account.get("username", "").strip().replace("@", "")
    if account.get("isSimulated", False):
        return {
            "status": "valid",
            "username": username,
            "fullName": account.get("name", username),
            "followers": account.get("followers", "12.4K"),
            "simulated": True
        }

    creds = account.get("credentials", {})
    password = creds.get("password", "")
    custom_session_path = os.path.join(SESSIONS_DIR, f"{username}_session.json") if username else None

    try:
        cl = get_instagram_client(account)
        try:
            info = cl.account_info()
        except LoginRequired:
            if password:
                print(f"[{username}] Session expired during verification. Auto-renewing...", file=sys.stderr)
                login_with_credentials(cl, username, password, custom_session_path)
                info = cl.account_info()
            else:
                raise

        return {
            "status": "valid",
            "username": info.username,
            "fullName": info.full_name,
            "followers": info.follower_count,
            "avatarUrl": str(info.profile_pic_url) if info.profile_pic_url else None
        }
    except Exception as e:
        return {"status": "expired", "error": str(e), "username": username}


def publish_to_instagram(account: Dict[str, Any], file_path: str, caption: str) -> Dict[str, Any]:
    username = account.get("username", account.get("name", "instagram")).strip().replace("@", "")

    if account.get("isSimulated", False):
        import time
        time.sleep(1.0)
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

    creds = account.get("credentials", {})
    password = creds.get("password", "")
    custom_session_path = os.path.join(SESSIONS_DIR, f"{username}_session.json") if username else None

    try:
        cl = get_instagram_client(account)
        is_video = file_path.lower().endswith(('.mp4', '.mov', '.avi', '.webm'))

        def do_upload():
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

        try:
            return do_upload()
        except LoginRequired:
            if password:
                print(f"[{username}] Session expired during upload. Auto-renewing session...", file=sys.stderr)
                login_with_credentials(cl, username, password, custom_session_path)
                return do_upload()
            else:
                raise

    except Exception as e:
        err_msg = str(e)
        print(f"[@{username}] Error: {err_msg}", file=sys.stderr)
        return {
            "status": "failed",
            "error": err_msg,
            "username": username
        }


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

    if action == "verify":
        res = verify_account(payload.get("account", {}))
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
