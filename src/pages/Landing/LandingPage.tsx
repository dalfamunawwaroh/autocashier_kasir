import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Camera,
  Zap,
  Scan,
  ShoppingCart,
  ShieldCheck,
  Smartphone,
  Cpu,
  MousePointer2
} from 'lucide-react';
import { useAppStore, translations } from '../../store/useAppStore';

export default function LandingPage() {
  const { language } = useAppStore();
  const t = translations[language];

  const features = [
    {
      icon: <Cpu className="w-6 h-6 text-neon-cobalt" />,
      title: "Computer Vision",
      desc: "Teknologi YOLOv8 mengenali produk secara instan tanpa perlu mencari barcode."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-hot-pink" />,
      title: "Secure Payment",
      desc: "Integrasi QRIS yang aman dan terverifikasi otomatis oleh sistem JagoAI."
    },
    {
      icon: <Smartphone className="w-6 h-6 text-green-400" />,
      title: "Self-Service",
      desc: "Kendali penuh di tangan pelanggan untuk pengalaman belanja lebih mandiri."
    }
  ];

  return (
    <div className="min-h-screen bg-deep-dark text-white selection:bg-neon-cobalt/30">

      {/* --- HEADER (Minimalist, No Navbar) --- */}
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-6 backdrop-blur-md bg-deep-dark/30 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-neon-cobalt to-hot-pink rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,71,255,0.4)] group-hover:rotate-12 transition-transform">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter leading-none">AutoCashier</span>
              <span className="text-[10px] font-bold text-neon-cobalt tracking-[0.2em] uppercase">by JagoAI</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Online</span>
            </div>
            <div className="h-4 w-[1px] bg-white/10" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-white/60">Koperasi GIAT</span>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden px-6 pt-32 pb-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] bg-neon-cobalt/10 blur-[150px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-5xl"
        >
          <h1 className="text-6xl md:text-[120px] font-black mb-8 tracking-tighter leading-[0.85]">
            CheckOut <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cobalt to-hot-pink">
              Tanpa Kasir
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
            Revolutionizing Koperasi GIAT with Computer Vision. Letakkan barang, scan otomatis, dan selesaikan pembayaran dalam sekejap.
          </p>

          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <Link to="/scan" className="group relative w-full md:w-auto">
              <div className="absolute inset-0 bg-neon-cobalt rounded-2xl blur-xl opacity-40 group-hover:opacity-70 transition-opacity" />
              <button className="relative px-12 py-6 bg-neon-cobalt text-white rounded-2xl font-black uppercase tracking-[0.2em] flex items-center gap-4 transition-transform active:scale-95 shadow-2xl">
                <Camera className="w-6 h-6" />
                {t.START_CHECKOUT}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* --- INTERFACE PREVIEW (Tablet Frame) --- */}
      <section className="py-24 px-6 overflow-hidden relative">
        <div className="max-w-5xl mx-auto relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-neon-cobalt/20 blur-[120px] rounded-full pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative"
          >
            {/* TABLET FRAME */}
            <div className="relative mx-auto border-[12px] border-slate-800 bg-slate-800 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] overflow-hidden aspect-[4/3] md:aspect-[16/10]">
              <div className="absolute top-1/2 left-2 -translate-y-1/2 w-1.5 h-8 bg-slate-700 rounded-full z-20" />

              {/* SCREEN CONTENT */}
              <div className="relative w-full h-full bg-[#050505] overflow-hidden flex">
                <div className="w-16 h-full bg-black/40 border-r border-white/5 flex flex-col items-center py-6 gap-6">
                  <div className="w-8 h-8 bg-neon-cobalt/20 rounded-lg flex items-center justify-center"><Zap className="w-4 h-4 text-neon-cobalt" /></div>
                  <div className="w-8 h-8 bg-white/5 rounded-lg" />
                  <div className="w-8 h-8 bg-white/5 rounded-lg" />
                </div>

                <div className="flex-1 relative p-6">
                  <div className="w-full h-full rounded-2xl bg-slate-900 overflow-hidden relative border border-white/10">
                    <img
                      src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000"
                      alt="Camera Feed"
                      className="w-full h-full object-cover opacity-40 grayscale-[0.5]"
                    />
                    <motion.div
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                      className="absolute left-0 w-full h-[2px] bg-neon-cobalt shadow-[0_0_20px_#0047FF] z-10"
                    />

                    {/* MOCK DETECTION BOXES */}
                    <div className="absolute top-1/4 left-1/4 w-32 h-40 border-2 border-green-400 rounded-sm">
                      <span className="absolute -top-6 left-0 bg-green-400 text-[10px] font-black text-black px-2 py-0.5 uppercase tracking-tighter">Chitato_Ori 0.98</span>
                    </div>
                    <div className="absolute bottom-1/3 right-1/4 w-24 h-48 border-2 border-neon-cobalt rounded-sm">
                      <span className="absolute -top-6 left-0 bg-neon-cobalt text-[10px] font-black text-white px-2 py-0.5 uppercase tracking-tighter">Pocari_350ml 0.95</span>
                    </div>

                    <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-black/80 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-black tracking-widest text-white uppercase text-xs">System Live: YOLOv8 Processing</span>
                    </div>
                  </div>
                </div>

                <div className="w-64 h-full bg-black/20 backdrop-blur-sm border-l border-white/10 p-6 hidden md:block">
                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 text-center">Current Scan</h5>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-xs font-bold">Chitato</span>
                      <span className="text-xs text-neon-cobalt font-black">Rp 12k</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-xs font-bold">Pocari</span>
                      <span className="text-xs text-neon-cobalt font-black">Rp 7k</span>
                    </div>
                  </div>
                  <div className="mt-auto absolute bottom-6 w-[calc(100%-3rem)]">
                    <div className="h-[1px] bg-white/10 mb-4" />
                    <div className="flex justify-between font-black text-sm text-hot-pink">
                      <span>TOTAL</span>
                      <span>Rp 19.000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-32 max-w-7xl mx-auto px-6">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-7xl font-black mb-6 tracking-tighter">Smarter System,<br /> Faster Shopping.</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Kami mengintegrasikan teknologi terbaik untuk memastikan kenyamanan Anda saat bertransaksi di koperasi.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
              className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] transition-all group"
            >
              <div className="w-14 h-14 bg-white/5 group-hover:bg-neon-cobalt/20 rounded-2xl flex items-center justify-center mb-8 transition-colors">
                {f.icon}
              </div>
              <h3 className="text-xl font-black mb-4 uppercase tracking-tight">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- STEPS SECTION --- */}
      <section className="py-32 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="flex-1">
              <h2 className="text-5xl md:text-7xl font-black mb-12 leading-[0.9] tracking-tighter">Tinggalkan Antrean,<br /> Mulai Berbelanja.</h2>
              <div className="space-y-10">
                {[
                  { n: "01", t: "Place Your Items", d: "Letakkan semua belanjaan Anda di atas meja pemindaian JagoBOT." },
                  { n: "02", t: "Automatic Detection", d: "Sistem mengenali jenis barang dan menghitung total harga secara real-time." },
                  { n: "03", t: "Fast Checkout", d: "Gunakan QRIS untuk membayar dan ambil struk digital Anda." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-8 items-start group">
                    <span className="text-5xl font-black text-white/5 group-hover:text-neon-cobalt/20 transition-colors">{step.n}</span>
                    <div>
                      <h4 className="text-2xl font-bold text-white mb-2 tracking-tight">{step.t}</h4>
                      <p className="text-slate-500 leading-relaxed">{step.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* --- FOOTER --- */}
      <footer className="py-20 border-t border-white/5 bg-black/40 backdrop-blur-xl relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-neon-cobalt rounded-lg" />
              <span className="text-2xl font-black tracking-tighter uppercase">AutoCashier</span>
            </div>
            <p className="text-slate-500 max-w-sm leading-relaxed mb-8 font-medium">
              Solusi cerdas Point of Sales berbasis Computer Vision untuk digitalisasi Koperasi GIAT. Dikembangkan oleh Tim JagoAI.
            </p>
            <div className="flex gap-4">
              {['IG', 'LD', 'GH'].map(social => (
                <div key={social} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-bold hover:bg-white hover:text-black transition-colors cursor-pointer">{social}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
          <span>&copy; 2026 JagoAI Startup - All Rights Reserved</span>
        </div>
      </footer>
    </div>
  );
}