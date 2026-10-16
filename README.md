# 中港體育速報 · HK-China Sports Express（港體育）

香港及中國體育新聞聚合網站，每 4 小時自動更新。純靜態網站，無後端、無 build step。結構與姊妹站 `hkcn-news` 基本相同，差異見下文。

- 線上網址：https://hksports.hk（Vercel project 名為 `hkcn-sports-news`）

## 技術棧

- HTML + CSS + vanilla JavaScript（無 framework）
- 體育新聞資料：`data/` 目錄下的每日 JSON，前端直接 `fetch` 渲染
- Hosting：Vercel（連接 GitHub `main` branch，push 即自動 deploy）；`hksports.hk` 域名經 Cloudflare DNS 指向 Vercel

## 資料夾／檔案

| 路徑 | 說明 |
|---|---|
| `index.html` | 首頁：搜尋列、運動分類／日期篩選、新聞卡片列表 |
| `assets/app.js` | 前端邏輯；`SPORTS` 定義 16 個運動分類 key |
| `assets/style.css` | 全站樣式 |
| `assets/logo-*`、`favicon.png` | logo 及 favicon |
| `data/YYYY-MM-DD.json` | 每日體育新聞資料 |
| `data/manifest.json` | `updated_at`、`site_url`、`dates: [{date, count}]`（日期由新到舊） |
| `data/unknown.json` | 已處理文章 ID 清單（去重用），array of id 字串 |
| `a/{id}.html` | 每篇新聞的獨立文章頁 |

## 與 hkcn-news 的差異

- 分類欄叫 `sport` 而唔係 `category`；16 個合法 key（見 `assets/app.js` 的 `SPORTS`）：`football`、`basketball`、`badminton`、`table_tennis`、`tennis`、`athletics`、`swimming`、`volleyball`、`cycling`、`rugby`、`golf`、`snooker`、`boxing_mma`、`esports`、`racing`、`others`。唔好自創 key。
- 來源欄位：`source` 係字串（機構名）＋ `source_url`（原文連結），唔係 `{name, url}` object。
- 文章頁用 `sport-tag` 樣式，backlink 文字係「← 港體育」。
- 去重靠 `data/unknown.json`：每加一篇新文章，就要將其 id 加入呢個清單。

## 文章資料格式

`data/YYYY-MM-DD.json` 內每篇：`id`（`YYYYMMDD-英文slug`，全站唯一）、`sport`、`published_at`（ISO 8601，`+08:00`）、`source`（字串）、`source_url`、`image_url`（可空）、`title`／`summary`／`tags`（`{en, zh_hant, zh_hans}` 三語）。

## 新聞更新流程（自動化）

- 排程 `hkcn-news-4h-update` 每 4 小時執行一次（約 00／04／08／12／16／20 HKT），同綜合新聞站一齊跑。
- 流程：搜尋近數小時體育新聞 → 摘要用自己文字重寫（三語）→ 寫入 `data/今日日期.json`、產生 `a/{id}.html`、更新 `manifest.json`、將新 id 加入 `data/unknown.json` → 經 GitHub PAT commit＋push 上 `main` → Vercel 自動 deploy。
- **版權要求**：摘要必須重新編寫，唔好大段複製原文。
- 目標每日約 25–40 篇，寧缺勿濫。

## 本地開發

純靜態網站，直接用瀏覽器開 `index.html` 即可；如瀏覽器擋本地 `fetch`，用 `python3 -m http.server` 經 `http://localhost:8000` 預覽。

## Deploy

Vercel 已連接本 repo 的 `main` branch：push 上 `main` 即自動 deploy，無需手動操作。

## 維護注意事項

- 加新運動分類：先改 `assets/app.js` 的 `SPORTS`，再喺新資料用該 key。
- `manifest.json` 的 `site_url` 目前仍寫 `https://hkcn-sports-news.vercel.app`，對外正式域名係 `https://hksports.hk`；改動前請確認用途。
- `manifest.json` 的 `dates` 由新到舊，`count` 須與該日 JSON 實際篇數一致。
