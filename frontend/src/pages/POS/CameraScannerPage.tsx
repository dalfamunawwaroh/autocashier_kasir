import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ShoppingBag, ShieldCheck, Loader2,
  Phone, ArrowRight, SkipForward, AlertCircle, X, Scan, Camera,
  Cpu, Zap, WifiOff, RefreshCw, Database, Minimize2, Plus, Minus, Trash2, User
} from 'lucide-react';
import { useAppStore, translations } from '../../store/useAppStore';

export interface CartItem {
  id: string | number;
  label: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

// --- COMPONENT: IDENTITY CHECK MODAL ---
interface IdentityCheckModalProps {
  onClose: () => void;
  cartItems: CartItem[];
}

function IdentityCheckModal({ onClose, cartItems }: IdentityCheckModalProps) {
  const navigate = useNavigate();
  const { language, setMemberIdentity } = useAppStore();
  const t = translations[language];
  const [phone, setPhone] = useState('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setIsLoading(true);
    setErrorStatus(null);
    
    try {
      const response = await fetch('/api/members/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();

      if (data.success && data.isMember) {
        setMemberIdentity(data.user, true);
        navigate('/cart', { state: { items: cartItems } });
      } else {
        setErrorStatus(t.WA_NOT_FOUND);
        setMemberIdentity({ name: 'Guest' }, false);
        setTimeout(() => navigate('/cart', { state: { items: cartItems } }), 2000);
      }
    } catch (err) {
      console.error('Check member error:', err);
      setErrorStatus('Gagal terhubung ke server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setMemberIdentity({ name: 'Guest' }, false);
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

        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#0047FF]">
          <User className="w-8 h-8 animate-pulse" />
        </div>
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
  const { language, user } = useAppStore();
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
  const [isCartExpanded, setIsCartExpanded] = useState(true);
  const [visionOnline, setVisionOnline] = useState<boolean | null>(null);
  const [visionProducts, setVisionProducts] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const [scanState, setScanState] = useState<{
    label: string | null;
    status: 'SCANNING' | 'DETECTED' | 'CONFIRMED' | 'IDLE';
    confidence: number;
    similarity: number | null;
    source: string | null;
    box: { x: number, y: number, w: number, h: number } | null;
  }>({ label: null, status: 'IDLE', confidence: 0, similarity: null, source: null, box: null });

  const totalQty = detectedItems.reduce((acc, i) => acc + i.qty, 0);
  const totalPrice = detectedItems.reduce((acc, i) => acc + i.price * i.qty, 0);

  // Helper functions to edit cart items manually
  const handleIncreaseQty = (index: number) => {
    setDetectedItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], qty: next[index].qty + 1 };
      return next;
    });
  };

  const handleDecreaseQty = (index: number) => {
    setDetectedItems(prev => {
      const next = [...prev];
      if (next[index].qty > 1) {
        next[index] = { ...next[index], qty: next[index].qty - 1 };
        return next;
      } else {
        return prev.filter((_, i) => i !== index);
      }
    });
  };

  const handleRemoveItem = (index: number) => {
    setDetectedItems(prev => prev.filter((_, i) => i !== index));
  };

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

  // 2a. Check vision server health (includes product count)
  const checkVisionHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/vision/health', { signal: AbortSignal.timeout(4000) });
      const data = await res.json();
      setVisionOnline(data.vision_server === 'online');
      if (data.products !== undefined) setVisionProducts(data.products);
    } catch {
      setVisionOnline(false);
    }
  }, []);

  useEffect(() => {
    checkVisionHealth();
    const interval = setInterval(checkVisionHealth, 15000);
    return () => clearInterval(interval);
  }, [checkVisionHealth]);

  // 2b. Sync produk dari Supabase ke vision server
  const handleSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncMsg('Syncing…');
    try {
      const res = await fetch('/api/vision/sync?wait=true', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const s = data.sync || {};
        setSyncMsg(`✅ ${s.total_products || 0} produk (${s.with_embeddings || 0} DINOv2)`);
        await checkVisionHealth();
      } else {
        setSyncMsg(`❌ ${data.message || 'Sync gagal'}`);
      }
    } catch (e: any) {
      setSyncMsg(`❌ ${e.message}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  }, [isSyncing, checkVisionHealth]);

  // 2b. Start auto-scanning when camera is ready
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
      // Capture frame dari video — downscale ke 480px untuk kecepatan transfer
      const CAPTURE_W = 480;
      const CAPTURE_H = 270;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width  = CAPTURE_W;
      canvas.height = CAPTURE_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0, CAPTURE_W, CAPTURE_H);
      const base64Image = canvas.toDataURL('image/jpeg', 0.7);

      // Send to backend /api/detect
      const response = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });

      const data = await response.json();
      console.log("[SCANNER DEBUG] detect response payload:", data);

      if (data.success && data.label) {
        console.log(`[SCAN] Detected: ${data.label} (${(data.confidence * 100).toFixed(1)}%) via ${data.source}`);
        console.log(`[SCAN] bbox raw:`, data.bbox, `| displayW=${videoRef.current?.clientWidth} displayH=${videoRef.current?.clientHeight}`);

        // Bbox dari vision server sudah ternormalisasi [0,1] relatif thd gambar input.
        // Cukup kalikan dengan ukuran display video yang sebenarnya terlihat (object-cover).
        const videoEl = videoRef.current;
        const displayW = videoEl.clientWidth;
        const displayH = videoEl.clientHeight;

        // Hitung area render sebenarnya untuk CSS object-cover
        // Capture: 480x270 (aspect 16:9), display bisa beda aspek rasio
        const captureAspect = CAPTURE_W / CAPTURE_H;
        const displayAspect = displayW / displayH;
        let renderedW: number, renderedH: number, offsetX: number, offsetY: number;
        if (displayAspect > captureAspect) {
          // Display lebih lebar → video fill width, height overflow (center)
          renderedW = displayW;
          renderedH = displayW / captureAspect;
          offsetX = 0;
          offsetY = (displayH - renderedH) / 2;
        } else {
          // Display lebih tinggi → video fill height, width overflow (center)
          renderedH = displayH;
          renderedW = displayH * captureAspect;
          offsetX = (displayW - renderedW) / 2;
          offsetY = 0;
        }

        const bbox = data.bbox as number[]; // [x1,y1,x2,y2] dalam [0,1]
        const boxForDisplay = bbox && bbox.length === 4 ? {
          x: bbox[0] * renderedW + offsetX,
          y: bbox[1] * renderedH + offsetY,
          w: (bbox[2] - bbox[0]) * renderedW,
          h: (bbox[3] - bbox[1]) * renderedH
        } : null;
        console.log(`[SCAN] boxForDisplay:`, boxForDisplay);

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
          similarity: data.similarity ?? null,
          source: data.source ?? null,
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
          new Audio('/Apple-Pay-Face-ID-Ding-Sound-Effect.mp3').play().catch(() => {});

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
              qty: 1,
              image: productData?.image_url || undefined
            }];
          });

          // After 2s, reset and resume scanning
          setTimeout(() => {
            setScanState({ label: null, status: 'SCANNING', confidence: 0, similarity: null, source: null, box: null });

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
        setScanState(prev => ({ ...prev, status: 'SCANNING', box: null, label: null, similarity: null, source: null }));
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
          <p className="font-black tracking-[0.4em] uppercase text-xs italic">Menyiapkan Kamera...</p>
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
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-[60%] h-[50%] border-[3px] border-dashed border-[#0047FF] rounded-[40px] relative shadow-[0_0_30px_rgba(0,71,255,0.15)]"
          >
            {/* Corner markers */}
            <div className="absolute -top-[3px] -left-[3px] w-12 h-12 border-t-[5px] border-l-[5px] border-[#0047FF] rounded-tl-2xl shadow-[0_0_15px_rgba(0,71,255,0.6)]" />
            <div className="absolute -top-[3px] -right-[3px] w-12 h-12 border-t-[5px] border-r-[5px] border-[#0047FF] rounded-tr-2xl shadow-[0_0_15px_rgba(0,71,255,0.6)]" />
            <div className="absolute -bottom-[3px] -left-[3px] w-12 h-12 border-b-[5px] border-l-[5px] border-[#0047FF] rounded-bl-2xl shadow-[0_0_15px_rgba(0,71,255,0.6)]" />
            <div className="absolute -bottom-[3px] -right-[3px] w-12 h-12 border-b-[5px] border-r-[5px] border-[#0047FF] rounded-br-2xl shadow-[0_0_15px_rgba(0,71,255,0.6)]" />

            {/* Scan line animation */}
            <motion.div
              animate={{ y: [0, 250, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-4 right-4 h-[3px] bg-gradient-to-r from-transparent via-[#0047FF] to-transparent shadow-[0_0_15px_rgba(0,71,255,0.8)] rounded-full"
            />
          </motion.div>

          {/* Instruction text */}
          <div className="absolute bottom-[32%] flex items-center gap-3 bg-black/75 backdrop-blur-md px-6 py-3 rounded-full text-white font-black text-sm uppercase tracking-widest border border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] z-20">
            <Camera className="w-5 h-5 text-[#0047FF]" />
            <span>Arahkan barang ke kamera</span>
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
            <Scan className="w-4 h-4 animate-spin" /> Melihat barang...
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
              {scanState.similarity != null && (
                <span className="opacity-50 ml-0.5 text-[9px]">Akurasi:{(scanState.similarity * 100).toFixed(0)}%</span>
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
          <div className="font-black text-2xl italic tracking-tighter uppercase leading-none select-none">
            GIAT <span className="text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]">SCANNER</span>
          </div>

          {/* Vision pipeline & status badges */}
          <div className="flex items-center gap-3">

            {/* Sync status message */}
            <AnimatePresence>
              {syncMsg && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  className="text-[10px] font-black text-white/80 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20 backdrop-blur-md shadow-lg"
                >
                  {syncMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Vision server status + product count */}
            <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider border transition-all duration-300 ${
              visionOnline === null ? 'border-white/20 text-white/50 bg-white/10' :
              visionOnline ? 'border-emerald-500/35 text-emerald-400 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)] backdrop-blur-md' :
              'border-rose-500/35 text-rose-400 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.15)] backdrop-blur-md'
            }`}>
              {visionOnline === null ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
               visionOnline ? <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> :
               <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
              <span>
                {visionOnline === null ? 'Mengecek…' :
                 visionOnline ? 'Sistem Pintar' :
                 'Terputus'}
              </span>
              {visionOnline && visionProducts > 0 && (
                <span className="flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-[10px] text-emerald-300 border border-emerald-500/20 font-black">
                  <Database className="w-2.5 h-2.5" />
                  <span>{visionProducts}</span>
                </span>
              )}
            </div>

            {/* Sync button */}
            {visionOnline && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                title="Sync produk dari database"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider border border-blue-500/35 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 hover:text-white hover:border-blue-400/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.25)] active:scale-95 transition-all disabled:opacity-40 backdrop-blur-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Memperbarui…' : 'Perbarui Data'}</span>
              </button>
            )}

            {/* Scan status */}
            <div className="flex items-center gap-3.5 bg-blue-500/10 px-6 py-2.5 rounded-full border border-blue-500/35 text-xs font-extrabold uppercase tracking-wider text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] backdrop-blur-md">
              <div className="relative flex h-2.5 w-2.5">
                {scanState.status !== 'IDLE' && (
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    scanState.status === 'CONFIRMED' ? 'bg-emerald-400' :
                    scanState.status === 'DETECTED' ? 'bg-amber-400' :
                    'bg-blue-400'
                  }`} />
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  scanState.status === 'CONFIRMED' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' :
                  scanState.status === 'DETECTED' ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' :
                  scanState.status === 'SCANNING' ? 'bg-blue-400 shadow-[0_0_8px_#60a5fa]' :
                  'bg-slate-500'
                }`} />
              </div>
              <span>
                {scanState.status === 'SCANNING' ? 'MENCARI BARANG' :
                 scanState.status === 'DETECTED' ? 'MENCOCOKKAN' :
                 scanState.status === 'CONFIRMED' ? 'DITEMUKAN' :
                 'SIAP'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Panel */}
      {isCartExpanded ? (
        <div className="absolute left-8 bottom-8 z-20 w-96 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[45px] flex flex-col max-h-[480px] text-white shadow-2xl overflow-hidden pointer-events-auto">
          <div className="p-10 pb-5">
            <div className="flex items-center justify-between opacity-70 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 text-[#0047FF]" /> Daftar Belanja ({totalQty})
              </div>
              <button 
                onClick={() => setIsCartExpanded(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer pointer-events-auto"
                title="Sembunyikan"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
            <div className="h-[1px] bg-white/5 w-full" />
          </div>
          
          <div className="px-10 flex-1 overflow-y-auto custom-scrollbar space-y-6 py-2">
            {detectedItems.length === 0 ? (
              <div className="text-xs text-white/20 italic font-bold">Silakan arahkan barang ke kamera...</div>
            ) : (
              detectedItems.map((item, idx) => (
                <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={idx} className="flex justify-between items-center group pointer-events-auto">
                  <div className="flex flex-col text-left max-w-[48%]">
                    <span className="text-sm font-black tracking-tight group-hover:text-[#0047FF] transition-colors truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-500">Rp {item.price.toLocaleString('id-ID')}</span>
                  </div>
                  
                  {/* Quantity Editor Controls */}
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2 py-1">
                    <button 
                      onClick={() => handleDecreaseQty(idx)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                      title="Kurangi"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    
                    <span className="text-[#0047FF] font-black text-sm min-w-[18px] text-center">{item.qty}</span>
                    
                    <button 
                      onClick={() => handleIncreaseQty(idx)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                      title="Tambah"
                    >
                      <Plus className="w-3 h-3" />
                    </button>

                    <div className="h-4 w-px bg-white/10 mx-1" />

                    <button 
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
          
          <div className="p-10 pt-5">
            <div className="h-[1px] bg-slate-200 dark:bg-white/5 w-full mb-8" />
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Total Harga</span>
              <span className="text-4xl font-black text-white italic tracking-tighter leading-none">Rp {totalPrice.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed Cart Button */
        <button
          onClick={() => setIsCartExpanded(true)}
          className="absolute left-8 bottom-8 z-20 bg-black/80 hover:bg-black/90 backdrop-blur-3xl border border-white/10 rounded-full px-8 py-5 text-white shadow-2xl flex items-center gap-3 transition-all transform active:scale-95 cursor-pointer pointer-events-auto"
        >
          <ShoppingBag className="w-5 h-5 text-[#0047FF] animate-pulse" />
          <span className="text-sm font-black uppercase tracking-wider">Daftar Belanja ({totalQty})</span>
          <span className="text-xs bg-[#0047FF] px-2.5 py-1 rounded-full font-black">Rp {totalPrice.toLocaleString('id-ID')}</span>
        </button>
      )}

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