# 資料模型

## Google Sheet

試算表名稱：`尚計劃活動相簿資料庫`

主要工作頁：`Albums`

每一行代表一個活動相簿。

## 欄位設計

| 欄 | 中文欄名 | 作用 | 建議格式 |
|---|---|---|---|
| A | 相簿代號 | 相簿唯一識別碼 | `BPK-01`、`BPK-2026-01` |
| B | 相簿名稱 | 網站顯示的活動相簿名稱 | `2026 潮州節` |
| C | 資料夾ID | Google Drive folder ID | 只貼 ID，不貼整條網址 |
| D | 分類 | 前台篩選分類 | 必須配合 `config.js` 的 categories |
| E | 活動日期 | 活動日期，用作排序及顯示 | 建議 `YYYY-MM-DD` |
| F | 相簿簡介 | 首頁相簿卡片簡介 | 1 至 2 句 |
| G | 封面圖片ID | 指定封面圖片 file ID | 可留空 |
| H | 公開顯示 | 是否顯示在網站 | checkbox / TRUE |
| I | 內部備註 | 管理用備註 | 不會在前台顯示 |

## 欄位規則

### 相簿代號

- 必須唯一。
- 建議只使用英文字母、數字及 `-`。
- 前台相簿頁網址會使用此值：

```text
?album=BPK-01
```

### 資料夾ID

Google Drive folder 網址通常是：

```text
https://drive.google.com/drive/folders/XXXXXXXXXXXX
```

或：

```text
https://drive.google.com/open?id=XXXXXXXXXXXX
```

`資料夾ID` 只填入 `XXXXXXXXXXXX` 部分。

### 活動日期

建議使用：

```text
YYYY-MM-DD
```

例如：

```text
2026-05-24
```

前台會以 `YYYY-MM-DD` 顯示，並按日期由新至舊排序。

### 公開顯示

- 勾選：顯示於網站。
- 不勾選：不顯示於網站。

## 分類設定

前台分類由 `config.js` 控制，欄 D `分類` 是唯一分流欄位：

```javascript
focusCategory: "焦點活動",
reviewCategory: "活動回顧",
categories: ["焦點活動", "活動回顧"]
```

Google Sheet `分類` 欄必須填寫以下其中一項：

| 分類 | 顯示位置 |
|---|---|
| `焦點活動` | 首頁焦點區。第一個相簿以大型 headline card 顯示，其餘以 focus card 顯示。 |
| `活動回顧` | 活動回顧頁。顯示相簿 grid，並提供搜尋及排序。 |

舊有 `精選活動` 欄不再用作前台顯示判斷。Apps Script 目前仍可相容讀取此欄，但不是必需欄位。

## Google Drive 相片規則

- 每個活動相簿對應一個 Google Drive folder。
- Apps Script 只讀取該 folder 第一層圖片。
- 不會自動讀取子資料夾。
- 如需要公開展示，資料夾或相片需設定為可被公開讀取。
