import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ShoppingBag, ShieldCheck, Loader2,
  Phone, ArrowRight, SkipForward, AlertCircle, X, Zap, Target, Scan
} from 'lucide-react';
import { ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import { useAppStore, translations } from '../../store/useAppStore';

export interface CartItem {
  id: string | number;
  label: string;
  name: string;
  price: number;
  qty: number;
}

const LOCAL_PRICE_MAP: Record<string, any> = {
  'pop_mie':            { id: 1, label: 'pop_mie',            name: 'Pop Mie Rasa Ayam',        price: 6500  },
  'le_minerale':        { id: 3, label: 'le_minerale',        name: 'Le Minerale 600ml',         price: 4000  },
  'aqua_600ml':         { id: 2, label: 'aqua_600ml',         name: 'Aqua 600ml',                price: 3500  },
  'cimory_yogurt_bites':{ id: 4, label: 'cimory_yogurt_bites',name: 'Cimory Yogurt Bites',       price: 12000 },
  'tel_u_fresh':        { id: 5, label: 'tel_u_fresh',        name: 'Tel-U Fresh Water',         price: 3000  },
};

// --- IDENTITY MODAL ---
function IdentityCheckModal({ onClose, cartItems }: { onClose: () => void; cartItems: CartItem[] }) {
  const navigate = useNavigate();
  const { language, setIdentity } = useAppStore();
  const t = translations[language];
  const [phone, setPhone] = useState('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setIsLoading(true);
    setTimeout(() => {
      if (phone === '081234') {
        setIdentity({ name: 'Demo Member', role: 'kasir', phone }, true);
        navigate('/cart', { state: { items: cartItems } });
      } else {
        setErrorStatus(t.WA_NOT_FOUND);
        setIdentity({ name: 'Guest', role: 'kasir' }, false);
        setTimeout(() => navigate('/cart', { state: { items: cartItems } }), 2000);
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-[#020617] border border-white/10 p-10 rounded-[3.5rem] shadow-2xl relative z-10 text-center">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">👋</div>
        <h1 className="text-3xl font-black text-white mb-2 italic uppercase tracking-tighter">{t.IDENTITY_TITLE}</h1>
        <p className="text-slate-400 font-medium text-sm mb-8">{t.IDENTITY_SUB}</p>
        {errorStatus && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex gap-3 items-start text-left text-red-400 text-xs font-bold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorStatus}
          </div>
        )}
        <form onSubmit={handleCheckMember} className="space-y-6">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t.WA_LABEL}</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-[#0047FF] transition-colors" />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoFocus
                className="block w-full pl-12 pr-4 py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-lg outline-none focus:ring-2 focus:ring-[#0047FF]/50 transition-all"
                placeholder="0812..." />
            </div>
          </div>
          <button type="submit" disabled={isLoading || !phone}
            className="w-full bg-[#0047FF] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 transition-all active:scale-95">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>{t.CEK_MEMBER} <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>
        <button onClick={() => { setIdentity({ name: 'Guest', role: 'kasir' }, false); navigate('/cart', { state: { items: cartItems } }); }}
          className="w-full mt-4 text-slate-500 hover:text-white py-4 rounded-2xl font-bold tracking-widest flex items-center justify-center gap-2 transition-all">
          {t.LEWATI} <SkipForward className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}

// --- MAIN PAGE ---
export default function CameraScannerPage() {
  const navigate = useNavigate();
  const { language } = useAppStore();
  const t = translations[language];
  const videoRef = useRef<HTMLVideoElement>(null);

  const [detector, setDetector] = useState<ObjectDetector | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<CartItem[]>([]);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>(['Sistem siap. Arahkan produk ke kamera.']);
  const [isRoboflowScanning, setIsRoboflowScanning] = useState(false);
  const [cvState, setCvState] = useState<{
    label: string | null;
    status: 'TRACKING' | 'IDENTIFYING' | 'CONFIRMED';
    box: { x: number; y: number; w: number; h: number } | null;
  }>({ label: null, status: 'TRACKING', box: null });

  const lastRoboflowTime = useRef(0);
  const isLockedRef = useRef(false);

  const totalQty   = detectedItems.reduce((acc, i) => acc + i.qty, 0);
  const totalPrice = detectedItems.reduce((acc, i) => acc + i.price * i.qty, 0);

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 5));

  // Init: kamera + MediaPipe ObjectDetector saja (tanpa HandLandmarker)
  useEffect(() => {
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (videoRef.current) videoRef.current.srcObject = stream;

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
        );
        const objectDetector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          scoreThreshold: 0.2,
        });

        setDetector(objectDetector);
        setIsModelLoading(false);
        addLog('MediaPipe siap. Roboflow standby.');
      } catch (err: any) {
        setInitError(err.message || 'Gagal memulai sistem');
        setIsModelLoading(false);
      }
    }
    init();
    return () => {
      if (videoRef.current?.srcObject)
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    };
  }, []);

  // Loop: MediaPipe untuk visual box + trigger Roboflow setiap 2 detik
  useEffect(() => {
    let rafId: number;

    const runLoop = async () => {
      const video = videoRef.current;
      if (video?.readyState === 4 && detector && cvState.status !== 'CONFIRMED') {
        const now = performance.now();

        // -- MediaPipe: tracking visual --
        const result = detector.detectForVideo(video, now);
        const candidates = result.detections.filter(d => {
          const cat = d.categories[0].categoryName;
          const { originX, originY, width, height } = d.boundingBox!;
          const cx = (originX + width / 2) / video.videoWidth;
          const cy = (originY + height / 2) / video.videoHeight;
          return cat !== 'person' && cx > 0.1 && cx < 0.9 && cy > 0.1 && cy < 0.9;
        });

        if (candidates.length > 0) {
          const best = candidates.sort((a, b) => b.categories[0].score - a.categories[0].score)[0].boundingBox!;
          const dW = window.innerWidth, dH = window.innerHeight;
          const vW = video.videoWidth,  vH = video.videoHeight;
          const videoAspect = vW / vH, displayAspect = dW / dH;
          let scale: number, offX = 0, offY = 0;
          if (displayAspect > videoAspect) { scale = dW / vW; offY = (dH - vH * scale) / 2; }
          else                             { scale = dH / vH; offX = (dW - vW * scale) / 2; }

          const targetBox = { x: best.originX * scale + offX, y: best.originY * scale + offY, w: best.width * scale, h: best.height * scale };
          setCvState(prev => ({
            ...prev,
            box: prev.box
              ? { x: prev.box.x + (targetBox.x - prev.box.x) * 0.25, y: prev.box.y + (targetBox.y - prev.box.y) * 0.25, w: prev.box.w + (targetBox.w - prev.box.w) * 0.25, h: prev.box.h + (targetBox.h - prev.box.h) * 0.25 }
              : targetBox,
            status: isRoboflowScanning ? 'IDENTIFYING' : 'TRACKING'
          }));
        } else {
          setCvState(prev => ({ ...prev, box: null, status: 'TRACKING' }));
        }

        // -- Roboflow: identifikasi setiap 2 detik --
        if (!isRoboflowScanning && !isLockedRef.current && (now - lastRoboflowTime.current > 2000)) {
          lastRoboflowTime.current = now;
          setIsRoboflowScanning(true);
          addLog('Mengirim ke Roboflow...');

          try {
            const canvas = document.createElement('canvas');
            canvas.width = 640; canvas.height = 480;
            canvas.getContext('2d')?.drawImage(video, 0, 0, 640, 480);
            const base64Image = canvas.toDataURL('image/jpeg', 0.85);

            const res = await fetch('/api/detect', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64Image })
            });
            const data = await res.json();

            if (data.success && data.label && !isLockedRef.current) {
              isLockedRef.current = true;
              const label = data.label as string;
              const conf  = ((data.confidence || 0) * 100).toFixed(1);
              const product = data.product || LOCAL_PRICE_MAP[label] || LOCAL_PRICE_MAP[label.replace(/-/g, '_')];

              addLog(`✓ ${label} (${conf}%)`);
              setCvState(prev => ({ ...prev, label, status: 'CONFIRMED' }));

              new Audio(product
                ? 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
                : 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'
              ).play().catch(() => {});

              setDetectedItems(prev => {
                const exists = prev.find(i => i.label === label || (product?.id && i.id === product.id));
                if (exists) return prev.map(i => i.label === label || i.id === product?.id ? { ...i, qty: i.qty + 1 } : i);
                return [...prev, product
                  ? { id: product.id, label, name: product.name, price: product.price, qty: 1 }
                  : { id: 'unknown_' + Date.now(), label, name: `Tidak Terdaftar: ${label.toUpperCase()}`, price: 0, qty: 1 }
                ];
              });

              setTimeout(() => {
                isLockedRef.current = false;
                lastRoboflowTime.current = performance.now();
                setCvState({ label: null, status: 'TRACKING', box: null });
              }, 3000);
            } else {
              addLog('Tidak ada objek.');
            }
          } catch {
            addLog('Koneksi server gagal.');
          } finally {
            setIsRoboflowScanning(false);
          }
        }
      }
      rafId = requestAnimationFrame(runLoop);
    };

    if (!isModelLoading) runLoop();
    return () => cancelAnimationFrame(rafId);
  }, [isModelLoading, detector, isRoboflowScanning, cvState.status]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030712] font-sans">
      <video ref={videoRef} autoPlay playsInline muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isModelLoading ? 'opacity-10' : 'opacity-60'}`} />

      {/* Loading */}
      {isModelLoading && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 text-white">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-t-[#0047FF] border-white/10 rounded-full mb-6" />
          <p className="font-black tracking-[0.4em] uppercase text-xs animate-pulse">Memuat MediaPipe...</p>
        </div>
      )}

      {/* Error */}
      {initError && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 text-white p-10 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
          <h2 className="text-2xl font-black uppercase mb-2">Inisialisasi Gagal</h2>
          <p className="text-white/60 mb-8">{initError}</p>
          <button onClick={() => window.location.reload()} className="px-8 py-4 bg-white text-black font-black uppercase rounded-full">Coba Lagi</button>
        </div>
      )}

      {/* Scan Zone (saat idle, tidak ada box) */}
      {!isModelLoading && !cvState.box && cvState.status === 'TRACKING' && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          <motion.div animate={{ opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 2.5, repeat: Infinity }}
            className="w-[55%] h-[55%] border-2 border-dashed border-white/20 rounded-[40px]" />
          <div className="absolute top-[22%] left-[22%] w-8 h-8 border-t-2 border-l-2 border-white/30 rounded-tl-lg" />
          <div className="absolute top-[22%] right-[22%] w-8 h-8 border-t-2 border-r-2 border-white/30 rounded-tr-lg" />
          <div className="absolute bottom-[22%] left-[22%] w-8 h-8 border-b-2 border-l-2 border-white/30 rounded-bl-lg" />
          <div className="absolute bottom-[22%] right-[22%] w-8 h-8 border-b-2 border-r-2 border-white/30 rounded-br-lg" />
        </div>
      )}

      {/* Bounding Box dari MediaPipe */}
      <AnimatePresence>
        {cvState.box && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1, borderColor: cvState.status === 'CONFIRMED' ? '#22c55e' : cvState.status === 'IDENTIFYING' ? '#f97316' : '#0047FF', boxShadow: cvState.status === 'CONFIRMED' ? '0 0 50px rgba(34,197,94,0.4)' : '0 0 50px rgba(0,71,255,0.3)' }} exit={{ opacity: 0 }}
            className="absolute z-50 border-[2px] rounded-[24px] pointer-events-none"
            style={{ left: cvState.box.x, top: cvState.box.y, width: cvState.box.w, height: cvState.box.h }}
          >
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-inherit rounded-tl-xl" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-inherit rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-inherit rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-inherit rounded-br-xl" />
            {cvState.label && (
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className={`absolute -top-10 left-0 px-4 py-2 rounded-xl text-white text-[10px] font-black flex items-center gap-2 shadow-xl ${cvState.status === 'CONFIRMED' ? 'bg-green-500' : 'bg-[#0047FF]'}`}>
                {cvState.status === 'CONFIRMED' ? <ShieldCheck className="w-4 h-4" /> : <Zap className="w-4 h-4 animate-pulse" />}
                {cvState.label.replace(/_/g, ' ').toUpperCase()}
              </motion.div>
            )}
            {cvState.status === 'IDENTIFYING' && (
              <motion.div animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 1, repeat: Infinity }}
                className="absolute inset-0 bg-orange-500/10 rounded-[22px]" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="absolute top-0 inset-x-0 p-8 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[32px] px-10 py-6 text-white shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#0047FF] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,71,255,0.5)]"><Target className="w-6 h-6 text-white" /></div>
            <div>
              <div className="font-black text-xl italic tracking-tighter uppercase leading-none">AutoCashier <span className="text-[#0047FF]">X</span></div>
              <div className="text-[8px] font-bold text-white/40 tracking-[0.2em] uppercase mt-1">MediaPipe + Roboflow Engine</div>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full backdrop-blur-xl border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${isRoboflowScanning ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : cvState.status === 'CONFIRMED' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-blue-500/20 border-blue-500/50 text-blue-400'}`}>
            {isRoboflowScanning ? <Loader2 className="w-3 h-3 animate-spin" /> : cvState.status === 'CONFIRMED' ? <ShieldCheck className="w-3 h-3" /> : <Scan className="w-3 h-3" />}
            {isRoboflowScanning ? 'Roboflow Scan...' : cvState.status === 'CONFIRMED' ? 'Terdeteksi!' : 'Tracking'}
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="absolute top-36 right-8 z-50 flex flex-col gap-2 pointer-events-none">
        {logs.map((log, i) => (
          <motion.div key={i + log} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1 - i * 0.18, x: 0 }}
            className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-[10px] font-mono text-white/80">
            <span className="text-[#0047FF] mr-2">●</span>{log}
          </motion.div>
        ))}
      </div>

      {/* Cart */}
      <div className="absolute left-8 bottom-8 z-20 w-80 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[45px] flex flex-col max-h-[480px] text-white shadow-2xl overflow-hidden">
        <div className="p-10 pb-5">
          <div className="flex items-center gap-3 opacity-50 text-[10px] font-black uppercase tracking-[0.3em] mb-4"><ShoppingBag className="w-4 h-4" /> Keranjang ({totalQty})</div>
          <div className="h-[1px] bg-white/5 w-full" />
        </div>
        <div className="px-10 flex-1 overflow-y-auto custom-scrollbar space-y-6 py-2">
          {detectedItems.length === 0
            ? <div className="text-xs text-white/20 italic font-bold">Arahkan kamera ke produk...</div>
            : detectedItems.map((item, idx) => (
              <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={idx} className="flex justify-between items-center group">
                <div className="flex flex-col text-left">
                  <span className={`text-sm font-black tracking-tight ${item.id.toString().startsWith('unknown_') ? 'text-red-400' : 'group-hover:text-[#0047FF]'}`}>{item.name}</span>
                  <span className="text-[10px] text-white/30 font-mono">Rp{item.price.toLocaleString('id-ID')}</span>
                </div>
                <div className={`${item.id.toString().startsWith('unknown_') ? 'text-red-400' : 'text-[#0047FF]'} font-black text-lg bg-white/5 px-3 py-1 rounded-lg`}>x{item.qty}</div>
              </motion.div>
            ))
          }
        </div>
        <div className="p-10 pt-5">
          <div className="h-[1px] bg-white/5 w-full mb-8" />
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subtotal</span>
            <span className="text-4xl font-black text-white italic tracking-tighter">Rp{totalPrice.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* Bayar */}
      <button disabled={detectedItems.length === 0} onClick={() => setIsIdentityModalOpen(true)}
        className={`absolute right-8 bottom-8 z-[60] px-16 py-10 rounded-[50px] font-black text-3xl uppercase flex items-center gap-6 transition-all active:scale-95 ${detectedItems.length > 0 ? 'bg-[#0047FF] text-white shadow-[0_20px_60px_rgba(0,71,255,0.5)]' : 'bg-white/5 text-white/10 cursor-not-allowed'}`}>
        BAYAR <ChevronRight className="w-8 h-8" />
      </button>

      <AnimatePresence>
        {isIdentityModalOpen && <IdentityCheckModal onClose={() => setIsIdentityModalOpen(false)} cartItems={detectedItems} />}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,71,255,0.3); border-radius: 20px; }
      `}</style>
    </div>
  );
}