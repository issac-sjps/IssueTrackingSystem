// src/pages/HomePage.jsx
import { useEffect, useState } from 'react';
import { getPublicReports } from '../lib/firestore';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const CATEGORIES = ['設備故障', '環境問題', '安全疑慮', '服務問題', '其他'];

const CATEGORY_COLORS = {
  '設備故障': '#e74c3c',
  '環境問題': '#2ecc71',
  '安全疑慮': '#f39c12',
  '服務問題': '#4f8cff',
  '其他': '#8b90a8',
};

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return format(d, 'yyyy/MM/dd HH:mm', { locale: zhTW });
}

export default function HomePage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending'); // pending | resolved
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    getPublicReports().then(data => { setReports(data); setLoading(false); });
  }, []);

  const filtered = reports.filter(r => {
    if (r.status !== tab) return false;
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    }
    return true;
  });

  const pendingCount  = reports.filter(r => r.status === 'pending').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;

  return (
    <div className="page" style={{ paddingTop: 40 }}>
      {/* Header */}
      <div className="fade-in" style={{ marginBottom: 36 }}>
        <h1 style={{
          fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700,
          letterSpacing: '1px', marginBottom: 8,
        }}>問題回報公告欄</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>
          所有回報皆為匿名提交，管理員會盡快處理並更新狀態。
        </p>
      </div>

      {/* Stats bar */}
      <div className="fade-in" style={{
        display: 'flex', gap: 12, marginBottom: 24,
        flexWrap: 'wrap',
      }}>
        <StatChip label="待處理" value={pendingCount} color="var(--orange)" />
        <StatChip label="已解決" value={resolvedCount} color="var(--green)" />
        <StatChip label="總回報" value={reports.length} color="var(--accent)" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 1 }}>
        <TabBtn active={tab === 'pending'} onClick={() => setTab('pending')}>
          待處理 <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 10, fontSize: 11, background: 'rgba(243,156,18,0.15)', color: 'var(--orange)' }}>{pendingCount}</span>
        </TabBtn>
        <TabBtn active={tab === 'resolved'} onClick={() => setTab('resolved')}>
          已解決 <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 10, fontSize: 11, background: 'rgba(46,204,113,0.12)', color: 'var(--green)' }}>{resolvedCount}</span>
        </TabBtn>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="input" placeholder="搜尋回報內容..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180, maxWidth: 280 }}
        />
        <select className="select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 120 }}>
          <option value="all">所有分類</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 60 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 60, color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{tab === 'pending' ? '🎉' : '📭'}</div>
          <p>{tab === 'pending' ? '目前沒有待處理的回報' : '還沒有已解決的回報'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((r, i) => (
            <ReportCard key={r.id} report={r} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ report: r, index }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card fade-in" style={{
      animationDelay: `${index * 0.04}s`, cursor: 'pointer',
      borderColor: open ? 'var(--border2)' : 'var(--border)',
      transition: 'border-color 0.2s',
    }} onClick={() => setOpen(!open)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <CategoryDot category={r.category} />
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{r.category}</span>
            <span className={`badge badge-${r.status}`}>
              {r.status === 'pending' ? '⏳ 處理中' : '✅ 已解決'}
            </span>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>{r.title}</h3>
          {!open && <p style={{ fontSize: 13, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</p>}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{formatDate(r.createdAt)}</p>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{open ? '▲ 收起' : '▼ 展開'}</p>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}
          onClick={e => e.stopPropagation()}>
          <p style={{ fontSize: 14, color: 'var(--text2)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{r.description}</p>

          {r.adminReply && (
            <div style={{
              marginTop: 16,
              padding: '12px 16px',
              background: 'rgba(46,204,113,0.06)',
              border: '1px solid rgba(46,204,113,0.2)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <p style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, marginBottom: 6 }}>✅ 管理員回覆</p>
              <p style={{ fontSize: 14, color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{r.adminReply}</p>
              {r.resolvedAt && (
                <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
                  解決時間：{formatDate(r.resolvedAt)}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryDot({ category }) {
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%',
      background: CATEGORY_COLORS[category] || 'var(--text3)',
      flexShrink: 0,
    }} />
  );
}

function StatChip({ label, value, color }) {
  return (
    <div style={{
      padding: '8px 16px',
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>{value}</span>
      <span style={{ fontSize: 13, color: 'var(--text2)' }}>{label}</span>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      padding: '8px 16px', fontSize: 14, fontWeight: 500,
      color: active ? 'var(--accent)' : 'var(--text2)',
      borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
      marginBottom: -1,
      transition: 'all 0.15s',
      display: 'flex', alignItems: 'center',
    }}>{children}</button>
  );
}
