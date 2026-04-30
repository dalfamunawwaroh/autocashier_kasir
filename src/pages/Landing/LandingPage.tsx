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

export default function LandingPage() {
  const { language } = useAppStore();
  const t = translations[language];

  const features = [
    {
      icon: <Cpu className="w-6 h-6 text-neon-blue" />,
      title: "Computer Vision",
      desc: "Teknologi YOLOv8 mengenali produk secara instan tanpa perlu mencari barcode."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-accent-pink" />,
      title: "Secure Payment",
      desc: "Integrasi QRIS yang aman dan terverifikasi otomatis oleh sistem JagoAI."
    },
    {
      icon: <Smartphone className="w-6 h-6 text-green-400" />,
      title: "Self-Service",
      desc: "Kendali penuh di tangan pelanggan untuk pengalaman belanja lebih mandiri."
    },
    {
      icon: <Layers className="w-6 h-6 text-neon-purple" />,
      title: "Real-time Sync",
      desc: "Data stok dan transaksi tersinkronisasi langsung ke dashboard admin."
    }
  ];

  return (
    <div className="min-h-screen bg-deep-dark text-slate-200 overflow-x-hidden">
      
      {/* --- BACKGROUND DECORATION --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-blue/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-pink/10 blur-[120px] rounded-full" />
      </div>

      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 backdrop-blur-xl bg-deep-dark/60 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-neon-blue to-neon-purple rounded-xl flex items-center justify-center shadow-glow group-hover:rotate-12 transition-transform duration-500">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight leading-none text-white font-heading">AutoCashier</span>
              <span className="text-[10px] font-bold text-neon-blue tracking-[0.3em] uppercase">by JagoAI</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Fitur</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Cara Kerja</a>
            <Link to="/login" className="px-5 py-2 rounded-full border border-white/10 text-sm font-semibold hover:bg-white/5 transition-all">Login Admin</Link>
          </nav>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-5xl z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-blue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-blue"></span>
            </span>
            <span className="text-[10px] font-bold text-neon-blue uppercase tracking-widest">Next-Gen POS for Koperasi GIAT</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tight leading-[1.1] text-white font-heading">
            Sistem Kasir Pintar <br />
            <span className="text-gradient">Berbasis AI</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
            Revolutionizing Koperasi GIAT with Computer Vision. Letakkan barang, scan otomatis, dan selesaikan pembayaran tanpa antre.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link to="/scan" className="group relative">
              <div className="absolute inset-0 bg-neon-blue rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
              <button className="relative px-10 py-5 bg-neon-blue text-white rounded-2xl font-bold flex items-center gap-3 transition-all hover:-translate-y-1 active:scale-95 shadow-xl">
                <Camera className="w-5 h-5" />
                Mulai Scan Sekarang
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <a href="#features" className="px-10 py-5 rounded-2xl border border-white/10 font-bold hover:bg-white/5 transition-all">
              Pelajari Fitur
            </a>
          </div>
        </motion.div>

        {/* --- FLOATING DECORATIONS --- */}
        <div className="absolute top-1/4 left-10 hidden lg:block">
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="glass-card p-4 rounded-2xl border-neon-blue/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neon-blue/20 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-neon-blue" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Detection Speed</div>
                <div className="text-sm font-bold text-white">0.2s / Item</div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-1/4 right-10 hidden lg:block">
          <motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="glass-card p-4 rounded-2xl border-accent-pink/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent-pink/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-accent-pink" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Accuracy Rate</div>
                <div className="text-sm font-bold text-white">99.8% YOLOv8</div>
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
                    className="absolute left-0 w-full h-[2px] bg-neon-blue shadow-[0_0_20px_rgba(0,102,255,1)] z-10"
                  />

                  {/* BBOXES */}
                  <div className="absolute top-1/4 left-1/3 w-32 h-40 border-2 border-neon-blue rounded-lg backdrop-blur-[2px]">
                    <span className="absolute -top-7 left-0 bg-neon-blue text-[10px] font-bold text-white px-3 py-1 rounded-t-md uppercase tracking-wider shadow-lg">Product Detected</span>
                  </div>
                </div>

                {/* OVERLAY UI */}
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                  <div className="glass-card p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-neon-blue/20 flex items-center justify-center animate-pulse">
                      <div className="w-3 h-3 rounded-full bg-neon-blue" />
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
                    <div className="w-full py-3 bg-neon-blue rounded-xl text-center text-xs font-bold text-white">Checkout</div>
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
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-white font-heading">Teknologi Terdepan.</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">Kami mengintegrasikan teknologi AI terbaik untuk memastikan kecepatan dan akurasi transaksi Anda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5, borderColor: 'rgba(0, 102, 255, 0.3)' }}
              className="glass-card p-8 rounded-3xl group transition-all"
            >
              <div className="w-12 h-12 bg-white/5 group-hover:bg-neon-blue/10 rounded-2xl flex items-center justify-center mb-8 transition-colors">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-4 text-white font-heading tracking-tight">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section id="how-it-works" className="py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-neon-purple/5 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl md:text-7xl font-black mb-12 text-white leading-[1.1] font-heading tracking-tight">
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
                    className="flex gap-6 items-start"
                  >
                    <div className="text-4xl font-black text-white/10 group-hover:text-neon-blue transition-colors font-heading">{step.n}</div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{step.t}</h4>
                      <p className="text-slate-400 leading-relaxed text-sm">{step.d}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square glass-card rounded-[3rem] overflow-hidden relative border-white/20">
                <img 
                  src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=1000" 
                  alt="Modern Checkout"
                  className="w-full h-full object-cover grayscale-[0.3]"
                />
                <div className="absolute inset-0 bg-neon-blue/20 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-dark via-transparent to-transparent" />
                
                <div className="absolute bottom-10 left-10 right-10 p-8 glass-card rounded-3xl border-white/30 backdrop-blur-3xl">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                        <Zap className="w-6 h-6 text-neon-blue" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Ultra Fast Processing</div>
                        <div className="text-xs text-slate-400">Powered by YOLOv8 Architecture</div>
                      </div>
                   </div>
                   <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ width: ['0%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="h-full bg-neon-blue shadow-[0_0_10px_#0066FF]"
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
        <div className="max-w-5xl mx-auto glass-card rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden border-neon-blue/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/20 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-neon-purple/20 blur-[100px] rounded-full" />
          
          <h2 className="text-4xl md:text-6xl font-black mb-8 text-white relative z-10 font-heading">Siap Digitalisasi Koperasi?</h2>
          <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto relative z-10">Tingkatkan efisiensi layanan dan kenyamanan pelanggan Anda dengan sistem kasir mandiri berbasis AI.</p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
            <Link to="/scan" className="px-10 py-5 bg-white text-black rounded-2xl font-bold hover:bg-slate-200 transition-all">Mulai Percobaan</Link>
            <Link to="/register" className="px-10 py-5 glass-card rounded-2xl font-bold hover:bg-white/10 transition-all">Hubungi Tim JagoAI</Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-20 border-t border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-br from-neon-blue to-neon-purple rounded-lg" />
              <span className="text-2xl font-black tracking-tighter text-white font-heading">AutoCashier</span>
            </div>
            <p className="text-slate-500 max-w-sm leading-relaxed mb-8">
              Solusi Point of Sales berbasis Computer Vision untuk modernisasi Koperasi GIAT. Dibangun dengan fokus pada kecepatan, akurasi, dan kemandirian.
            </p>
            <div className="flex gap-4">
              {['Instagram', 'LinkedIn', 'Github'].map(social => (
                <div key={social} className="px-4 py-2 rounded-full border border-white/10 text-[10px] font-bold hover:bg-white hover:text-black transition-all cursor-pointer uppercase tracking-widest">{social}</div>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="text-white font-bold mb-6 text-sm">Product</h5>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="#" className="hover:text-neon-blue transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-neon-blue transition-colors">YOLOv8 AI</a></li>
              <li><a href="#" className="hover:text-neon-blue transition-colors">Security</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold mb-6 text-sm">Company</h5>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="#" className="hover:text-neon-blue transition-colors">About JagoAI</a></li>
              <li><a href="#" className="hover:text-neon-blue transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-neon-blue transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
          <span>&copy; 2026 JagoAI - Modernizing Retail Experience</span>
          <div className="flex gap-8">
            <a href="#" className="hover:text-slate-400">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}