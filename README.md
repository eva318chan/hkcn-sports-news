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

## 圖片政策（編輯紅線，必守）

> 總原則（2026-10-20 江仔定調）：本站屬非商業性質，影響不大，最重要謹守兩條紅線 ——（1）東方系列一律唔用、（2）三大外國通訊社圖片一律唔用 —— 守住就冇問題。其餘按下面三級制靈活處理。本節內容來自江仔 2026-10-20 至 10-21 喺 WhatsApp 嘅指示，同自動更新 pipeline（`hkcn-news-4h-update`）入面嘅守則一致；改政策要兩邊一齊改。

### 🔴 絕對唔用

- **東方報業集團**（東網、東方日報、on.cc）：來源、圖片、社交媒體 embed 全部唔用，否則有官非風險。
- **大型外國通訊社**：AP（美聯社）、Reuters（路透社）、AFP（法新社）、Getty —— 就算來源文章嘅 `og:image` credit 係佢哋、或者經第三方網站轉載，都一律 skip，寧願冇圖。

### 🟢 可以用（必須註明出處）

- **政府新聞處（ISD）**：首選。圖片本身派俾傳媒用，圖說／alt 註明「政府新聞處」即可；如相片註明版權屬第三方，skip 唔用。康文署等政府部門稿同樣處理。
- **新華社、中新社**：可以用，註明出處。
- **中國日報英文版（China Daily）**：圖片可以用，註明出處（見下面「主動搵圖」）。
- **文匯大公系列所有平台**（2026-10-21 江仔追加）：文匯報、大公報、大公文匯網及集團其他平台嘅圖片都可以用，註明出處。

### 🟡 本地媒體

- 唔直接攞其他本地媒體自家攝影嘅相。睇 credit：如果張相係政府新聞處／主辦方／大會提供，就返去源頭攞原相嚟用。
- 用唔用得睇授權來源，唔係睇張相面頭有冇 logo。**絕對唔可以**裁剪走 logo／版權字句，亦唔可以專揀冇 logo 嘅次選相嚟避開出處 —— 咁做屬移除版權管理資訊，風險更高。

### 揀新聞次序：政府新聞處優先

1. 每一輪揀新聞，**第一步先掃政府新聞處當日公報**（info.gov.hk 當日索引／news.gov.hk），揀啱題材、尤其有相（with photo）嘅稿做嗰輪骨幹，避免首頁出現一堆冇圖片配套嘅卡，顯示唔好睇。
2. 之後先用其他來源補新聞處冇嘅題材（國際、娛樂、突發等）；同等重要性下，優先揀有可用圖片嘅故仔（圖片要過到上面紅線）。
3. **補圖回顧**：每次 run 檢查今日＋昨日冇圖嘅已刊文章，政府／官方活動題材就去政府新聞處搵返對應原相回補（補之前要對清楚 caption 同題材相符）；非政府題材可去中國日報英文版／文匯大公系列搵同題材相回補。

### 主動搵圖來源

- 篇文冇圖嗰陣，除咗政府新聞處，可以主動去**中國日報英文版**（chinadaily.com.cn）同**文匯大公系列平台**搵同題材相片嚟用。用之前必須對清楚張相真係同一事件／同一題材，唔對題就唔好用；用嗰陣註明出處。

### 基本守則（寧缺勿錯）

- **每張要上線嘅圖，必須親眼睇過先可以用**，唔可以憑檔名、憑記憶估。唔肯定就寧願冇圖，都唔好出錯（圖片、數字、人名、賽果都一樣）。
- 新聞照片必須係**真實照片**，絕對唔可以用 AI 圖片或者假圖扮新聞相。體育站冇江仔指示，唔可以用 AI 生成圖片。
- 每張圖／片要對返同一單新聞、同一事件、接近同一日，唔好用舊相舊片充數。

### 冇圖顯示規則（2026-10-30 江仔指示）

- **首頁卡**：冇 `image_url` 嗰陣唔出圖片位，只顯示標題＋摘要（之前個 🏅 placeholder 睇落唔好）；有圖就正常顯示。
- **文章頁**：冇圖嗰陣成個 `article-hero` div 唔寫；有圖但載入失敗，`onerror` 成個 hero 移除，唔好換 noimg 🏅。
- 2026-10-30 前已刊嘅 402 篇冇圖文章，已一次過清走晒啲 noimg hero（commits `48c1025`、`164555e`）。

## 本地開發

純靜態網站，直接用瀏覽器開 `index.html` 即可；如瀏覽器擋本地 `fetch`，用 `python3 -m http.server` 經 `http://localhost:8000` 預覽。

## Deploy

Vercel 已連接本 repo 的 `main` branch：push 上 `main` 即自動 deploy，無需手動操作。

## 維護注意事項

- 加新運動分類：先改 `assets/app.js` 的 `SPORTS`，再喺新資料用該 key。
- `manifest.json` 的 `site_url` 目前仍寫 `https://hkcn-sports-news.vercel.app`，對外正式域名係 `https://hksports.hk`；改動前請確認用途。
- `manifest.json` 的 `dates` 由新到舊，`count` 須與該日 JSON 實際篇數一致。

