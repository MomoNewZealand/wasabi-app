import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Plus, LogOut, Menu, X } from 'lucide-react';

// Supabase初期化
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// メインコンポーネント
export default function WasamiApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // ユーザーセッション確認
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage setUser={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <h1 className="text-xl font-bold text-green-700">わさび田管理システム</h1>
          </div>
          <div className="hidden md:flex gap-4 items-center">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-2 px-3 py-2 rounded bg-red-50 text-red-600 hover:bg-red-100"
            >
              <LogOut size={16} /> ログアウト
            </button>
          </div>
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* ナビゲーションタブ */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 flex gap-4 overflow-x-auto">
          {[
            { id: 'dashboard', label: '📊 ダッシュボード' },
            { id: 'planting', label: '🌱 植え付け記録' },
            { id: 'shipment', label: '📦 出荷記録' },
            { id: 'processing', label: '🔪 加工記録' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setMenuOpen(false); }}
              className={`px-4 py-4 border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-green-600 text-green-600 font-bold'
                  : 'border-transparent text-gray-600 hover:text-green-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'planting' && <PlantingTab />}
        {activeTab === 'shipment' && <ShipmentTab />}
        {activeTab === 'processing' && <ProcessingTab />}
      </main>
    </div>
  );
}

// ============================================================
// ログイン画面
// ============================================================
function LoginPage({ setUser }) {
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
        // サインアップ
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        setMessage('✅ サインアップ成功！メールを確認してください。');
      } else {
        // ログイン
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        setMessage('✅ ログイン成功！');
      }
    } catch (error) {
      setMessage('❌ エラー: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) console.error('ログインエラー:', error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌾</div>
          <h1 className="text-3xl font-bold text-green-700">わさび田管理システム</h1>
          <p className="text-gray-600 mt-2">植え付けから出荷・加工まで、すべて管理</p>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded text-sm text-center"
            style={{
              backgroundColor: message.includes('✅') ? '#d1fae5' : '#fee2e2',
              color: message.includes('✅') ? '#065f46' : '#991b1b'
            }}>
            {message}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="example@gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? '処理中...' : isSignUp ? 'サインアップ' : 'ログイン'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage('');
            }}
            className="w-full text-green-600 text-sm hover:underline"
          >
            {isSignUp ? 'ログイン画面へ' : 'サインアップ'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">または</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
        >
          🔐 Google でログイン
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          初回アクセス時は自動的にアカウントが作成されます
        </p>
      </div>
    </div>
  );
}

// ============================================================
// ダッシュボード
// ============================================================
function DashboardTab() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 月別出荷量
      const { data: shipmentsByMonth } = await supabase
        .from('shipments')
        .select('shipment_date, quantity');

      // 出荷先別出荷量
      const { data: shipmentsByDest } = await supabase
        .from('shipments')
        .select('destination_id, quantity, destinations(name)');

      // 加工記録
      const { data: processingData } = await supabase
        .from('processing')
        .select('*');

      // 植え付けと出荷の日数計算
      const { data: plantingShipments } = await supabase
        .from('shipments')
        .select('shipment_date, plantings(planted_date)');

      setDashboardData({
        shipmentsByMonth,
        shipmentsByDest,
        processingData,
        plantingShipments
      });
    } catch (error) {
      console.error('ダッシュボード読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">📊 ダッシュボード</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 月別出荷量 */}
        <ChartCard title="📈 月別出荷量">
          <MonthlyShipmentChart data={dashboardData?.shipmentsByMonth} />
        </ChartCard>

        {/* 出荷先別出荷量 */}
        <ChartCard title="🎯 出荷先別出荷量">
          <DestinationChart data={dashboardData?.shipmentsByDest} />
        </ChartCard>

        {/* 加工歩留まり率 */}
        <ChartCard title="🔪 部位別加工歩留まり率">
          <ProcessingYieldChart data={dashboardData?.processingData} />
        </ChartCard>

        {/* 植え付けから出荷までの日数 */}
        <ChartCard title="📅 植え付けから出荷までの日数">
          <PlantingToShipmentChart data={dashboardData?.plantingShipments} />
        </ChartCard>
      </div>

      <button
        onClick={fetchDashboardData}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
      >
        🔄 更新
      </button>
    </div>
  );
}

// ============================================================
// 植え付け記録タブ
// ============================================================
function PlantingTab() {
  const [formData, setFormData] = useState({
    location: '',
    planted_date: '',
    planted_quantity: '',
    variety: '',
    status: '生育中'
  });
  const [plantings, setPlantings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlantings();
  }, []);

  const fetchPlantings = async () => {
    const { data } = await supabase
      .from('plantings')
      .select('*')
      .order('planted_date', { ascending: false });
    setPlantings(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('plantings').insert([formData]);
    if (!error) {
      setFormData({ location: '', planted_date: '', planted_quantity: '', variety: '', status: '生育中' });
      fetchPlantings();
      alert('✅ 植え付け記録を追加しました');
    } else {
      alert('❌ エラー: ' + error.message);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">🌱 植え付け記録</h2>

      {/* フォーム */}
      <FormCard title="新しい植え付けを記録">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <FormInput
              label="詳細な場所"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
            <FormInput
              label="植え付け日"
              type="date"
              value={formData.planted_date}
              onChange={(e) => setFormData({ ...formData, planted_date: e.target.value })}
              required
            />
            <FormInput
              label="植え付け本数"
              type="number"
              value={formData.planted_quantity}
              onChange={(e) => setFormData({ ...formData, planted_quantity: e.target.value })}
              required
            />
            <FormInput
              label="苗の種類"
              value={formData.variety}
              onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
              placeholder="天城ニシキ、5783 など"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2 transition"
          >
            <Plus size={20} /> 記録を追加
          </button>
        </form>
      </FormCard>

      {/* リスト */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">記録一覧</h3>
        {loading ? (
          <LoadingSpinner />
        ) : plantings.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded text-gray-600">
            記録がまだありません
          </div>
        ) : (
          <div className="space-y-2">
            {plantings.map(planting => (
              <PlantingCard key={planting.id} planting={planting} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 出荷記録タブ
// ============================================================
function ShipmentTab() {
  const [formData, setFormData] = useState({
    planting_id: '',
    destination_id: '',
    shipment_date: '',
    quantity: '',
    unit_price: ''
  });
  const [plantings, setPlantings] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: plantingsData } = await supabase.from('plantings').select('*');
    const { data: destinationsData } = await supabase.from('destinations').select('*');
    const { data: shipmentsData } = await supabase
      .from('shipments')
      .select('*, plantings(location), destinations(name)')
      .order('shipment_date', { ascending: false });

    setPlantings(plantingsData || []);
    setDestinations(destinationsData || []);
    setShipments(shipmentsData || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = parseFloat(formData.quantity) * parseFloat(formData.unit_price || 0);
    const { error } = await supabase.from('shipments').insert([
      { ...formData, total_amount: total }
    ]);
    if (!error) {
      setFormData({ planting_id: '', destination_id: '', shipment_date: '', quantity: '', unit_price: '' });
      fetchData();
      alert('✅ 出荷記録を追加しました');
    } else {
      alert('❌ エラー: ' + error.message);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">📦 出荷記録</h2>

      {/* フォーム */}
      <FormCard title="新しい出荷を記録">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <FormSelect
              label="植え付けロット"
              value={formData.planting_id}
              onChange={(e) => setFormData({ ...formData, planting_id: e.target.value })}
              required
            >
              <option value="">選択してください</option>
              {plantings.map(p => (
                <option key={p.id} value={p.id}>
                  {p.location} ({p.variety})
                </option>
              ))}
            </FormSelect>
            <FormSelect
              label="出荷先"
              value={formData.destination_id}
              onChange={(e) => setFormData({ ...formData, destination_id: e.target.value })}
              required
            >
              <option value="">選択してください</option>
              {destinations.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </FormSelect>
            <FormInput
              label="出荷日"
              type="date"
              value={formData.shipment_date}
              onChange={(e) => setFormData({ ...formData, shipment_date: e.target.value })}
              required
            />
            <FormInput
              label="出荷量 (g)"
              type="number"
              step="0.1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
            <FormInput
              label="単価 (円/g)"
              type="number"
              step="0.01"
              value={formData.unit_price}
              onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2 transition"
          >
            <Plus size={20} /> 記録を追加
          </button>
        </form>
      </FormCard>

      {/* リスト */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">出荷記録一覧</h3>
        {loading ? (
          <LoadingSpinner />
        ) : shipments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded text-gray-600">
            記録がまだありません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">出荷日</th>
                  <th className="px-4 py-2 text-left">植え付けロット</th>
                  <th className="px-4 py-2 text-left">出荷先</th>
                  <th className="px-4 py-2 text-right">出荷量 (g)</th>
                  <th className="px-4 py-2 text-right">金額 (円)</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map(shipment => (
                  <tr key={shipment.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{shipment.shipment_date}</td>
                    <td className="px-4 py-2">{shipment.plantings?.location}</td>
                    <td className="px-4 py-2">{shipment.destinations?.name}</td>
                    <td className="px-4 py-2 text-right">{shipment.quantity}</td>
                    <td className="px-4 py-2 text-right font-bold">
                      {shipment.total_amount ? `¥${shipment.total_amount.toLocaleString()}` : '-'}
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
    processing_date: '',
    part: '',
    weight_before: '',
    weight_after: ''
  });
  const [processingRecords, setProcessingRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProcessing();
  }, []);

  const fetchProcessing = async () => {
    const { data } = await supabase
      .from('processing')
      .select('*')
      .order('processing_date', { ascending: false });
    setProcessingRecords(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const yield_rate = (parseFloat(formData.weight_after) / parseFloat(formData.weight_before) * 100).toFixed(2);
    const { error } = await supabase.from('processing').insert([
      { ...formData, yield_rate }
    ]);
    if (!error) {
      setFormData({ processing_date: '', part: '', weight_before: '', weight_after: '' });
      fetchProcessing();
      alert('✅ 加工記録を追加しました');
    } else {
      alert('❌ エラー: ' + error.message);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">🔪 加工記録</h2>

      {/* フォーム */}
      <FormCard title="新しい加工を記録">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <FormInput
              label="加工日"
              type="date"
              value={formData.processing_date}
              onChange={(e) => setFormData({ ...formData, processing_date: e.target.value })}
              required
            />
            <FormInput
              label="部位"
              value={formData.part}
              onChange={(e) => setFormData({ ...formData, part: e.target.value })}
              placeholder="花、茎、葉 など"
              required
            />
            <FormInput
              label="加工前重量 (g)"
              type="number"
              step="0.1"
              value={formData.weight_before}
              onChange={(e) => setFormData({ ...formData, weight_before: e.target.value })}
              required
            />
            <FormInput
              label="加工後重量 (g)"
              type="number"
              step="0.1"
              value={formData.weight_after}
              onChange={(e) => setFormData({ ...formData, weight_after: e.target.value })}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2 transition"
          >
            <Plus size={20} /> 記録を追加
          </button>
        </form>
      </FormCard>

      {/* リスト */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">加工記録一覧</h3>
        {loading ? (
          <LoadingSpinner />
        ) : processingRecords.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded text-gray-600">
            記録がまだありません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">加工日</th>
                  <th className="px-4 py-2 text-left">部位</th>
                  <th className="px-4 py-2 text-right">加工前 (g)</th>
                  <th className="px-4 py-2 text-right">加工後 (g)</th>
                  <th className="px-4 py-2 text-right">歩留まり (%)</th>
                </tr>
              </thead>
              <tbody>
                {processingRecords.map(record => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{record.processing_date}</td>
                    <td className="px-4 py-2">{record.part}</td>
                    <td className="px-4 py-2 text-right">{record.weight_before}</td>
                    <td className="px-4 py-2 text-right">{record.weight_after}</td>
                    <td className="px-4 py-2 text-right font-bold">{record.yield_rate}%</td>
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
// ユーティリティコンポーネント
// ============================================================

function FormInput({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <input
        {...props}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  );
}

function FormSelect({ label, children, ...props }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <select
        {...props}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        {children}
      </select>
    </div>
  );
}

function FormCard({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="w-full h-64">
        {children}
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    </div>
  );
}

function PlantingCard({ planting }) {
  return (
    <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-gray-800">{planting.location}</h4>
          <p className="text-sm text-gray-600">
            品種: {planting.variety} | 本数: {planting.planted_quantity}本
          </p>
          <p className="text-xs text-gray-500 mt-1">
            植え付け: {planting.planted_date}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
          planting.status === '生育中' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {planting.status}
        </span>
      </div>
    </div>
  );
}

// チャートコンポーネント（ダミー）
function MonthlyShipmentChart() {
  const data = [
    { month: '1月', 出荷量: 120 },
    { month: '2月', 出荷量: 150 },
    { month: '3月', 出荷量: 200 }
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="出荷量" stroke="#10b981" />
      </LineChart>
    </ResponsiveContainer>
  );
}

function DestinationChart() {
  const data = [
    { name: '六雁', 出荷量: 300 },
    { name: 'わさび食堂', 出荷量: 250 },
    { name: 'その他', 出荷量: 150 }
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="出荷量" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ProcessingYieldChart() {
  const data = [
    { part: '花', 歩留まり: 52 },
    { part: '茎・葉', 歩留まり: 49 }
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="part" />
        <YAxis domain={[0, 100]} />
        <Tooltip formatter={(value) => `${value}%`} />
        <Bar dataKey="歩留まり" fill="#f59e0b" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function PlantingToShipmentChart() {
  const data = [
    { range: '0-30日', 件数: 5 },
    { range: '31-60日', 件数: 8 },
    { range: '61-90日', 件数: 12 },
    { range: '91日以上', 件数: 15 }
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="range" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="件数" fill="#ec4899" />
      </BarChart>
    </ResponsiveContainer>
  );
}
