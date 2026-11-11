# OmniPost - 1-Click Multi-Account Social Broadcaster

OmniPost is a unified social media management application that allows you to connect multiple accounts across **Instagram**, **Facebook**, **X (Twitter)**, and **YouTube**, and broadcast a single post or video to all of them simultaneously with one click.

---

## ⚡ Quick Start

### 1. Start the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🚀 Key Features Built

1. **Broadcast Studio (`/`)**:
   - Multi-account selection matrix (Select All, Deselect All, or filter by platform).
   - Video (MP4 / MOV / WebM) and Image (PNG / JPG / WebP) uploader with live in-browser preview.
   - Smart caption validator with live character counters (alerts when approaching or exceeding X's 280-character limit).
   - 1-Click Broadcast Engine: pushes to all selected accounts in parallel with live status reporting and direct links to created posts.

2. **Accounts Manager (`/accounts`)**:
   - Connect as many accounts as you want (e.g. 3 Instagram accounts, 2 Facebook Pages, 2 X accounts).
   - Includes a **1-Click Demo Account Generator** so you can immediately test having 5+ accounts and watch simultaneous multi-posting without waiting on API keys.
   - Secure credential storage per account.

3. **Broadcast History (`/history`)**:
   - Complete log of all past broadcasts, media previews, targeted accounts, individual success/error statuses, and direct links to live posts.

4. **API Settings & Sandbox Toggle (`/settings`)**:
   - **Simulation / Sandbox Mode**: Enabled by default so you can test the full pipeline and UI immediately without throwing API errors.
   - **Live API Mode**: Toggle off simulation to make direct HTTP calls to the Meta Graph API and X API v2.
   - Public App URL configuration (required by Meta's container API).

---

## 🔑 How the Platforms Work

### 1. Instagram (Meta Graph API)
- **Account Type**: Instagram accounts must be **Professional (Business or Creator)** and linked to a Facebook Page.
- **Workflow**:
  1. OmniPost uploads your video/image to a public URL.
  2. Creates a Media Container via `POST /{ig_user_id}/media` (`media_type=REELS` or `IMAGE`).
  3. Polls status until container is `FINISHED`.
  4. Publishes via `POST /{ig_user_id}/media_publish`.

### 2. Facebook Pages (Meta Graph API)
- Video: `POST /{page_id}/videos` with `file_url` and description.
- Photos: `POST /{page_id}/photos` with `url` and caption.
- Text: `POST /{page_id}/feed` with `message`.

### 3. X / Twitter (X API v2)
- Tweets with media chunked upload via `twitter-api-v2` (`v1.uploadMedia` + `v2.tweet`).

### 4. YouTube (Data API v3)
- Modular channel support for pushing Shorts or Videos.

---

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── accounts/     # GET, POST, DELETE accounts
│   │   │   ├── history/      # GET broadcast history
│   │   │   ├── publish/      # Multi-account parallel dispatcher
│   │   │   ├── settings/     # App configuration
│   │   │   └── upload/       # Video/image storage handler
│   │   ├── accounts/         # Accounts UI
│   │   ├── history/          # Broadcast history UI
│   │   ├── settings/         # Settings & Setup Guide UI
│   │   ├── layout.tsx        # Shell layout & navbar
│   │   └── page.tsx          # Broadcast studio
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── PlatformIcon.tsx
│   └── lib/
│       ├── db.ts             # File-based database store
│       ├── types.ts          # Core TypeScript definitions
│       └── publishers/       # Instagram, Facebook, X, YouTube engines
├── data/
│   └── db.json               # Auto-initialized local DB
└── public/
    └── uploads/              # Uploaded media storage
```

