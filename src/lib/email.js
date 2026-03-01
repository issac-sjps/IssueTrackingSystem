// src/lib/email.js
// 使用 EmailJS 從前端發送 Email 通知（無需後端）
// 每月免費 200 封，足夠一般使用

import emailjs from '@emailjs/browser';

// ⚠️ 前往 https://www.emailjs.com 註冊後填入以下三個值
// EmailJS Console > Account > API Keys
const SERVICE_ID  = 'YOUR_EMAILJS_SERVICE_ID';   // 例如 service_abc123
const TEMPLATE_ID = 'YOUR_EMAILJS_TEMPLATE_ID';  // 例如 template_xyz789
const PUBLIC_KEY  = 'YOUR_EMAILJS_PUBLIC_KEY';   // 例如 abcDEFghiJKL

export async function sendNewReportEmail({ title, category, description, ip, location, createdAt }) {
  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        report_title:    title,
        report_category: category,
        report_desc:     description,
        report_ip:       ip,
        report_city:     location?.city  || '未知',
        report_region:   location?.region || '未知',
        report_time:     createdAt,
      },
      PUBLIC_KEY
    );
    console.log('Email 通知已發送');
  } catch (err) {
    // Email 失敗不影響提交流程，只記 log
    console.warn('Email 通知失敗（不影響回報提交）：', err);
  }
}

// ── EmailJS Template 設定說明 ────────────────────────────────
// 在 EmailJS Console > Email Templates 建立模板，內容範例：
//
// 主旨：【新回報】{{report_category}} - {{report_title}}
//
// 內文：
// 有新的問題回報！
//
// 分類：{{report_category}}
// 標題：{{report_title}}
// 內容：{{report_desc}}
// IP：{{report_ip}}
// 城市：{{report_city}}, {{report_region}}
// 時間：{{report_time}}
//
// 請前往後台處理：https://你的帳號.github.io/report-system/admin
