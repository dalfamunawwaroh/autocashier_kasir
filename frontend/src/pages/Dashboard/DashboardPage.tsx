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
    { label: 'Total Penjualan', value: 'Rp 12.450.000', change: '+12.5%', icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Transaksi Hari Ini', value: '142', change: '+8.2%', icon: BarChart3, color: 'text-brand-primary', bg: 'bg-blue-50 dark:bg-brand-primary/10' },
    { label: 'Pelanggan Baru', value: '24', change: '-2.4%', icon: Users, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { label: 'Stok Kritis', value: lowStockItems.length.toString(), change: 'Perlu Cek', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="container mx-auto max-w-7xl">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-heading">Admin Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Pantau performa Koperasi GIAT secara real-time.</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-white/5 p-3 rounded-2xl border border-slate-200 dark:border-white/10 backdrop-blur-md">
            <Calendar className="w-5 h-5 text-brand-primary ml-2" />
            <span className="text-sm font-bold text-slate-900 dark:text-white pr-4">30 April 2026</span>
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
              className="glass-card glass-card-hover p-6 rounded-[2rem] group transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-black ${stat.change.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stat.change}
                  {stat.change.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                </div>
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 glass-card rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-heading">Aktivitas Penjualan Terakhir</h3>
              <button className="text-xs font-bold text-brand-primary uppercase tracking-widest hover:underline">Lihat Semua</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100 dark:bg-white/5">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">ID Transaksi</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Waktu</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {/* Rows */}
                  {[
                    { id: '#TRX-9021', time: '14:22:10', total: 'Rp 45.000', status: 'Selesai' },
                    { id: '#TRX-9020', time: '14:15:05', total: 'Rp 12.500', status: 'Selesai' },
                    { id: '#TRX-9019', time: '14:02:44', total: 'Rp 88.000', status: 'Selesai' },
                    { id: '#TRX-9018', time: '13:55:12', total: 'Rp 5.000', status: 'Selesai' },
                    { id: '#TRX-9017', time: '13:48:30', total: 'Rp 21.000', status: 'Selesai' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-200 dark:border-white/5 last:border-0">
                      <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">{row.id}</td>
                      <td className="px-8 py-4 text-sm text-slate-500">{row.time}</td>
                      <td className="px-8 py-4 text-sm font-black text-slate-900 dark:text-white">{row.total}</td>
                      <td className="px-8 py-4">
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest border border-emerald-500/20">
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
          <div className="glass-card rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-slate-200 dark:border-white/10">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-heading">Peringatan Stok</h3>
            </div>
            <div className="p-6 space-y-4">
              {isLoading ? (
                <div className="py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Loading stock data...</div>
              ) : lowStockItems.length === 0 ? (
                <div className="py-10 text-center text-emerald-500 font-bold uppercase tracking-widest text-xs">Semua stok aman</div>
              ) : (
                lowStockItems.map((item, i) => (
                  <div key={i} className="p-4 bg-slate-100/50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-500 font-bold uppercase tracking-widest">Sisa: {item.stock} Unit</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-red-600 dark:text-red-400 font-black uppercase tracking-widest">Kritis</p>
                      <div className="w-20 h-1.5 bg-slate-300 dark:bg-white/10 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-red-500 shadow-[0_0_8px_red]" style={{ width: `${(item.stock / 15) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))
              )}
              <button className="w-full py-4 bg-brand-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-all mt-4 shadow-lg shadow-brand-primary/20">
                Kelola Inventaris
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
