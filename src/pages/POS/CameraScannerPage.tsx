import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ShoppingBag, Scan, ShieldCheck, Loader2 } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import { useAppStore, translations } from '../../store/useAppStore';

const LOCAL_PRICE_MAP: Record<string, any> = {
  'pop_mie': { id: 1, label: 'pop_mie', name: 'Pop Mie Rasa Ayam', price: 6500 },
  'le_minerale': { id: 3, label: 'le_minerale', name: 'Le Minerale 600ml', price: 4000 },
  'aqua_600ml': { id: 'prod_002', label: 'aqua_600ml', name: 'Aqua 600ml', price: 3500 }
};

export default function CameraScannerPage() {
  const navigate = useNavigate();
  const { language } = useAppStore();
  const t = translations[language];
  const videoRef = useRef<HTMLVideoElement>(null);

  // State untuk AI & Deteksi
  const [model, setModel] = useState<cocossd.ObjectDetection | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [detectedItems, setDetectedItems] = useState<any[]>([]);

  const [cvState, setCvState] = useState<{
    label: string | null;
    status: 'hunting' | 'locked' | 'confirmed';
    progress: number;
    box: { x: number, y: number, w: number, h: number } | null;
  }>({ label: null, status: 'hunting', progress: 0, box: null });

  // 1. Inisialisasi Kamera & Load Model AI
  useEffect(() => {
    async function init() {
      try {
        // Setup Kamera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: 1280, height: 720 }
        });
        if (videoRef.current) videoRef.current.srcObject = stream;

        // Load TensorFlow Model
        await tf.ready();
        const loadedModel = await cocossd.load();
        setModel(loadedModel);
        setIsModelLoading(false);
      } catch (err) {
        console.error("Gagal inisialisasi:", err);
      }
    }
    init();
  }, []);

  // 2. Real-time Detection Loop
  useEffect(() => {
    let requestUpdate: number;

    const runDetection = async () => {
      if (model && videoRef.current && videoRef.current.readyState === 4 && cvState.status === 'hunting') {
        const predictions = await model.detect(videoRef.current);

        if (predictions.length > 0) {
          const primary = predictions[0];

          // Mapping Label Sederhana untuk Testing
          // 'cup' (gelas/cup mie) -> pop_mie
          // 'bottle' (botol minum) -> le_minerale
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

    if (!isModelLoading) {
      runDetection();
    }

    return () => cancelAnimationFrame(requestUpdate);
  }, [model, isModelLoading, cvState.status]);

  // 3. Logic: Locked -> Progress -> Confirmed
  const handleDetectionLogic = (label: string, bbox: number[]) => {
    // Berhenti jika sedang memproses konfirmasi
    if (cvState.status !== 'hunting') return;

    setCvState({
      label: label,
      status: 'locked',
      progress: 0,
      box: { x: bbox[0], y: bbox[1], w: bbox[2], h: bbox[3] }
    });

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setCvState(prev => ({ ...prev, progress: currentProgress }));

      if (currentProgress >= 100) {
        clearInterval(interval);
        confirmDetection(label);
      }
    }, 100); // Progress bar penuh dalam 1 detik
  };

  const confirmDetection = (label: string) => {
    const item = LOCAL_PRICE_MAP[label];
    if (!item) return;

    // Beep Sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/707/707-preview.mp3');
    audio.play().catch(() => { });

    setCvState(prev => ({ ...prev, status: 'confirmed' }));

    setDetectedItems(prev => {
      const exists = prev.find(i => i.label === label);
      if (exists) {
        return prev.map(i => i.label === label ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });

    // Reset ke mode hunting setelah jeda (cooldown)
    setTimeout(() => {
      setCvState({ label: null, status: 'hunting', progress: 0, box: null });
    }, 2000);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans">
      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isModelLoading ? 'opacity-20' : 'opacity-70'}`}
      />

      {/* Loading Overlay */}
      {isModelLoading && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 text-white">
          <Loader2 className="w-12 h-12 animate-spin text-[#0047FF] mb-4" />
          <p className="font-black tracking-widest uppercase animate-pulse">Menyiapkan Mesin Vision...</p>
        </div>
      )}

      {/* 1. VISUAL ROI GUIDE (Statis di tengah) */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div className="w-[350px] h-[350px] border-2 border-dashed border-white/20 rounded-[40px] flex items-center justify-center relative">
          <div className="text-white/20 uppercase text-[10px] font-black tracking-[0.3em] absolute -bottom-10">
            Arahkan Barang ke Area Tengah
          </div>
          {/* Corner Brackets */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white/30 rounded-tl-3xl" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white/30 rounded-tr-3xl" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white/30 rounded-bl-3xl" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white/30 rounded-br-3xl" />
        </div>
      </div>

      {/* 2. DYNAMIC BOUNDING BOX (Hasil Deteksi AI) */}
      <AnimatePresence>
        {cvState.box && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1,
              borderColor: cvState.status === 'confirmed' ? '#22c55e' : '#0047FF',
              boxShadow: cvState.status === 'confirmed' ? '0 0 40px rgba(34,197,94,0.4)' : '0 0 40px rgba(0,71,255,0.4)'
            }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute z-50 border-[4px] rounded-[30px] pointer-events-none"
            style={{
              left: cvState.box.x,
              top: cvState.box.y,
              width: cvState.box.w,
              height: cvState.box.h
            }}
          >
            {/* Status Label */}
            <div className={`absolute -top-12 left-0 px-4 py-2 rounded-xl text-white text-sm font-black flex items-center gap-2 shadow-lg transition-colors ${cvState.status === 'confirmed' ? 'bg-green-500' : 'bg-[#0047FF]'}`}>
              {cvState.status === 'confirmed' ? <ShieldCheck className="w-4 h-4" /> : <Scan className="w-4 h-4 animate-spin-slow" />}
              {cvState.label?.replace('_', ' ').toUpperCase()}
              <span className="opacity-60">| {cvState.status === 'confirmed' ? 'MATCH' : 'SCANNING...'}</span>
            </div>

            {/* Progress Fill (Dwell Time Visual) */}
            {cvState.status === 'locked' && (
              <div className="absolute inset-0 rounded-[26px] overflow-hidden">
                <motion.div
                  className="absolute bottom-0 left-0 right-0 bg-blue-500/30"
                  animate={{ height: `${cvState.progress}%` }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. UI OVERLAYS */}
      <div className="absolute top-0 inset-x-0 p-8 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-[32px] px-8 py-5">
          <div className="text-white font-black text-2xl tracking-tighter italic">JagoAI <span className="text-[#0047FF]">VISION</span></div>
          <div className="flex items-center gap-4 bg-white/5 px-5 py-2 rounded-full border border-white/5">
            <div className={`w-3 h-3 rounded-full ${cvState.status !== 'hunting' ? 'bg-red-500 animate-pulse' : 'bg-green-500 shadow-[0_0_10px_#22c55e]'}`} />
            <span className="text-white text-[10px] font-black uppercase tracking-widest">{cvState.status} mode</span>
          </div>
        </div>
      </div>

      {/* Floating Cart Widget */}
      <div className="absolute left-8 bottom-8 z-20 w-80 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6 text-white opacity-50">
          <ShoppingBag className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-widest">Live Basket ({detectedItems.length})</span>
        </div>
        <div className="space-y-4 max-h-48 overflow-y-auto custom-scrollbar pr-2">
          {detectedItems.length === 0 ? (
            <p className="text-white/20 text-sm italic">Menunggu barang terdeteksi...</p>
          ) : (
            detectedItems.map((item, idx) => (
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={idx} className="flex justify-between items-center">
                <span className="text-white font-bold text-sm">{item.name}</span>
                <span className="text-[#0047FF] font-black bg-white/5 px-3 py-1 rounded-lg text-xs">x{item.qty}</span>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Checkout Button */}
      <button
        disabled={detectedItems.length === 0}
        onClick={() => navigate('/identity-check', { state: { items: detectedItems } })}
        className={`absolute right-8 bottom-8 z-[70] px-12 py-8 rounded-[40px] font-black text-2xl uppercase tracking-tighter flex items-center gap-5 transition-all active:scale-95 group ${detectedItems.length > 0
          ? 'bg-[#0047FF] text-white shadow-[0_20px_50px_rgba(0,71,255,0.4)]'
          : 'bg-white/10 text-white/20 cursor-not-allowed'
          }`}
      >
        SELESAI <ChevronRight className="group-hover:translate-x-2 transition-transform" />
      </button>

      <style>{`
        .animate-spin-slow { animation: spin 3s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}