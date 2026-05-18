import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Camera,
  Zap,
  ShieldCheck,
  Smartphone,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { useAppStore, translations } from '../../store/useAppStore';
import Logo from '../../components/UI/Logo';

export default function LandingPage() {
  const { language } = useAppStore();
  const t = translations[language];

  const features = [
    {
      icon: <Cpu className="w-6 h-6 text-brand-primary" />,
      title: "Computer Vision",
      desc: "Teknologi YOLOv8 mengenali produk secara instan tanpa perlu mencari barcode."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-brand-accent" />,
      title: "Secure Payment",
      desc: "Integrasi QRIS yang aman dan terverifikasi otomatis oleh sistem JagoAI."
    },
    {
      icon: <Smartphone className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      title: "Self-Service",
      desc: "Kendali penuh di tangan pelanggan untuk pengalaman belanja lebih mandiri."
    },
    {
      icon: <Layers className="w-6 h-6 text-brand-secondary" />,
      title: "Real-time Sync",
      desc: "Data stok dan transaksi tersinkronisasi langsung ke dashboard admin."
    }
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-5xl z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/5 border border-brand-primary/10 mb-8 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
            </span>
            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Next-Gen POS for Koperasi GIAT Bandung</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tight leading-[1.1] text-slate-900 dark:text-white font-heading">
            Sistem Kasir Pintar <br />
            <span className="text-gradient">Berbasis AI</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
            Revolutionizing Koperasi GIAT Cabang Bandung with Computer Vision. Letakkan barang, scan otomatis, dan selesaikan pembayaran tanpa antre.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link to="/scan" className="group relative">
              <div className="absolute inset-0 bg-brand-primary rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
              <button className="relative px-10 py-5 bg-brand-primary text-white rounded-2xl font-bold flex items-center gap-3 transition-all hover:-translate-y-1 active:scale-95 shadow-xl">
                <Camera className="w-5 h-5" />
                Mulai Scan Sekarang
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <a href="#features" className="px-10 py-5 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
              Pelajari Fitur
            </a>
          </div>
        </motion.div>

        {/* --- FLOATING DECORATIONS --- */}
        <div className="absolute top-1/4 left-10 hidden lg:block">
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="glass-card glass-card-hover p-4 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-brand-primary" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Detection Speed</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">0.2s / Item</div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="absolute top-1/3 right-10 hidden lg:block">
          <motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="glass-card glass-card-hover p-4 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-accent/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-brand-accent" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Accuracy Rate</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">99.8% YOLOv8</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- INTERFACE PREVIEW --- */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* DECORATIVE GLOW */}
            <div className="absolute -inset-4 bg-gradient-to-r from-neon-blue to-neon-purple opacity-20 blur-3xl rounded-[3rem]" />
            
            {/* TABLET FRAME */}
            <div className="relative glass-card p-4 md:p-8 rounded-[3rem] border-white/20">
              <div className="relative aspect-[16/10] bg-[#0A0A0A] rounded-[2rem] overflow-hidden border border-white/10">
                
                {/* MOCK CAMERA VIEW */}
                <div className="absolute inset-0">
                  <img
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200"
                    alt="AI Processing"
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
                  
                  {/* SCANNING LINE */}
                  <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="absolute left-0 w-full h-[2px] bg-brand-primary shadow-[0_0_20px_rgba(37,99,235,1)] z-10"
                  />

                  {/* BBOXES */}
                  <div className="absolute top-1/4 left-1/3 w-32 h-40 border-2 border-brand-primary rounded-lg backdrop-blur-[2px]">
                    <span className="absolute -top-7 left-0 bg-brand-primary text-[10px] font-bold text-white px-3 py-1 rounded-t-md uppercase tracking-wider shadow-lg">Product Detected</span>
                  </div>
                </div>

                {/* OVERLAY UI */}
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                  <div className="glass-card p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center animate-pulse">
                      <div className="w-3 h-3 rounded-full bg-brand-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white uppercase tracking-widest">System Status</div>
                      <div className="text-[10px] text-slate-400">Processing real-time stream...</div>
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-2xl w-64">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-4">Cart Preview</div>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Items (2)</span>
                        <span className="text-white font-bold">Rp 19.500</span>
                      </div>
                    </div>
                    <div className="w-full py-3 bg-brand-primary rounded-xl text-center text-xs font-bold text-white">Checkout</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="py-32 max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-slate-900 dark:text-white font-heading">Teknologi Terdepan.</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">Kami mengintegrasikan teknologi AI terbaik untuk memastikan kecepatan dan akurasi transaksi Anda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card glass-card-hover p-8 rounded-3xl group transition-all"
            >
              <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 group-hover:bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-8 transition-colors">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white font-heading tracking-tight">{f.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section id="how-it-works" className="py-32 relative overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand-secondary/3 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl md:text-7xl font-black mb-12 text-slate-900 dark:text-white leading-[1.1] font-heading tracking-tight">
                Alur Belanja <br /> 
                <span className="text-gradient">Masa Depan</span>
              </h2>
              
              <div className="space-y-8">
                {[
                  { n: "01", t: "Letakkan Produk", d: "Simpan semua item belanjaan Anda di area pemindaian kamera AutoCashier." },
                  { n: "02", t: "Deteksi Otomatis", d: "AI kami akan mengenali setiap produk secara instan dan memasukkannya ke keranjang digital." },
                  { n: "03", t: "Scan QRIS", d: "Selesaikan transaksi dengan memindai kode QRIS dan ambil struk digital Anda." }
                ].map((step, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 }}
                    className="flex gap-6 items-start group"
                  >
                    <div className="text-4xl font-black text-slate-200 dark:text-white/10 group-hover:text-brand-primary transition-colors font-heading">{step.n}</div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white">{step.t}</h4>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{step.d}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square glass-card rounded-[3rem] overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=1000" 
                  alt="Modern Checkout"
                  className="w-full h-full object-cover grayscale-[0.3]"
                />
                <div className="absolute inset-0 bg-brand-primary/10 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-100 dark:from-slate-900 via-transparent to-transparent" />
                
                <div className="absolute bottom-10 left-10 right-10 p-8 glass-card rounded-3xl backdrop-blur-3xl">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                        <Zap className="w-6 h-6 text-brand-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">Ultra Fast Processing</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">Powered by YOLOv8 Architecture</div>
                      </div>
                   </div>
                   <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ width: ['0%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="h-full bg-brand-primary shadow-[0_0_10px_#2563eb]"
                      />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto glass-card rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          <h2 className="text-4xl md:text-6xl font-black mb-8 text-slate-900 dark:text-white relative z-10 font-heading">Siap Digitalisasi Koperasi?</h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-12 max-w-xl mx-auto relative z-10">Tingkatkan efisiensi layanan dan kenyamanan pelanggan Anda dengan sistem kasir mandiri berbasis AI.</p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
            <Link to="/scan" className="px-10 py-5 bg-brand-primary text-white rounded-2xl font-bold hover:shadow-lg transition-all active:scale-95">Mulai Percobaan</Link>
            <a href="https://jagoai.dev" target="_blank" rel="noopener noreferrer" className="px-10 py-5 glass-card glass-card-hover rounded-2xl font-bold transition-all">Tentang JagoAI</a>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-24 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/60 backdrop-blur-xl relative overflow-hidden">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16 relative z-10">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="mb-6 transform scale-125 origin-left transition-transform duration-300 hover:scale-130">
              <Logo imgClass="h-16 w-auto object-contain transition-all duration-500" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 max-w-md leading-relaxed text-sm font-medium">
              AutoCashier adalah sistem POS cerdas berbasis Computer Vision YOLOv8 yang dirancang khusus untuk merevolusi efisiensi operasional Koperasi GIAT. Letakkan barang, scan instan, bayar digital.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              4 Cabang Operasional Aktif
            </div>
            <div className="flex gap-4 pt-2">
              {['Instagram', 'LinkedIn', 'Github'].map(social => (
                <a
                  key={social} href="#"
                  className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-white/10 text-[9px] font-black text-slate-600 dark:text-slate-400 hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all cursor-pointer uppercase tracking-widest"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="text-slate-900 dark:text-white font-black uppercase tracking-wider mb-6 text-xs text-brand-primary">Cabang Koperasi</h5>
            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-bold">
              <li className="flex items-center gap-2.5 group cursor-pointer hover:text-brand-primary transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary group-hover:scale-150 transition-all" />
                Jakarta Central (JKT)
              </li>
              <li className="flex items-center gap-2.5 group cursor-pointer hover:text-brand-primary transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary group-hover:scale-150 transition-all" />
                Bandung Branch (BDG)
              </li>
              <li className="flex items-center gap-2.5 group cursor-pointer hover:text-brand-primary transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary group-hover:scale-150 transition-all" />
                Surabaya Branch (SBY)
              </li>
              <li className="flex items-center gap-2.5 group cursor-pointer hover:text-brand-primary transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary group-hover:scale-150 transition-all" />
                Cabang Utama (UTM)
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-slate-900 dark:text-white font-black uppercase tracking-wider mb-6 text-xs text-brand-primary">Teknologi AI POS</h5>
            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-bold">
              <li className="hover:text-brand-primary transition-colors cursor-pointer flex items-center gap-2">👁️ YOLOv8 Computer Vision</li>
              <li className="hover:text-brand-primary transition-colors cursor-pointer flex items-center gap-2">💳 QRIS Auto-Verification</li>
              <li className="hover:text-brand-primary transition-colors cursor-pointer flex items-center gap-2">✨ Sesi Kasir & Member Terpisah</li>
              <li className="hover:text-brand-primary transition-colors cursor-pointer flex items-center gap-2">🤝 Alur Kantin Kejujuran</li>
              <li className="hover:text-brand-primary transition-colors cursor-pointer flex items-center gap-2">🎁 Cashback Points (1%)</li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] relative z-10">
          <span>&copy; 2026 JagoAI - Modernizing Retail Experience</span>
          <div className="flex gap-8">
            <a href="#" className="hover:text-brand-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}