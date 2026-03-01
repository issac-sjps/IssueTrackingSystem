// src/pages/ReportPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitReport, checkRateLimit } from '../lib/firestore';
import { getIpInfo } from '../lib/geo';
import { sendNewReportEmail } from '../lib/email';
import { useToast } from '../components/ToastProvider';

const CATEGORIES = ['設備故障', '環境問題', '安全疑慮', '服務問題', '其他'];

export default function ReportPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.category) {
      toast('請填寫所有欄位', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { ip, location } = await getIpInfo();

      const allowed = await checkRateLimit(ip);
      if (!allowed) {
        toast('您提交太頻繁，請稍後再試（每小時上限 3 次）', 'error');
        setSubmitting(false);
        return;
      }

      await submitReport({ ...form, ip, location });

      // 發送 Email 通知（失敗不影響提交）
      const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
      sendNewReportEmail({ ...form, ip, location, createdAt: now });

      setDone(true);
      toast('回報已成功提交！');
    } catch (err) {
      console.error(err);
      toast('提交失敗，請稍後再試', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="page fade-in" style={{ paddingTop: 80, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>回報已提交！</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 32, fontSize: 15 }}>
          感謝您的回報，管理員會盡快處理並更新狀態。<br />
          您可以在首頁查看回報的處理進度。
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/')}>查看所有回報</button>
          <button className="btn btn-ghost" onClick={() => { setDone(false); setForm({ title: '', description: '', category: '' }); }}>
            再次提交
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page fade-in" style={{ paddingTop: 40 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, letterSpacing: '1px', marginBottom: 8 }}>
          提交回報
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>
          所有回報均為匿名，請盡量詳細描述問題，以便管理員快速處理。
        </p>
      </div>

      <div style={{
        padding: '12px 16px', marginBottom: 24,
        background: 'rgba(79,140,255,0.06)',
        border: '1px solid rgba(79,140,255,0.2)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 13, color: 'var(--accent)',
      }}>
        🔒 本系統不會收集您的個人身份資訊，僅記錄 IP 地址用於防止濫用（不對外公開）
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>問題分類 *</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button type="button" key={cat}
                  onClick={() => set('category', cat)}
                  style={{
                    padding: '7px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                    border: `1px solid ${form.category === cat ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.category === cat ? 'rgba(79,140,255,0.12)' : 'var(--bg3)',
                    color: form.category === cat ? 'var(--accent)' : 'var(--text2)',
                    transition: 'all 0.15s',
                  }}
                >{cat}</button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>問題標題 *</label>
            <input className="input" placeholder="簡短描述問題（例如：洗手間水龍頭漏水）"
              value={form.title} onChange={e => set('title', e.target.value)} maxLength={80} />
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{form.title.length}/80</p>
          </div>

          <div className="form-group">
            <label>詳細說明 *</label>
            <textarea className="textarea"
              placeholder="請詳細描述問題的位置、情況、發生時間等資訊..."
              value={form.description} onChange={e => set('description', e.target.value)}
              maxLength={1000} style={{ minHeight: 130 }} />
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{form.description.length}/1000</p>
          </div>

          <button type="submit" className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            disabled={submitting}>
            {submitting
              ? <><div className="spinner" style={{ width: 16, height: 16 }} /> 提交中...</>
              : '📤 提交回報'}
          </button>
        </form>
      </div>
    </div>
  );
}
