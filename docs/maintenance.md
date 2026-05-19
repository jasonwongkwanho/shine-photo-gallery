# 日常維護流程

## 新增活動相簿

1. 在 Google Drive 建立新的活動相片資料夾。
2. 將已審核、適合公開展示的相片放入該資料夾。
3. 複製 Google Drive folder ID。
4. 在 Google Sheet `Albums` 工作頁新增一行。
5. 填寫以下資料：
   - 相簿代號
   - 相簿名稱
   - 資料夾ID
   - 分類
   - 活動日期
   - 相簿簡介
   - 封面圖片ID（可留空）
   - 公開顯示
   - 內部備註
6. 在 `分類` 欄填寫 `焦點活動` 或 `活動回顧`。
7. 勾選 `公開顯示`。
8. 重新整理 GitHub Pages 網站。

## 修改相簿資料

直接在 Google Sheet `Albums` 工作頁修改即可。

常見修改：

| 修改內容 | 修改位置 |
|---|---|
| 相簿名稱 | `相簿名稱` 欄 |
| 相簿分類 | `分類` 欄 |
| 活動日期 | `活動日期` 欄 |
| 相簿簡介 | `相簿簡介` 欄 |
| 是否公開 | `公開顯示` 欄 |
| 封面圖片 | `封面圖片ID` 欄 |

## 調整分類

前台分類來自 GitHub `config.js`：

```javascript
focusCategory: "焦點活動",
reviewCategory: "活動回顧",
categories: ["焦點活動", "活動回顧"]
```

目前欄 D `分類` 只用作前台分流：

| 分類 | 前台位置 |
|---|---|
| `焦點活動` | 首頁焦點活動區 |
| `活動回顧` | 活動回顧頁 |

如日後要新增第三個前台分類，需要同步更新 `config.js`、`assets/app.js` 顯示邏輯，以及 Google Sheet `分類` 欄的填寫規則。

## 相片管理

- 相片不應直接放入 GitHub repo。
- 相片應放在 Google Drive 對應活動資料夾。
- 如需要更換封面，可在 `封面圖片ID` 填入指定圖片的 file ID。
- 若 `封面圖片ID` 留空，系統會使用該資料夾中的第一張圖片作封面。

## 焦點活動管理

首頁「焦點活動」會顯示所有 `分類 = 焦點活動` 且 `公開顯示 = TRUE` 的相簿。

- 排序後第一個焦點相簿會以大型 headline card 顯示。
- 其他焦點相簿會以 focus card 顯示。
- 如要把相簿移到活動回顧，將 `分類` 改為 `活動回顧`。
- 舊有 `精選活動` 欄不再控制前台顯示。

## 隱藏相簿

取消勾選 `公開顯示`，該相簿便不會在網站顯示。

## 更新前台設計

如要改：

- 顏色
- 字體
- 卡片設計
- Hero 背景
- 相片牆版面
- 搜尋器或篩選器

請修改：

```text
assets/styles.css
assets/app.js
index.html（只在需要調整 HTML 結構時）
```

## 更新 Apps Script

如要改：

- Google Sheet 欄名
- 讀取 Google Drive 的方式
- API action
- 日期排序邏輯
- JSONP 輸出方式

請修改：

```text
apps-script/Code.gs
```

修改後需要手動貼到 Google Apps Script，並重新部署現有 Web App。
