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

// Types
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
      if (data.success) {
        setAllProducts(data.products);
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
        if (data.success) {
          setStoreName(data.settings.store_name);
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

      if (data.success) {
        const product = data.product;
        
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
            color: 'text-blue-400' 
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
        ctx.fillStyle = 'rgba(0, 242, 255, 0.1)';
        ctx.fillRect(0, scanlineY, canvas.width, 2);

        let activeTargetLabel: string | null = null;

        for (const pred of predictions) {
          const [x, y, w, h] = pred.bbox;
          const originalLabel = pred.class;
          const confidence = pred.score;

          // 1. Minimum Threshold Check (75%)
          if (confidence < 0.75) {
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
            ctx.font = '12px font-mono';
            ctx.fillText(`Searching Product... (${Math.round(confidence * 100)}%)`, x, y - 5);
            continue;
          }

          // 2. Custom Heuristic Mapping
          let heuristicLabel = originalLabel;
          if (['book', 'sandwich', 'hot dog', 'pizza'].includes(originalLabel)) heuristicLabel = 'indomie_goreng';
          if (['bottle', 'cup', 'vase'].includes(originalLabel)) heuristicLabel = 'le_minerale';
          if (['cell phone', 'remote', 'mouse'].includes(originalLabel)) heuristicLabel = 'beng_beng';

          const mappedProduct = allProducts.find(p => p.ai_label === heuristicLabel || p.ai_label === originalLabel);
          const isKnown = !!mappedProduct;
          const displayName = isKnown ? mappedProduct.name : originalLabel;

          // 3. Fallback: Unknown Product (Yellow Box)
          if (!isKnown) {
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);
            
            ctx.fillStyle = '#eab308';
            ctx.font = 'bold 12px font-mono';
            ctx.fillText("Produk Tidak Dikenali - Gunakan Scan Barcode", x, y - 5);
            continue;
          }

          // 4. Stable Match Processing
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

          // Drawing matched box
          const themeColor = showGreenFlash && (dwellTimerRef.current === null) ? '#10b981' : '#00f2ff';
          ctx.strokeStyle = themeColor;
          ctx.lineWidth = 3;
          ctx.shadowBlur = 10;
          ctx.shadowColor = themeColor;
          ctx.strokeRect(x, y, w, h);

          // Corner Brackets
          const bracketLen = 15;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x, y + bracketLen); ctx.lineTo(x, y); ctx.lineTo(x + bracketLen, y);
          ctx.moveTo(x + w - bracketLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + bracketLen);
          ctx.moveTo(x, y + h - bracketLen); ctx.lineTo(x, y + h); ctx.lineTo(x + bracketLen, y + h);
          ctx.moveTo(x + w - bracketLen, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - bracketLen);
          ctx.stroke();

          // Label
          ctx.shadowBlur = 0;
          ctx.fillStyle = themeColor;
          const labelText = `${displayName} | ${Math.round(confidence * 100)}%`;
          ctx.font = 'bold 14px font-mono';
          const textWidth = ctx.measureText(labelText).width;
          
          ctx.beginPath();
          ctx.roundRect(x, Math.max(0, y - 25), textWidth + 10, 20, 4);
          ctx.fill();
          
          ctx.fillStyle = 'black';
          ctx.fillText(labelText, x + 5, Math.max(15, y - 10));

          // Progress Bar for Scanning
          if (dwellTimerRef.current && dwellTimerRef.current.label === heuristicLabel) {
             const progress = Math.min(1, (now - dwellTimerRef.current.startTime) / 1200);
             ctx.fillStyle = 'rgba(0, 242, 255, 0.3)';
             ctx.fillRect(x, y + h + 5, w, 6);
             ctx.fillStyle = themeColor;
             ctx.fillRect(x, y + h + 5, w * progress, 6);
          }
        }

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
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const newInvoice = `AC-BDG-${dateStr}-${seq}`;
    
    setInvoiceNumber(newInvoice);
    setIsCheckoutModalOpen(true);
  };

  const handleFinalizePayment = async () => {
    try {
      const payload = {
        header: {
          invoice_number: invoiceNumber,
          total_price: totalAmount,
          payment_method: paymentMethod,
          cash_received: Number(cashReceived) || 0,
          cash_return: Math.max(0, Number(cashReceived) - totalAmount),
          cashier_name: user?.name || 'Unknown',
          branch: 'Cabang Bandung'
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
      if (data.success) {
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
      "h-screen flex flex-col font-sans overflow-hidden transition-colors duration-300",
      "bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100",
      isDark ? "dark" : ""
    )}>
      {/* Header (Internal POS Header) */}
      <div className={cn(
        "h-14 border-b flex items-center justify-between px-6 shrink-0 z-10 transition-colors duration-300",
        "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700"
      )}>
        <div className="flex items-center gap-6">
          <Logo />
          <div className={cn(
            "flex items-center gap-4 px-3 py-1 rounded-full border transition-colors duration-300",
            "bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700"
          )}>
            <Clock className={cn("w-3 h-3", isDark ? "text-slate-500" : "text-slate-400")} />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                {currentTime.toLocaleTimeString('en-GB', { hour12: false })}
              </span>
              <span className="text-[9px] text-slate-500 font-medium uppercase">
                {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={cn(
              "p-2 rounded-xl border transition-all duration-300",
              isDark 
                ? "bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700" 
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            )}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="relative">
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className={cn("flex items-center gap-3 active:scale-95 transition-all text-left p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800", isDark ? "hover:bg-slate-800" : "hover:bg-slate-100")}
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 dark:text-white">PIC: {user?.name || 'Dalfa'}</p>
                <div className="flex items-center justify-end gap-2">
                  <span className="bg-emerald-100/10 text-emerald-500 text-[8px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">Verified Kasir</span>
                </div>
              </div>
              <div className={cn(
                "w-9 h-9 rounded-full border-2 shadow-sm flex items-center justify-center overflow-hidden transition-colors duration-300",
                isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
              )}>
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <ChevronDown className={cn("w-4 h-4 transition-transform hidden sm:block", isProfileMenuOpen ? "rotate-180" : "", isDark ? "text-slate-500" : "text-slate-400")} />
            </button>

            <AnimatePresence>
              {isProfileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={cn(
                      "absolute right-0 top-full mt-3 w-64 rounded-2xl shadow-xl border z-50 overflow-hidden",
                      isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                    )}
                  >
                    <div className={cn("p-4 border-b", isDark ? "border-slate-800" : "border-slate-100")}>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">PIC: {user?.name || 'Dalfa'}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">@{user?.username || 'afa_kasir'}</p>
                    </div>

                    <div className="p-2 space-y-1">
                      <button onClick={() => navigate('/profile')} className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition-colors text-left", isDark ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}>
                        <Settings className="w-4 h-4 text-slate-400" /> Profile Settings
                      </button>
                      <button onClick={() => navigate('/analytics')} className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition-colors text-left", isDark ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}>
                        <BarChart className="w-4 h-4 text-blue-500" /> Detail Transaksi
                      </button>
                    </div>

                    <div className={cn("p-2 border-t", isDark ? "border-slate-800" : "border-slate-100")}>
                      <button onClick={handleLogout} className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold text-red-500 transition-colors text-left", isDark ? "hover:bg-red-500/10" : "hover:bg-red-50")}>
                        <LogOut className="w-4 h-4" /> Logout System
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Shopping Cart (70%) */}
        <div className={cn(
          "w-[70%] flex flex-col border-r transition-colors duration-300",
          isDark ? "bg-[#1e293b] border-slate-700" : "bg-white border-slate-200"
        )}>
          <div className={cn(
            "p-4 border-b flex items-center justify-between transition-colors duration-300",
            isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50/50 border-slate-100"
          )}>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-500" />
              <h2 className={cn("font-bold uppercase tracking-wider text-sm", isDark ? "text-slate-300" : "text-slate-700")}>Active Shopping Cart</h2>
              <span className="bg-blue-500/10 text-blue-500 text-xs font-bold px-2 py-0.5 rounded-full">
                {cart.length} Items
              </span>
            </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search product or SKU..." 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addToCart(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              className={cn(
                "pl-9 pr-4 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 transition-colors duration-300",
                isDark 
                  ? "bg-slate-900 border-slate-700 text-slate-300 placeholder:text-slate-600" 
                  : "bg-white border-slate-200 text-slate-700 placeholder:text-slate-400"
              )}
            />
          </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className={cn(
                "sticky top-0 z-10 shadow-sm transition-colors duration-300",
                isDark ? "bg-[#1e293b]" : "bg-white"
              )}>
                <tr className={cn(
                  "text-[11px] font-bold uppercase tracking-widest border-b transition-colors duration-300",
                  isDark ? "text-slate-500 border-slate-700" : "text-slate-400 border-slate-100"
                )}>
                  <th className="px-6 py-4">Item Desc</th>
                  <th className="px-4 py-4">SKU ID</th>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4">UnitPrice</th>
                  <th className="px-4 py-4 text-center">Quantity</th>
                  <th className="px-4 py-4 text-center">Stock</th>
                  <th className="px-6 py-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className={cn(
                "divide-y transition-colors duration-300",
                isDark ? "divide-slate-700" : "divide-slate-50"
              )}>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-20">
                        <ShoppingCart className={cn("w-16 h-16", isDark ? "text-white" : "text-slate-900")} />
                        <p className={cn("text-lg font-medium", isDark ? "text-white" : "text-slate-900")}>Cart is empty. Start scanning products.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={item.id} 
                      className={cn(
                        "group transition-colors duration-300",
                        isDark ? "hover:bg-slate-800/50" : "hover:bg-slate-50/80"
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={item.image || `https://picsum.photos/seed/${item.ai_label}/100/100`} alt={item.name} className={cn("w-12 h-12 rounded-lg object-cover border", isDark ? "border-slate-700" : "border-slate-100")} />
                          <div className="flex flex-col">
                            <span className={cn("font-bold text-sm", isDark ? "text-slate-300" : "text-slate-700")}>{item.name}</span>
                            {item.stock < 5 && (
                              <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1">
                                <AlertCircle className="w-2 h-2" />
                                Low Stock: {item.stock}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn("font-mono text-xs px-2 py-1 rounded", isDark ? "bg-slate-900 text-slate-500" : "bg-slate-100 text-slate-500")}>{item.sku}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-semibold text-slate-500 uppercase">{item.category}</span>
                      </td>
                      <td className={cn("px-4 py-4 font-mono text-sm", isDark ? "text-slate-400" : "text-slate-600")}>{formatIDR(item.price)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={item.isUpdating}
                            className={cn(
                              "w-7 h-7 rounded-full border flex items-center justify-center transition-all disabled:opacity-50",
                              isDark 
                                ? "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800" 
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className={cn(
                            "w-8 text-center font-bold text-sm transition-opacity",
                            item.isUpdating ? "opacity-30" : "opacity-100",
                            isDark ? "text-slate-300" : "text-slate-700"
                          )}>
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={item.isUpdating}
                            className={cn(
                              "w-7 h-7 rounded-full border flex items-center justify-center transition-all disabled:opacity-50",
                              isDark 
                                ? "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800" 
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={cn(
                          "font-bold text-sm tracking-wide",
                          item.stock < 10 ? "text-red-500" : isDark ? "text-slate-300" : "text-slate-700"
                        )}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-4">
                          <span className="font-mono font-bold text-blue-500">{formatIDR(item.price * item.quantity)}</span>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Checkout Bar */}
          <div className={cn(
            "p-8 border-t flex items-center justify-between shrink-0 transition-colors duration-300",
            isDark ? "bg-[#1e293b] border-slate-700" : "bg-white border-slate-200"
          )}>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Grand Total</span>
              <span className={cn("text-4xl font-mono font-black", isDark ? "text-white" : "text-blue-900")}>{formatIDR(totalAmount)}</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white px-12 py-5 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              PROCEED TO CHECKOUT
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right: Intelligence Sidebar (30%) */}
        <aside className={cn(
          "w-[30%] flex flex-col overflow-hidden transition-colors duration-300 border-l",
          isDark ? "bg-[#0f172a] border-slate-700" : "bg-white border-slate-200"
        )}>
          <div className={cn("p-4 border-b flex items-center justify-between", isDark ? "border-slate-800" : "border-slate-200")}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className={cn("text-[10px] font-bold uppercase tracking-widest", isDark ? "text-white" : "text-slate-900")}>AI Vision Monitor</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">FPS: 60.0</span>
          </div>

          <div className={cn(
            "relative aspect-video overflow-hidden group transition-colors duration-300 main-layout-container",
            isDark ? "bg-black" : "bg-white ring-1 ring-slate-200 shadow-md"
          )}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover opacity-80"
            />
            
            <canvas 
              ref={canvasRef}
              className="absolute inset-0 w-full h-full z-10 pointer-events-none"
            />
            
            {/* Loading Model Overlay */}
            {!modelLoaded && (
              <div className="absolute inset-0 z-40 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent flex items-center justify-center rounded-full animate-spin" />
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Initializing AI Engine...</span>
                </div>
              </div>
            )}

            {/* Green Flash Feedback */}
            <AnimatePresence>
              {showGreenFlash && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 border-[12px] border-emerald-500/50 z-30 pointer-events-none"
                />
              )}
            </AnimatePresence>
            
            {/* Scanning Overlays */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Safe Zone */}
              <div className="absolute inset-8 border-2 border-dashed border-blue-500/30 rounded-lg">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500" />
              </div>

              {/* Laser Line (Hybrid Edge Computing Simulation) */}
              <motion.div 
                className="absolute left-0 right-0 h-1 bg-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,1)] z-20 flex items-center justify-center overflow-hidden"
                animate={{ top: ['5%', '95%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-full h-full bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />
                <span className="absolute text-[6px] font-black text-blue-200 uppercase tracking-[0.2em] whitespace-nowrap opacity-40">
                  Hybrid Edge Processing • Active Scanning • GIAT-AI-v2.5
                </span>
              </motion.div>

              {/* Floating Tooltip */}
              <motion.div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-sm"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Scan className="w-3 h-3" />
                Target: Hybrid AI Recognition Active
              </motion.div>
            </div>
          </div>

          <div className={cn("flex-1 p-4 space-y-4 overflow-y-auto", isDark ? "custom-scrollbar-dark" : "custom-scrollbar")}>
            <div className="space-y-2">
              <h3 className={cn("text-[10px] font-bold uppercase tracking-widest", isDark ? "text-slate-500" : "text-slate-900")}>System Status</h3>
              <div className="grid grid-cols-1 gap-2">
                <div className={cn("p-3 rounded-xl flex items-center justify-between border", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm")}>
                  <span className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-600")}>Edge Computing</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-400">ONLINE</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                </div>
                <div className={cn("p-3 rounded-xl flex items-center justify-between border", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm")}>
                  <span className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-600")}>Cloud Sync</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-bold", isSyncing ? "text-emerald-400" : "text-red-400")}>
                      {isSyncing ? "ONLINE" : "OFFLINE"}
                    </span>
                    <div className={cn("w-1.5 h-1.5 rounded-full", isSyncing ? "bg-emerald-400" : "bg-red-400")} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className={cn("text-[10px] font-bold uppercase tracking-widest", isDark ? "text-slate-500" : "text-slate-900")}>AI Recognition Log</h3>
              <div className="space-y-2">
                {scanLogs.map((log, i) => (
                  <div key={i} className="text-[10px] font-mono flex gap-2">
                    <span className={isDark ? "text-slate-600" : "text-slate-400"}>[{log.time}]</span>
                    <span className={isDark ? log.color : "text-slate-600"}>{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={cn("p-4 rounded-2xl mt-auto border", isDark ? "bg-blue-600/10 border-blue-500/20" : "bg-amber-50 border-amber-200")}>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className={cn("w-4 h-4", isDark ? "text-blue-400" : "text-amber-600")} />
                <span className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-blue-400" : "text-amber-700")}>Shrinkage Alert</span>
              </div>
              <p className={cn("text-[10px] leading-relaxed", isDark ? "text-slate-400" : "text-amber-800")}>
                AI Monitoring active. System will automatically flag suspicious movements or unscanned items in the safe zone.
              </p>
            </div>
          </div>
        </aside>
      </main>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={cn(
                "relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300",
                isDark ? "bg-[#1e293b]" : "bg-white"
              )}
            >
              <div className={cn(
                "p-6 border-b flex items-center justify-between transition-colors duration-300",
                isDark ? "border-slate-700" : "border-slate-100"
              )}>
                <h2 className={cn("text-xl font-black uppercase tracking-tight", isDark ? "text-white" : "text-slate-800")}>Payment Engine</h2>
                <button onClick={() => setIsCheckoutModalOpen(false)} className={cn("p-2 rounded-full transition-colors", isDark ? "hover:bg-slate-800" : "hover:bg-slate-100")}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="text-center space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Amount to Pay</p>
                  <h3 className="text-5xl font-mono font-black text-blue-500">{formatIDR(totalAmount)}</h3>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Select Payment Method</p>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'CASH', label: 'Cash', icon: Banknote },
                      { id: 'QRIS', label: 'QRIS', icon: QrCode },
                      { id: 'TRANSFER', label: 'Transfer', icon: CreditCard },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                        className={cn(
                          "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all active:scale-95",
                          paymentMethod === method.id 
                            ? "border-blue-600 bg-blue-500/10 text-blue-500 shadow-md" 
                            : isDark ? "border-slate-700 bg-slate-900 text-slate-500 hover:border-slate-600" : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                        )}
                      >
                        <method.icon className="w-8 h-8" />
                        <span className="font-bold uppercase tracking-wider text-xs">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {paymentMethod === 'CASH' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-2 gap-8"
                    >
                      <div className="space-y-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Numeric Keypad</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '000', 0, 'C'].map((num) => (
                            <button
                              key={num}
                              onClick={() => {
                                if (num === 'C') setCashReceived('');
                                else setCashReceived(prev => prev + num);
                              }}
                              className={cn(
                                "h-12 rounded-xl font-bold transition-colors active:scale-95",
                                isDark ? "bg-slate-900 text-slate-300 hover:bg-slate-800" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                              )}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className={cn(
                        "flex flex-col justify-center space-y-6 p-6 rounded-2xl border transition-colors duration-300",
                        isDark ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-100"
                      )}>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nominal Terima</p>
                          <p className={cn("text-2xl font-mono font-bold", isDark ? "text-white" : "text-slate-800")}>{formatIDR(Number(cashReceived) || 0)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Kembalian</p>
                          <p className={cn(
                            "text-3xl font-mono font-black",
                            (Number(cashReceived) - totalAmount) >= 0 ? "text-emerald-500" : "text-red-400"
                          )}>
                            {formatIDR(Math.max(0, Number(cashReceived) - totalAmount))}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {paymentMethod === 'QRIS' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex flex-col items-center gap-6"
                    >
                      <div className={cn(
                        "p-6 border-2 rounded-3xl shadow-xl relative transition-colors duration-300",
                        isDark ? "bg-white border-slate-700" : "bg-white border-slate-100"
                      )}>
                        <QRCodeSVG value={`qris://payment?amount=${totalAmount}&merchant=KoperasiGIAT`} size={200} />
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[1px] opacity-0 hover:opacity-100 transition-opacity rounded-3xl">
                           <div className="flex flex-col items-center gap-2">
                             <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                             <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Waiting for Payment...</span>
                           </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className={cn("text-sm font-bold", isDark ? "text-white" : "text-slate-800")}>Scan QRIS Koperasi GIAT</p>
                        <p className="text-xs text-slate-500">Merchant ID: GIAT-POS-001</p>
                      </div>
                    </motion.div>
                  )}

                  {paymentMethod === 'TRANSFER' && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-blue-600 text-white p-8 rounded-3xl space-y-6 shadow-xl shadow-blue-500/30"
                    >
                      <div className="flex items-center justify-between">
                        <CreditCard className="w-10 h-10 opacity-50" />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-80">Bank Transfer</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs opacity-70 uppercase tracking-widest">Account Number</p>
                        <p className="text-3xl font-mono font-black tracking-wider">1234 5678 90</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] opacity-70 uppercase tracking-widest">Account Name</p>
                          <p className="font-bold">Koperasi GIAT Telkom</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] opacity-70 uppercase tracking-widest">Bank</p>
                          <p className="font-bold">Bank Mandiri</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className={cn(
                "p-6 border-t transition-colors duration-300",
                isDark ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-100"
              )}>
                <button 
                  onClick={handleFinalizePayment}
                  disabled={!paymentMethod || (paymentMethod === 'CASH' && Number(cashReceived) < totalAmount)}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  FINALIZE TRANSACTION
                  <CheckCircle2 className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {isReceiptOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative w-full max-w-sm"
            >
              {/* Thermal Receipt Style */}
              <div className="bg-white p-8 shadow-2xl relative print:shadow-none print:p-0 print-only">
                {/* Jagged Edges (CSS trick) */}
                <div className="absolute -top-2 left-0 right-0 h-4 bg-white" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }} />
                
                <div className="text-center space-y-1 mb-8">
                  <h2 className="text-2xl font-black tracking-tighter text-slate-800">{storeName.toUpperCase()}</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modern AI Point of Sale System</p>
                  <div className="w-full border-b border-dashed border-slate-300 my-4" />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>{lastTransaction ? new Date(lastTransaction.created_at).toLocaleDateString() : currentTime.toLocaleDateString()}</span>
                    <span>{lastTransaction ? new Date(lastTransaction.created_at).toLocaleTimeString() : currentTime.toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>TRX: #{lastTransaction?.invoice_number || invoiceNumber}</span>
                    <span>KASIR: {lastTransaction?.cashier_name?.split(' ')[0].toUpperCase() || 'DALFA'}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {(lastTransaction?.items || cart).map((item: any) => (
                    <div key={item.product_id || item.id} className="flex justify-between text-xs">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{item.name}</span>
                        <span className="text-slate-400">{item.quantity} x {formatIDR(item.price)}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800">{formatIDR(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 border-t border-dashed border-slate-300 pt-4 mb-8">
                  <div className="flex justify-between text-sm font-bold">
                    <span>TOTAL</span>
                    <span className="font-mono">{formatIDR(lastTransaction?.total_price || totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>PAYMENT TYPE</span>
                    <span className="font-bold">{lastTransaction?.payment_method || paymentMethod}</span>
                  </div>
                  {(lastTransaction?.payment_method === 'CASH' || paymentMethod === 'CASH') && (
                    <>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>CASH RECEIVED</span>
                        <span className="font-bold">{formatIDR(lastTransaction?.cash_received || Number(cashReceived))}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>CHANGE</span>
                        <span className="font-bold">{formatIDR(lastTransaction?.cash_return || (Number(cashReceived) - totalAmount))}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-center space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thank you for shopping at Koperasi GIAT!</p>
                  <div className="flex justify-center">
                    <QRCodeSVG value="https://giat.telkomuniversity.ac.id" size={60} />
                  </div>
                </div>

                <div className="absolute -bottom-2 left-0 right-0 h-4 bg-white" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }} />
              </div>

              <div className="mt-8 flex gap-3 no-print">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 bg-white hover:bg-slate-50 text-slate-800 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  <Printer className="w-5 h-5" />
                  CETAK STRUK
                </button>
                <button 
                  onClick={resetTransaction}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95"
                >
                  NEW ORDER
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
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
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          .print-only, .print-only * { visibility: visible; }
          .fixed { position: absolute !important; top: 0 !important; left: 0 !important; }
          .bg-slate-900\/80 { display: none !important; }
        }
      `}</style>
    </div>
  );
}
