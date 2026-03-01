// src/pages/AdminPage.jsx
import { useEffect, useState } from 'react';
import { getAdminReports, getStats, resolveReport, updateReply } from '../lib/firestore';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useToast } from '../components/ToastProvider';

const PIE_COLORS = ['#e74c3c','#2ecc71','#f39c12','#4f8cff','#8b90a8'];

function fmt(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return format(d, 'yyyy/MM/dd HH:mm', { locale: zhTW });
}

// ─────────────────────────────────────────────────────────────
export default function AdminPage() {
  const toast = useToast();
  const [tab, setTab] = useState('dashboard'); // dashboard | reports
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const [r, s] = await Promise.all([getAdminReports(), getStats()]);
    setReports(r);
    setStats(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = reports.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.title.toLowerCase().includes(q) ||
             r.ip?.includes(q) ||
             r.location?.city?.includes(q);
    }
    return true;
  });

  return (
    <div className="page-wide" style={{ paddingTop: 32 }}>
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, letterSpacing: '1px' }}>後台管理</h1>
          <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>問題回報系統 · 管理員專區</p>
        </div>
        <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={load}>🔄 刷新</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 1 }}>
        <AdminTab active={tab === 'dashboard'} onClick={() => setTab('dashboard')}>📊 統計儀表板</AdminTab>
        <AdminTab active={tab === 'reports'} onClick={() => setTab('reports')}>
          📋 回報管理
          <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 10, fontSize: 11,
            background: 'rgba(243,156,18,0.15)', color: 'var(--orange)' }}>
            {reports.filter(r => r.status === 'pending').length}
          </span>
        </AdminTab>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}><div className="spinner" /></div>
      ) : tab === 'dashboard' ? (
        <Dashboard stats={stats} />
      ) : (
        <ReportList
          reports={filtered}
          allReports={reports}
          search={search} setSearch={setSearch}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          onReload={load}
          toast={toast}
        />
      )}
    </div>
  );
}

// ─── 統計儀表板 ───────────────────────────────────────────────
function Dashboard({ stats }) {
  if (!stats) return null;

  return (
    <div className="fade-in">
      {/* 總覽卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <BigStat label="本週回報" value={stats.thisWeek} color="var(--accent)" icon="📅" />
        <BigStat label="本月回報" value={stats.thisMonth} color="var(--orange)" icon="📆" />
        <BigStat label="歷史總回報" value={stats.total} color="var(--text)" icon="📊" />
        <BigStat label="待處理" value={stats.pending} color="var(--orange)" icon="⏳" />
        <BigStat label="已解決" value={stats.resolved} color="var(--green)" icon="✅" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* 每日趨勢 */}
        <div className="card">
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>過去 7 天趨勢</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.dailyChart} margin={{ top: 0, bottom: 0, left: -20, right: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} />
              <Bar dataKey="count" name="回報數" fill="var(--accent)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 分類分佈 */}
        <div className="card">
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>分類分佈</h3>
          {stats.categoryChart.length === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>無資料</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={stats.categoryChart} cx="50%" cy="50%" outerRadius={70} dataKey="value" nameKey="name">
                  {stats.categoryChart.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {stats.categoryChart.map((c, i) => (
              <span key={c.name} style={{ fontSize: 11, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], display: 'inline-block' }} />
                {c.name} ({c.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* 時段分佈 */}
        <div className="card">
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>24 小時回報時段</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats.hourChart} margin={{ top: 0, bottom: 0, left: -20, right: 0 }}>
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false}
                tickFormatter={v => v.split(':')[0]} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} />
              <Bar dataKey="count" name="回報數" fill="var(--orange)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 地點 Top 5 */}
        <div className="card">
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>回報來源前 5 城市</h3>
          {stats.locationTop.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>無資料</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.locationTop.map((loc, i) => (
                <div key={loc.city} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)', width: 16, textAlign: 'right' }}>#{i+1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 13 }}>{loc.city}</span>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{loc.count}</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        background: `hsl(${220 + i * 20}, 70%, 60%)`,
                        width: `${(loc.count / stats.locationTop[0].count) * 100}%`,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 回報管理列表 ─────────────────────────────────────────────
function ReportList({ reports, allReports, search, setSearch, statusFilter, setStatusFilter, onReload, toast }) {
  const [selectedId, setSelectedId] = useState(null);
  const selected = reports.find(r => r.id === selectedId) || null;

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 16, minHeight: 500 }}>
      {/* Left: list */}
      <div>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <input className="input" placeholder="搜尋標題、IP、城市..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 180 }} />
          <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 110 }}>
            <option value="all">全部狀態</option>
            <option value="pending">待處理</option>
            <option value="resolved">已解決</option>
          </select>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
          顯示 {reports.length} / {allReports.length} 筆
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reports.length === 0 ? (
            <p style={{ color: 'var(--text3)', textAlign: 'center', marginTop: 40 }}>沒有符合條件的回報</p>
          ) : reports.map(r => (
            <div key={r.id}
              className="card"
              onClick={() => setSelectedId(r.id === selectedId ? null : r.id)}
              style={{
                cursor: 'pointer',
                borderColor: selectedId === r.id ? 'var(--accent)' : 'var(--border)',
                padding: '14px 16px',
                transition: 'border-color 0.15s',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                    <span className={`badge badge-${r.status}`} style={{ fontSize: 11 }}>
                      {r.status === 'pending' ? '⏳ 待處理' : '✅ 已解決'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: 10 }}>
                      {r.category}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                    {r.ip} · {r.location?.city || '未知'} · {fmt(r.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: detail panel */}
      <div>
        {selected ? (
          <ReportDetail report={selected} onReload={onReload} toast={toast} onClose={() => setSelectedId(null)} />
        ) : (
          <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>← 點擊左側回報查看詳情</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 回報詳情 + 回覆 ──────────────────────────────────────────
function ReportDetail({ report: r, onReload, toast, onClose }) {
  const [reply, setReply] = useState(r.adminReply || '');
  const [saving, setSaving] = useState(false);

  const handleResolve = async () => {
    if (!reply.trim()) { toast('請填寫回覆內容', 'error'); return; }
    setSaving(true);
    try {
      await resolveReport(r.id, reply);
      toast('已標記為已解決');
      onReload();
    } catch { toast('操作失敗', 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveReply = async () => {
    setSaving(true);
    try {
      await updateReply(r.id, reply);
      toast('回覆已儲存');
      onReload();
    } catch { toast('儲存失敗', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="card fade-in" style={{ position: 'sticky', top: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700 }}>回報詳情</h3>
        <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={onClose}>✕</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <span className={`badge badge-${r.status}`}>{r.status === 'pending' ? '⏳ 待處理' : '✅ 已解決'}</span>
        <span style={{ fontSize: 12, color: 'var(--text3)', background: 'var(--bg3)', padding: '3px 10px', borderRadius: 10 }}>{r.category}</span>
      </div>

      <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{r.title}</h4>
      <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 16, whiteSpace: 'pre-wrap' }}>{r.description}</p>

      <hr style={{ marginBottom: 14 }} />

      {/* IP 資訊 */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>回報者資訊</p>
        <InfoRow label="IP 位址" value={r.ip} mono />
        <InfoRow label="城市" value={r.location?.city} />
        <InfoRow label="地區" value={r.location?.region} />
        <InfoRow label="國家" value={r.location?.country} />
        <InfoRow label="提交時間" value={fmt(r.createdAt)} mono />
        {r.resolvedAt && <InfoRow label="解決時間" value={fmt(r.resolvedAt)} mono />}
      </div>

      <hr style={{ marginBottom: 14 }} />

      {/* 回覆區 */}
      <div>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>管理員回覆</p>
        <textarea className="textarea"
          placeholder="輸入回覆內容，告知使用者處理進度或結果..."
          value={reply} onChange={e => setReply(e.target.value)}
          style={{ minHeight: 100, marginBottom: 10 }} />

        <div style={{ display: 'flex', gap: 8 }}>
          {r.status === 'pending' && (
            <button className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}
              onClick={handleResolve} disabled={saving}>
              {saving ? <div className="spinner" style={{ width: 14, height: 14 }} /> : '✅ 標記已解決'}
            </button>
          )}
          <button className="btn btn-ghost" style={{ flex: r.status === 'resolved' ? 1 : 0, justifyContent: 'center', padding: '9px 14px' }}
            onClick={handleSaveReply} disabled={saving}>
            💾 {r.status === 'resolved' ? '更新回覆' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 小元件 ───────────────────────────────────────────────────
function BigStat({ label, value, color, icon }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, gap: 10 }}>
      <span style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: 12, color: 'var(--text)',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
        textAlign: 'right', wordBreak: 'break-all',
      }}>{value || '—'}</span>
    </div>
  );
}

function AdminTab({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      padding: '8px 18px', fontSize: 14, fontWeight: 500,
      color: active ? 'var(--accent)' : 'var(--text2)',
      borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
      marginBottom: -1, transition: 'all 0.15s',
      display: 'flex', alignItems: 'center',
    }}>{children}</button>
  );
}
