import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Plus, LogOut, Sprout, PackageCheck, Scissors, LayoutDashboard, Settings } from 'lucide-react';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// スマホ判定hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// CSVエクスポートユーティリティ
function exportCSV(rows, filename) {
  if (!rows.length) { alert('エクスポートするデータがありません'); return; }
  const headers = Object.keys(rows[0]);
  const escape = v => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// 場所マスター（フォールバック用静的定義）
// ============================================================
const WASABI_AREAS_FALLBACK = {
  '越沢': ['越沢05-04', '越沢05-05', '越沢06-01', '越沢06-06', '越沢07-01', '越沢07-04', '越沢10-03', '越沢（詳細不明）', 'メイン横のわさび田', 'メイン横のわさび田（新しく直した所）', 'メイン横のわさび田（新しく直した所） (1)', 'キッチン横', '木が倒れている場所'],
  '寸庭': ['1段目', '2段目'],
  '小中沢': [],
  '青梅': [],
  '栃寄': ['1', '2', '3', '4', '5', '6'],
};
const AREA_NAMES_FALLBACK = Object.keys(WASABI_AREAS_FALLBACK);

const PROCESSING_PARTS = ['花', '茎・葉', '茎', '葉', '根茎'];


// ============================================================
// スタイル
// ============================================================
const S = {
  app: { minHeight: '100vh', backgroundColor: '#f0faf4', fontFamily: "'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif" },
  header: { background: 'linear-gradient(135deg,#1b4332 0%,#2d6a4f 100%)', boxShadow: '0 2px 12px rgba(27,67,50,0.25)', position: 'sticky', top: 0, zIndex: 100 },
  headerInner: { maxWidth: 1200, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  headerBrand: { display: 'flex', alignItems: 'center', gap: 12 },
  headerTitle: { color: '#d8f3dc', fontSize: 18, fontWeight: 700 },
  headerSub: { color: '#74c69d', fontSize: 11, letterSpacing: '0.05em' },
  headerUser: { display: 'flex', alignItems: 'center', gap: 12 },
  headerEmail: { color: '#95d5b2', fontSize: 13 },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, color: '#d8f3dc', padding: '6px 14px', fontSize: 12, cursor: 'pointer' },
  nav: { background: '#fff', borderBottom: '1px solid #d8f3dc', boxShadow: '0 1px 4px rgba(45,106,79,0.08)' },
  navInner: { maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', overflowX: 'auto' },
  navBtn: { position: 'relative', display: 'flex', alignItems: 'center', gap: 7, padding: '14px 18px', border: 'none', background: 'none', color: '#74c69d', fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' },
  navBtnActive: { color: '#1b4332', fontWeight: 700 },
  navIndicator: { position: 'absolute', bottom: 0, left: 10, right: 10, height: 3, borderRadius: '3px 3px 0 0', background: 'linear-gradient(90deg,#2d6a4f,#52b788)' },
  main: { maxWidth: 1200, margin: '0 auto', padding: '28px 20px 60px' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: 24 },
  pageHeader: { display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 4 },
  pageHeaderIcon: { fontSize: 36 },
  pageTitle: { fontSize: 22, fontWeight: 700, color: '#1b4332', margin: 0 },
  pageSubtitle: { fontSize: 13, color: '#52b788', margin: '2px 0 0' },
  formCard: { background: '#fff', borderRadius: 16, border: '1px solid #d8f3dc', overflow: 'hidden', boxShadow: '0 2px 8px rgba(45,106,79,0.06)' },
  formCardHeader: { background: 'linear-gradient(90deg,#f0faf4,#e8f5e9)', padding: '14px 24px', borderBottom: '1px solid #d8f3dc' },
  formCardTitle: { color: '#2d6a4f', fontWeight: 700, fontSize: 15, margin: 0 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, padding: '20px 24px' },
  fieldFull: { gridColumn: '1 / -1' },
  fieldLabel: { display: 'block', fontSize: 12, fontWeight: 600, color: '#40916c', marginBottom: 5 },
  toggleLink: { background: 'none', border: 'none', color: '#52b788', fontSize: 11, cursor: 'pointer', padding: 0, textDecoration: 'underline' },
  input: { width: '100%', boxSizing: 'border-box', border: '1.5px solid #b7e4c7', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: '#1b4332', background: '#f8fffe', outline: 'none' },
  select: { width: '100%', boxSizing: 'border-box', border: '1.5px solid #b7e4c7', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: '#1b4332', background: '#f8fffe', outline: 'none', cursor: 'pointer' },
  submitBtn: { margin: '0 24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#2d6a4f,#40916c)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', width: 'calc(100% - 48px)' },
  cancelBtn: { background: '#f0f0f0', border: 'none', borderRadius: 10, padding: '13px 20px', fontSize: 14, cursor: 'pointer', color: '#666' },
  autoFillBadge: { marginLeft: 8, background: '#d8f3dc', color: '#2d6a4f', borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 700 },
  totalPreview: { gridColumn: '1 / -1', background: 'linear-gradient(90deg,#f0faf4,#e8f5e9)', border: '1.5px solid #b7e4c7', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 13, color: '#40916c', fontWeight: 600 },
  totalValue: { fontSize: 22, fontWeight: 800, color: '#1b4332' },
  tableWrap: { overflowX: 'auto', borderRadius: 14, border: '1px solid #d8f3dc', boxShadow: '0 2px 8px rgba(45,106,79,0.06)', background: '#fff' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thead: { background: 'linear-gradient(90deg,#2d6a4f,#40916c)' },
  th: { padding: '12px 16px', color: '#d8f3dc', fontWeight: 600, fontSize: 12, textAlign: 'left', letterSpacing: '0.04em' },
  tr: {},
  td: { padding: '11px 16px', borderBottom: '1px solid #e8f5e9', verticalAlign: 'middle' },
  listHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#1b4332', margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
  countBadge: { background: '#d8f3dc', color: '#2d6a4f', borderRadius: 20, padding: '1px 10px', fontSize: 12, fontWeight: 600 },
  filterRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterBtn: { background: '#fff', border: '1.5px solid #b7e4c7', borderRadius: 20, color: '#52b788', padding: '4px 12px', fontSize: 12, cursor: 'pointer' },
  filterBtnActive: { background: 'linear-gradient(135deg,#2d6a4f,#40916c)', color: '#fff', border: '1.5px solid transparent' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 },
  statusDot: { width: 6, height: 6, borderRadius: '50%' },
  varietyBadge: { background: '#f0faf4', color: '#2d6a4f', border: '1px solid #b7e4c7', borderRadius: 6, padding: '2px 8px', fontSize: 12 },
  destTag: { background: '#d8f3dc', color: '#1b4332', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 },
  partBadge: { background: '#e8f5e9', color: '#2d6a4f', border: '1px solid #b7e4c7', borderRadius: 6, padding: '2px 8px', fontSize: 12 },
  yieldBadge: { border: '1.5px solid', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700, display: 'inline-block' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 },
  statCard: { background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 8px rgba(45,106,79,0.06)', border: '1px solid #d8f3dc' },
  statEmoji: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 800, lineHeight: 1.1 },
  statUnit: { fontSize: 13, fontWeight: 500, marginLeft: 3 },
  statLabel: { fontSize: 12, color: '#74c69d', marginTop: 4 },
  chartGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 },
  chartCard: { background: '#fff', borderRadius: 14, border: '1px solid #d8f3dc', padding: '20px 20px 16px', boxShadow: '0 2px 8px rgba(45,106,79,0.06)' },
  chartTitle: { fontSize: 14, fontWeight: 700, color: '#1b4332', margin: '0 0 14px' },
  editBtn: { background: '#f0faf4', border: '1px solid #b7e4c7', color: '#2d6a4f', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  deleteBtn: { background: '#fff0f0', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', background: '#f8fffe', borderRadius: 14, border: '1px dashed #b7e4c7' },
  emptyIcon: { fontSize: 32, marginBottom: 10, opacity: 0.5 },
  emptyText: { color: '#74c69d', fontSize: 14 },
  spinner: { width: 32, height: 32, border: '3px solid #d8f3dc', borderTop: '3px solid #2d6a4f', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  refreshBtn: { background: 'none', border: '1.5px solid #b7e4c7', color: '#40916c', borderRadius: 10, padding: '9px 20px', fontSize: 13, cursor: 'pointer', alignSelf: 'flex-start' },
  revenueSummary: { fontSize: 14, color: '#52b788' },
  // グループヘッダー
  groupHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'linear-gradient(90deg,#f0faf4,#fff)', cursor: 'pointer', borderBottom: '1px solid #e8f5e9' },
  groupLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  groupRight: { display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 },
  groupTitle: { fontSize: 14, fontWeight: 700, color: '#1b4332' },
  groupCount: { background: '#d8f3dc', color: '#2d6a4f', borderRadius: 20, padding: '1px 10px', fontSize: 11, fontWeight: 600 },
  chevron: { fontSize: 12, color: '#52b788', transition: 'transform 0.2s', display: 'inline-block' },
  // ビュー切り替え
  viewBtns: { display: 'flex', gap: 6 },
  viewBtn: { padding: '6px 14px', fontSize: 12, border: '1.5px solid #b7e4c7', borderRadius: 20, background: '#fff', color: '#52b788', cursor: 'pointer' },
  viewBtnActive: { background: 'linear-gradient(135deg,#2d6a4f,#40916c)', color: '#fff', border: '1.5px solid transparent' },
  // モーダル
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: 16, fontWeight: 700, color: '#1b4332', margin: '0 0 20px' },
  // マスター管理
  masterTabs: { display: 'flex', gap: 0, borderBottom: '1px solid #d8f3dc', marginBottom: 24 },
  masterTab: { padding: '10px 20px', fontSize: 13, border: 'none', background: 'none', color: '#74c69d', cursor: 'pointer', fontWeight: 500, borderBottom: '2px solid transparent' },
  masterTabActive: { color: '#1b4332', fontWeight: 700, borderBottom: '2px solid #2d6a4f' },
  // ログイン
  loginBg: { minHeight: '100vh', background: 'linear-gradient(160deg,#1b4332 0%,#2d6a4f 40%,#40916c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', fontFamily: "'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif" },
  loginCard: { background: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', position: 'relative', zIndex: 1 },
  loginHeader: { textAlign: 'center', marginBottom: 28 },
  loginEmoji: { fontSize: 48, marginBottom: 12 },
  loginTitle: { fontSize: 24, fontWeight: 800, color: '#1b4332', margin: '0 0 4px' },
  loginSubtitle: { fontSize: 12, color: '#74c69d', letterSpacing: '0.08em', margin: 0 },
  loginForm: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 },
  primaryBtn: { background: 'linear-gradient(135deg,#2d6a4f,#40916c)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  textBtn: { background: 'none', border: 'none', color: '#52b788', fontSize: 13, cursor: 'pointer', padding: '4px 0' },
  divider: { position: 'relative', textAlign: 'center', borderTop: '1px solid #d8f3dc', marginBottom: 16 },
  dividerText: { position: 'relative', top: '-10px', background: '#fff', padding: '0 12px', fontSize: 12, color: '#74c69d' },
  googleBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#fff', border: '2px solid #b7e4c7', borderRadius: 10, color: '#2d6a4f', padding: '12px 20px', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  msgBox: { padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, textAlign: 'center' },
  msgSuccess: { background: '#d8f3dc', color: '#1b4332' },
  msgError: { background: '#fee2e2', color: '#991b1b' },
  loadingScreen: { minHeight: '100vh', background: 'linear-gradient(135deg,#d8f3dc 0%,#b7e4c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadingContent: { textAlign: 'center' },
  loadingLeaf: { fontSize: 52, marginBottom: 16 },
  loadingText: { color: '#40916c', fontSize: 14 },
  // モバイルカード
  mobileCard: { background: '#fff', borderRadius: 12, border: '1px solid #d8f3dc', padding: '12px 14px', boxShadow: '0 1px 4px rgba(45,106,79,0.06)' },
  mobileCardField: { display: 'flex', flexDirection: 'column', gap: 2 },
  mobileCardKey: { fontSize: 11, color: '#74c69d', fontWeight: 600 },
  mobileCardVal: { fontSize: 13, color: '#1b4332' },
  mobileCardActions: { display: 'flex', gap: 8, marginTop: 10, borderTop: '1px solid #e8f5e9', paddingTop: 10 },
  csvBtn: { background: '#fff', border: '1.5px solid #b7e4c7', color: '#2d6a4f', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
};

const statusColors = {
  '生育中': { bg: '#d8f3dc', text: '#1b4332', dot: '#52b788' },
  '収穫可能': { bg: '#fff3cd', text: '#664d03', dot: '#ffc107' },
  '収穫済': { bg: '#e2e3e5', text: '#41464b', dot: '#6c757d' },
  '廃棄': { bg: '#f8d7da', text: '#842029', dot: '#dc3545' },
};

// ============================================================
// メインコンポーネント
// ============================================================
export default function WasabiApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={S.loadingScreen}>
      <div style={S.loadingContent}>
        <div style={S.loadingLeaf}>🌿</div>
        <p style={S.loadingText}>読み込み中...</p>
      </div>
    </div>
  );

  if (!user) return <LoginPage />;

  const tabs = [
    { id: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
    { id: 'planting', label: '植え付け', icon: Sprout },
    { id: 'shipment', label: '出荷', icon: PackageCheck },
    { id: 'processing', label: '加工', icon: Scissors },
    { id: 'master', label: 'マスター管理', icon: Settings },
  ];

  return (
    <div style={S.app}>
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={S.headerBrand}>
            <div style={{ fontSize: 28 }}>🌿</div>
            <div>
              <div style={S.headerTitle}>わさび田管理</div>
              <div style={S.headerSub}>Farm Management System</div>
            </div>
          </div>
          <div style={S.headerUser}>
            <span style={S.headerEmail}>{user.email?.split('@')[0]}</span>
            <button style={S.logoutBtn} onClick={() => supabase.auth.signOut()}>
              <LogOut size={14} /><span>ログアウト</span>
            </button>
          </div>
        </div>
      </header>

      <nav style={S.nav}>
        <div style={S.navInner}>
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                style={{ ...S.navBtn, ...(active ? S.navBtnActive : {}) }}>
                <Icon size={16} />
                <span>{label}</span>
                {active && <div style={S.navIndicator} />}
              </button>
            );
          })}
        </div>
      </nav>

      <main style={S.main}>
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'planting' && <PlantingTab />}
        {activeTab === 'shipment' && <ShipmentTab />}
        {activeTab === 'processing' && <ProcessingTab />}
        {activeTab === 'master' && <MasterTab />}
      </main>
    </div>
  );
}

// ============================================================
// ログイン
// ============================================================
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault(); setLoading(true); setMessage('');
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        setMessage('success:メールを確認してください');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) { setMessage('error:' + err.message); }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) console.error(error);
  };

  const isSuccess = message.startsWith('success:');

  return (
    <div style={S.loginBg}>
      <div style={S.loginCard}>
        <div style={S.loginHeader}>
          <div style={S.loginEmoji}>🌿</div>
          <h1 style={S.loginTitle}>わさび田管理</h1>
          <p style={S.loginSubtitle}>Farm Management System</p>
        </div>
        {message && (
          <div style={{ ...S.msgBox, ...(isSuccess ? S.msgSuccess : S.msgError) }}>
            {isSuccess ? '✅ ' : '❌ '}{message.slice(message.indexOf(':') + 1)}
          </div>
        )}
        <form onSubmit={handleEmailAuth} style={S.loginForm}>
          <div><label style={S.fieldLabel}>メールアドレス</label>
            <input type="email" style={S.input} value={email} onChange={e => setEmail(e.target.value)} required placeholder="example@gmail.com" /></div>
          <div><label style={S.fieldLabel}>パスワード</label>
            <input type="password" style={S.input} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" /></div>
          <button type="submit" disabled={loading} style={S.primaryBtn}>
            {loading ? '処理中...' : isSignUp ? '新規登録' : 'ログイン'}
          </button>
          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }} style={S.textBtn}>
            {isSignUp ? 'ログインへ戻る' : '新規登録はこちら'}
          </button>
        </form>
        <div style={S.divider}><span style={S.dividerText}>または</span></div>
        <button onClick={handleGoogleLogin} style={S.googleBtn}>
          <span style={{ fontSize: 18 }}>G</span><span>Google でログイン</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================
// ダッシュボード
// ============================================================
function DashboardTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalPlantings: 0, totalShipments: 0, totalProcessing: 0, avgYield: 0 });

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [{ data: shipments }, { data: processing }, { data: plantings }] = await Promise.all([
        supabase.from('shipments').select('shipment_date,quantity,total_amount,destinations(name)'),
        supabase.from('processing').select('*'),
        supabase.from('plantings').select('*'),
      ]);

      const monthMap = {};
      (shipments || []).forEach(s => {
        const m = s.shipment_date?.slice(0, 7);
        if (m) monthMap[m] = (monthMap[m] || 0) + parseFloat(s.quantity || 0);
      });
      const monthlyData = Object.entries(monthMap).sort().map(([m, v]) => ({ month: m.slice(5) + '月', 出荷量: Math.round(v) }));

      const destMap = {};
      (shipments || []).forEach(s => {
        const name = s.destinations?.name || '不明';
        destMap[name] = (destMap[name] || 0) + parseFloat(s.quantity || 0);
      });
      const destData = Object.entries(destMap).map(([name, v]) => ({ name, 出荷量: Math.round(v) }));

      const partMap = {};
      (processing || []).forEach(p => {
        if (!partMap[p.part]) partMap[p.part] = { rates: [], processed: 0, used: 0 };
        partMap[p.part].rates.push(parseFloat(p.yield_rate || 0));
        partMap[p.part].processed += parseFloat(p.weight_after || 0);
        if (p.is_used) partMap[p.part].used += parseFloat(p.weight_after || 0);
      });
      const yieldData = Object.entries(partMap).map(([part, v]) => ({
        part, 歩留まり: Math.round(v.rates.reduce((a, b) => a + b, 0) / v.rates.length)
      }));
      const inventoryData = Object.entries(partMap).map(([part, v]) => ({
        part,
        processed: Math.round(v.processed),
        used: Math.round(v.used),
        remaining: Math.round(v.processed - v.used),
      }));

      const totalQty = (shipments || []).reduce((a, s) => a + parseFloat(s.quantity || 0), 0);
      const avgYield = yieldData.length ? Math.round(yieldData.reduce((a, b) => a + b.歩留まり, 0) / yieldData.length) : 0;

      setStats({ totalPlantings: (plantings || []).length, totalShipments: Math.round(totalQty), totalProcessing: (processing || []).length, avgYield });
      setData({ monthlyData, destData, yieldData, inventoryData });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingSpinner />;

  const chartColors = ['#2d6a4f', '#52b788', '#95d5b2', '#40916c', '#74c69d'];
  const statCards = [
    { label: '植え付けロット', value: stats.totalPlantings, unit: '件', icon: '🌱', color: '#2d6a4f' },
    { label: '総出荷量', value: stats.totalShipments.toLocaleString(), unit: 'g', icon: '📦', color: '#40916c' },
    { label: '加工記録', value: stats.totalProcessing, unit: '件', icon: '🔪', color: '#52b788' },
    { label: '平均歩留まり', value: stats.avgYield, unit: '%', icon: '📊', color: '#74c69d' },
  ];

  return (
    <div style={S.tabContent}>
      <PageHeader title="ダッシュボード" subtitle="農場の状況をひと目で確認" icon="📊" />
      <div style={S.statsGrid}>
        {statCards.map((s, i) => (
          <div key={i} style={{ ...S.statCard, borderTop: `3px solid ${s.color}` }}>
            <div style={S.statEmoji}>{s.icon}</div>
            <div style={{ ...S.statValue, color: s.color }}>{s.value}<span style={S.statUnit}>{s.unit}</span></div>
            <div style={S.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={S.chartGrid}>
        <div style={S.chartCard}>
          <h3 style={S.chartTitle}>📈 月別出荷量</h3>
          {(data?.monthlyData?.length || 0) > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8f5e9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#40916c' }} />
                <YAxis tick={{ fontSize: 11, fill: '#74c69d' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #b7e4c7' }} />
                <Line type="monotone" dataKey="出荷量" stroke="#2d6a4f" strokeWidth={2.5} dot={{ fill: '#2d6a4f', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
        <div style={S.chartCard}>
          <h3 style={S.chartTitle}>🎯 出荷先別出荷量</h3>
          {(data?.destData?.length || 0) > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.destData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8f5e9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#40916c' }} />
                <YAxis tick={{ fontSize: 11, fill: '#74c69d' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #b7e4c7' }} />
                <Bar dataKey="出荷量" radius={[4, 4, 0, 0]}>
                  {(data?.destData || []).map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
        <div style={S.chartCard}>
          <h3 style={S.chartTitle}>🔪 部位別歩留まり率</h3>
          {(data?.yieldData?.length || 0) > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.yieldData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8f5e9" />
                <XAxis dataKey="part" tick={{ fontSize: 12, fill: '#40916c' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#74c69d' }} />
                <Tooltip formatter={v => `${v}%`} contentStyle={{ borderRadius: 8, border: '1px solid #b7e4c7' }} />
                <Bar dataKey="歩留まり" fill="#95d5b2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
        <div style={S.chartCard}>
          <h3 style={S.chartTitle}>🚧 今後追加予定の機能</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
            {[
              { icon: '📅', text: '植え付けから出荷までの日数分析' },
              { icon: '💹', text: '出荷先ごとの売上トレンド' },
              { icon: '🗺️', text: 'わさび田マップ（場所プロット）' },
              { icon: '📱', text: '収穫リマインダー通知' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{f.icon}</span>
                <span style={{ fontSize: 13, color: '#52b788' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        {(data?.inventoryData?.length || 0) > 0 && (
          <div style={S.chartCard}>
            <h3 style={S.chartTitle}>📦 部位別在庫状況</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.inventoryData.map(({ part, processed, remaining }) => {
                const pct = processed > 0 ? Math.round((remaining / processed) * 100) : 0;
                return (
                  <div key={part}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ color: '#1b4332', fontWeight: 600 }}>{part}</span>
                      <span style={{ color: remaining > 0 ? '#2d6a4f' : '#aaa', fontWeight: 700 }}>{remaining.toLocaleString()}g</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: '#e8f5e9', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#2d6a4f,#52b788)', borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
              <p style={{ fontSize: 11, color: '#95d5b2', margin: '4px 0 0' }}>残量 = 加工後合計 − 使用済み</p>
            </div>
          </div>
        )}
      </div>
      <button onClick={fetchDashboardData} style={S.refreshBtn}>🔄 データを更新</button>
    </div>
  );
}

// ============================================================
// 植え付け記録タブ
// ============================================================
function PlantingTab() {
  const [varieties, setVarieties] = useState([]);
  const [locations, setLocations] = useState([]);
  const [areas, setAreas] = useState([]); // DBから取得するエリア一覧
  const [plantings, setPlantings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('area');
  const [filterStatus, setFilterStatus] = useState('すべて');
  const [openAreas, setOpenAreas] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineEditData, setInlineEditData] = useState({});

  const emptyForm = { area: '', location: '', planted_date: '', planted_quantity: '', variety_id: '', variety_generation: '', status: '生育中', notes: '' };
  const [formData, setFormData] = useState(emptyForm);
  const [newLocationName, setNewLocationName] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [{ data: pd }, { data: vd }, { data: ld }, { data: ad }] = await Promise.all([
      supabase.from('plantings').select('*').order('planted_date', { ascending: false }),
      supabase.from('varieties').select('*').order('name'),
      supabase.from('locations').select('*').order('area').order('name'),
      supabase.from('areas').select('*').order('sort_order').order('name'),
    ]);
    setPlantings(pd || []);
    setVarieties(vd || []);
    setLocations(ld || []);
    const areaList = (ad && ad.length > 0) ? ad.map(a => a.name) : AREA_NAMES_FALLBACK;
    setAreas(areaList);
    const init = {};
    areaList.forEach(a => { init[a] = true; });
    init['その他'] = true;
    setOpenAreas(init);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loc = formData.location === '__new__' ? newLocationName : formData.location;
    if (!loc) { alert('場所を入力してください'); return; }

    // 新しい場所ならlocationsテーブルにも追加
    if (formData.location === '__new__' && newLocationName && formData.area) {
      await supabase.from('locations').insert([{ area: formData.area, name: newLocationName }]).select();
    }

    const payload = {
      location: loc,
      planted_date: formData.planted_date,
      planted_quantity: parseInt(formData.planted_quantity),
      variety_id: formData.variety_id || null,
      variety_generation: formData.variety_generation || null,
      status: formData.status,
      notes: formData.notes || null,
    };
    const { error } = await supabase.from('plantings').insert([payload]);
    if (error) { alert('❌ ' + error.message); return; }
    setFormData(emptyForm);
    setNewLocationName('');
    setShowForm(false);
    fetchAll();
  };

  // インライン編集開始
  const startInlineEdit = (p) => {
    setInlineEditId(p.id);
    setInlineEditData({
      location: p.location,
      planted_date: p.planted_date,
      planted_quantity: p.planted_quantity,
      variety_id: p.variety_id || '',
      variety_generation: p.variety_generation || '',
      status: p.status,
      notes: p.notes || '',
    });
  };

  // インライン編集保存
  const saveInlineEdit = async () => {
    const payload = {
      location: inlineEditData.location,
      planted_date: inlineEditData.planted_date,
      planted_quantity: parseInt(inlineEditData.planted_quantity),
      variety_id: inlineEditData.variety_id || null,
      variety_generation: inlineEditData.variety_generation || null,
      status: inlineEditData.status,
      notes: inlineEditData.notes || null,
    };
    const { error } = await supabase.from('plantings').update(payload).eq('id', inlineEditId);
    if (error) { alert('❌ ' + error.message); return; }
    setInlineEditId(null);
    fetchAll();
  };

  // 削除
  const handleDelete = async (id) => {
    if (!window.confirm('この記録を削除しますか？')) return;
    await supabase.from('plantings').delete().eq('id', id);
    fetchAll();
  };

  const getArea = (location) => {
    const loc = locations.find(l => l.name === location);
    if (loc) return loc.area;
    for (const [area, locs] of Object.entries(WASABI_AREAS_FALLBACK)) {
      if (locs.includes(location)) return area;
    }
    return '';
  };

  const getVarietyLabel = (p) => {
    const v = varieties.find(v => v.id === p.variety_id);
    if (!v) return p.variety || '—';
    return p.variety_generation ? `${v.name}（${p.variety_generation}）` : v.name;
  };

  const getLocationsByArea = (area) => {
    const fromDB = locations.filter(l => l.area === area).map(l => l.name);
    const fromStatic = (WASABI_AREAS_FALLBACK[area] || []);
    return [...new Set([...fromDB, ...fromStatic])];
  };

  const filtered = filterStatus === 'すべて' ? plantings : plantings.filter(p => p.status === filterStatus);

  const grouped = {};
  areas.forEach(a => { grouped[a] = []; });
  grouped['その他'] = [];
  filtered.forEach(p => {
    const area = getArea(p.location);
    if (area && grouped[area] !== undefined) grouped[area].push(p);
    else grouped['その他'].push(p);
  });

  const locationOptions = getLocationsByArea(formData.area);

  return (
    <div style={S.tabContent}>
      <PageHeader title="植え付け記録" subtitle="わさび田ごとのロット管理" icon="🌱" />

      <button onClick={() => { setShowForm(!showForm); setFormData(emptyForm); setNewLocationName(''); }} style={S.submitBtn}>
        <Plus size={18} /> 新しい植え付けを記録
      </button>

      {showForm && (
        <FormCard title="新しい植え付けを記録">
          <form onSubmit={handleSubmit}>
            <div style={S.formGrid}>
              <div>
                <label style={S.fieldLabel}>わさび田</label>
                <select style={S.select} value={formData.area}
                  onChange={e => setFormData({ ...formData, area: e.target.value, location: '' })} required>
                  <option value="">エリアを選択</option>
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div>
                <label style={S.fieldLabel}>詳細場所</label>
                <select style={S.select} value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })} required>
                  <option value="">場所を選択</option>
                  {locationOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  <option value="__new__">＋ 新しい場所を追加</option>
                </select>
                {formData.location === '__new__' && (
                  <input style={{ ...S.input, marginTop: 6 }} value={newLocationName}
                    onChange={e => setNewLocationName(e.target.value)}
                    placeholder="新しい場所名を入力（マスターにも追加されます）" autoFocus required />
                )}
              </div>

              <div>
                <label style={S.fieldLabel}>品種</label>
                <select style={S.select} value={formData.variety_id}
                  onChange={e => setFormData({ ...formData, variety_id: e.target.value, variety_generation: '' })}>
                  <option value="">品種を選択</option>
                  {varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>

              {formData.variety_id && (
                <div>
                  <label style={S.fieldLabel}>世代・系統（任意）</label>
                  <input style={S.input} value={formData.variety_generation}
                    onChange={e => setFormData({ ...formData, variety_generation: e.target.value })}
                    placeholder="例: 2代目、3代目" />
                </div>
              )}

              <div>
                <label style={S.fieldLabel}>植え付け日</label>
                <input type="date" style={S.input} value={formData.planted_date}
                  onChange={e => setFormData({ ...formData, planted_date: e.target.value })} required />
              </div>

              <div>
                <label style={S.fieldLabel}>植え付け本数</label>
                <input type="number" style={S.input} value={formData.planted_quantity}
                  onChange={e => setFormData({ ...formData, planted_quantity: e.target.value })} placeholder="本数" required />
              </div>

              <div>
                <label style={S.fieldLabel}>ステータス</label>
                <select style={S.select} value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  {['生育中', '収穫可能', '収穫済', '廃棄'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div style={S.fieldFull}>
                <label style={S.fieldLabel}>備考</label>
                <input style={S.input} value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="メモなど（任意）" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, margin: '0 24px 20px' }}>
              <button type="submit" style={{ ...S.submitBtn, margin: 0, flex: 1 }}>
                <Plus size={18} /> 記録を追加
              </button>
              <button type="button" onClick={() => { setShowForm(false); setFormData(emptyForm); }} style={S.cancelBtn}>
                キャンセル
              </button>
            </div>
          </form>
        </FormCard>
      )}

      <div style={S.listHeader}>
        <h3 style={S.sectionTitle}>記録一覧 <span style={S.countBadge}>{filtered.length}件</span></h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => {
            const rows = filtered.map(p => ({
              場所: p.location,
              品種: getVarietyLabel(p),
              植え付け日: p.planted_date,
              植え付け本数: p.planted_quantity,
              ステータス: p.status,
              備考: p.notes || '',
            }));
            exportCSV(rows, `植え付け記録_${new Date().toISOString().slice(0,10)}.csv`);
          }} style={S.csvBtn}>⬇ CSV出力</button>
          <div style={S.viewBtns}>
            {[['area', 'わさび田ごと'], ['date', '日付順']].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)}
                style={{ ...S.viewBtn, ...(view === v ? S.viewBtnActive : {}) }}>{l}</button>
            ))}
          </div>
          <div style={S.filterRow}>
            {['すべて', '生育中', '収穫可能', '収穫済', '廃棄'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{ ...S.filterBtn, ...(filterStatus === s ? S.filterBtnActive : {}) }}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState text="記録がまだありません" /> : (
        view === 'date' ? (
          <PlantingTable plantings={filtered} varieties={varieties} getVarietyLabel={getVarietyLabel}
            inlineEditId={inlineEditId} inlineEditData={inlineEditData} setInlineEditData={setInlineEditData}
            onStartEdit={startInlineEdit} onSaveEdit={saveInlineEdit} onCancelEdit={() => setInlineEditId(null)}
            onDelete={handleDelete} locations={locations} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...areas, 'その他'].map(area => {
              const rows = grouped[area] || [];
              if (rows.length === 0) return null;
              const isOpen = openAreas[area] !== false;
              const totalQty = rows.reduce((a, p) => a + (p.planted_quantity || 0), 0);
              return (
                <div key={area} style={S.tableWrap}>
                  <div style={S.groupHeader}
                    onClick={() => setOpenAreas(prev => ({ ...prev, [area]: !isOpen }))}>
                    <div style={S.groupLeft}>
                      <span style={{ ...S.chevron, transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                      <span style={S.groupTitle}>{area}</span>
                      <span style={S.groupCount}>{rows.length}件</span>
                    </div>
                    <div style={S.groupRight}>
                      <span style={{ color: '#52b788', fontSize: 12 }}>合計 {totalQty.toLocaleString()}本</span>
                    </div>
                  </div>
                  {isOpen && (
                    <PlantingTable plantings={rows} varieties={varieties} getVarietyLabel={getVarietyLabel}
                      inlineEditId={inlineEditId} inlineEditData={inlineEditData} setInlineEditData={setInlineEditData}
                      onStartEdit={startInlineEdit} onSaveEdit={saveInlineEdit} onCancelEdit={() => setInlineEditId(null)}
                      onDelete={handleDelete} locations={locations} nested />
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

function PlantingTable({ plantings, varieties, getVarietyLabel, inlineEditId, inlineEditData, setInlineEditData, onStartEdit, onSaveEdit, onCancelEdit, onDelete, locations, nested = false }) {
  const isMobile = useIsMobile();
  const thBg = nested ? '#f8fffe' : undefined;
  const thColor = nested ? '#74c69d' : '#d8f3dc';
  const theadBg = nested ? { background: '#f8fffe' } : S.thead;

  // モバイル：カード表示
  if (isMobile) {
    return (
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {plantings.map(p => {
          const isEditing = inlineEditId === p.id;
          const sc = statusColors[p.status] || statusColors['生育中'];
          if (isEditing) {
            return (
              <div key={p.id} style={{ ...S.mobileCard, background: '#f0faf4', border: '1.5px solid #52b788' }}>
                <div style={S.mobileCardField}>
                  <span style={S.mobileCardKey}>場所</span>
                  <input style={{ ...S.input, fontSize: 13, padding: '6px 10px', flex: 1 }}
                    value={inlineEditData.location} onChange={e => setInlineEditData({ ...inlineEditData, location: e.target.value })} />
                </div>
                <div style={S.mobileCardField}>
                  <span style={S.mobileCardKey}>品種</span>
                  <select style={{ ...S.select, fontSize: 13, padding: '6px 10px', flex: 1 }}
                    value={inlineEditData.variety_id} onChange={e => setInlineEditData({ ...inlineEditData, variety_id: e.target.value })}>
                    <option value="">—</option>
                    {varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div style={S.mobileCardField}>
                  <span style={S.mobileCardKey}>植え付け日</span>
                  <input type="date" style={{ ...S.input, fontSize: 13, padding: '6px 10px', flex: 1 }}
                    value={inlineEditData.planted_date} onChange={e => setInlineEditData({ ...inlineEditData, planted_date: e.target.value })} />
                </div>
                <div style={S.mobileCardField}>
                  <span style={S.mobileCardKey}>本数</span>
                  <input type="number" style={{ ...S.input, fontSize: 13, padding: '6px 10px', flex: 1 }}
                    value={inlineEditData.planted_quantity} onChange={e => setInlineEditData({ ...inlineEditData, planted_quantity: e.target.value })} />
                </div>
                <div style={S.mobileCardField}>
                  <span style={S.mobileCardKey}>ステータス</span>
                  <select style={{ ...S.select, fontSize: 13, padding: '6px 10px', flex: 1 }}
                    value={inlineEditData.status} onChange={e => setInlineEditData({ ...inlineEditData, status: e.target.value })}>
                    {['生育中', '収穫可能', '収穫済', '廃棄'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={S.mobileCardField}>
                  <span style={S.mobileCardKey}>備考</span>
                  <input style={{ ...S.input, fontSize: 13, padding: '6px 10px', flex: 1 }}
                    value={inlineEditData.notes} onChange={e => setInlineEditData({ ...inlineEditData, notes: e.target.value })} placeholder="備考" />
                </div>
                <div style={S.mobileCardActions}>
                  <button onClick={onSaveEdit} style={{ ...S.editBtn, background: '#d8f3dc', fontWeight: 700, flex: 1, padding: '8px' }}>保存</button>
                  <button onClick={onCancelEdit} style={{ ...S.cancelBtn, flex: 1, padding: '8px' }}>キャンセル</button>
                </div>
              </div>
            );
          }
          return (
            <div key={p.id} style={S.mobileCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: '#1b4332', fontSize: 15 }}>{p.location}</span>
                <span style={{ ...S.statusBadge, backgroundColor: sc.bg, color: sc.text }}>
                  <span style={{ ...S.statusDot, backgroundColor: sc.dot }} />{p.status}
                </span>
              </div>
              <span style={S.varietyBadge}>{getVarietyLabel(p)}</span>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <div style={S.mobileCardField}>
                  <span style={S.mobileCardKey}>植え付け日</span>
                  <span style={S.mobileCardVal}>{p.planted_date}</span>
                </div>
                <div style={S.mobileCardField}>
                  <span style={S.mobileCardKey}>本数</span>
                  <span style={{ ...S.mobileCardVal, color: '#2d6a4f', fontWeight: 700 }}>{p.planted_quantity?.toLocaleString()}本</span>
                </div>
              </div>
              {p.notes && <div style={{ fontSize: 12, color: '#74c69d', marginTop: 6 }}>{p.notes}</div>}
              <div style={S.mobileCardActions}>
                <button onClick={() => onStartEdit(p)} style={{ ...S.editBtn, flex: 1, padding: '8px' }}>編集</button>
                <button onClick={() => onDelete(p.id)} style={{ ...S.deleteBtn, flex: 1, padding: '8px' }}>削除</button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // PC：テーブル表示
  return (
    <div style={nested ? {} : S.tableWrap}>
      <table style={{ ...S.table, tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '18%' }} /><col style={{ width: '16%' }} />
          <col style={{ width: '13%' }} /><col style={{ width: '10%' }} />
          <col style={{ width: '13%' }} /><col style={{ width: '18%' }} />
          <col style={{ width: '12%' }} />
        </colgroup>
        <thead>
          <tr style={theadBg}>
            {['場所', '品種', '植え付け日', '本数', 'ステータス', '備考', '操作'].map((h, i) => (
              <th key={h} style={{ ...S.th, color: thColor, background: thBg, textAlign: i === 3 ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {plantings.map((p, i) => {
            const isEditing = inlineEditId === p.id;
            const sc = statusColors[p.status] || statusColors['生育中'];
            if (isEditing) {
              return (
                <tr key={p.id} style={{ backgroundColor: '#f0faf4' }}>
                  <td style={S.td}><input style={{ ...S.input, fontSize: 12, padding: '5px 8px' }} value={inlineEditData.location} onChange={e => setInlineEditData({ ...inlineEditData, location: e.target.value })} /></td>
                  <td style={S.td}><select style={{ ...S.select, fontSize: 12, padding: '5px 8px' }} value={inlineEditData.variety_id} onChange={e => setInlineEditData({ ...inlineEditData, variety_id: e.target.value })}><option value="">—</option>{varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></td>
                  <td style={S.td}><input type="date" style={{ ...S.input, fontSize: 12, padding: '5px 8px' }} value={inlineEditData.planted_date} onChange={e => setInlineEditData({ ...inlineEditData, planted_date: e.target.value })} /></td>
                  <td style={{ ...S.td, textAlign: 'right' }}><input type="number" style={{ ...S.input, fontSize: 12, padding: '5px 8px', textAlign: 'right' }} value={inlineEditData.planted_quantity} onChange={e => setInlineEditData({ ...inlineEditData, planted_quantity: e.target.value })} /></td>
                  <td style={S.td}><select style={{ ...S.select, fontSize: 12, padding: '5px 8px' }} value={inlineEditData.status} onChange={e => setInlineEditData({ ...inlineEditData, status: e.target.value })}>{['生育中', '収穫可能', '収穫済', '廃棄'].map(s => <option key={s}>{s}</option>)}</select></td>
                  <td style={S.td}><input style={{ ...S.input, fontSize: 12, padding: '5px 8px' }} value={inlineEditData.notes} onChange={e => setInlineEditData({ ...inlineEditData, notes: e.target.value })} placeholder="備考" /></td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button onClick={onSaveEdit} style={{ ...S.editBtn, background: '#d8f3dc', fontWeight: 700 }}>保存</button>
                      <button onClick={onCancelEdit} style={S.cancelBtn}>✕</button>
                    </div>
                  </td>
                </tr>
              );
            }
            return (
              <tr key={p.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f8fffe' }}>
                <td style={S.td}><span style={{ fontWeight: 600, color: '#1b4332', fontSize: 13 }}>{p.location}</span></td>
                <td style={S.td}><span style={S.varietyBadge}>{getVarietyLabel(p)}</span></td>
                <td style={{ ...S.td, color: '#40916c', fontSize: 12 }}>{p.planted_date}</td>
                <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#2d6a4f' }}>{p.planted_quantity?.toLocaleString()}本</td>
                <td style={S.td}><span style={{ ...S.statusBadge, backgroundColor: sc.bg, color: sc.text }}><span style={{ ...S.statusDot, backgroundColor: sc.dot }} />{p.status}</span></td>
                <td style={{ ...S.td, fontSize: 12, color: '#74c69d' }}>{p.notes || '—'}</td>
                <td style={{ ...S.td, textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <button onClick={() => onStartEdit(p)} style={S.editBtn}>編集</button>
                    <button onClick={() => onDelete(p.id)} style={S.deleteBtn}>削除</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// 出荷記録タブ
// ============================================================
function ShipmentTab() {
  const [plantings, setPlantings] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('date');
  const [openDests, setOpenDests] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineEditData, setInlineEditData] = useState({});
  const [yearFilter, setYearFilter] = useState('すべて');

  const emptyForm = { planting_id: '', destination_id: '', shipment_date: '', quantity: '', unit_price: '', notes: '' };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [{ data: pd }, { data: dd }, { data: sd }] = await Promise.all([
      supabase.from('plantings').select('*').order('planted_date', { ascending: false }),
      supabase.from('destinations').select('*').order('name'),
      supabase.from('shipments').select('*,plantings(location,variety),destinations(name,unit_price)').order('shipment_date', { ascending: false }),
    ]);
    setPlantings(pd || []);
    setDestinations(dd || []);
    setShipments(sd || []);
    setLoading(false);
  };

  const handleDestChange = (destId) => {
    const dest = destinations.find(d => d.id === destId);
    setFormData(prev => ({ ...prev, destination_id: destId, unit_price: dest?.unit_price ? String(dest.unit_price) : prev.unit_price }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = formData.quantity && formData.unit_price ? parseFloat(formData.quantity) * parseFloat(formData.unit_price) : null;
    const payload = { ...formData, planting_id: formData.planting_id || null, total_amount: total };
    const { error } = await supabase.from('shipments').insert([payload]);
    if (error) { alert('❌ ' + error.message); return; }
    setFormData(emptyForm); setShowForm(false); fetchData();
  };

  const startInlineEdit = (s) => {
    setInlineEditId(s.id);
    setInlineEditData({
      planting_id: s.planting_id || '',
      destination_id: s.destination_id,
      shipment_date: s.shipment_date,
      quantity: String(s.quantity),
      unit_price: s.unit_price ? String(s.unit_price) : '',
      notes: s.notes || '',
    });
  };

  const saveInlineEdit = async () => {
    const total = inlineEditData.quantity && inlineEditData.unit_price
      ? parseFloat(inlineEditData.quantity) * parseFloat(inlineEditData.unit_price) : null;
    const payload = { ...inlineEditData, planting_id: inlineEditData.planting_id || null, total_amount: total };
    const { error } = await supabase.from('shipments').update(payload).eq('id', inlineEditId);
    if (error) { alert('❌ ' + error.message); return; }
    setInlineEditId(null); fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('この記録を削除しますか？')) return;
    await supabase.from('shipments').delete().eq('id', id);
    fetchData();
  };

  const totalAmount = formData.quantity && formData.unit_price
    ? (parseFloat(formData.quantity) * parseFloat(formData.unit_price)).toLocaleString() : null;

  // 年フィルター
  const years = ['すべて', ...Array.from(new Set(shipments.map(s => s.shipment_date?.slice(0, 4)).filter(Boolean))).sort().reverse()];
  const filteredShipments = yearFilter === 'すべて' ? shipments : shipments.filter(s => s.shipment_date?.startsWith(yearFilter));
  const filteredRevenue = filteredShipments.reduce((a, s) => a + parseFloat(s.total_amount || 0), 0);

  // 出荷先ごとにグループ化
  const grouped = {};
  filteredShipments.forEach(s => {
    const name = s.destinations?.name || '不明';
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(s);
  });

  return (
    <div style={S.tabContent}>
      <PageHeader title="出荷記録" subtitle="出荷先・数量・金額の管理" icon="📦" />

      <button onClick={() => { setShowForm(!showForm); setFormData(emptyForm); }} style={S.submitBtn}>
        <Plus size={18} /> 新しい出荷を記録
      </button>

      {showForm && (
        <FormCard title="新しい出荷を記録">
          <form onSubmit={handleSubmit}>
            <div style={S.formGrid}>
              <div>
                <label style={S.fieldLabel}>植え付けロット <span style={{ color: '#74c69d', fontWeight: 400 }}>（任意）</span></label>
                <select style={S.select} value={formData.planting_id}
                  onChange={e => setFormData({ ...formData, planting_id: e.target.value })}>
                  <option value="">未設定</option>
                  {plantings.map(p => <option key={p.id} value={p.id}>{p.location}（{p.variety || '品種不明'}）</option>)}
                </select>
              </div>
              <div>
                <label style={S.fieldLabel}>出荷先</label>
                <select style={S.select} value={formData.destination_id}
                  onChange={e => handleDestChange(e.target.value)} required>
                  <option value="">出荷先を選択</option>
                  {destinations.map(d => <option key={d.id} value={d.id}>{d.name}{d.unit_price ? ` (¥${d.unit_price}/g)` : ''}</option>)}
                </select>
              </div>
              <div>
                <label style={S.fieldLabel}>出荷日</label>
                <input type="date" style={S.input} value={formData.shipment_date}
                  onChange={e => setFormData({ ...formData, shipment_date: e.target.value })} required />
              </div>
              <div>
                <label style={S.fieldLabel}>出荷量 (g)</label>
                <input type="number" step="0.1" style={S.input} value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })} placeholder="例: 500" required />
              </div>
              <div>
                <label style={S.fieldLabel}>
                  単価 (円/g)
                  {formData.destination_id && destinations.find(d => d.id === formData.destination_id)?.unit_price && (
                    <span style={S.autoFillBadge}>⚡ 自動入力</span>
                  )}
                </label>
                <input type="number" step="0.01" style={S.input} value={formData.unit_price}
                  onChange={e => setFormData({ ...formData, unit_price: e.target.value })} placeholder="例: 35" />
              </div>
              {totalAmount && (
                <div style={S.totalPreview}>
                  <span style={S.totalLabel}>合計金額</span>
                  <span style={S.totalValue}>¥{totalAmount}</span>
                </div>
              )}
              <div style={S.fieldFull}>
                <label style={S.fieldLabel}>備考</label>
                <input style={S.input} value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="メモなど（任意）" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, margin: '0 24px 20px' }}>
              <button type="submit" style={{ ...S.submitBtn, margin: 0, flex: 1 }}>
                <Plus size={18} /> 記録を追加
              </button>
              <button type="button" onClick={() => { setShowForm(false); setFormData(emptyForm); }} style={S.cancelBtn}>キャンセル</button>
            </div>
          </form>
        </FormCard>
      )}

      <div style={S.listHeader}>
        <h3 style={S.sectionTitle}>出荷記録一覧 <span style={S.countBadge}>{filteredShipments.length}件</span></h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={S.revenueSummary}>総売上: <strong style={{ color: '#2d6a4f' }}>¥{Math.round(filteredRevenue).toLocaleString()}</strong></span>
          <button onClick={() => {
            const rows = filteredShipments.map(s => ({
              出荷日: s.shipment_date,
              出荷先: s.destinations?.name || '',
              植え付けロット: s.plantings?.location || '',
              出荷量_g: s.quantity,
              単価_円g: s.unit_price || '',
              合計金額_円: s.total_amount ? Math.round(s.total_amount) : '',
              備考: s.notes || '',
            }));
            exportCSV(rows, `出荷記録_${yearFilter}_${new Date().toISOString().slice(0,10)}.csv`);
          }} style={S.csvBtn}>⬇ CSV出力</button>
          <div style={S.viewBtns}>
            {[['date', '日付順'], ['dest', '出荷先ごと']].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)}
                style={{ ...S.viewBtn, ...(view === v ? S.viewBtnActive : {}) }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 年フィルター */}
      <div style={S.filterRow}>
        {years.map(y => (
          <button key={y} onClick={() => setYearFilter(y)}
            style={{ ...S.filterBtn, ...(yearFilter === y ? S.filterBtnActive : {}) }}>{y}</button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : filteredShipments.length === 0 ? <EmptyState text="出荷記録がまだありません" /> : (
        view === 'date' ? (
          <ShipmentTable shipments={filteredShipments} plantings={plantings} destinations={destinations}
            inlineEditId={inlineEditId} inlineEditData={inlineEditData} setInlineEditData={setInlineEditData}
            onStartEdit={startInlineEdit} onSaveEdit={saveInlineEdit} onCancelEdit={() => setInlineEditId(null)}
            onDelete={handleDelete} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(grouped).map(([destName, rows]) => {
              const isOpen = openDests[destName] !== false;
              const totalQty = rows.reduce((a, s) => a + parseFloat(s.quantity || 0), 0);
              const totalAmt = rows.reduce((a, s) => a + parseFloat(s.total_amount || 0), 0);
              return (
                <div key={destName} style={S.tableWrap}>
                  <div style={S.groupHeader} onClick={() => setOpenDests(prev => ({ ...prev, [destName]: !isOpen }))}>
                    <div style={S.groupLeft}>
                      <span style={{ ...S.chevron, transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                      <span style={S.destTag}>{destName}</span>
                      <span style={S.groupCount}>{rows.length}件</span>
                    </div>
                    <div style={S.groupRight}>
                      <span style={{ color: '#52b788', fontSize: 12 }}>{Math.round(totalQty).toLocaleString()}g</span>
                      {totalAmt > 0 && <span style={{ fontWeight: 700, color: '#1b4332' }}>¥{Math.round(totalAmt).toLocaleString()}</span>}
                    </div>
                  </div>
                  {isOpen && <ShipmentTable shipments={rows} plantings={plantings} destinations={destinations}
                    inlineEditId={inlineEditId} inlineEditData={inlineEditData} setInlineEditData={setInlineEditData}
                    onStartEdit={startInlineEdit} onSaveEdit={saveInlineEdit} onCancelEdit={() => setInlineEditId(null)}
                    onDelete={handleDelete} nested />}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

function ShipmentTable({ shipments, plantings, destinations, inlineEditId, inlineEditData, setInlineEditData, onStartEdit, onSaveEdit, onCancelEdit, onDelete, nested = false }) {
  const isMobile = useIsMobile();
  const thStyle = nested ? { ...S.th, color: '#74c69d', background: '#f8fffe' } : S.th;
  const theadStyle = nested ? { background: '#f8fffe' } : S.thead;

  if (isMobile) {
    return (
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {shipments.map(s => {
          const isEditing = inlineEditId === s.id;
          if (isEditing) {
            const previewTotal = inlineEditData.quantity && inlineEditData.unit_price
              ? Math.round(parseFloat(inlineEditData.quantity) * parseFloat(inlineEditData.unit_price)).toLocaleString() : null;
            return (
              <div key={s.id} style={{ ...S.mobileCard, background: '#f0faf4', border: '1.5px solid #52b788' }}>
                <div style={S.mobileCardField}><span style={S.mobileCardKey}>出荷先</span>
                  <select style={{ ...S.select, fontSize: 13, padding: '6px 10px' }} value={inlineEditData.destination_id} onChange={e => setInlineEditData({ ...inlineEditData, destination_id: e.target.value })}>
                    {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select></div>
                <div style={S.mobileCardField}><span style={S.mobileCardKey}>植え付けロット（任意）</span>
                  <select style={{ ...S.select, fontSize: 13, padding: '6px 10px' }} value={inlineEditData.planting_id} onChange={e => setInlineEditData({ ...inlineEditData, planting_id: e.target.value })}>
                    <option value="">未設定</option>
                    {plantings.map(p => <option key={p.id} value={p.id}>{p.location}</option>)}
                  </select></div>
                <div style={S.mobileCardField}><span style={S.mobileCardKey}>出荷日</span>
                  <input type="date" style={{ ...S.input, fontSize: 13, padding: '6px 10px' }} value={inlineEditData.shipment_date} onChange={e => setInlineEditData({ ...inlineEditData, shipment_date: e.target.value })} /></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ ...S.mobileCardField, flex: 1 }}><span style={S.mobileCardKey}>出荷量 (g)</span>
                    <input type="number" step="0.1" style={{ ...S.input, fontSize: 13, padding: '6px 10px' }} value={inlineEditData.quantity} onChange={e => setInlineEditData({ ...inlineEditData, quantity: e.target.value })} /></div>
                  <div style={{ ...S.mobileCardField, flex: 1 }}><span style={S.mobileCardKey}>単価 (円/g)</span>
                    <input type="number" step="0.01" style={{ ...S.input, fontSize: 13, padding: '6px 10px' }} value={inlineEditData.unit_price} onChange={e => setInlineEditData({ ...inlineEditData, unit_price: e.target.value })} /></div>
                </div>
                {previewTotal && <div style={{ fontSize: 13, color: '#1b4332', fontWeight: 700, marginTop: 4 }}>合計: ¥{previewTotal}</div>}
                <div style={S.mobileCardField}><span style={S.mobileCardKey}>備考</span>
                  <input style={{ ...S.input, fontSize: 13, padding: '6px 10px' }} value={inlineEditData.notes} onChange={e => setInlineEditData({ ...inlineEditData, notes: e.target.value })} /></div>
                <div style={S.mobileCardActions}>
                  <button onClick={onSaveEdit} style={{ ...S.editBtn, background: '#d8f3dc', fontWeight: 700, flex: 1, padding: '8px' }}>保存</button>
                  <button onClick={onCancelEdit} style={{ ...S.cancelBtn, flex: 1, padding: '8px' }}>キャンセル</button>
                </div>
              </div>
            );
          }
          return (
            <div key={s.id} style={S.mobileCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={S.destTag}>{s.destinations?.name}</span>
                <span style={{ fontSize: 12, color: '#40916c' }}>{s.shipment_date}</span>
              </div>
              {s.plantings?.location && <div style={{ fontSize: 12, color: '#52b788', marginBottom: 8 }}>{s.plantings.location}</div>}
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={S.mobileCardField}><span style={S.mobileCardKey}>出荷量</span><span style={{ ...S.mobileCardVal, fontWeight: 700 }}>{parseFloat(s.quantity).toLocaleString()}g</span></div>
                <div style={S.mobileCardField}><span style={S.mobileCardKey}>単価</span><span style={S.mobileCardVal}>{s.unit_price ? `¥${s.unit_price}/g` : '—'}</span></div>
                <div style={S.mobileCardField}><span style={S.mobileCardKey}>金額</span><span style={{ ...S.mobileCardVal, color: '#1b4332', fontWeight: 700 }}>{s.total_amount ? `¥${Math.round(s.total_amount).toLocaleString()}` : '—'}</span></div>
              </div>
              <div style={S.mobileCardActions}>
                <button onClick={() => onStartEdit(s)} style={{ ...S.editBtn, flex: 1, padding: '8px' }}>編集</button>
                <button onClick={() => onDelete(s.id)} style={{ ...S.deleteBtn, flex: 1, padding: '8px' }}>削除</button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={nested ? {} : S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr style={theadStyle}>
            <th style={thStyle}>出荷日</th>
            {!nested && <th style={thStyle}>出荷先</th>}
            <th style={thStyle}>ロット</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>出荷量</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>単価</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>金額</th>
            <th style={thStyle}>備考</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((s, i) => {
            const isEditing = inlineEditId === s.id;
            if (isEditing) {
              const previewTotal = inlineEditData.quantity && inlineEditData.unit_price
                ? Math.round(parseFloat(inlineEditData.quantity) * parseFloat(inlineEditData.unit_price)).toLocaleString() : '—';
              return (
                <tr key={s.id} style={{ backgroundColor: '#f0faf4' }}>
                  <td style={S.td}><input type="date" style={{ ...S.input, fontSize: 12, padding: '5px 8px' }} value={inlineEditData.shipment_date} onChange={e => setInlineEditData({ ...inlineEditData, shipment_date: e.target.value })} /></td>
                  {!nested && <td style={S.td}><select style={{ ...S.select, fontSize: 12, padding: '5px 8px' }} value={inlineEditData.destination_id} onChange={e => setInlineEditData({ ...inlineEditData, destination_id: e.target.value })}>{destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></td>}
                  <td style={S.td}><select style={{ ...S.select, fontSize: 12, padding: '5px 8px' }} value={inlineEditData.planting_id} onChange={e => setInlineEditData({ ...inlineEditData, planting_id: e.target.value })}><option value="">未設定</option>{plantings.map(p => <option key={p.id} value={p.id}>{p.location}</option>)}</select></td>
                  <td style={{ ...S.td, textAlign: 'right' }}><input type="number" step="0.1" style={{ ...S.input, fontSize: 12, padding: '5px 8px', textAlign: 'right' }} value={inlineEditData.quantity} onChange={e => setInlineEditData({ ...inlineEditData, quantity: e.target.value })} /></td>
                  <td style={{ ...S.td, textAlign: 'right' }}><input type="number" step="0.01" style={{ ...S.input, fontSize: 12, padding: '5px 8px', textAlign: 'right' }} value={inlineEditData.unit_price} onChange={e => setInlineEditData({ ...inlineEditData, unit_price: e.target.value })} /></td>
                  <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#1b4332' }}>¥{previewTotal}</td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button onClick={onSaveEdit} style={{ ...S.editBtn, background: '#d8f3dc', fontWeight: 700 }}>保存</button>
                      <button onClick={onCancelEdit} style={S.cancelBtn}>✕</button>
                    </div>
                  </td>
                </tr>
              );
            }
            return (
              <tr key={s.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f8fffe' }}>
                <td style={{ ...S.td, color: '#40916c' }}>{s.shipment_date}</td>
                {!nested && <td style={S.td}><span style={S.destTag}>{s.destinations?.name}</span></td>}
                <td style={{ ...S.td, fontSize: 12, color: '#52b788' }}>{s.plantings?.location || '—'}</td>
                <td style={{ ...S.td, textAlign: 'right', fontWeight: 600 }}>{parseFloat(s.quantity).toLocaleString()}g</td>
                <td style={{ ...S.td, textAlign: 'right', color: '#74c69d' }}>{s.unit_price ? `¥${s.unit_price}/g` : '—'}</td>
                <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#1b4332' }}>{s.total_amount ? `¥${Math.round(s.total_amount).toLocaleString()}` : '—'}</td>
                <td style={{ ...S.td, fontSize: 12, color: '#74c69d' }}>{s.notes || '—'}</td>
                <td style={{ ...S.td, textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <button onClick={() => onStartEdit(s)} style={S.editBtn}>編集</button>
                    <button onClick={() => onDelete(s.id)} style={S.deleteBtn}>削除</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// 加工記録タブ
// ============================================================
function ProcessingTab() {
  const isMobile = useIsMobile();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [customPart, setCustomPart] = useState(false);
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineEditData, setInlineEditData] = useState({});

  const emptyForm = { processing_date: '', part: '', weight_before: '', weight_after: '', notes: '' };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data: pd } = await supabase.from('processing').select('*').order('processing_date', { ascending: false });
    setRecords(pd || []);
    setLoading(false);
  };

  const fetchProcessing = async () => {
    const { data } = await supabase.from('processing').select('*').order('processing_date', { ascending: false });
    setRecords(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const yield_rate = (formData.weight_before && formData.weight_after)
      ? ((parseFloat(formData.weight_after) / parseFloat(formData.weight_before)) * 100).toFixed(2)
      : null;
    const payload = { ...formData, yield_rate, weight_before: formData.weight_before || null };
    const { error } = await supabase.from('processing').insert([payload]);
    if (error) { alert('❌ ' + error.message); return; }
    setFormData(emptyForm); setShowForm(false); setCustomPart(false); fetchProcessing();
  };

  const startInlineEdit = (r) => {
    setInlineEditId(r.id);
    setInlineEditData({ processing_date: r.processing_date, part: r.part, weight_before: String(r.weight_before), weight_after: String(r.weight_after), notes: r.notes || '' });
  };

  const saveInlineEdit = async () => {
    const yield_rate = (inlineEditData.weight_before && inlineEditData.weight_after)
      ? ((parseFloat(inlineEditData.weight_after) / parseFloat(inlineEditData.weight_before)) * 100).toFixed(2)
      : null;
    const payload = { ...inlineEditData, yield_rate, weight_before: inlineEditData.weight_before || null };
    const { error } = await supabase.from('processing').update(payload).eq('id', inlineEditId);
    if (error) { alert('❌ ' + error.message); return; }
    setInlineEditId(null); fetchProcessing();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('この記録を削除しますか？')) return;
    await supabase.from('processing').delete().eq('id', id);
    fetchProcessing();
  };

  const toggleUsed = async (r) => {
    const newUsed = !r.is_used;
    await supabase.from('processing').update({ is_used: newUsed, used_for: newUsed ? r.used_for : null }).eq('id', r.id);
    fetchProcessing();
  };

  const updateUsedFor = async (id, used_for) => {
    await supabase.from('processing').update({ used_for }).eq('id', id);
    fetchProcessing();
  };

  const yieldPreview = formData.weight_before && formData.weight_after
    ? ((parseFloat(formData.weight_after) / parseFloat(formData.weight_before)) * 100).toFixed(1) : null;

  const getYieldColor = (rate) => rate >= 60 ? '#2d6a4f' : rate >= 45 ? '#52b788' : '#f59e0b';

  // 部位別在庫計算：加工後合計 - 出荷合計
  // ※出荷は部位ごとに紐付いていないため、total出荷量を全部位で按分して表示
  // 実際には is_used フラグで管理
  const inventoryByPart = (() => {
    const map = {};
    records.forEach(r => {
      if (!map[r.part]) map[r.part] = { processed: 0, used: 0 };
      map[r.part].processed += parseFloat(r.weight_after || 0);
      if (r.is_used) map[r.part].used += parseFloat(r.weight_after || 0);
    });
    return Object.entries(map).map(([part, v]) => ({
      part,
      processed: Math.round(v.processed),
      used: Math.round(v.used),
      remaining: Math.round(v.processed - v.used),
    }));
  })();

  return (
    <div style={S.tabContent}>
      <PageHeader title="加工記録" subtitle="部位別の重量と歩留まり率" icon="🔪" />

      {/* 部位別在庫サマリー */}
      {!loading && inventoryByPart.length > 0 && (
        <div>
          <h3 style={{ ...S.sectionTitle, marginBottom: 12 }}>📦 部位別在庫状況</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {inventoryByPart.map(({ part, processed, used, remaining }) => {
              const pct = processed > 0 ? Math.round((remaining / processed) * 100) : 0;
              const barColor = remaining > 0 ? '#52b788' : '#e2e3e5';
              return (
                <div key={part} style={{ background: '#fff', borderRadius: 12, border: '1px solid #d8f3dc', padding: '14px 16px', boxShadow: '0 1px 4px rgba(45,106,79,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={S.partBadge}>{part}</span>
                    <span style={{ fontSize: 11, color: '#74c69d' }}>{pct}%残</span>
                  </div>
                  {/* プログレスバー */}
                  <div style={{ height: 5, borderRadius: 3, background: '#e8f5e9', marginBottom: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#74c69d' }}>加工合計</span>
                      <span style={{ color: '#52b788', fontWeight: 600 }}>{processed.toLocaleString()}g</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#74c69d' }}>使用済み</span>
                      <span style={{ color: '#aaa' }}>{used.toLocaleString()}g</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px solid #e8f5e9', paddingTop: 4, marginTop: 2 }}>
                      <span style={{ color: '#40916c', fontWeight: 700 }}>残量</span>
                      <span style={{ color: remaining > 0 ? '#1b4332' : '#aaa', fontWeight: 800 }}>{remaining.toLocaleString()}g</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: '#95d5b2', marginTop: 8 }}>※「使用済み」は各記録の使用済みフラグに基づいています</p>
        </div>
      )}

      <button onClick={() => { setShowForm(!showForm); setFormData(emptyForm); }} style={S.submitBtn}>
        <Plus size={18} /> 新しい加工を記録
      </button>

      {showForm && (
        <FormCard title="新しい加工を記録">
          <form onSubmit={handleSubmit}>
            <div style={S.formGrid}>
              <div>
                <label style={S.fieldLabel}>加工日</label>
                <input type="date" style={S.input} value={formData.processing_date}
                  onChange={e => setFormData({ ...formData, processing_date: e.target.value })} required />
              </div>
              <div>
                <label style={S.fieldLabel}>部位</label>
                <div style={{ marginBottom: 4 }}>
                  <button type="button" onClick={() => setCustomPart(!customPart)} style={S.toggleLink}>
                    {customPart ? '▾ 選択肢から選ぶ' : '✏️ 直接入力'}
                  </button>
                </div>
                {customPart ? (
                  <input style={S.input} value={formData.part} onChange={e => setFormData({ ...formData, part: e.target.value })} placeholder="部位を入力" required />
                ) : (
                  <select style={S.select} value={formData.part} onChange={e => setFormData({ ...formData, part: e.target.value })} required>
                    <option value="">部位を選択</option>
                    {PROCESSING_PARTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label style={S.fieldLabel}>加工前重量 (g) <span style={{ color: '#95d5b2', fontWeight: 400 }}>任意</span></label>
                <input type="number" step="0.1" style={S.input} value={formData.weight_before}
                  onChange={e => setFormData({ ...formData, weight_before: e.target.value })} placeholder="例: 1500（不明の場合は空白）" />
              </div>
              <div>
                <label style={S.fieldLabel}>加工後重量 (g)</label>
                <input type="number" step="0.1" style={S.input} value={formData.weight_after}
                  onChange={e => setFormData({ ...formData, weight_after: e.target.value })} placeholder="例: 780" required />
              </div>
              {yieldPreview && (
                <div style={S.totalPreview}>
                  <span style={S.totalLabel}>歩留まり率（自動計算）</span>
                  <span style={{ ...S.totalValue, color: getYieldColor(parseFloat(yieldPreview)) }}>{yieldPreview}%</span>
                </div>
              )}
              <div style={S.fieldFull}>
                <label style={S.fieldLabel}>備考</label>
                <input style={S.input} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="メモなど（任意）" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, margin: '0 24px 20px' }}>
              <button type="submit" style={{ ...S.submitBtn, margin: 0, flex: 1 }}>
                <Plus size={18} /> 記録を追加
              </button>
              <button type="button" onClick={() => { setShowForm(false); setFormData(emptyForm); }} style={S.cancelBtn}>キャンセル</button>
            </div>
          </form>
        </FormCard>
      )}

      <div style={S.listHeader}>
        <h3 style={S.sectionTitle}>加工記録一覧 <span style={S.countBadge}>{records.length}件</span></h3>
        <button onClick={() => {
          const rows = records.map(r => ({
            加工日: r.processing_date,
            部位: r.part,
            加工前重量_g: r.weight_before,
            加工後重量_g: r.weight_after,
            歩留まり率_percent: r.yield_rate,
            備考: r.notes || '',
          }));
          exportCSV(rows, `加工記録_${new Date().toISOString().slice(0,10)}.csv`);
        }} style={S.csvBtn}>⬇ CSV出力</button>
      </div>

      {loading ? <LoadingSpinner /> : records.length === 0 ? <EmptyState text="加工記録がまだありません" /> : (
        isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {records.map(r => {
              const isEditing = inlineEditId === r.id;
              const yr = parseFloat(r.yield_rate || 0);
              const yc = getYieldColor(yr);
              if (isEditing) {
                const editYield = inlineEditData.weight_before && inlineEditData.weight_after
                  ? ((parseFloat(inlineEditData.weight_after) / parseFloat(inlineEditData.weight_before)) * 100).toFixed(1) : null;
                return (
                  <div key={r.id} style={{ ...S.mobileCard, background: '#f0faf4', border: '1.5px solid #52b788' }}>
                    <div style={S.mobileCardField}><span style={S.mobileCardKey}>加工日</span>
                      <input type="date" style={{ ...S.input, fontSize: 13, padding: '6px 10px' }} value={inlineEditData.processing_date} onChange={e => setInlineEditData({ ...inlineEditData, processing_date: e.target.value })} /></div>
                    <div style={S.mobileCardField}><span style={S.mobileCardKey}>部位</span>
                      <select style={{ ...S.select, fontSize: 13, padding: '6px 10px' }} value={inlineEditData.part} onChange={e => setInlineEditData({ ...inlineEditData, part: e.target.value })}>
                        {PROCESSING_PARTS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select></div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ ...S.mobileCardField, flex: 1 }}><span style={S.mobileCardKey}>加工前 (g)</span>
                        <input type="number" step="0.1" style={{ ...S.input, fontSize: 13, padding: '6px 10px' }} value={inlineEditData.weight_before} onChange={e => setInlineEditData({ ...inlineEditData, weight_before: e.target.value })} /></div>
                      <div style={{ ...S.mobileCardField, flex: 1 }}><span style={S.mobileCardKey}>加工後 (g)</span>
                        <input type="number" step="0.1" style={{ ...S.input, fontSize: 13, padding: '6px 10px' }} value={inlineEditData.weight_after} onChange={e => setInlineEditData({ ...inlineEditData, weight_after: e.target.value })} /></div>
                    </div>
                    {editYield && <div style={{ fontSize: 13, color: getYieldColor(parseFloat(editYield)), fontWeight: 700, marginTop: 4 }}>歩留まり: {editYield}%</div>}
                    <div style={S.mobileCardField}><span style={S.mobileCardKey}>備考</span>
                      <input style={{ ...S.input, fontSize: 13, padding: '6px 10px' }} value={inlineEditData.notes} onChange={e => setInlineEditData({ ...inlineEditData, notes: e.target.value })} /></div>
                    <div style={S.mobileCardActions}>
                      <button onClick={saveInlineEdit} style={{ ...S.editBtn, background: '#d8f3dc', fontWeight: 700, flex: 1, padding: '8px' }}>保存</button>
                      <button onClick={() => setInlineEditId(null)} style={{ ...S.cancelBtn, flex: 1, padding: '8px' }}>キャンセル</button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={r.id} style={{ ...S.mobileCard, opacity: r.is_used ? 0.65 : 1, background: r.is_used ? "#f5f5f5" : "#fff" }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={S.partBadge}>{r.part}</span>
                    <span style={{ fontSize: 12, color: '#40916c' }}>{r.processing_date}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                    <div style={S.mobileCardField}><span style={S.mobileCardKey}>加工前</span><span style={S.mobileCardVal}>{r.weight_before ? `${parseFloat(r.weight_before).toLocaleString()}g` : '—'}</span></div>
                    <div style={S.mobileCardField}><span style={S.mobileCardKey}>加工後</span><span style={S.mobileCardVal}>{parseFloat(r.weight_after).toLocaleString()}g</span></div>
                    <div style={S.mobileCardField}><span style={S.mobileCardKey}>歩留まり</span>
                      {r.yield_rate ? <span style={{ ...S.yieldBadge, color: yc, borderColor: yc }}>{yr.toFixed(1)}%</span> : <span style={{ color: '#b7e4c7' }}>—</span>}
                    </div>
                  </div>
                  {r.notes && <div style={{ fontSize: 12, color: '#74c69d', marginBottom: 6 }}>{r.notes}</div>}
                  {r.is_used && (
                    <div style={{ fontSize: 12, background: '#d8f3dc', color: '#1b4332', borderRadius: 6, padding: '3px 10px', marginBottom: 6, display: 'inline-block' }}>
                      ✅ 使用済み{r.used_for ? `（${r.used_for}）` : ''}
                    </div>
                  )}
                  <div style={S.mobileCardActions}>
                    <button onClick={() => toggleUsed(r)} style={{
                      flex: 1, padding: '8px', fontSize: 12, cursor: 'pointer', borderRadius: 6,
                      background: r.is_used ? '#d8f3dc' : '#fff',
                      border: `1px solid ${r.is_used ? '#52b788' : '#b7e4c7'}`,
                      color: r.is_used ? '#1b4332' : '#74c69d', fontWeight: r.is_used ? 700 : 400,
                    }}>{r.is_used ? '✅ 使用済' : '未使用'}</button>
                    <button onClick={() => startInlineEdit(r)} style={{ ...S.editBtn, flex: 1, padding: '8px' }}>編集</button>
                    <button onClick={() => handleDelete(r.id)} style={{ ...S.deleteBtn, flex: 1, padding: '8px' }}>削除</button>
                  </div>
                  {r.is_used && (
                    <div style={{ marginTop: 6 }}>
                      <select style={{ ...S.select, fontSize: 12, padding: '5px 10px' }}
                        value={r.used_for || ''}
                        onChange={e => updateUsedFor(r.id, e.target.value)}>
                        <option value="">使用先を選択</option>
                        <option value="わさび食堂">わさび食堂</option>
                        <option value="ソーセージ原料">ソーセージ原料</option>
                        <option value="その他">その他</option>
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr style={S.thead}>
                  <th style={S.th}>加工日</th>
                  <th style={S.th}>部位</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>加工前 (g)</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>加工後 (g)</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>歩留まり</th>
                  <th style={S.th}>備考</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>使用済み</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const isEditing = inlineEditId === r.id;
                  const yr = parseFloat(r.yield_rate || 0);
                  const yc = getYieldColor(yr);
                  const editYield = isEditing && inlineEditData.weight_before && inlineEditData.weight_after
                    ? ((parseFloat(inlineEditData.weight_after) / parseFloat(inlineEditData.weight_before)) * 100).toFixed(1) : null;
                  const rowBg = r.is_used ? '#f5f5f5' : (i % 2 === 0 ? '#fff' : '#f8fffe');
                  if (isEditing) {
                    return (
                      <tr key={r.id} style={{ backgroundColor: '#f0faf4' }}>
                        <td style={S.td}><input type="date" style={{ ...S.input, fontSize: 12, padding: '5px 8px' }} value={inlineEditData.processing_date} onChange={e => setInlineEditData({ ...inlineEditData, processing_date: e.target.value })} /></td>
                        <td style={S.td}><select style={{ ...S.select, fontSize: 12, padding: '5px 8px' }} value={inlineEditData.part} onChange={e => setInlineEditData({ ...inlineEditData, part: e.target.value })}>{PROCESSING_PARTS.map(p => <option key={p} value={p}>{p}</option>)}</select></td>
                        <td style={{ ...S.td, textAlign: 'right' }}><input type="number" step="0.1" style={{ ...S.input, fontSize: 12, padding: '5px 8px', textAlign: 'right' }} value={inlineEditData.weight_before} onChange={e => setInlineEditData({ ...inlineEditData, weight_before: e.target.value })} /></td>
                        <td style={{ ...S.td, textAlign: 'right' }}><input type="number" step="0.1" style={{ ...S.input, fontSize: 12, padding: '5px 8px', textAlign: 'right' }} value={inlineEditData.weight_after} onChange={e => setInlineEditData({ ...inlineEditData, weight_after: e.target.value })} /></td>
                        <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: editYield ? getYieldColor(parseFloat(editYield)) : '#74c69d' }}>
                          {editYield ? `${editYield}%` : '—'}
                        </td>
                        <td style={S.td}><input style={{ ...S.input, fontSize: 12, padding: '5px 8px' }} value={inlineEditData.notes} onChange={e => setInlineEditData({ ...inlineEditData, notes: e.target.value })} placeholder="備考" /></td>
                        <td style={S.td}>—</td>
                        <td style={{ ...S.td, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button onClick={saveInlineEdit} style={{ ...S.editBtn, background: '#d8f3dc', fontWeight: 700 }}>保存</button>
                            <button onClick={() => setInlineEditId(null)} style={S.cancelBtn}>✕</button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={r.id} style={{ backgroundColor: rowBg, opacity: r.is_used ? 0.6 : 1 }}>
                      <td style={{ ...S.td, color: '#40916c' }}>{r.processing_date}</td>
                      <td style={S.td}><span style={S.partBadge}>{r.part}</span></td>
                      <td style={{ ...S.td, textAlign: 'right' }}>{r.weight_before ? `${parseFloat(r.weight_before).toLocaleString()}g` : <span style={{ color: '#b7e4c7' }}>—</span>}</td>
                      <td style={{ ...S.td, textAlign: 'right' }}>{parseFloat(r.weight_after).toLocaleString()}g</td>
                      <td style={{ ...S.td, textAlign: 'right' }}>
                        {r.yield_rate ? <span style={{ ...S.yieldBadge, color: yc, borderColor: yc }}>{yr.toFixed(1)}%</span> : <span style={{ color: '#b7e4c7' }}>—</span>}
                      </td>
                      <td style={{ ...S.td, fontSize: 12, color: '#74c69d' }}>{r.notes || '—'}</td>
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                          <button onClick={() => toggleUsed(r)} style={{
                            background: r.is_used ? '#d8f3dc' : '#fff',
                            border: `1.5px solid ${r.is_used ? '#52b788' : '#b7e4c7'}`,
                            borderRadius: 20, padding: '3px 10px', fontSize: 12,
                            color: r.is_used ? '#1b4332' : '#74c69d', cursor: 'pointer', fontWeight: r.is_used ? 700 : 400,
                          }}>{r.is_used ? '✅ 使用済' : '未使用'}</button>
                          {r.is_used && (
                            <select style={{ ...S.select, fontSize: 11, padding: '3px 6px', width: 100 }}
                              value={r.used_for || ''}
                              onChange={e => updateUsedFor(r.id, e.target.value)}>
                              <option value="">使用先</option>
                              <option value="わさび食堂">わさび食堂</option>
                              <option value="ソーセージ原料">ソーセージ原料</option>
                              <option value="その他">その他</option>
                            </select>
                          )}
                        </div>
                      </td>
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button onClick={() => startInlineEdit(r)} style={S.editBtn}>編集</button>
                          <button onClick={() => handleDelete(r.id)} style={S.deleteBtn}>削除</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

// ============================================================
// マスター管理タブ（出荷先 ＋ 品種 ＋ 場所 ＋ エリア）
// ============================================================
function MasterTab() {
  const [activeMaster, setActiveMaster] = useState('destinations');

  return (
    <div style={S.tabContent}>
      <PageHeader title="マスター管理" subtitle="出荷先・品種・場所・エリアなどの基本情報" icon="⚙️" />
      <div style={S.masterTabs}>
        {[['destinations', '🏪 出荷先'], ['varieties', '🌿 品種'], ['areas', '🗺️ エリア'], ['locations', '📍 場所']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveMaster(id)}
            style={{ ...S.masterTab, ...(activeMaster === id ? S.masterTabActive : {}) }}>
            {label}
          </button>
        ))}
      </div>
      {activeMaster === 'destinations' && <DestinationsMaster />}
      {activeMaster === 'varieties' && <VarietiesMaster />}
      {activeMaster === 'areas' && <AreasMaster />}
      {activeMaster === 'locations' && <LocationsMaster />}
    </div>
  );
}

// ============================================================
// エリアマスター
// ============================================================
function AreasMaster() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', notes: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => { fetchAreas(); }, []);

  const fetchAreas = async () => {
    const { data } = await supabase.from('areas').select('*').order('sort_order').order('name');
    setAreas(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await supabase.from('areas').update(formData).eq('id', editId);
      setEditId(null);
    } else {
      const { error } = await supabase.from('areas').insert([formData]);
      if (error) { alert('❌ ' + error.message); return; }
    }
    setFormData({ name: '', notes: '' });
    fetchAreas();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('このエリアを削除しますか？\n（関連する詳細場所の「エリア」情報は残ります）')) return;
    await supabase.from('areas').delete().eq('id', id);
    fetchAreas();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormCard title={editId ? 'エリアを編集' : 'エリアを追加'}>
        <form onSubmit={handleSubmit}>
          <div style={S.formGrid}>
            <div>
              <label style={S.fieldLabel}>エリア名</label>
              <input style={S.input} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="例: 新エリア名" required />
            </div>
            <div style={S.fieldFull}>
              <label style={S.fieldLabel}>備考</label>
              <input style={S.input} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="メモなど（任意）" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, margin: '0 24px 20px' }}>
            <button type="submit" style={{ ...S.submitBtn, margin: 0, flex: 1 }}><Plus size={18} /> {editId ? '更新' : '登録'}</button>
            {editId && <button type="button" onClick={() => { setEditId(null); setFormData({ name: '', notes: '' }); }} style={S.cancelBtn}>キャンセル</button>}
          </div>
        </form>
      </FormCard>

      <div>
        <div style={{ ...S.listHeader, marginBottom: 12 }}>
          <h3 style={S.sectionTitle}>登録済みエリア <span style={S.countBadge}>{areas.length}件</span></h3>
          <span style={{ fontSize: 12, color: '#74c69d' }}>植え付け記録・場所登録のドロップダウンに反映されます</span>
        </div>
        {loading ? <LoadingSpinner /> : areas.length === 0 ? (
          <div>
            <EmptyState text="エリアが登録されていません（下のSQLを実行してください）" />
            <div style={{ marginTop: 12, background: '#f0faf4', border: '1px solid #b7e4c7', borderRadius: 10, padding: 16 }}>
              <p style={{ fontSize: 12, color: '#40916c', fontWeight: 700, marginBottom: 8 }}>📋 Supabase SQL Editorで実行してください：</p>
              <pre style={{ fontSize: 11, color: '#2d6a4f', whiteSpace: 'pre-wrap', margin: 0 }}>{`INSERT INTO areas (name) VALUES
  ('越沢'),('寸庭'),('小中沢'),('青梅'),('栃寄')
ON CONFLICT (name) DO NOTHING;`}</pre>
            </div>
          </div>
        ) : (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead><tr style={S.thead}>
                <th style={S.th}>エリア名</th>
                <th style={S.th}>備考</th>
                <th style={{ ...S.th, textAlign: 'center' }}>操作</th>
              </tr></thead>
              <tbody>
                {areas.map((a, i) => (
                  <tr key={a.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f8fffe' }}>
                    <td style={S.td}><span style={{ fontWeight: 700, color: '#1b4332', fontSize: 14 }}>🗺️ {a.name}</span></td>
                    <td style={{ ...S.td, color: '#74c69d', fontSize: 12 }}>{a.notes || '—'}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => { setEditId(a.id); setFormData({ name: a.name, notes: a.notes || '' }); }} style={S.editBtn}>編集</button>
                        <button onClick={() => handleDelete(a.id)} style={S.deleteBtn}>削除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function DestinationsMaster() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', unit_price: '', notes: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => { fetchDestinations(); }, []);

  const fetchDestinations = async () => {
    const { data } = await supabase.from('destinations').select('*').order('name');
    setDestinations(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null };
    if (editId) {
      await supabase.from('destinations').update(payload).eq('id', editId);
      setEditId(null);
    } else {
      const { error } = await supabase.from('destinations').insert([payload]);
      if (error) { alert('❌ ' + error.message); return; }
    }
    setFormData({ name: '', unit_price: '', notes: '' });
    fetchDestinations();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('削除しますか？')) return;
    await supabase.from('destinations').delete().eq('id', id);
    fetchDestinations();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormCard title={editId ? '出荷先を編集' : '出荷先を登録'}>
        <form onSubmit={handleSubmit}>
          <div style={S.formGrid}>
            <div><label style={S.fieldLabel}>出荷先名</label>
              <input style={S.input} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="例: 六雁" required /></div>
            <div><label style={S.fieldLabel}>単価 (円/g)</label>
              <input type="number" step="0.01" style={S.input} value={formData.unit_price} onChange={e => setFormData({ ...formData, unit_price: e.target.value })} placeholder="例: 35" /></div>
            <div style={S.fieldFull}><label style={S.fieldLabel}>備考</label>
              <input style={S.input} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="メモなど" /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, margin: '0 24px 20px' }}>
            <button type="submit" style={{ ...S.submitBtn, margin: 0, flex: 1 }}><Plus size={18} /> {editId ? '更新' : '登録'}</button>
            {editId && <button type="button" onClick={() => { setEditId(null); setFormData({ name: '', unit_price: '', notes: '' }); }} style={S.cancelBtn}>キャンセル</button>}
          </div>
        </form>
      </FormCard>

      <div>
        <h3 style={{ ...S.sectionTitle, marginBottom: 12 }}>登録済み出荷先 <span style={S.countBadge}>{destinations.length}件</span></h3>
        {loading ? <LoadingSpinner /> : destinations.length === 0 ? <EmptyState text="出荷先が登録されていません" /> : (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead><tr style={S.thead}>
                <th style={S.th}>出荷先名</th>
                <th style={{ ...S.th, textAlign: 'right' }}>単価 (円/g)</th>
                <th style={S.th}>備考</th>
                <th style={{ ...S.th, textAlign: 'center' }}>操作</th>
              </tr></thead>
              <tbody>
                {destinations.map((d, i) => (
                  <tr key={d.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f8fffe' }}>
                    <td style={S.td}><span style={S.destTag}>{d.name}</span></td>
                    <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#2d6a4f' }}>
                      {d.unit_price ? `¥${d.unit_price}` : <span style={{ color: '#b7e4c7' }}>未設定</span>}
                    </td>
                    <td style={{ ...S.td, color: '#74c69d', fontSize: 12 }}>{d.notes || '—'}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => { setEditId(d.id); setFormData({ name: d.name, unit_price: d.unit_price || '', notes: d.notes || '' }); }} style={S.editBtn}>編集</button>
                        <button onClick={() => handleDelete(d.id)} style={S.deleteBtn}>削除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function VarietiesMaster() {
  const [varieties, setVarieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', notes: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => { fetchVarieties(); }, []);

  const fetchVarieties = async () => {
    const { data } = await supabase.from('varieties').select('*').order('name');
    setVarieties(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await supabase.from('varieties').update(formData).eq('id', editId);
      setEditId(null);
    } else {
      const { error } = await supabase.from('varieties').insert([formData]);
      if (error) { alert('❌ ' + error.message); return; }
    }
    setFormData({ name: '', notes: '' });
    fetchVarieties();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('削除しますか？')) return;
    await supabase.from('varieties').delete().eq('id', id);
    fetchVarieties();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormCard title={editId ? '品種を編集' : '品種を登録'}>
        <form onSubmit={handleSubmit}>
          <div style={S.formGrid}>
            <div><label style={S.fieldLabel}>品種名</label>
              <input style={S.input} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="例: 天城ニシキ" required /></div>
            <div style={S.fieldFull}><label style={S.fieldLabel}>備考</label>
              <input style={S.input} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="メモなど（任意）" /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, margin: '0 24px 20px' }}>
            <button type="submit" style={{ ...S.submitBtn, margin: 0, flex: 1 }}><Plus size={18} /> {editId ? '更新' : '登録'}</button>
            {editId && <button type="button" onClick={() => { setEditId(null); setFormData({ name: '', notes: '' }); }} style={S.cancelBtn}>キャンセル</button>}
          </div>
        </form>
      </FormCard>

      <div>
        <div style={{ ...S.listHeader, marginBottom: 12 }}>
          <h3 style={S.sectionTitle}>登録済み品種 <span style={S.countBadge}>{varieties.length}件</span></h3>
          <span style={{ fontSize: 12, color: '#74c69d' }}>植え付け記録で「世代・系統」を自由入力できます</span>
        </div>
        {loading ? <LoadingSpinner /> : varieties.length === 0 ? <EmptyState text="品種が登録されていません" /> : (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead><tr style={S.thead}>
                <th style={S.th}>品種名</th>
                <th style={S.th}>備考</th>
                <th style={{ ...S.th, textAlign: 'center' }}>操作</th>
              </tr></thead>
              <tbody>
                {varieties.map((v, i) => (
                  <tr key={v.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f8fffe' }}>
                    <td style={S.td}><span style={S.varietyBadge}>{v.name}</span></td>
                    <td style={{ ...S.td, color: '#74c69d', fontSize: 12 }}>{v.notes || '—'}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => { setEditId(v.id); setFormData({ name: v.name, notes: v.notes || '' }); }} style={S.editBtn}>編集</button>
                        <button onClick={() => handleDelete(v.id)} style={S.deleteBtn}>削除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function LocationsMaster() {
  const [locations, setLocations] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ area: '', name: '', notes: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [{ data: ld }, { data: ad }] = await Promise.all([
      supabase.from('locations').select('*').order('area').order('name'),
      supabase.from('areas').select('*').order('sort_order').order('name'),
    ]);
    setLocations(ld || []);
    setAreas((ad && ad.length > 0) ? ad.map(a => a.name) : AREA_NAMES_FALLBACK);
    setLoading(false);
  };

  const fetchLocations = async () => {
    const { data } = await supabase.from('locations').select('*').order('area').order('name');
    setLocations(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await supabase.from('locations').update(formData).eq('id', editId);
      setEditId(null);
    } else {
      const { error } = await supabase.from('locations').insert([formData]);
      if (error) { alert('❌ ' + error.message); return; }
    }
    setFormData({ area: '', name: '', notes: '' });
    fetchLocations();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('削除しますか？')) return;
    await supabase.from('locations').delete().eq('id', id);
    fetchLocations();
  };

  // エリアごとにグループ化
  const grouped = {};
  locations.forEach(l => {
    if (!grouped[l.area]) grouped[l.area] = [];
    grouped[l.area].push(l);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormCard title={editId ? '場所を編集' : '場所を登録'}>
        <form onSubmit={handleSubmit}>
          <div style={S.formGrid}>
            <div>
              <label style={S.fieldLabel}>わさび田（エリア）</label>
              <select style={S.select} value={formData.area} onChange={e => setFormData({ ...formData, area: e.target.value })} required>
                <option value="">エリアを選択</option>
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={S.fieldLabel}>詳細場所名</label>
              <input style={S.input} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="例: 越沢08-01" required />
            </div>
            <div style={S.fieldFull}>
              <label style={S.fieldLabel}>備考</label>
              <input style={S.input} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="メモなど（任意）" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, margin: '0 24px 20px' }}>
            <button type="submit" style={{ ...S.submitBtn, margin: 0, flex: 1 }}><Plus size={18} /> {editId ? '更新' : '登録'}</button>
            {editId && <button type="button" onClick={() => { setEditId(null); setFormData({ area: '', name: '', notes: '' }); }} style={S.cancelBtn}>キャンセル</button>}
          </div>
        </form>
      </FormCard>

      <div>
        <div style={{ ...S.listHeader, marginBottom: 12 }}>
          <h3 style={S.sectionTitle}>登録済み場所 <span style={S.countBadge}>{locations.length}件</span></h3>
          <span style={{ fontSize: 12, color: '#74c69d' }}>植え付け記録のドロップダウンに反映されます</span>
        </div>
        {loading ? <LoadingSpinner /> : locations.length === 0 ? <EmptyState text="場所が登録されていません" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(grouped).map(([area, locs]) => (
              <div key={area} style={S.tableWrap}>
                <div style={{ ...S.groupHeader, cursor: 'default' }}>
                  <div style={S.groupLeft}>
                    <span style={S.groupTitle}>{area}</span>
                    <span style={S.groupCount}>{locs.length}件</span>
                  </div>
                </div>
                <table style={S.table}>
                  <thead><tr style={S.thead}>
                    <th style={S.th}>場所名</th>
                    <th style={S.th}>備考</th>
                    <th style={{ ...S.th, textAlign: 'center' }}>操作</th>
                  </tr></thead>
                  <tbody>
                    {locs.map((l, i) => (
                      <tr key={l.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f8fffe' }}>
                        <td style={S.td}><span style={{ fontWeight: 600, color: '#1b4332' }}>{l.name}</span></td>
                        <td style={{ ...S.td, color: '#74c69d', fontSize: 12 }}>{l.notes || '—'}</td>
                        <td style={{ ...S.td, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button onClick={() => { setEditId(l.id); setFormData({ area: l.area, name: l.name, notes: l.notes || '' }); }} style={S.editBtn}>編集</button>
                            <button onClick={() => handleDelete(l.id)} style={S.deleteBtn}>削除</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 共通コンポーネント
// ============================================================
function PageHeader({ title, subtitle, icon }) {
  return (
    <div style={S.pageHeader}>
      <div style={S.pageHeaderIcon}>{icon}</div>
      <div>
        <h2 style={S.pageTitle}>{title}</h2>
        <p style={S.pageSubtitle}>{subtitle}</p>
      </div>
    </div>
  );
}

function FormCard({ title, children }) {
  return (
    <div style={S.formCard}>
      <div style={S.formCardHeader}><h3 style={S.formCardTitle}>{title}</h3></div>
      {children}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <div style={S.spinner} />
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={S.emptyState}>
      <div style={S.emptyIcon}>🌿</div>
      <p style={S.emptyText}>{text}</p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div style={{ ...S.emptyState, height: 220 }}>
      <p style={{ ...S.emptyText, fontSize: 13 }}>データがまだありません</p>
    </div>
  );
}
