# 東京六日 · 2026/06 行程手帳

旅遊雜誌風格的互動式行程顯示。

## 🚀 部署到 GitHub Pages（5 分鐘搞定）

### 1. 註冊 / 登入 GitHub
[github.com](https://github.com)

### 2. 新建 Repository
- 點右上角 **+** → **New repository**
- Repository name: `tokyo-2026`（或任何你喜歡的名字）
- 設為 **Public**（Pages 免費版需要 public）
- ✅ 勾選 **Add a README file**
- 點 **Create repository**

### 3. 上傳檔案
進入 repo 頁面 → **Add file** → **Upload files**

把這幾個檔案拖進去：
- `index.html`
- `styles.css`
- `app.js`
- `data.js`

下方寫 commit 訊息（例如「Initial upload」）→ **Commit changes**

### 4. 開啟 Pages
- Repo 頁面 → **Settings**（最右邊那個齒輪）
- 左邊側欄 → **Pages**
- **Source** 選 `Deploy from a branch`
- **Branch** 選 `main` / `(root)` → **Save**

### 5. 等 1-2 分鐘
回到 **Pages** 頁面，看到綠色框框寫：
> Your site is live at `https://你的帳號.github.io/tokyo-2026/`

點進去就是你的行程網站了 🎉

---

## 📂 檔案說明

| 檔案 | 內容 |
|---|---|
| `index.html` | 主頁面 |
| `styles.css` | 視覺樣式 |
| `app.js` | React 元件邏輯 |
| `data.js` | 行程資料（**修改這裡就能改行程**） |

## ✏️ 之後想改行程？

直接編輯 `data.js`，找到對應的日期和事件就能改：
- 時間：`time`
- 地點：`title`
- 備註：`note`
- 座標：`lat` / `lng`（從 Google Maps 點地點，網址會有座標）

改完上傳到 GitHub（Add file → Upload files 覆蓋），1 分鐘後網站自動更新。

## 📱 手機加入主畫面

iPhone Safari：分享 → 加入主畫面
Android Chrome：選單 → 加到主畫面

之後就像 App 一樣可以打開，checklist 勾選會自動儲存。

## 🌐 其他部署選項

- **Netlify Drop** — [app.netlify.com/drop](https://app.netlify.com/drop)（拖整個資料夾上去，馬上上線）
- **Vercel** — [vercel.com](https://vercel.com)（GitHub 連結即部署）

---

行程平安、玩得開心 ✈️🗼
