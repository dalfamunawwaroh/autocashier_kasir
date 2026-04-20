import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Package, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';

interface DashboardPageProps {
  user: { name: string; role: string } | null;
}

export default function DashboardPage({ user }: DashboardPageProps) {
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRedAlert, setShowRedAlert] = useState(false);

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.success) {
          const lowStock = data.products.filter((p: any) => p.stock < 15);
          setLowStockItems(lowStock);
          if (lowStock.length > 0) setShowRedAlert(true);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLowStock();
  }, []);

  const stats = [
    { label: 'Total Penjualan', value: 'Rp 12.450.000', change: '+12.5%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Transaksi Hari Ini', value: '142', change: '+8.2%', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pelanggan Baru', value: '24', change: '-2.4%', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Stok Kritis', value: lowStockItems.length.toString(), change: 'Perlu Cek', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-6 dashboard-container">
      <AnimatePresence>
        {showRedAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-6"
          >
            <div className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border-4 border-red-400 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-2 rounded-xl">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-black uppercase tracking-tighter">RED ALERT: CRITICAL STOCK</h4>
                  <p className="text-xs font-bold opacity-80 uppercase tracking-widest">
                    {lowStockItems.length} items are below the threshold of 15 units!
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowRedAlert(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto max-w-7xl">
        <header className="flex flex-col md:row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-500 font-medium">Pantau performa Koperasi GIAT secara real-time.</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <Calendar className="w-5 h-5 text-slate-400 ml-2" />
            <span className="text-sm font-bold text-slate-600 pr-4">13 Maret 2026</span>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow dashboard-panel"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-black ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stat.change}
                  {stat.change.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden dashboard-panel">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Aktivitas Penjualan Terakhir</h3>
              <button className="text-xs font-bold text-blue-600 uppercase tracking-widest hover:underline">Lihat Semua</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Transaksi</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { id: '#TRX-9021', time: '14:22:10', total: 'Rp 45.000', status: 'Selesai' },
                    { id: '#TRX-9020', time: '14:15:05', total: 'Rp 12.500', status: 'Selesai' },
                    { id: '#TRX-9019', time: '14:02:44', total: 'Rp 88.000', status: 'Selesai' },
                    { id: '#TRX-9018', time: '13:55:12', total: 'Rp 5.000', status: 'Selesai' },
                    { id: '#TRX-9017', time: '13:48:30', total: 'Rp 21.000', status: 'Selesai' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-4 text-sm font-bold text-slate-900">{row.id}</td>
                      <td className="px-8 py-4 text-sm text-slate-500">{row.time}</td>
                      <td className="px-8 py-4 text-sm font-black text-slate-900">{row.total}</td>
                      <td className="px-8 py-4">
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inventory Alerts */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden dashboard-panel">
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Peringatan Stok</h3>
            </div>
            <div className="p-6 space-y-4">
              {isLoading ? (
                <div className="py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Loading stock data...</div>
              ) : lowStockItems.length === 0 ? (
                <div className="py-10 text-center text-emerald-500 font-bold uppercase tracking-widest text-xs">Semua stok aman</div>
              ) : (
                lowStockItems.map((item, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sisa: {item.stock} Unit</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Kritis</p>
                      <div className="w-20 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: `${(item.stock / 15) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))
              )}
              <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors mt-4">
                Kelola Inventaris
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
