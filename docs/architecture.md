# 系統架構

## 概覽

本專案使用 GitHub Pages 作公開前台，Google Apps Script 作 read-only API，Google Sheet 作相簿資料庫，Google Drive 作相片儲存位置。

```text
使用者瀏覽器
        ↓
GitHub Pages：index.html / config.js / assets/styles.css / assets/app.js
        ↓ JSONP request
Apps Script Web App：Code.gs
        ↓
Google Sheet：Albums 工作頁
        ↓
Google Drive：每個相簿對應一個 folderId
```

## GitHub Pages

前台由以下檔案組成：

- `index.html`：HTML 結構，載入 `config.js`、`assets/styles.css`、`assets/app.js`。
- `config.js`：網站設定、焦點 / 回顧分類及 Apps Script API URL。
- `assets/styles.css`：前台視覺設計、焦點活動、活動回顧、相片牆及 responsive 樣式。
- `assets/app.js`：JSONP 讀取、分類分流、搜尋、排序、相簿列表及相簿詳情頁顯示邏輯。

GitHub Pages 是靜態網站，不應放置 secret 或密碼。

## Apps Script

Apps Script 以 Web App 方式部署，提供公開 read-only API：

| action | 用途 |
|---|---|
| `albums` | 讀取公開相簿清單 |
| `photos` | 讀取指定相簿的相片 |
| `latest` | 讀取最新相片 |
| `list` | 舊版相容用途 |

因 GitHub Pages 跨域讀取 Apps Script 可能遇到 CORS 問題，因此前台使用 JSONP：

```text
?action=albums&callback=jsonp_cb_xxx
```

Apps Script 會回傳：

```javascript
jsonp_cb_xxx({ ok: true, albums: [...] });
```

## Google Sheet

Google Sheet 是相簿資料庫。每一行代表一個活動相簿。前台不直接讀 Sheet，而是經 Apps Script 讀取。

前台以 `分類` 欄作唯一分流：

| 分類 | 前台位置 |
|---|---|
| `焦點活動` | 首頁焦點活動區。第一個相簿以大型 headline card 顯示，其餘以 focus card 顯示。 |
| `活動回顧` | 活動回顧頁。顯示相簿 grid，並提供搜尋及排序。 |

舊有 `精選活動` 欄不再控制前台顯示。

## Google Drive

每一個活動相簿對應一個 Google Drive folderId。Apps Script 只讀該資料夾第一層圖片，不會自動讀取子資料夾。

## 資料流

### 首頁

```text
index.html → config.js + assets/app.js → apiBaseUrl?action=albums → Apps Script → Google Sheet + Google Drive → 回傳 albums → 顯示相簿卡片
```

首頁預設顯示 `分類 = 焦點活動` 的相簿。

### 活動回顧頁

```text
使用者點擊「活動回顧」→ ?category=活動回顧 → assets/app.js → 篩選 albums → 顯示活動回顧 grid + 搜尋 / 排序工具
```

### 相簿詳情頁

```text
使用者點擊相簿 → ?album=BPK-01 → assets/app.js → apiBaseUrl?action=photos&albumId=BPK-01 → Apps Script → 指定 Drive folder → 回傳 photos → 顯示相片牆
```
