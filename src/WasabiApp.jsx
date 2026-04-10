import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Plus, LogOut, Sprout, PackageCheck, Scissors, LayoutDashboard, Store } from 'lucide-react';

// Supabase初期化
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================
// マスターデータ（場所・苗の選択肢）
// ============================================================
const LOCATION_OPTIONS = [
  { group: '越沢エリア', options: [
    '越沢05-04', '越沢05-05', '越沢06-01', '越沢06-06',
    '越沢07-01', '越沢07-04', '越沢10-03', '越沢（詳細不明）'
  ]},
  { group: 'メインエリア', options: [
    'メイン横のわさび田（新しく直した所）',
    'メイン横のわさび田（新しく直した所） (1)',
    'キッチン横',
    '木が倒れている場所'
  ]},
  { group: '区画番号', options: ['1', '2', '3', '4', '5', '6'] },
];

const VARIETY_OPTIONS = [
  '天城ニシキ', '真妻（2代目）', '実生', 'レイワ', '5783', 'イシダル'
];

const PROCESSING_PARTS = ['花', '茎・葉', '茎', '葉', '根茎'];

// ============================================================
// カラーパレット（CSS変数風）
// ============================================================
const colors = {
  primary: '#2d6a4f',
  primaryLight: '#52b788',
  primaryDark: '#1b4332',
  accent: '#95d5b2',
  accentWarm: '#d8f3dc',
  surface: '#f8fffe',
  card: '#ffffff',
  border: '#b7e4c7',
  textPrimary: '#1b4332',
  textSecondary: '#40916c',
  textMuted: '#74c69d',
  chartColors: ['#2d6a4f', '#52b788', '#95d5b2', '#40916c', '#74c69d'],
};

// ============================================================
// メインコンポーネント
// ============================================================
export default function WasabiApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingContent}>
          <div style={styles.loadingLeaf}>🌿</div>
          <div style={styles.loadingBar}><div style={styles.loadingProgress} /></div>
          <p style={styles.loadingText}>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const tabs = [
    { id: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
    { id: 'planting', label: '植え付け', icon: Sprout },
    { id: 'shipment', label: '出荷', icon: PackageCheck },
    { id: 'processing', label: '加工', icon: Scissors },
    { id: 'destinations', label: '出荷先管理', icon: Store },
  ];

  return (
    <div style={styles.app}>
      {/* ヘッダー */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerBrand}>
            <div style={styles.headerLeaf}>🌿</div>
            <div>
              <div style={styles.headerTitle}>わさび田管理</div>
              <div style={styles.headerSub}>Farm Management System</div>
            </div>
          </div>
          <div style={styles.headerUser}>
            <span style={styles.headerEmail}>{user.email?.split('@')[0]}</span>
            <button style={styles.logoutBtn} onClick={() => supabase.auth.signOut()}>
              <LogOut size={14} />
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      </header>

      {/* ナビゲーション */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.navBtn,
                  ...(active ? styles.navBtnActive : {})
                }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                <span style={styles.navLabel}>{tab.label}</span>
                {active && <div style={styles.navIndicator} />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* コンテンツ */}
      <main style={styles.main}>
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'planting' && <PlantingTab />}
        {activeTab === 'shipment' && <ShipmentTab />}
        {activeTab === 'processing' && <ProcessingTab />}
        {activeTab === 'destinations' && <DestinationsTab />}
      </main>
    </div>
  );
}

// ============================================================
// ログイン画面
// ============================================================
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        setMessage('success:メールを確認してください');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setMessage('error:' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) console.error(error);
  };

  const isSuccess = message.startsWith('success:');

  return (
    <div style={styles.loginBg}>
      {/* 背景デコレーション */}
      <div style={styles.loginDeco1} />
      <div style={styles.loginDeco2} />
      <div style={styles.loginDeco3} />

      <div style={styles.loginCard}>
        <div style={styles.loginHeader}>
          <div style={styles.loginEmoji}>🌿</div>
          <h1 style={styles.loginTitle}>わさび田管理</h1>
          <p style={styles.loginSubtitle}>Farm Management System</p>
        </div>

        {message && (
          <div style={{ ...styles.msgBox, ...(isSuccess ? styles.msgSuccess : styles.msgError) }}>
            {isSuccess ? '✅ ' : '❌ '}{message.slice(message.indexOf(':') + 1)}
          </div>
        )}

        <form onSubmit={handleEmailAuth} style={styles.loginForm}>
          <InputField label="メールアドレス" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@gmail.com" required />
          <InputField label="パスワード" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          <button type="submit" disabled={loading} style={styles.primaryBtn}>
            {loading ? '処理中...' : isSignUp ? '新規登録' : 'ログイン'}
          </button>
          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }} style={styles.textBtn}>
            {isSignUp ? 'ログインへ戻る' : '新規登録はこちら'}
          </button>
        </form>

        <div style={styles.divider}><span style={styles.dividerText}>または</span></div>

        <button onClick={handleGoogleLogin} style={styles.googleBtn}>
          <span style={{ fontSize: 18 }}>G</span>
          <span>Google でログイン</span>
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
        supabase.from('shipments').select('shipment_date, quantity, total_amount, destinations(name)'),
        supabase.from('processing').select('*'),
        supabase.from('plantings').select('*'),
      ]);

      // 月別出荷量
      const monthMap = {};
      (shipments || []).forEach(s => {
        const m = s.shipment_date?.slice(0, 7);
        if (m) monthMap[m] = (monthMap[m] || 0) + parseFloat(s.quantity || 0);
      });
      const monthlyData = Object.entries(monthMap).sort().map(([m, v]) => ({
        month: m.slice(5) + '月', 出荷量: Math.round(v)
      }));

      // 出荷先別
      const destMap = {};
      (shipments || []).forEach(s => {
        const name = s.destinations?.name || '不明';
        destMap[name] = (destMap[name] || 0) + parseFloat(s.quantity || 0);
      });
      const destData = Object.entries(destMap).map(([name, v]) => ({ name, 出荷量: Math.round(v) }));

      // 部位別歩留まり
      const partMap = {};
      (processing || []).forEach(p => {
        if (!partMap[p.part]) partMap[p.part] = [];
        partMap[p.part].push(parseFloat(p.yield_rate || 0));
      });
      const yieldData = Object.entries(partMap).map(([part, arr]) => ({
        part, 歩留まり: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
      }));

      // サマリー統計
      const totalQty = (shipments || []).reduce((a, s) => a + parseFloat(s.quantity || 0), 0);
      const avgYield = yieldData.length ? Math.round(yieldData.reduce((a, b) => a + b.歩留まり, 0) / yieldData.length) : 0;

      setStats({
        totalPlantings: (plantings || []).length,
        totalShipments: Math.round(totalQty),
        totalProcessing: (processing || []).length,
        avgYield
      });

      setData({ monthlyData, destData, yieldData });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const statCards = [
    { label: '植え付けロット', value: stats.totalPlantings, unit: '件', icon: '🌱', color: '#2d6a4f' },
    { label: '総出荷量', value: stats.totalShipments.toLocaleString(), unit: 'g', icon: '📦', color: '#40916c' },
    { label: '加工記録', value: stats.totalProcessing, unit: '件', icon: '🔪', color: '#52b788' },
    { label: '平均歩留まり', value: stats.avgYield, unit: '%', icon: '📊', color: '#74c69d' },
  ];

  return (
    <div style={styles.tabContent}>
      <PageHeader title="ダッシュボード" subtitle="農場の状況をひと目で確認" icon="📊" />

      {/* サマリーカード */}
      <div style={styles.statsGrid}>
        {statCards.map((s, i) => (
          <div key={i} style={{ ...styles.statCard, borderTop: `3px solid ${s.color}` }}>
            <div style={styles.statEmoji}>{s.icon}</div>
            <div style={{ ...styles.statValue, color: s.color }}>{s.value}<span style={styles.statUnit}>{s.unit}</span></div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* チャートグリッド */}
      <div style={styles.chartGrid}>
        <ChartCard title="📈 月別出荷量">
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
        </ChartCard>

        <ChartCard title="🎯 出荷先別出荷量">
          {(data?.destData?.length || 0) > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.destData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8f5e9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#40916c' }} />
                <YAxis tick={{ fontSize: 11, fill: '#74c69d' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #b7e4c7' }} />
                <Bar dataKey="出荷量" radius={[4, 4, 0, 0]}>
                  {(data?.destData || []).map((_, i) => (
                    <Cell key={i} fill={colors.chartColors[i % colors.chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="🔪 部位別歩留まり率">
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
        </ChartCard>

        {/* 今後の予定カード */}
        <ChartCard title="🚧 今後追加予定の機能">
          <div style={styles.futureFeatures}>
            {[
              { icon: '📅', text: '植え付けから出荷までの日数分析' },
              { icon: '💹', text: '出荷先ごとの売上トレンド' },
              { icon: '🌡️', text: '天気・気温データとの連携' },
              { icon: '📱', text: '収穫リマインダー通知' },
            ].map((f, i) => (
              <div key={i} style={styles.futureItem}>
                <span style={styles.futureIcon}>{f.icon}</span>
                <span style={styles.futureText}>{f.text}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <button onClick={fetchDashboardData} style={styles.refreshBtn}>
        🔄 データを更新
      </button>
    </div>
  );
}

// ============================================================
// 植え付け記録タブ
// ============================================================
function PlantingTab() {
  const [formData, setFormData] = useState({
    location: '', planted_date: '', planted_quantity: '', variety: '', status: '生育中', notes: ''
  });
  const [plantings, setPlantings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customLocation, setCustomLocation] = useState(false);
  const [customVariety, setCustomVariety] = useState(false);
  const [filterStatus, setFilterStatus] = useState('すべて');

  useEffect(() => { fetchPlantings(); }, []);

  const fetchPlantings = async () => {
    const { data } = await supabase.from('plantings').select('*').order('planted_date', { ascending: false });
    setPlantings(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('plantings').insert([formData]);
    if (!error) {
      setFormData({ location: '', planted_date: '', planted_quantity: '', variety: '', status: '生育中', notes: '' });
      fetchPlantings();
    } else {
      alert('❌ エラー: ' + error.message);
    }
  };

  const filtered = filterStatus === 'すべて' ? plantings : plantings.filter(p => p.status === filterStatus);

  const statusColors = {
    '生育中': { bg: '#d8f3dc', text: '#1b4332', dot: '#52b788' },
    '収穫可能': { bg: '#fff3cd', text: '#664d03', dot: '#ffc107' },
    '収穫済': { bg: '#e2e3e5', text: '#41464b', dot: '#6c757d' },
    '廃棄': { bg: '#f8d7da', text: '#842029', dot: '#dc3545' },
  };

  return (
    <div style={styles.tabContent}>
      <PageHeader title="植え付け記録" subtitle="植え付けロットの管理" icon="🌱" />

      {/* フォーム */}
      <FormCard title="新しい植え付けを記録">
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            {/* 場所 */}
            <div style={styles.fieldFull}>
              <label style={styles.fieldLabel}>場所</label>
              <div style={styles.fieldToggleRow}>
                <button type="button" onClick={() => setCustomLocation(!customLocation)} style={styles.toggleLink}>
                  {customLocation ? '▾ 選択肢から選ぶ' : '✏️ 直接入力'}
                </button>
              </div>
              {customLocation ? (
                <input style={styles.input} value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="場所を入力" required />
              ) : (
                <select style={styles.select} value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} required>
                  <option value="">場所を選択</option>
                  {LOCATION_OPTIONS.map(g => (
                    <optgroup key={g.group} label={g.group}>
                      {g.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </optgroup>
                  ))}
                </select>
              )}
            </div>

            {/* 苗の種類 */}
            <div>
              <label style={styles.fieldLabel}>苗の種類</label>
              <div style={styles.fieldToggleRow}>
                <button type="button" onClick={() => setCustomVariety(!customVariety)} style={styles.toggleLink}>
                  {customVariety ? '▾ 選択肢から選ぶ' : '✏️ 直接入力'}
                </button>
              </div>
              {customVariety ? (
                <input style={styles.input} value={formData.variety} onChange={e => setFormData({ ...formData, variety: e.target.value })} placeholder="品種名を入力" />
              ) : (
                <select style={styles.select} value={formData.variety} onChange={e => setFormData({ ...formData, variety: e.target.value })}>
                  <option value="">品種を選択</option>
                  {VARIETY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              )}
            </div>

            <div>
              <label style={styles.fieldLabel}>植え付け日</label>
              <input type="date" style={styles.input} value={formData.planted_date} onChange={e => setFormData({ ...formData, planted_date: e.target.value })} required />
            </div>

            <div>
              <label style={styles.fieldLabel}>植え付け本数</label>
              <input type="number" style={styles.input} value={formData.planted_quantity} onChange={e => setFormData({ ...formData, planted_quantity: e.target.value })} placeholder="本数" required />
            </div>

            <div>
              <label style={styles.fieldLabel}>ステータス</label>
              <select style={styles.select} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                <option>生育中</option>
                <option>収穫可能</option>
                <option>収穫済</option>
                <option>廃棄</option>
              </select>
            </div>

            <div style={styles.fieldFull}>
              <label style={styles.fieldLabel}>備考</label>
              <input style={styles.input} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="メモなど（任意）" />
            </div>
          </div>
          <button type="submit" style={styles.submitBtn}>
            <Plus size={18} /> 記録を追加
          </button>
        </form>
      </FormCard>

      {/* フィルター & 一覧 */}
      <div>
        <div style={styles.listHeader}>
          <h3 style={styles.sectionTitle}>記録一覧 <span style={styles.countBadge}>{filtered.length}件</span></h3>
          <div style={styles.filterRow}>
            {['すべて', '生育中', '収穫可能', '収穫済', '廃棄'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                ...styles.filterBtn,
                ...(filterStatus === s ? styles.filterBtnActive : {})
              }}>{s}</button>
            ))}
          </div>
        </div>

        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState text="記録がまだありません" />
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>場所</th>
                  <th style={styles.th}>品種</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>植え付け日</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>本数</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>ステータス</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const sc = statusColors[p.status] || statusColors['生育中'];
                  return (
                    <tr key={p.id} style={{ ...styles.tr, backgroundColor: i % 2 === 0 ? '#fff' : '#f8fffe' }}>
                      <td style={styles.td}>
                        <span style={styles.locationText}>{p.location}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.varietyBadge}>{p.variety || '—'}</span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center', color: '#40916c' }}>{p.planted_date}</td>
                      <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, color: '#2d6a4f' }}>{p.planted_quantity?.toLocaleString()}本</td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={{ ...styles.statusBadge, backgroundColor: sc.bg, color: sc.text }}>
                          <span style={{ ...styles.statusDot, backgroundColor: sc.dot }} />
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 出荷記録タブ（出荷先選択で単価自動入力）
// ============================================================
function ShipmentTab() {
  const [formData, setFormData] = useState({
    planting_id: '', destination_id: '', shipment_date: '', quantity: '', unit_price: '', notes: ''
  });
  const [plantings, setPlantings] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [{ data: pd }, { data: dd }, { data: sd }] = await Promise.all([
      supabase.from('plantings').select('*').order('planted_date', { ascending: false }),
      supabase.from('destinations').select('*').order('name'),
      supabase.from('shipments').select('*, plantings(location, variety), destinations(name)').order('shipment_date', { ascending: false })
    ]);
    setPlantings(pd || []);
    setDestinations(dd || []);
    setShipments(sd || []);
    setLoading(false);
  };

  // 出荷先が変わったら単価を自動セット
  const handleDestinationChange = (e) => {
    const destId = e.target.value;
    const dest = destinations.find(d => d.id === destId);
    setFormData(prev => ({
      ...prev,
      destination_id: destId,
      unit_price: dest?.unit_price ? String(dest.unit_price) : ''
    }));
  };

  const totalAmount = formData.quantity && formData.unit_price
    ? (parseFloat(formData.quantity) * parseFloat(formData.unit_price)).toLocaleString()
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = formData.quantity && formData.unit_price
      ? parseFloat(formData.quantity) * parseFloat(formData.unit_price)
      : null;
    const { error } = await supabase.from('shipments').insert([{ ...formData, total_amount: total }]);
    if (!error) {
      setFormData({ planting_id: '', destination_id: '', shipment_date: '', quantity: '', unit_price: '', notes: '' });
      fetchData();
    } else {
      alert('❌ エラー: ' + error.message);
    }
  };

  const totalRevenue = shipments.reduce((a, s) => a + parseFloat(s.total_amount || 0), 0);

  return (
    <div style={styles.tabContent}>
      <PageHeader title="出荷記録" subtitle="出荷先・数量・金額の管理" icon="📦" />

      <FormCard title="新しい出荷を記録">
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div>
              <label style={styles.fieldLabel}>植え付けロット</label>
              <select style={styles.select} value={formData.planting_id} onChange={e => setFormData({ ...formData, planting_id: e.target.value })} required>
                <option value="">ロットを選択</option>
                {plantings.map(p => (
                  <option key={p.id} value={p.id}>{p.location}（{p.variety || '品種不明'}）</option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.fieldLabel}>出荷先</label>
              <select style={styles.select} value={formData.destination_id} onChange={handleDestinationChange} required>
                <option value="">出荷先を選択</option>
                {destinations.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}{d.unit_price ? ` (¥${d.unit_price}/g)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.fieldLabel}>出荷日</label>
              <input type="date" style={styles.input} value={formData.shipment_date} onChange={e => setFormData({ ...formData, shipment_date: e.target.value })} required />
            </div>

            <div>
              <label style={styles.fieldLabel}>出荷量 (g)</label>
              <input type="number" step="0.1" style={styles.input} value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} placeholder="例: 500" required />
            </div>

            <div>
              <label style={styles.fieldLabel}>
                単価 (円/g)
                {formData.destination_id && destinations.find(d => d.id === formData.destination_id)?.unit_price && (
                  <span style={styles.autoFillBadge}>⚡ 自動入力</span>
                )}
              </label>
              <input type="number" step="0.01" style={styles.input} value={formData.unit_price} onChange={e => setFormData({ ...formData, unit_price: e.target.value })} placeholder="例: 35" />
            </div>

            {/* 合計金額プレビュー */}
            {totalAmount && (
              <div style={styles.totalPreview}>
                <span style={styles.totalLabel}>合計金額</span>
                <span style={styles.totalValue}>¥{totalAmount}</span>
              </div>
            )}

            <div style={styles.fieldFull}>
              <label style={styles.fieldLabel}>備考</label>
              <input style={styles.input} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="メモなど（任意）" />
            </div>
          </div>
          <button type="submit" style={styles.submitBtn}>
            <Plus size={18} /> 記録を追加
          </button>
        </form>
      </FormCard>

      <div>
        <div style={styles.listHeader}>
          <h3 style={styles.sectionTitle}>出荷記録一覧 <span style={styles.countBadge}>{shipments.length}件</span></h3>
          <div style={styles.revenueSummary}>
            総売上: <strong style={{ color: '#2d6a4f' }}>¥{Math.round(totalRevenue).toLocaleString()}</strong>
          </div>
        </div>

        {loading ? <LoadingSpinner /> : shipments.length === 0 ? (
          <EmptyState text="出荷記録がまだありません" />
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>出荷日</th>
                  <th style={styles.th}>出荷先</th>
                  <th style={styles.th}>ロット</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>出荷量</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>単価</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>金額</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((s, i) => (
                  <tr key={s.id} style={{ ...styles.tr, backgroundColor: i % 2 === 0 ? '#fff' : '#f8fffe' }}>
                    <td style={{ ...styles.td, color: '#40916c' }}>{s.shipment_date}</td>
                    <td style={styles.td}>
                      <span style={styles.destTag}>{s.destinations?.name}</span>
                    </td>
                    <td style={{ ...styles.td, fontSize: 12, color: '#52b788' }}>{s.plantings?.location}</td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>{parseFloat(s.quantity).toLocaleString()}g</td>
                    <td style={{ ...styles.td, textAlign: 'right', color: '#74c69d' }}>
                      {s.unit_price ? `¥${s.unit_price}/g` : '—'}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, color: '#1b4332' }}>
                      {s.total_amount ? `¥${Math.round(s.total_amount).toLocaleString()}` : '—'}
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

// ============================================================
// 加工記録タブ
// ============================================================
function ProcessingTab() {
  const [formData, setFormData] = useState({
    processing_date: '', part: '', weight_before: '', weight_after: '', notes: ''
  });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customPart, setCustomPart] = useState(false);

  useEffect(() => { fetchProcessing(); }, []);

  const fetchProcessing = async () => {
    const { data } = await supabase.from('processing').select('*').order('processing_date', { ascending: false });
    setRecords(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const yield_rate = ((parseFloat(formData.weight_after) / parseFloat(formData.weight_before)) * 100).toFixed(2);
    const { error } = await supabase.from('processing').insert([{ ...formData, yield_rate }]);
    if (!error) {
      setFormData({ processing_date: '', part: '', weight_before: '', weight_after: '', notes: '' });
      fetchProcessing();
    } else {
      alert('❌ エラー: ' + error.message);
    }
  };

  const yieldPreview = formData.weight_before && formData.weight_after
    ? ((parseFloat(formData.weight_after) / parseFloat(formData.weight_before)) * 100).toFixed(1)
    : null;

  const getYieldColor = (rate) => {
    if (rate >= 60) return '#2d6a4f';
    if (rate >= 45) return '#52b788';
    return '#f59e0b';
  };

  return (
    <div style={styles.tabContent}>
      <PageHeader title="加工記録" subtitle="部位別の重量と歩留まり率" icon="🔪" />

      <FormCard title="新しい加工を記録">
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div>
              <label style={styles.fieldLabel}>加工日</label>
              <input type="date" style={styles.input} value={formData.processing_date} onChange={e => setFormData({ ...formData, processing_date: e.target.value })} required />
            </div>

            <div>
              <label style={styles.fieldLabel}>部位</label>
              <div style={styles.fieldToggleRow}>
                <button type="button" onClick={() => setCustomPart(!customPart)} style={styles.toggleLink}>
                  {customPart ? '▾ 選択肢から選ぶ' : '✏️ 直接入力'}
                </button>
              </div>
              {customPart ? (
                <input style={styles.input} value={formData.part} onChange={e => setFormData({ ...formData, part: e.target.value })} placeholder="部位を入力" required />
              ) : (
                <select style={styles.select} value={formData.part} onChange={e => setFormData({ ...formData, part: e.target.value })} required>
                  <option value="">部位を選択</option>
                  {PROCESSING_PARTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              )}
            </div>

            <div>
              <label style={styles.fieldLabel}>加工前重量 (g)</label>
              <input type="number" step="0.1" style={styles.input} value={formData.weight_before} onChange={e => setFormData({ ...formData, weight_before: e.target.value })} placeholder="例: 1500" required />
            </div>

            <div>
              <label style={styles.fieldLabel}>加工後重量 (g)</label>
              <input type="number" step="0.1" style={styles.input} value={formData.weight_after} onChange={e => setFormData({ ...formData, weight_after: e.target.value })} placeholder="例: 780" required />
            </div>

            {yieldPreview && (
              <div style={styles.totalPreview}>
                <span style={styles.totalLabel}>歩留まり率（自動計算）</span>
                <span style={{ ...styles.totalValue, color: getYieldColor(parseFloat(yieldPreview)) }}>
                  {yieldPreview}%
                </span>
              </div>
            )}

            <div style={styles.fieldFull}>
              <label style={styles.fieldLabel}>備考</label>
              <input style={styles.input} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="メモなど（任意）" />
            </div>
          </div>
          <button type="submit" style={styles.submitBtn}>
            <Plus size={18} /> 記録を追加
          </button>
        </form>
      </FormCard>

      <div>
        <div style={styles.listHeader}>
          <h3 style={styles.sectionTitle}>加工記録一覧 <span style={styles.countBadge}>{records.length}件</span></h3>
        </div>

        {loading ? <LoadingSpinner /> : records.length === 0 ? (
          <EmptyState text="加工記録がまだありません" />
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>加工日</th>
                  <th style={styles.th}>部位</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>加工前 (g)</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>加工後 (g)</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>歩留まり</th>
                  <th style={styles.th}>備考</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const yr = parseFloat(r.yield_rate || 0);
                  const yc = getYieldColor(yr);
                  return (
                    <tr key={r.id} style={{ ...styles.tr, backgroundColor: i % 2 === 0 ? '#fff' : '#f8fffe' }}>
                      <td style={{ ...styles.td, color: '#40916c' }}>{r.processing_date}</td>
                      <td style={styles.td}>
                        <span style={styles.partBadge}>{r.part}</span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{parseFloat(r.weight_before).toLocaleString()}g</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{parseFloat(r.weight_after).toLocaleString()}g</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <span style={{ ...styles.yieldBadge, color: yc, borderColor: yc }}>{yr.toFixed(1)}%</span>
                      </td>
                      <td style={{ ...styles.td, fontSize: 12, color: '#74c69d' }}>{r.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 出荷先管理タブ
// ============================================================
function DestinationsTab() {
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

  const handleEdit = (d) => {
    setEditId(d.id);
    setFormData({ name: d.name, unit_price: d.unit_price || '', notes: d.notes || '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('削除しますか？')) return;
    await supabase.from('destinations').delete().eq('id', id);
    fetchDestinations();
  };

  return (
    <div style={styles.tabContent}>
      <PageHeader title="出荷先管理" subtitle="出荷先と単価の登録・編集" icon="🏪" />

      <FormCard title={editId ? '出荷先を編集' : '新しい出荷先を登録'}>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div>
              <label style={styles.fieldLabel}>出荷先名</label>
              <input style={styles.input} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="例: 六雁" required />
            </div>
            <div>
              <label style={styles.fieldLabel}>単価 (円/g)</label>
              <input type="number" step="0.01" style={styles.input} value={formData.unit_price} onChange={e => setFormData({ ...formData, unit_price: e.target.value })} placeholder="例: 35（出荷記録で自動入力されます）" />
            </div>
            <div style={styles.fieldFull}>
              <label style={styles.fieldLabel}>備考</label>
              <input style={styles.input} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="メモなど" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={styles.submitBtn}>
              <Plus size={18} /> {editId ? '更新' : '登録'}
            </button>
            {editId && (
              <button type="button" onClick={() => { setEditId(null); setFormData({ name: '', unit_price: '', notes: '' }); }} style={styles.cancelBtn}>
                キャンセル
              </button>
            )}
          </div>
        </form>
      </FormCard>

      <div>
        <h3 style={styles.sectionTitle}>登録済み出荷先 <span style={styles.countBadge}>{destinations.length}件</span></h3>

        {loading ? <LoadingSpinner /> : destinations.length === 0 ? (
          <EmptyState text="出荷先が登録されていません" />
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>出荷先名</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>単価 (円/g)</th>
                  <th style={styles.th}>備考</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {destinations.map((d, i) => (
                  <tr key={d.id} style={{ ...styles.tr, backgroundColor: i % 2 === 0 ? '#fff' : '#f8fffe' }}>
                    <td style={styles.td}>
                      <span style={styles.destTag}>{d.name}</span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, color: '#2d6a4f' }}>
                      {d.unit_price ? `¥${d.unit_price}` : <span style={{ color: '#b7e4c7' }}>未設定</span>}
                    </td>
                    <td style={{ ...styles.td, color: '#74c69d', fontSize: 12 }}>{d.notes || '—'}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => handleEdit(d)} style={styles.editBtn}>編集</button>
                        <button onClick={() => handleDelete(d.id)} style={styles.deleteBtn}>削除</button>
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

// ============================================================
// 共通コンポーネント
// ============================================================

function PageHeader({ title, subtitle, icon }) {
  return (
    <div style={styles.pageHeader}>
      <div style={styles.pageHeaderIcon}>{icon}</div>
      <div>
        <h2 style={styles.pageTitle}>{title}</h2>
        <p style={styles.pageSubtitle}>{subtitle}</p>
      </div>
    </div>
  );
}

function FormCard({ title, children }) {
  return (
    <div style={styles.formCard}>
      <div style={styles.formCardHeader}>
        <h3 style={styles.formCardTitle}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={styles.chartCard}>
      <h3 style={styles.chartTitle}>{title}</h3>
      {children}
    </div>
  );
}

function InputField({ label, ...props }) {
  return (
    <div>
      <label style={styles.fieldLabel}>{label}</label>
      <input style={styles.input} {...props} />
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <div style={styles.spinner} />
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>🌿</div>
      <p style={styles.emptyText}>{text}</p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div style={{ ...styles.emptyState, height: 220 }}>
      <p style={{ ...styles.emptyText, fontSize: 13 }}>データがまだありません</p>
    </div>
  );
}

// ============================================================
// スタイル定義
// ============================================================

const styles = {
  // アプリ全体
  app: {
    minHeight: '100vh',
    backgroundColor: '#f0faf4',
    fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
  },

  // ヘッダー
  header: {
    background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
    boxShadow: '0 2px 12px rgba(27,67,50,0.25)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBrand: { display: 'flex', alignItems: 'center', gap: 12 },
  headerLeaf: { fontSize: 28, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' },
  headerTitle: { color: '#d8f3dc', fontSize: 18, fontWeight: 700, letterSpacing: '0.02em' },
  headerSub: { color: '#74c69d', fontSize: 11, letterSpacing: '0.05em' },
  headerUser: { display: 'flex', alignItems: 'center', gap: 12 },
  headerEmail: { color: '#95d5b2', fontSize: 13 },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 20,
    color: '#d8f3dc',
    padding: '6px 14px',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },

  // ナビ
  nav: {
    background: '#fff',
    borderBottom: '1px solid #d8f3dc',
    boxShadow: '0 1px 4px rgba(45,106,79,0.08)',
  },
  navInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    gap: 0,
    overflowX: 'auto',
  },
  navBtn: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '14px 18px',
    border: 'none',
    background: 'none',
    color: '#74c69d',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'color 0.2s',
  },
  navBtnActive: {
    color: '#1b4332',
    fontWeight: 700,
  },
  navLabel: {},
  navIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    right: 10,
    height: 3,
    borderRadius: '3px 3px 0 0',
    background: 'linear-gradient(90deg, #2d6a4f, #52b788)',
  },

  // メイン
  main: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '28px 20px 60px',
  },
  tabContent: { display: 'flex', flexDirection: 'column', gap: 24 },

  // ページヘッダー
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 4,
  },
  pageHeaderIcon: { fontSize: 36 },
  pageTitle: { fontSize: 22, fontWeight: 700, color: '#1b4332', margin: 0 },
  pageSubtitle: { fontSize: 13, color: '#52b788', margin: '2px 0 0' },

  // ローディング
  loadingScreen: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #d8f3dc 0%, #b7e4c7 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  loadingContent: { textAlign: 'center' },
  loadingLeaf: { fontSize: 52, marginBottom: 16 },
  loadingBar: { width: 160, height: 4, background: '#b7e4c7', borderRadius: 4, margin: '0 auto 12px', overflow: 'hidden' },
  loadingProgress: {
    width: '60%', height: '100%',
    background: 'linear-gradient(90deg, #2d6a4f, #52b788)',
    borderRadius: 4,
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  loadingText: { color: '#40916c', fontSize: 14 },

  // ログイン
  loginBg: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #1b4332 0%, #2d6a4f 40%, #40916c 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
    fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
  },
  loginDeco1: {
    position: 'absolute', top: -80, right: -80,
    width: 300, height: 300, borderRadius: '50%',
    background: 'rgba(149,213,178,0.15)',
  },
  loginDeco2: {
    position: 'absolute', bottom: -60, left: -60,
    width: 250, height: 250, borderRadius: '50%',
    background: 'rgba(82,183,136,0.12)',
  },
  loginDeco3: {
    position: 'absolute', top: '50%', left: '10%',
    width: 100, height: 100, borderRadius: '50%',
    background: 'rgba(216,243,220,0.08)',
  },
  loginCard: {
    background: '#fff',
    borderRadius: 20,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    position: 'relative', zIndex: 1,
  },
  loginHeader: { textAlign: 'center', marginBottom: 28 },
  loginEmoji: { fontSize: 48, marginBottom: 12 },
  loginTitle: { fontSize: 24, fontWeight: 800, color: '#1b4332', margin: '0 0 4px' },
  loginSubtitle: { fontSize: 12, color: '#74c69d', letterSpacing: '0.08em', margin: 0 },
  loginForm: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 },
  msgBox: { padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, textAlign: 'center' },
  msgSuccess: { background: '#d8f3dc', color: '#1b4332' },
  msgError: { background: '#fee2e2', color: '#991b1b' },
  primaryBtn: {
    background: 'linear-gradient(135deg, #2d6a4f, #40916c)',
    color: '#fff', border: 'none', borderRadius: 10,
    padding: '13px 20px', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', transition: 'transform 0.1s',
  },
  textBtn: {
    background: 'none', border: 'none', color: '#52b788',
    fontSize: 13, cursor: 'pointer', padding: '4px 0',
  },
  divider: {
    position: 'relative', textAlign: 'center',
    borderTop: '1px solid #d8f3dc', marginBottom: 16,
  },
  dividerText: {
    position: 'relative', top: '-10px',
    background: '#fff', padding: '0 12px',
    fontSize: 12, color: '#74c69d',
  },
  googleBtn: {
    width: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    background: '#fff', border: '2px solid #b7e4c7', borderRadius: 10,
    color: '#2d6a4f', padding: '12px 20px', fontSize: 15, fontWeight: 600,
    cursor: 'pointer', transition: 'background 0.2s',
  },

  // フォームカード
  formCard: {
    background: '#fff',
    borderRadius: 16,
    border: '1px solid #d8f3dc',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(45,106,79,0.06)',
  },
  formCardHeader: {
    background: 'linear-gradient(90deg, #f0faf4, #e8f5e9)',
    padding: '14px 24px',
    borderBottom: '1px solid #d8f3dc',
  },
  formCardTitle: { color: '#2d6a4f', fontWeight: 700, fontSize: 15, margin: 0 },

  // フォーム内
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    padding: '20px 24px',
  },
  fieldFull: { gridColumn: '1 / -1' },
  fieldLabel: { display: 'block', fontSize: 12, fontWeight: 600, color: '#40916c', marginBottom: 5 },
  fieldToggleRow: { marginBottom: 4 },
  toggleLink: {
    background: 'none', border: 'none', color: '#52b788',
    fontSize: 11, cursor: 'pointer', padding: 0,
    textDecoration: 'underline',
  },
  input: {
    width: '100%', boxSizing: 'border-box',
    border: '1.5px solid #b7e4c7',
    borderRadius: 8, padding: '9px 12px',
    fontSize: 14, color: '#1b4332',
    background: '#f8fffe',
    outline: 'none', transition: 'border 0.2s',
  },
  select: {
    width: '100%', boxSizing: 'border-box',
    border: '1.5px solid #b7e4c7',
    borderRadius: 8, padding: '9px 12px',
    fontSize: 14, color: '#1b4332',
    background: '#f8fffe',
    outline: 'none', cursor: 'pointer',
  },
  submitBtn: {
    margin: '0 24px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: 'linear-gradient(135deg, #2d6a4f, #40916c)',
    color: '#fff', border: 'none', borderRadius: 10,
    padding: '13px 28px', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', width: 'calc(100% - 48px)',
  },
  cancelBtn: {
    background: '#f0f0f0', border: 'none', borderRadius: 10,
    padding: '13px 20px', fontSize: 14, cursor: 'pointer',
  },
  autoFillBadge: {
    marginLeft: 8, background: '#d8f3dc',
    color: '#2d6a4f', borderRadius: 20,
    padding: '1px 8px', fontSize: 10, fontWeight: 700,
  },
  totalPreview: {
    gridColumn: '1 / -1',
    background: 'linear-gradient(90deg, #f0faf4, #e8f5e9)',
    border: '1.5px solid #b7e4c7', borderRadius: 10,
    padding: '12px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  totalLabel: { fontSize: 13, color: '#40916c', fontWeight: 600 },
  totalValue: { fontSize: 22, fontWeight: 800, color: '#1b4332' },

  // テーブル
  tableWrap: {
    overflowX: 'auto',
    borderRadius: 14,
    border: '1px solid #d8f3dc',
    boxShadow: '0 2px 8px rgba(45,106,79,0.06)',
    background: '#fff',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thead: { background: 'linear-gradient(90deg, #2d6a4f, #40916c)' },
  th: {
    padding: '12px 16px',
    color: '#d8f3dc', fontWeight: 600, fontSize: 12,
    textAlign: 'left', letterSpacing: '0.04em',
  },
  tr: { transition: 'background 0.15s' },
  td: { padding: '11px 16px', borderBottom: '1px solid #e8f5e9', verticalAlign: 'middle' },

  // リストヘッダー
  listHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#1b4332', margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
  countBadge: {
    background: '#d8f3dc', color: '#2d6a4f',
    borderRadius: 20, padding: '1px 10px', fontSize: 12, fontWeight: 600,
  },
  filterRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterBtn: {
    background: '#fff', border: '1.5px solid #b7e4c7',
    borderRadius: 20, color: '#52b788',
    padding: '4px 12px', fontSize: 12, cursor: 'pointer',
  },
  filterBtnActive: {
    background: 'linear-gradient(135deg, #2d6a4f, #40916c)',
    color: '#fff', border: '1.5px solid transparent',
  },
  revenueSummary: { fontSize: 14, color: '#52b788' },

  // バッジ類
  statusBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    borderRadius: 20, padding: '3px 10px',
    fontSize: 12, fontWeight: 600,
  },
  statusDot: { width: 6, height: 6, borderRadius: '50%' },
  varietyBadge: {
    background: '#f0faf4', color: '#2d6a4f',
    border: '1px solid #b7e4c7', borderRadius: 6,
    padding: '2px 8px', fontSize: 12,
  },
  destTag: {
    background: '#d8f3dc', color: '#1b4332',
    borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600,
  },
  partBadge: {
    background: '#e8f5e9', color: '#2d6a4f',
    border: '1px solid #b7e4c7', borderRadius: 6,
    padding: '2px 8px', fontSize: 12,
  },
  yieldBadge: {
    border: '1.5px solid',
    borderRadius: 20, padding: '2px 10px',
    fontSize: 12, fontWeight: 700, display: 'inline-block',
  },
  locationText: { fontWeight: 600, color: '#1b4332', fontSize: 13 },

  // ダッシュボード
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 14,
  },
  statCard: {
    background: '#fff', borderRadius: 14,
    padding: '18px 20px',
    boxShadow: '0 2px 8px rgba(45,106,79,0.06)',
    border: '1px solid #d8f3dc',
  },
  statEmoji: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 800, lineHeight: 1.1 },
  statUnit: { fontSize: 13, fontWeight: 500, marginLeft: 3 },
  statLabel: { fontSize: 12, color: '#74c69d', marginTop: 4 },

  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 16,
  },
  chartCard: {
    background: '#fff', borderRadius: 14,
    border: '1px solid #d8f3dc',
    padding: '20px 20px 16px',
    boxShadow: '0 2px 8px rgba(45,106,79,0.06)',
  },
  chartTitle: { fontSize: 14, fontWeight: 700, color: '#1b4332', margin: '0 0 14px' },

  futureFeatures: { display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' },
  futureItem: { display: 'flex', alignItems: 'center', gap: 10 },
  futureIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  futureText: { fontSize: 13, color: '#52b788' },

  refreshBtn: {
    background: 'none', border: '1.5px solid #b7e4c7',
    color: '#40916c', borderRadius: 10, padding: '9px 20px',
    fontSize: 13, cursor: 'pointer', alignSelf: 'flex-start',
  },

  // 編集・削除ボタン
  editBtn: {
    background: '#f0faf4', border: '1px solid #b7e4c7',
    color: '#2d6a4f', borderRadius: 6, padding: '4px 10px',
    fontSize: 12, cursor: 'pointer',
  },
  deleteBtn: {
    background: '#fff0f0', border: '1px solid #fca5a5',
    color: '#ef4444', borderRadius: 6, padding: '4px 10px',
    fontSize: 12, cursor: 'pointer',
  },

  // エンプティ
  emptyState: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '48px 24px',
    background: '#f8fffe', borderRadius: 14,
    border: '1px dashed #b7e4c7',
  },
  emptyIcon: { fontSize: 32, marginBottom: 10, opacity: 0.5 },
  emptyText: { color: '#74c69d', fontSize: 14 },

  // スピナー
  spinner: {
    width: 32, height: 32,
    border: '3px solid #d8f3dc',
    borderTop: '3px solid #2d6a4f',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
