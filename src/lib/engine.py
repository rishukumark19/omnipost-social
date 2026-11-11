import os
import sys
import json
import pickle
import traceback
from typing import Dict, Any, List

def publish_instagram(account: Dict[str, Any], file_path: str, caption: str) -> Dict[str, Any]:
    from instagrapi import Client
    cl = Client()
    cl.delay_range = [1, 3]

    session_data = account.get("credentials", {}).get("sessionData")
    session_file = account.get("credentials", {}).get("sessionFile")
    username = account.get("credentials", {}).get("username")
    password = account.get("credentials", {}).get("password")

    # Check fallback to D:\ai video editing with image\insta_session.json if available
    default_session_path = r"D:\ai video editing with image\insta_session.json"

    logged_in = False

    if session_data:
        try:
            cl.set_settings(session_data if isinstance(session_data, dict) else json.loads(session_data))
            logged_in = True
        except Exception as e:
            print(f"[Instagram] Session data load failed: {e}", file=sys.stderr)

    if not logged_in and session_file and os.path.exists(session_file):
        try:
            cl.load_settings(session_file)
            logged_in = True
        except Exception as e:
            print(f"[Instagram] Session file load failed: {e}", file=sys.stderr)

    if not logged_in and os.path.exists(default_session_path):
        try:
            cl.load_settings(default_session_path)
            logged_in = True
            print(f"[Instagram] Loaded default session from {default_session_path}", file=sys.stderr)
        except Exception as e:
            print(f"[Instagram] Default session load failed: {e}", file=sys.stderr)

    if not logged_in and username and password:
        try:
            print(f"[Instagram] Logging in with username {username}...", file=sys.stderr)
            cl.login(username, password)
            logged_in = True
        except Exception as e:
            return {"status": "failed", "error": f"Instagram login failed: {str(e)}"}

    if not logged_in:
        return {"status": "failed", "error": "No valid Instagram session or login credentials found."}

    # Upload video (Reel) or photo
    is_video = file_path.lower().endswith(('.mp4', '.mov', '.avi', '.webm'))
    try:
        if is_video:
            print(f"[Instagram] Uploading Reel: {file_path}", file=sys.stderr)
            media = cl.clip_upload(file_path, caption=caption)
            reel_url = f"https://www.instagram.com/reel/{media.code}/"
            return {
                "status": "success",
                "postId": str(media.pk),
                "postUrl": reel_url,
                "code": media.code
            }
        else:
            print(f"[Instagram] Uploading Photo: {file_path}", file=sys.stderr)
            media = cl.photo_upload(file_path, caption=caption)
            post_url = f"https://www.instagram.com/p/{media.code}/"
            return {
                "status": "success",
                "postId": str(media.pk),
                "postUrl": post_url,
                "code": media.code
            }
    except Exception as e:
        return {"status": "failed", "error": f"Instagram upload error: {str(e)}"}


def publish_youtube(account: Dict[str, Any], file_path: str, caption: str) -> Dict[str, Any]:
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    from google.auth.transport.requests import Request

    token_path = account.get("credentials", {}).get("tokenFile")
    default_yt_token = r"D:\ai video editing with image\yt credential\yt_token.pickle"

    token_file = token_path if (token_path and os.path.exists(token_path)) else default_yt_token

    if not os.path.exists(token_file):
        return {"status": "failed", "error": f"YouTube token file not found at {token_file}"}

    try:
        with open(token_file, "rb") as f:
            creds = pickle.load(f)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
                with open(token_file, "wb") as f:
                    pickle.dump(creds, f)
            else:
                return {"status": "failed", "error": "YouTube credentials expired and require re-authentication."}

        youtube = build("youtube", "v3", credentials=creds)

        title = (caption.split("\n")[0][:95] if caption else "New Short") or "New Short"
        description = caption

        media = MediaFileUpload(file_path, mimetype="video/mp4", resumable=True)
        body = {
            "snippet": {
                "title": title,
                "description": description,
                "tags": ["shorts", "trending"],
                "categoryId": "24"
            },
            "status": {
                "privacyStatus": "public",
                "selfDeclaredMadeForKids": False
            }
        }

        request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
        response = None
        while response is None:
            status, response = request.next_chunk()
            if status:
                print(f"[YouTube] Uploaded {int(status.progress() * 100)}%", file=sys.stderr)

        video_id = response.get("id")
        return {
            "status": "success",
            "postId": video_id,
            "postUrl": f"https://youtube.com/shorts/{video_id}"
        }
    except Exception as e:
        return {"status": "failed", "error": f"YouTube upload error: {str(e)}"}


def publish_twitter(account: Dict[str, Any], file_path: str, caption: str) -> Dict[str, Any]:
    import tweepy
    creds = account.get("credentials", {})
    api_key = creds.get("apiKey")
    api_secret = creds.get("apiSecret")
    access_token = creds.get("twitterAccessToken")
    access_secret = creds.get("twitterAccessSecret")
    bearer_token = creds.get("bearerToken")

    if not (api_key and api_secret and access_token and access_secret):
        return {"status": "failed", "error": "Missing Twitter API Key / Access Token in account credentials."}

    try:
        # OAuth 1.0a handler for media upload
        auth = tweepy.OAuth1UserHandler(api_key, api_secret, access_token, access_secret)
        api = tweepy.API(auth)

        # Client for v2 tweet creation
        client = tweepy.Client(
            consumer_key=api_key,
            consumer_secret=api_secret,
            access_token=access_token,
            access_token_secret=access_secret
        )

        media_ids = []
        if file_path and os.path.exists(file_path):
            is_video = file_path.lower().endswith(('.mp4', '.mov', '.avi', '.webm'))
            category = "tweet_video" if is_video else None
            media = api.media_upload(filename=file_path, media_category=category)
            media_ids.append(media.media_id)

        tweet = client.create_tweet(text=caption[:280], media_ids=media_ids if media_ids else None)
        tweet_id = tweet.data["id"]
        handle = account.get("handle", "user").replace("@", "")

        return {
            "status": "success",
            "postId": tweet_id,
            "postUrl": f"https://x.com/{handle}/status/{tweet_id}"
        }
    except Exception as e:
        return {"status": "failed", "error": f"Twitter error: {str(e)}"}


def publish_facebook(account: Dict[str, Any], file_path: str, caption: str) -> Dict[str, Any]:
    import requests
    creds = account.get("credentials", {})
    page_id = creds.get("pageId")
    access_token = creds.get("accessToken")

    if not (page_id and access_token):
        return {"status": "failed", "error": "Missing Facebook Page ID or Access Token"}

    try:
        is_video = file_path and file_path.lower().endswith(('.mp4', '.mov', '.avi', '.webm'))
        
        if is_video:
            url = f"https://graph.facebook.com/v19.0/{page_id}/videos"
            with open(file_path, "rb") as video_file:
                files = {"source": video_file}
                data = {"description": caption, "access_token": access_token}
                res = requests.post(url, data=data, files=files)
                res_data = res.json()
        else:
            url = f"https://graph.facebook.com/v19.0/{page_id}/photos"
            with open(file_path, "rb") as photo_file:
                files = {"source": photo_file}
                data = {"caption": caption, "access_token": access_token}
                res = requests.post(url, data=data, files=files)
                res_data = res.json()

        if "id" in res_data:
            post_id = res_data["id"]
            return {
                "status": "success",
                "postId": post_id,
                "postUrl": f"https://facebook.com/{post_id}"
            }
        else:
            err = res_data.get("error", {}).get("message", "Facebook API Error")
            return {"status": "failed", "error": err}
    except Exception as e:
        return {"status": "failed", "error": f"Facebook error: {str(e)}"}


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No payload provided"}))
        sys.exit(1)

    payload_raw = sys.argv[1]
    try:
        if os.path.exists(payload_raw):
            with open(payload_raw, "r", encoding="utf-8") as f:
                payload = json.load(f)
        else:
            payload = json.loads(payload_raw)
    except Exception as e:
        print(json.dumps({"error": f"Failed to parse payload: {e}"}))
        sys.exit(1)

    action = payload.get("action", "publish")
    if action == "publish":
        file_path = payload.get("filePath", "")
        caption = payload.get("caption", "")
        accounts = payload.get("accounts", [])

        results = []
        for acc in accounts:
            platform = acc.get("platform")
            acc_id = acc.get("id")
            acc_name = acc.get("name")
            
            # If account is marked simulated, return instant mock
            if acc.get("isSimulated", False):
                mock_id = f"sim_{acc_id}_{int(os.times().elapsed * 1000)}"
                results.append({
                    "accountId": acc_id,
                    "accountName": acc_name,
                    "platform": platform,
                    "status": "success",
                    "postId": mock_id,
                    "postUrl": f"https://{platform}.com/{mock_id}"
                })
                continue

            try:
                if platform == "instagram":
                    res = publish_instagram(acc, file_path, caption)
                elif platform == "youtube":
                    res = publish_youtube(acc, file_path, caption)
                elif platform == "twitter":
                    res = publish_twitter(acc, file_path, caption)
                elif platform == "facebook":
                    res = publish_facebook(acc, file_path, caption)
                else:
                    res = {"status": "failed", "error": f"Unsupported platform: {platform}"}

                res["accountId"] = acc_id
                res["accountName"] = acc_name
                res["platform"] = platform
                results.append(res)
            except Exception as e:
                results.append({
                    "accountId": acc_id,
                    "accountName": acc_name,
                    "platform": platform,
                    "status": "failed",
                    "error": str(e)
                })

        print(json.dumps({"results": results}))

if __name__ == "__main__":
    main()

