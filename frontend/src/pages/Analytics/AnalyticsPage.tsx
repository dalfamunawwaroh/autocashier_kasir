import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, DollarSign, Package, Calendar, Award } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from 'next-themes';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AnalyticsPage({ user }: { user: any }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('daily');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Theme matching based on global next-themes wrapper
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics?filter=${filter}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [filter]);

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col font-sans transition-colors duration-300 dashboard-content-wrapper",
      isDark ? "bg-[#0f172a] text-[#f1f5f9]" : "bg-[#f8fafc] text-slate-900"
    )}>
      {/* Header */}
      <div className={cn(
        "h-16 border-b flex items-center px-8 shrink-0 relative transition-colors duration-300",
        isDark ? "bg-[#1e293b] border-slate-700" : "bg-white border-slate-200"
      )}>
        <button 
          onClick={() => navigate('/kasir')}
          className={cn(
            "p-2 rounded-full mr-4 transition-colors",
            isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"
          )}
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <h1 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-blue-500" />
          Detail Transaksi
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Filters */}
        <div className="flex gap-4">
          {['daily', 'weekly', 'monthly', 'yearly'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                filter === f 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                  : isDark ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                {f}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent flex items-center justify-center rounded-full animate-spin" />
          </div>
        ) : !data ? (
          <div className="p-8 text-center text-slate-500">No data available</div>
        ) : (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={cn(
                "p-8 rounded-3xl border transition-colors duration-300",
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
              )}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Revenue</span>
                  <div className="p-3 bg-emerald-500/10 rounded-xl">
                    <DollarSign className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>
                <h3 className="text-4xl font-mono font-black text-emerald-500">{formatIDR(data.total_revenue)}</h3>
              </div>

              <div className={cn(
                "p-8 rounded-3xl border transition-colors duration-300",
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
              )}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">AOV (Avg Order Value)</span>
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
                <h3 className="text-4xl font-mono font-black text-blue-500">{formatIDR(data.aov)}</h3>
              </div>

              <div className={cn(
                "p-8 rounded-3xl border transition-colors duration-300",
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
              )}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Orders</span>
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <Package className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
                <h3 className="text-4xl font-mono font-black text-purple-500">{data.total_orders}</h3>
              </div>
            </div>

            {/* Top 5 Products */}
            <div className={cn(
              "p-8 rounded-3xl border transition-colors duration-300 dashboard-panel",
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
            )}>
              <div className="flex items-center gap-3 mb-8">
                <Award className="w-6 h-6 text-yellow-500" />
                <h2 className={cn("text-lg font-bold uppercase tracking-widest", isDark ? "text-white" : "text-slate-900")}>Top 5 Products Sold</h2>
              </div>

              <div className="space-y-4">
                {data.top_products.length === 0 ? (
                  <p className="text-slate-500 italic text-sm">No sales dat for this period.</p>
                ) : (
                  data.top_products.map((item: any, idx: number) => (
                    <div key={item._id} className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-colors",
                      isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"
                    )}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-slate-400">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{item.name}</p>
                          <p className="text-xs text-slate-500 font-mono">Qty Sold: {item.quantity_sold}</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-blue-500">{formatIDR(item.revenue_generated)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
