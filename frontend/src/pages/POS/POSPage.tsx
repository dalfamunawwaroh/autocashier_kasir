/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { 
  Scan, 
  ShoppingCart, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Minus, 
  Trash2, 
  QrCode, 
  Banknote, 
  CreditCard, 
  Printer,
  X,
  ChevronRight,
  Search,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  BarChart,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from 'next-themes';
import { QRCodeSVG } from 'qrcode.react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';
import Logo from '../../components/UI/Logo';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types for POS
interface Product {
  id: any;
  sku: string;
  name: string;
  price: number;
  stock: number;
  ai_label: string;
  category?: string;
  image?: string;
}

interface CartItem extends Product {
  quantity: number;
  subtotal: number;
  isUpdating?: boolean;
}

type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER';

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, sku: 'IDM-001', name: 'Indomie Goreng Original', price: 3500, stock: 10, ai_label: 'indomie_goreng' },
  { id: 2, sku: 'ROT-002', name: 'Roti Sari Roti Tawar', price: 15000, stock: 3, ai_label: 'roti_tawar' },
  { id: 3, sku: 'LEM-003', name: 'Le Minerale 600ml', price: 4000, stock: 20, ai_label: 'le_minerale' },
  { id: 4, sku: 'COK-004', name: 'Coca Cola 250ml', price: 6000, stock: 15, ai_label: 'coca_cola' },
  { id: 5, sku: 'CHI-005', name: 'Chitato Sapi Panggang', price: 12000, stock: 2, ai_label: 'chitato' },
];

interface POSPageProps {
  user: { name: string; role: string; username?: string } | null;
}

export default function POSPage({ user }: POSPageProps) {
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const handleLogout = () => {
    localStorage.removeItem('autocashier_user');
    sessionStorage.clear();
    navigate('/');
    window.location.reload();
  };
  const [cart, setCart] = useState<CartItem[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const [isSyncing, setIsSyncing] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [storeName, setStoreName] = useState('Koperasi GIAT Cabang Bandung - AI POS');
  const [scanLogs, setScanLogs] = useState<{ time: string; msg: string; color: string }[]>([
    { time: new Date().toLocaleTimeString('en-GB', { hour12: false }), msg: 'System initialized...', color: 'text-slate-400' }
  ]);
  const [detection, setDetection] = useState<{ label: string; name: string; confidence: number; x: number; y: number; w: number; h: number; status: 'scanning' | 'matched' | 'unknown' } | null>(null);
  const [showGreenFlash, setShowGreenFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dwellTimerRef = useRef<{ label: string, startTime: number } | null>(null);
  const lastScanTimeRef = useRef<{ [label: string]: number }>({});
  const beepRef = useRef<HTMLAudioElement | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);

  // Load Model & Beep
  useEffect(() => {
    beepRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    syncAllProducts();

    cocoSsd.load().then(loadedModel => {
      modelRef.current = loadedModel;
      setModelLoaded(true);
    });
  }, []);

  const syncAllProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.status === 'success') {
        setAllProducts(data.data || []);
      }
    } catch (err) {
      console.error("Sync error:", err);
    }
  };

  // Check Cloud Sync Status
  useEffect(() => {
    const checkSync = async () => {
      try {
        const res = await fetch('/api/store-settings');
        const data = await res.json();
        if (data.status === 'success') {
          setStoreName(data.data.store_name);
          setIsSyncing(true);
        }
      } catch (err) {
        if (isSyncing) {
          // Only alert once when it goes offline
          console.error("Cloud Sync: Offline");
        }
        setIsSyncing(false);
      }
    };
    checkSync();
    const interval = setInterval(checkSync, 30000);
    return () => clearInterval(interval);
  }, [isSyncing]);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Camera stream
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }
    startCamera();
  }, []);

  const addToCart = async (label: string) => {
    try {
      const response = await fetch(`/api/products/search?label=${label}`);
      const data = await response.json();

      if (data.status === 'success') {
        const product = data.data;
        
        // Visual Feedback: Green Flash
        setShowGreenFlash(true);
        setTimeout(() => setShowGreenFlash(false), 500);

        // Play BEEP sound (scanner sound)
        if (beepRef.current) {
          beepRef.current.currentTime = 0;
          beepRef.current.play().catch(() => {});
        }

        setScanLogs(prev => [
          { 
            time: new Date().toLocaleTimeString('en-GB', { hour12: false }), 
            msg: `Detected: ${product.name} | PIC: ${user?.name || 'Kasir'}`, 
            color: 'text-brand-primary' 
          },
          ...prev.slice(0, 4)
        ]);

        setCart(prev => {
          const existing = prev.find(item => item.id === product.id);
          if (existing) {
            return prev.map(item => 
              item.id === product.id 
                ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price } 
                : item
            );
          }
          return [...prev, { ...product, quantity: 1, subtotal: product.price }];
        });
        
        // Refresh local products to get latest stock
        syncAllProducts();
      } else {
        toast.error(`Unknown Item: ${label}`, {
          description: "Please add this item to inventory.",
          icon: <AlertCircle className="text-yellow-500" />
        });
      }
    } catch (err) {
      console.error("Scan error:", err);
    }
  };

  // Real AI Detection Engine & Canvas Overlay
  useEffect(() => {
    if (!modelLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let scanlineY = 0;

    const detectAndDraw = async () => {
      if (videoRef.current && videoRef.current.readyState === 4 && modelRef.current) {
        // Match canvas to video size
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 360;
        
        const predictions = await modelRef.current.detect(videoRef.current);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Scanline effect over entire safe area
        scanlineY = (scanlineY + 2) % canvas.height;
        ctx.fillStyle = 'rgba(37, 99, 235, 0.1)';
        ctx.fillRect(0, scanlineY, canvas.width, 2);

        let activeTargetLabel: string | null = null;
        let highestConfDetection: any = null;

        for (const pred of predictions) {
          const [x, y, w, h] = pred.bbox;
          const originalLabel = pred.class;
          const confidence = pred.score;

          // 1. Minimum Threshold Check (65% for showing)
          if (confidence < 0.65) continue;

          // 2. Custom Heuristic Mapping
          let heuristicLabel = originalLabel;
          if (['book', 'sandwich', 'hot dog', 'pizza'].includes(originalLabel)) heuristicLabel = 'indomie_goreng';
          if (['bottle', 'cup', 'vase'].includes(originalLabel)) heuristicLabel = 'le_minerale';
          if (['cell phone', 'remote', 'mouse'].includes(originalLabel)) heuristicLabel = 'beng_beng';

          const mappedProduct = allProducts.find(p => p.ai_label === heuristicLabel || p.ai_label === originalLabel);
          const isKnown = !!mappedProduct;
          const displayName = isKnown ? mappedProduct.name : originalLabel;

          // Tracking for top bar status
          if (!highestConfDetection || confidence > highestConfDetection.confidence) {
            highestConfDetection = { label: originalLabel, name: displayName, confidence, status: isKnown ? 'matched' : 'unknown' };
          }

          // 3. Stable Match Processing
          if (isKnown) {
            const now = Date.now();
            if (!dwellTimerRef.current || dwellTimerRef.current.label !== heuristicLabel) {
              dwellTimerRef.current = { label: heuristicLabel, startTime: now };
            }
            activeTargetLabel = heuristicLabel;

            const elapsed = now - dwellTimerRef.current.startTime;
            const lastScan = lastScanTimeRef.current[heuristicLabel] || 0;
            
            if (elapsed >= 1200 && now - lastScan > 3000) {
              lastScanTimeRef.current[heuristicLabel] = now;
              addToCart(mappedProduct.ai_label);
              dwellTimerRef.current = null;
            }
          }

          // 4. Drawing detection box
          const isMatched = isKnown && dwellTimerRef.current === null && showGreenFlash;
          const boxColor = isKnown ? (isMatched ? '#10b981' : '#3b82f6') : '#ef4444'; // Red for unknown
          
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = 4;
          ctx.lineJoin = 'round';
          
          // Draw rounded rect manually
          if ((ctx as any).roundRect) {
            ctx.beginPath();
            (ctx as any).roundRect(x, y, w, h, 20);
            ctx.stroke();
          } else {
            ctx.strokeRect(x, y, w, h);
          }

          // Label above box
          const statusLabel = isKnown ? (isMatched ? "MATCHED" : displayName.toUpperCase()) : "TIDAK DIKENAL";
          ctx.font = 'bold 12px sans-serif';
          const textMetrics = ctx.measureText(statusLabel);
          const padding = 12;
          
          ctx.fillStyle = boxColor;
          if ((ctx as any).roundRect) {
            ctx.beginPath();
            (ctx as any).roundRect(x, y - 30, textMetrics.width + padding * 2, 24, 12);
            ctx.fill();
          } else {
            ctx.fillRect(x, y - 30, textMetrics.width + padding * 2, 24);
          }
          
          ctx.fillStyle = 'white';
          ctx.fillText(statusLabel, x + padding, y - 14);

          // Progress Bar for Scanning
          if (isKnown && dwellTimerRef.current && dwellTimerRef.current.label === heuristicLabel) {
             const progress = Math.min(1, (Date.now() - dwellTimerRef.current.startTime) / 1200);
             ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
             ctx.fillRect(x, y + h + 10, w, 4);
             ctx.fillStyle = '#3b82f6';
             ctx.fillRect(x, y + h + 10, w * progress, 4);
          }
        }

        setDetection(highestConfDetection);

        // Reset timer if nothing detected
        if (!activeTargetLabel) {
          dwellTimerRef.current = null;
        }
      }

      animationFrameId = requestAnimationFrame(detectAndDraw);
    };

    detectAndDraw();
    return () => cancelAnimationFrame(animationFrameId);
  }, [modelLoaded, showGreenFlash, allProducts]);

  const updateQuantity = async (id: string | number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty === 0) return null as any;
        return { ...item, quantity: newQty, subtotal: newQty * item.price };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id: string | number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Format: AC-BDG-YYYYMMDD-SEQ (using timestamp for simplicity in SEQ)
    const branchCode = localStorage.getItem('autocashier_branch_code') || 'BDG';
    
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const newInvoice = `AC-${branchCode}-${dateStr}-${seq}`;
    
    setInvoiceNumber(newInvoice);
    setIsCheckoutModalOpen(true);
  };

  const handleFinalizePayment = async () => {
    try {
      const branchId = localStorage.getItem('autocashier_branch_id') || null;
      const payload = {
        header: {
          invoice_number: invoiceNumber,
          total_price: totalAmount,
          payment_method: paymentMethod,
          cash_received: Number(cashReceived) || 0,
          cash_return: Math.max(0, Number(cashReceived) - totalAmount),
          cashier_name: user?.name || 'Unknown',
          branch_id: branchId
        },
        items: cart.map(item => ({
          product_id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal
        }))
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success("Transaction Successful!", {
          description: `Invoice ${invoiceNumber} saved.`,
        });

        // Check for Low Stock (Restock Alert)
        cart.forEach(item => {
          if (item.stock - item.quantity < 15) {
            toast.warning(`RESTOCK ALERT: ${item.name} stock is low (${item.stock - item.quantity})`, {
              description: 'Please restock this item soon.',
              duration: 5000,
            });
          }
        });

        setLastTransaction(data.transaction);
        setCart([]);
        setPaymentMethod(null);
        setCashReceived('');
        setIsCheckoutModalOpen(false);
        setIsReceiptOpen(true);
      } else {
        toast.error("Gagal menyimpan transaksi ke database.");
      }
    } catch (err) {
      toast.error("Cloud Sync Error: Gagal menghubungkan ke server.");
    }
  };

  const resetTransaction = () => {
    setCart([]);
    setPaymentMethod(null);
    setCashReceived('');
    setIsReceiptOpen(false);
  };

  return (
    <div className={cn(
      "h-screen flex flex-col font-sans overflow-hidden transition-colors duration-500 bg-black",
      isDark ? "dark" : ""
    )}>
      {/* Fullscreen Video Background Area */}
      <main className="flex-1 relative overflow-hidden bg-black">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        
        <canvas 
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
        />

        {/* Top Header Overlay */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/90 to-transparent z-20 flex items-center justify-between px-12">
          <div className="flex flex-col">
            <h1 className="text-white font-black italic tracking-tighter text-3xl">JAGOAI VISION</h1>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Active Neural Engine v2.5 • Edge Computing Enabled</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-6 py-2.5 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", detection?.status === 'unknown' ? "bg-red-500" : "bg-emerald-500")} />
              <span className="text-white text-[10px] font-black uppercase tracking-widest">
                {detection?.status === 'unknown' ? "UNRECOGNIZED" : "STABLE SCAN"}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-all"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => navigate('/')}
                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Floating Cart (Bottom Left) */}
        <div className="absolute bottom-12 left-12 z-30 w-96">
          <motion.div 
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-black/70 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/40">
                  <ShoppingCart className="text-white w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white text-[11px] font-black uppercase tracking-widest">Keranjang ({cart.length})</h3>
                  <p className="text-white/40 text-[9px] font-bold">Auto-syncing with database</p>
                </div>
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto mb-8 pr-3 custom-scrollbar-dark">
              {cart.length === 0 ? (
                <div className="py-8 text-center space-y-2 opacity-20">
                  <p className="text-white text-xs font-black uppercase italic tracking-widest">Belum ada barang terdeteksi...</p>
                  <p className="text-white/60 text-[9px]">Arahkan kamera ke barcode atau produk</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between group">
                      <div className="flex flex-col">
                        <span className="text-white text-sm font-bold truncate max-w-[140px]">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white/40 text-[10px] font-mono">{item.quantity}x</span>
                          <span className="text-white/20 text-[10px]">•</span>
                          <span className="text-white/40 text-[10px] font-mono">{formatIDR(item.price)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-indigo-400 font-mono text-sm font-black">{formatIDR(item.subtotal)}</span>
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500 flex items-center justify-center transition-all group-hover:opacity-100 opacity-0"
                        >
                          <X className="w-3 h-3 text-red-500 group-hover:text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-white/10 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Total Belanja</span>
                <span className="text-white text-3xl font-black tracking-tighter">{formatIDR(totalAmount)}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Button (Bottom Right) */}
        <div className="absolute bottom-12 right-12 z-30">
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="group relative flex items-center gap-6 bg-white/10 hover:bg-white/20 backdrop-blur-2xl border border-white/20 rounded-full pl-12 pr-6 py-6 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl"
          >
            <span className="text-white font-black italic tracking-tighter text-3xl group-hover:pr-6 transition-all uppercase">Lanjut</span>
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform shadow-xl">
              <ChevronRight className="text-black w-8 h-8" />
            </div>
          </button>
        </div>

        {/* Model Initialization Overlay */}
        {!modelLoaded && (
          <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center">
             <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-white/5 rounded-[32px]" />
                <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-[32px] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <Scan className="w-8 h-8 text-indigo-600 animate-pulse" />
                </div>
             </div>
             <h3 className="text-white font-black text-xl tracking-tighter mb-2">INITIALIZING VISION CORE</h3>
             <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Loading Neural Weights • v2.5</p>
          </div>
        )}

        {/* Green Flash Success Feedback */}
        <AnimatePresence>
          {showGreenFlash && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 pointer-events-none bg-emerald-500/5 border-[32px] border-emerald-500/20 backdrop-blur-[1px]"
            />
          )}
        </AnimatePresence>
      </main>

      {/* Checkout & Receipt Modals */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900 w-full max-w-xl rounded-[48px] p-12 border border-white/10"
            >
              <div className="text-center mb-12">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Checkout Processing</p>
                <h2 className="text-white text-5xl font-black tracking-tighter">{formatIDR(totalAmount)}</h2>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-12">
                {['CASH', 'QRIS', 'TRANSFER'].map(m => (
                  <button 
                    key={m}
                    onClick={() => setPaymentMethod(m as any)}
                    className={cn(
                      "py-6 rounded-3xl border-2 font-black text-[10px] tracking-widest transition-all",
                      paymentMethod === m ? "bg-white border-white text-black" : "border-white/10 text-white/40 hover:border-white/40"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <button 
                onClick={handleFinalizePayment}
                disabled={!paymentMethod}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-3xl font-black italic tracking-tighter text-xl transition-all active:scale-95 disabled:opacity-20 shadow-2xl shadow-indigo-600/20"
              >
                FINALIZE TRANSACTION
              </button>
              
              <button 
                onClick={() => setIsCheckoutModalOpen(false)}
                className="w-full mt-4 py-4 text-white/30 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancel Process
              </button>
            </motion.div>
          </div>
        )}

        {isReceiptOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-emerald-950/40 backdrop-blur-2xl">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white p-12 rounded-[48px] shadow-2xl max-w-sm w-full text-center"
            >
               <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/40">
                  <CheckCircle2 className="text-white w-10 h-10" />
               </div>
               <h2 className="text-3xl font-black tracking-tighter text-black mb-2">SUCCESS!</h2>
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-10">Transaction #{invoiceNumber} Saved</p>
               
               <div className="space-y-4 mb-12 text-left">
                  <div className="flex justify-between text-xs font-bold border-b border-slate-100 pb-4">
                     <span className="text-slate-400">Total Items</span>
                     <span>{lastTransaction?.items?.length || 0} Products</span>
                  </div>
                  <div className="flex justify-between text-lg font-black">
                     <span>Total Paid</span>
                     <span className="text-indigo-600">{formatIDR(lastTransaction?.total_price || 0)}</span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => window.print()} className="py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors">Print Struk</button>
                  <button onClick={resetTransaction} className="py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-80 transition-all">New Order</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar-dark::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        @media print {
          body * { visibility: hidden; }
          .receipt-content, .receipt-content * { visibility: visible; }
        }
      `}</style>
    </div>
  );
}
