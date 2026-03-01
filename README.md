# 匿名問題回報系統 — GitHub Pages 部署指南

**技術架構：** React + Vite · Firebase Firestore + Auth · EmailJS · GitHub Pages

---

## 🚀 部署步驟（共 5 步）

### 第 1 步：建立 Firebase 專案

1. 前往 https://console.firebase.google.com → 新增專案
2. **Authentication** → 開始使用 → 啟用「Google」登入
3. **Firestore Database** → 建立資料庫 → 選「生產模式」→ 地區選 `asia-east1`

---

### 第 2 步：填入 Firebase 設定

開啟 `src/lib/firebase.js`，填入兩個地方：

**① Firebase 設定（Firebase Console → 專案設定 → 你的應用程式）：**
```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  // ...其餘欄位
};
```

**② 你的管理員 Google UID：**
```js
export const ADMIN_UID = "你的UID";
```

> 如何取得 UID：先把程式跑起來，用你的 Google 帳號登入一次，
> 然後到 Firebase Console → Authentication → Users → 複製 UID

同樣，把 `firestore.rules` 裡的 `YOUR_ADMIN_UID` 換成你的 UID，
然後到 Firebase Console → Firestore → 規則 → 貼上並發布。

---

### 第 3 步：設定 EmailJS（新回報 Email 通知）

1. 前往 https://www.emailjs.com 免費註冊
2. **Add New Service** → 選 Gmail → 連結你的信箱
3. **Email Templates** → Create New Template，範本內容：

   主旨：`【新回報】{{report_category}} - {{report_title}}`

   內文：
   ```
   分類：{{report_category}}
   標題：{{report_title}}
   內容：{{report_desc}}
   IP：{{report_ip}} / {{report_city}}, {{report_region}}
   時間：{{report_time}}
   ```

4. **Account → API Keys** → 複製 Public Key
5. 開啟 `src/lib/email.js`，填入三個值：
   ```js
   const SERVICE_ID  = 'service_xxxxxx';
   const TEMPLATE_ID = 'template_xxxxxx';
   const PUBLIC_KEY  = 'xxxxxxxxxxxxxx';
   ```

---

### 第 4 步：設定 GitHub Pages + repo 名稱

1. 把這個資料夾上傳到 GitHub，建立新 repo（例如命名 `report-system`）
2. 開啟 `vite.config.js`，確認 `base` 跟你的 repo 名稱一致：
   ```js
   base: '/report-system/',  // 改成你的 repo 名稱
   ```
3. GitHub repo → **Settings → Pages** → Source 選 **GitHub Actions**

---

### 第 5 步：Push 並自動部署

```bash
git add .
git commit -m "init"
git push origin main
```

Actions 約 1-2 分鐘後完成，網址：`https://你的帳號.github.io/report-system/`

---

## ✅ 部署後驗證

| 測試 | 預期 |
|------|------|
| 開啟首頁 | 看到「問題回報公告欄」 |
| 提交回報 | 送出後約 30 秒收到 Email |
| 前往 `/#/admin/login` | 顯示 Google 登入 |
| 管理員登入 | 進入後台儀表板 |
| 後台標記已解決 | 首頁移至已解決分頁 |

---

## 📁 需要修改的檔案（共 3 個）

| 檔案 | 修改內容 |
|------|---------|
| `src/lib/firebase.js` | firebaseConfig + ADMIN_UID |
| `src/lib/email.js` | EmailJS 三個 ID |
| `vite.config.js` | base 改成你的 repo 名稱 |
| `firestore.rules` | YOUR_ADMIN_UID（貼到 Firebase Console） |

---

## ⚠️ 注意事項

- Firebase API Key 公開在前端是正常的，安全性由 `firestore.rules` 控制
- 路由使用 HashRouter，網址格式為 `/#/report`、`/#/admin`
- EmailJS 免費版每月 200 封通知
