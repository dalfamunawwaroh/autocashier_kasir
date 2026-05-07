import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ShoppingBag, ShieldCheck, Loader2,
  Phone, ArrowRight, SkipForward, AlertCircle, X, Scan, Camera
} from 'lucide-react';
import { useAppStore, translations } from '../../store/useAppStore';

export interface CartItem {
  id: string | number;
  label: string;
  name: string;
  price: number;
  qty: number;
}

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
        className="w-full max-w-md bg-[#020617] border border-white/10 p-10 rounded-[3.5rem] shadow-2xl relative z-10 text-center"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

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
              <input
                type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoFocus
                className="block w-full pl-12 pr-4 py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-lg outline-none focus:ring-2 focus:ring-[#0047FF]/50 transition-all"
                placeholder="0812..."
              />
            </div>
          </div>
          <button
            type="submit" disabled={isLoading || !phone}
            className="w-full bg-[#0047FF] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 transition-all active:scale-95"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>{t.CEK_MEMBER} <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <button onClick={handleSkip} className="w-full mt-4 text-slate-500 hover:text-white py-4 rounded-2xl font-bold tracking-widest flex items-center justify-center gap-2 transition-all">
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessingRef = useRef(false);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<CartItem[]>([]);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [scanState, setScanState] = useState<{
    label: string | null;
    status: 'SCANNING' | 'DETECTED' | 'CONFIRMED' | 'IDLE';
    confidence: number;
    box: { x: number, y: number, w: number, h: number } | null;
  }>({ label: null, status: 'IDLE', confidence: 0, box: null });

  const totalQty = detectedItems.reduce((acc, i) => acc + i.qty, 0);
  const totalPrice = detectedItems.reduce((acc, i) => acc + i.price * i.qty, 0);

  // 1. Init Camera
  useEffect(() => {
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsCameraReady(true);
          };
        }
      } catch (err: any) {
        console.error('Camera init error:', err);
        setInitError(err.message || 'Gagal akses kamera');
      }
    }
    initCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  // 2. Start auto-scanning when camera is ready
  useEffect(() => {
    if (!isCameraReady) return;

    // Start scanning loop
    setScanState(prev => ({ ...prev, status: 'SCANNING' }));

    scanIntervalRef.current = setInterval(() => {
      if (!isProcessingRef.current) {
        captureAndDetect();
      }
    }, 1500);

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [isCameraReady]);

  // 3. Capture frame and send to Roboflow via backend
  const captureAndDetect = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState < 4) return;
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsScanning(true);

    try {
      // Capture frame from video
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg', 0.7);

      // Send to backend /api/detect
      const response = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });

      const data = await response.json();

      if (data.success && data.label) {
        console.log(`[SCAN] Detected: ${data.label} (${(data.confidence * 100).toFixed(1)}%) via ${data.source}`);

        // Calculate box position relative to video display
        const videoEl = videoRef.current;
        const displayW = videoEl.clientWidth;
        const displayH = videoEl.clientHeight;
        const videoW = videoEl.videoWidth;
        const videoH = videoEl.videoHeight;
        const scaleX = displayW / videoW;
        const scaleY = displayH / videoH;

        const bbox = data.bbox || [0, 0, 100, 100];
        const boxForDisplay = {
          x: bbox[0] * scaleX,
          y: bbox[1] * scaleY,
          w: (bbox[2] - bbox[0]) * scaleX,
          h: (bbox[3] - bbox[1]) * scaleY
        };

        // Pause scanning interval
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }

        // Show detected state
        setScanState({
          label: data.product?.name || data.label,
          status: 'DETECTED',
          confidence: data.confidence,
          box: boxForDisplay
        });

        // After short delay, confirm and add to cart
        setTimeout(() => {
          const productData = data.product;
          const label = data.label;
          const productName = productData?.name || label;
          const productPrice = productData?.price || 0;
          const productId = productData?.id || label;

          // Play success sound
          new Audio('https://assets.mixkit.co/active_storage/sfx/707/707-preview.mp3').play().catch(() => {});

          setScanState(prev => ({ ...prev, status: 'CONFIRMED' }));

          setDetectedItems(prev => {
            const exists = prev.find(i => i.label === label || i.id === productId);
            if (exists) {
              return prev.map(i => (i.label === label || i.id === productId) ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, {
              id: productId,
              label: label,
              name: productName,
              price: productPrice,
              qty: 1
            }];
          });

          // After 2s, reset and resume scanning
          setTimeout(() => {
            setScanState({ label: null, status: 'SCANNING', confidence: 0, box: null });

            // Resume scanning
            scanIntervalRef.current = setInterval(() => {
              if (!isProcessingRef.current) {
                captureAndDetect();
              }
            }, 1500);
          }, 2000);

        }, 800);

      } else {
        // Nothing detected, keep scanning
        setScanState(prev => ({ ...prev, status: 'SCANNING', box: null, label: null }));
      }
    } catch (err) {
      console.error('[SCAN] Detection error:', err);
    } finally {
      isProcessingRef.current = false;
      setIsScanning(false);
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030712] font-sans">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Feed */}
      <video ref={videoRef} autoPlay playsInline muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${!isCameraReady ? 'opacity-20' : 'opacity-60'}`}
      />

      {/* Loading State */}
      {!isCameraReady && !initError && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 text-white">
          <Loader2 className="w-12 h-12 animate-spin text-[#0047FF] mb-6" />
          <p className="font-black tracking-[0.4em] uppercase text-xs italic">Initializing Camera...</p>
        </div>
      )}

      {/* Error State */}
      {initError && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 text-white p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
          <p className="font-black text-xl mb-2">Kamera Gagal</p>
          <p className="text-slate-400 text-sm text-center max-w-md">{initError}</p>
        </div>
      )}

      {/* Scan Zone Overlay - shown when actively scanning */}
      {isCameraReady && scanState.status === 'SCANNING' && !scanState.box && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-[60%] h-[50%] border-2 border-dashed border-[#0047FF]/40 rounded-[40px] relative"
          >
            {/* Corner markers */}
            <div className="absolute -top-1 -left-1 w-10 h-10 border-t-3 border-l-3 border-[#0047FF] rounded-tl-xl" />
            <div className="absolute -top-1 -right-1 w-10 h-10 border-t-3 border-r-3 border-[#0047FF] rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-3 border-l-3 border-[#0047FF] rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-3 border-r-3 border-[#0047FF] rounded-br-xl" />

            {/* Scan line animation */}
            <motion.div
              animate={{ y: [0, 250, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-[#0047FF] to-transparent"
            />
          </motion.div>

          {/* Instruction text */}
          <div className="absolute bottom-[30%] flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest">
            <Camera className="w-4 h-4" />
            Arahkan produk ke kamera
          </div>
        </div>
      )}

      {/* Scanning indicator pulse */}
      {isScanning && scanState.status === 'SCANNING' && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-30">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="flex items-center gap-2 bg-[#0047FF]/20 border border-[#0047FF]/40 px-5 py-2.5 rounded-full text-[#0047FF] text-xs font-black uppercase tracking-widest"
          >
            <Scan className="w-4 h-4 animate-spin" /> Menganalisis...
          </motion.div>
        </div>
      )}

      {/* Bounding Box from Roboflow detection */}
      <AnimatePresence>
        {scanState.box && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1,
              borderColor: scanState.status === 'CONFIRMED' ? '#22c55e' : '#0047FF'
            }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute z-50 border-[4px] rounded-[20px] pointer-events-none"
            style={{
              left: scanState.box.x,
              top: scanState.box.y,
              width: scanState.box.w,
              height: scanState.box.h,
              boxShadow: scanState.status === 'CONFIRMED'
                ? '0 0 40px rgba(34,197,94,0.4)'
                : '0 0 40px rgba(0,71,255,0.4)'
            }}
          >
            {/* Label badge */}
            <div className={`absolute -top-10 left-0 px-4 py-2 rounded-xl text-white text-xs font-black flex items-center gap-2 ${
              scanState.status === 'CONFIRMED' ? 'bg-green-500' : 'bg-[#0047FF]'
            }`}>
              {scanState.status === 'CONFIRMED'
                ? <ShieldCheck className="w-4 h-4" />
                : <Scan className="w-4 h-4 animate-spin" />
              }
              {scanState.label?.toUpperCase()}
              {scanState.confidence > 0 && (
                <span className="opacity-60 ml-1">{(scanState.confidence * 100).toFixed(0)}%</span>
              )}
            </div>

            {/* Progress fill for DETECTED state */}
            {scanState.status === 'DETECTED' && (
              <div className="absolute inset-0 rounded-[16px] overflow-hidden">
                <motion.div
                  initial={{ height: '0%' }}
                  animate={{ height: '100%' }}
                  transition={{ duration: 0.8 }}
                  className="absolute bottom-0 left-0 right-0 bg-blue-500/30"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="absolute top-0 inset-x-0 p-8 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[32px] px-10 py-6 text-white shadow-2xl">
          <div className="font-black text-2xl italic tracking-tighter uppercase leading-none">JagoAI <span className="text-[#0047FF]">VISION</span></div>
          <div className="flex items-center gap-4 bg-[#0047FF]/10 px-6 py-2.5 rounded-full border border-[#0047FF]/30 text-[10px] font-black uppercase tracking-widest text-[#0047FF]">
            <div className={`w-2.5 h-2.5 rounded-full ${
              scanState.status === 'CONFIRMED' ? 'bg-green-500' :
              scanState.status === 'DETECTED' ? 'bg-amber-500 animate-pulse' :
              scanState.status === 'SCANNING' ? 'bg-[#0047FF]' :
              'bg-slate-500'
            }`} />
            {scanState.status === 'SCANNING' ? 'VISION MODE' :
             scanState.status === 'DETECTED' ? 'LOCKED' :
             scanState.status === 'CONFIRMED' ? 'CONFIRMED' :
             'IDLE'}
          </div>
        </div>
      </div>

      {/* Cart Panel */}
      <div className="absolute left-8 bottom-8 z-20 w-85 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[45px] flex flex-col max-h-[480px] text-white shadow-2xl overflow-hidden">
        <div className="p-10 pb-5">
          <div className="flex items-center gap-3 opacity-50 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
            <ShoppingBag className="w-4 h-4" /> Keranjang ({totalQty})
          </div>
          <div className="h-[1px] bg-white/5 w-full" />
        </div>
        <div className="px-10 flex-1 overflow-y-auto custom-scrollbar space-y-6 py-2">
          {detectedItems.length === 0 ? (
            <div className="text-xs text-white/20 italic font-bold">Belum ada barang terdeteksi...</div>
          ) : (
            detectedItems.map((item, idx) => (
              <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={idx} className="flex justify-between items-center group">
                <div className="flex flex-col text-left">
                  <span className="text-sm font-black tracking-tight group-hover:text-[#0047FF] transition-colors">{item.name}</span>
                  <span className="text-[10px] text-slate-500">Rp{item.price.toLocaleString('id-ID')}</span>
                </div>
                <div className="text-[#0047FF] font-black text-lg bg-white/5 px-3 py-1 rounded-lg">x{item.qty}</div>
              </motion.div>
            ))
          )}
        </div>
        <div className="p-10 pt-5">
          <div className="h-[1px] bg-slate-200 dark:bg-white/5 w-full mb-8" />
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Total Belanja</span>
            <span className="text-4xl font-black text-white italic tracking-tighter leading-none">Rp{totalPrice.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* Bayar Button */}
      <button disabled={detectedItems.length === 0} onClick={() => setIsIdentityModalOpen(true)}
        className={`absolute right-8 bottom-8 z-[60] px-16 py-10 rounded-[50px] font-black text-3xl uppercase flex items-center gap-6 transition-all transform active:scale-95 ${detectedItems.length > 0 ? 'bg-[#0047FF] text-white shadow-[0_20px_60px_rgba(0,71,255,0.5)]' : 'bg-white/5 text-white/10 cursor-not-allowed'}`}
      >
        LANJUT <ChevronRight className="w-8 h-8" />
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