import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ShoppingBag,
  Scan,
  ShieldCheck,
  Loader2,
  Phone,
  ArrowRight,
  SkipForward,
  AlertCircle,
  X,
  Zap
} from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import { useAppStore, translations } from '../../store/useAppStore';

// --- TYPES ---
export interface CartItem {
  id: string | number;
  label: string;
  name: string;
  price: number;
  qty: number;
}

const LOCAL_PRICE_MAP: Record<string, any> = {
  'pop_mie': { id: 1, label: 'pop_mie', name: 'Pop Mie Rasa Ayam', price: 6500 },
  'le_minerale': { id: 3, label: 'le_minerale', name: 'Le Minerale 600ml', price: 4000 },
  'aqua_600ml': { id: 'prod_002', label: 'aqua_600ml', name: 'Aqua 600ml', price: 3500 }
};

// --- COMPONENT: IDENTITY CHECK MODAL ---
interface IdentityCheckModalProps {
  onClose: () => void;
  cartItems: CartItem[];
}

function IdentityCheckModal({ onClose, cartItems }: IdentityCheckModalProps) {
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
    setErrorStatus(null);

    setTimeout(() => {
      if (phone === '081234') {
        const user = { name: 'Demo Member', role: 'kasir', phone };
        setIdentity(user, true);
        navigate('/cart', { state: { items: cartItems } });
      } else {
        setErrorStatus(t.WA_NOT_FOUND);
        setIdentity({ name: 'Guest', role: 'kasir' }, false);
        setTimeout(() => navigate('/cart', { state: { items: cartItems } }), 2000);
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleSkip = () => {
    setIdentity({ name: 'Guest', role: 'kasir' }, false);
    navigate('/cart', { state: { items: cartItems } });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md glass-card p-10 rounded-[3.5rem] shadow-2xl relative z-10 text-center"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">👋</div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 italic uppercase tracking-tighter">{t.IDENTITY_TITLE}</h1>
        <p className="text-slate-600 dark:text-slate-400 font-medium text-sm mb-8">{t.IDENTITY_SUB}</p>

        {errorStatus && (
          <div className="mb-6 p-4 rounded-2xl bg-hot-pink/10 border border-hot-pink/30 flex gap-3 items-start text-left text-hot-pink text-xs font-bold leading-tight">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorStatus}
          </div>
        )}

        <form onSubmit={handleCheckMember} className="space-y-6">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t.WA_LABEL}</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-neon-blue transition-colors" />
              <input
                type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoFocus
                className="block w-full pl-12 pr-4 py-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-bold text-lg outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all placeholder:text-slate-500"
                placeholder="0812..."
              />
            </div>
          </div>
          <button
            type="submit" disabled={isLoading || !phone}
            className="w-full bg-neon-blue text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(0,102,255,0.3)] disabled:opacity-50 transition-all active:scale-95"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>{t.CEK_MEMBER} <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <button onClick={handleSkip} className="w-full mt-4 text-slate-500 hover:text-slate-900 dark:hover:text-white py-4 rounded-2xl font-bold tracking-widest flex items-center justify-center gap-2 transition-all">
          {t.LEWATI} <SkipForward className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}

// --- MAIN PAGE: CAMERA SCANNER ---
export default function CameraScannerPage() {
  const navigate = useNavigate();
  const { language } = useAppStore();
  const t = translations[language];
  const videoRef = useRef<HTMLVideoElement>(null);

  const [model, setModel] = useState<cocossd.ObjectDetection | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [detectedItems, setDetectedItems] = useState<CartItem[]>([]);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);

  const [cvState, setCvState] = useState<{
    label: string | null;
    status: 'VISION MODE' | 'LOCKED' | 'CONFIRMED';
    progress: number;
    box: { x: number, y: number, w: number, h: number } | null;
  }>({ label: null, status: 'VISION MODE', progress: 0, box: null });

  const totalQty = detectedItems.reduce((acc, item) => acc + item.qty, 0);
  const totalPrice = detectedItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

  useEffect(() => {
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: 1280, height: 720 }
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
        await tf.ready();
        const loadedModel = await cocossd.load();
        setModel(loadedModel);
        setIsModelLoading(false);
      } catch (err) { console.error(err); }
    }
    init();
  }, []);

  useEffect(() => {
    let requestUpdate: number;
    const runDetection = async () => {
      if (model && videoRef.current?.readyState === 4 && cvState.status === 'VISION MODE') {
        const predictions = await model.detect(videoRef.current);
        if (predictions.length > 0) {
          const primary = predictions[0];
          let mappedLabel = '';
          if (primary.class === 'cup') mappedLabel = 'pop_mie';
          if (primary.class === 'bottle') mappedLabel = 'le_minerale';
          if (mappedLabel && LOCAL_PRICE_MAP[mappedLabel]) {
            handleDetectionLogic(mappedLabel, primary.bbox);
          }
        }
      }
      requestUpdate = requestAnimationFrame(runDetection);
    };
    if (!isModelLoading) runDetection();
    return () => cancelAnimationFrame(requestUpdate);
  }, [model, isModelLoading, cvState.status]);

  const handleDetectionLogic = (label: string, bbox: number[]) => {
    setCvState({ label, status: 'LOCKED', progress: 0, box: { x: bbox[0], y: bbox[1], w: bbox[2], h: bbox[3] } });
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setCvState(prev => ({ ...prev, progress: currentProgress }));
      if (currentProgress >= 100) {
        clearInterval(interval);
        confirmDetection(label);
      }
    }, 100);
  };

  const confirmDetection = (label: string) => {
    const item = LOCAL_PRICE_MAP[label];
    if (!item) return;
    new Audio('https://assets.mixkit.co/active_storage/sfx/707/707-preview.mp3').play().catch(() => { });
    setCvState(prev => ({ ...prev, status: 'CONFIRMED' }));
    setDetectedItems(prev => {
      const exists = prev.find(i => i.label === label);
      if (exists) return prev.map(i => i.label === label ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
    setTimeout(() => setCvState({ label: null, status: 'VISION MODE', progress: 0, box: null }), 2000);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 font-sans">
      <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isModelLoading ? 'opacity-20' : 'opacity-60'}`} />

      {isModelLoading && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 text-white">
          <Loader2 className="w-12 h-12 animate-spin text-neon-blue mb-6" />
          <p className="font-black tracking-[0.4em] uppercase text-xs italic">Initializing JagoAI Engine...</p>
        </div>
      )}

      {!isModelLoading && cvState.status === 'VISION MODE' && (
        <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="absolute left-0 w-full h-[2px] bg-[#0047FF] shadow-[0_0_20px_rgba(0,71,255,0.8)] z-10 pointer-events-none" />
      )}

      <AnimatePresence>
        {cvState.box && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1, borderColor: cvState.status === 'CONFIRMED' ? '#22c55e' : '#0066FF' }} exit={{ opacity: 0, scale: 1.1 }}
            className="absolute z-50 border-[4px] rounded-[30px] pointer-events-none shadow-[0_0_50px_rgba(0,102,255,0.3)]"
            style={{ left: cvState.box.x, top: cvState.box.y, width: cvState.box.w, height: cvState.box.h }}
          >
            <div className={`absolute -top-12 left-0 px-4 py-2 rounded-xl text-white text-xs font-black flex items-center gap-2 ${cvState.status === 'CONFIRMED' ? 'bg-green-500' : 'bg-neon-blue'}`}>
              {cvState.status === 'CONFIRMED' ? <ShieldCheck className="w-4 h-4" /> : <Scan className="w-4 h-4 animate-spin" />}
              {cvState.label?.replace('_', ' ').toUpperCase()}
            </div>
            {cvState.status === 'LOCKED' && <div className="absolute inset-0 rounded-[26px] overflow-hidden"><motion.div className="absolute bottom-0 left-0 right-0 bg-blue-500/40" animate={{ height: `${cvState.progress}%` }} /></div>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 inset-x-0 p-8 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/80 dark:bg-black/40 backdrop-blur-3xl border border-slate-200 dark:border-white/5 rounded-[32px] px-10 py-6 text-slate-900 dark:text-white shadow-2xl">
          <div className="font-black text-2xl italic tracking-tighter uppercase leading-none">JagoAI <span className="text-neon-blue">VISION</span></div>
          <div className="flex items-center gap-4 bg-neon-blue/10 px-6 py-2.5 rounded-full border border-neon-blue/30 text-[10px] font-black uppercase tracking-widest text-neon-blue">
            <div className={`w-2.5 h-2.5 rounded-full ${cvState.status !== 'VISION MODE' ? 'bg-red-500 animate-pulse' : 'bg-neon-blue'}`} />
            {cvState.status}
          </div>
        </div>
      </div>

      <div className="absolute left-8 bottom-8 z-20 w-85 glass-card rounded-[45px] flex flex-col max-h-[480px] text-slate-900 dark:text-white shadow-2xl overflow-hidden">
        <div className="p-10 pb-5">
          <div className="flex items-center gap-3 opacity-50 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
            <ShoppingBag className="w-4 h-4" /> Keranjang ({totalQty})
          </div>
          <div className="h-[1px] bg-slate-200 dark:bg-white/5 w-full" />
        </div>

        <div className="px-10 flex-1 overflow-y-auto custom-scrollbar space-y-6 py-2">
          {detectedItems.length === 0 ? (
            <div className="text-xs text-slate-400 dark:text-white/20 italic font-bold">Belum ada barang terdeteksi...</div>
          ) : (
            detectedItems.map((item, idx) => (
              <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={idx} className="flex justify-between items-center group">
                <div className="flex flex-col text-left">
                  <span className="text-sm font-black tracking-tight group-hover:text-neon-blue transition-colors">{item.name}</span>
                </div>
                <div className="text-neon-blue font-black text-lg bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-lg">x{item.qty}</div>
              </motion.div>
            ))
          )}
        </div>

        <div className="p-10 pt-5">
          <div className="h-[1px] bg-slate-200 dark:bg-white/5 w-full mb-8" />
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Total Belanja</span>
            <span className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none">Rp{totalPrice.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      <button disabled={detectedItems.length === 0} onClick={() => setIsIdentityModalOpen(true)}
        className={`absolute right-8 bottom-8 z-[60] px-16 py-10 rounded-[50px] font-black text-3xl uppercase flex items-center gap-6 transition-all transform active:scale-95 ${detectedItems.length > 0 ? 'bg-neon-blue text-white shadow-[0_20px_60px_rgba(0,102,255,0.5)]' : 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-white/10 cursor-not-allowed'}`}
      >
        LANJUT <ChevronRight className="w-8 h-8" />
      </button>

      <AnimatePresence>
        {isIdentityModalOpen && <IdentityCheckModal onClose={() => setIsIdentityModalOpen(false)} cartItems={detectedItems} />}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 71, 255, 0.3); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 71, 255, 0.6); }
      `}</style>
    </div>
  );
}