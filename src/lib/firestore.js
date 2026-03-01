// src/lib/firestore.js
import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, query, orderBy, where, Timestamp,
  limit, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const REPORTS_COL = 'reports';

// ── 提交新回報（前台） ──────────────────────────────────────
export async function submitReport({ title, description, category, ip, location }) {
  const ref = await addDoc(collection(db, REPORTS_COL), {
    title,
    description,
    category,
    status: 'pending',           // pending | resolved
    ip,
    location,                    // { city, region, country }
    adminReply: '',
    resolvedAt: null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── 檢查 IP 提交頻率限制（每小時最多 3 次） ────────────────
export async function checkRateLimit(ip) {
  const oneHourAgo = Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000));
  const q = query(
    collection(db, REPORTS_COL),
    where('ip', '==', ip),
    where('createdAt', '>=', oneHourAgo)
  );
  const snap = await getDocs(q);
  return snap.size < 3; // true = 允許提交
}

// ── 取得所有回報（前台公開用，不含 IP） ────────────────────
export async function getPublicReports() {
  const q = query(collection(db, REPORTS_COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title,
      description: data.description,
      category: data.category,
      status: data.status,
      adminReply: data.adminReply,
      resolvedAt: data.resolvedAt,
      createdAt: data.createdAt,
    };
  });
}

// ── 取得所有回報（後台，含 IP 與地點） ────────────────────
export async function getAdminReports() {
  const q = query(collection(db, REPORTS_COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── 管理員回覆並標記狀態 ───────────────────────────────────
export async function resolveReport(reportId, adminReply) {
  const ref = doc(db, REPORTS_COL, reportId);
  await updateDoc(ref, {
    adminReply,
    status: 'resolved',
    resolvedAt: serverTimestamp(),
  });
}

// ── 更新回覆（不改變狀態）─────────────────────────────────
export async function updateReply(reportId, adminReply) {
  const ref = doc(db, REPORTS_COL, reportId);
  await updateDoc(ref, { adminReply });
}

// ── 統計資料 ───────────────────────────────────────────────
export async function getStats() {
  const now = new Date();

  // 本自然週：週一 00:00 到現在
  const dayOfWeek = now.getDay(); // 0=週日
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diffToMonday);
  weekStart.setHours(0, 0, 0, 0);

  // 本月：1 號 00:00 到現在
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [weekSnap, monthSnap, allSnap] = await Promise.all([
    getDocs(query(collection(db, REPORTS_COL), where('createdAt', '>=', Timestamp.fromDate(weekStart)))),
    getDocs(query(collection(db, REPORTS_COL), where('createdAt', '>=', Timestamp.fromDate(monthStart)))),
    getDocs(collection(db, REPORTS_COL)),
  ]);

  // 每日分佈（過去 7 天）
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const dailyMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    dailyMap[key] = 0;
  }

  allSnap.docs.forEach(d => {
    const ts = d.data().createdAt?.toDate();
    if (!ts || ts < sevenDaysAgo) return;
    const key = `${ts.getMonth() + 1}/${ts.getDate()}`;
    if (key in dailyMap) dailyMap[key]++;
  });

  const dailyChart = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

  // 分類分佈
  const categoryMap = {};
  allSnap.docs.forEach(d => {
    const cat = d.data().category || '其他';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryChart = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // 時段分佈（0-23 小時）
  const hourMap = Array(24).fill(0);
  allSnap.docs.forEach(d => {
    const ts = d.data().createdAt?.toDate();
    if (ts) hourMap[ts.getHours()]++;
  });
  const hourChart = hourMap.map((count, hour) => ({ hour: `${hour}:00`, count }));

  // 地點 Top 5
  const locationMap = {};
  allSnap.docs.forEach(d => {
    const loc = d.data().location?.city || '未知';
    locationMap[loc] = (locationMap[loc] || 0) + 1;
  });
  const locationTop = Object.entries(locationMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([city, count]) => ({ city, count }));

  return {
    thisWeek: weekSnap.size,
    thisMonth: monthSnap.size,
    total: allSnap.size,
    pending: allSnap.docs.filter(d => d.data().status === 'pending').size,
    resolved: allSnap.docs.filter(d => d.data().status === 'resolved').length,
    dailyChart,
    categoryChart,
    hourChart,
    locationTop,
  };
}
