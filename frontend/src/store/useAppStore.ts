import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'id' | 'en';
export type Theme = 'dark' | 'light';

/** Authenticated cashier/admin user from the backend. */
export interface AuthUser {
  id?: string;
  name: string;
  role: string;
  phone?: string;
  branch_id?: string;
  branch_code?: string;
  branch_name?: string;
}

/** Identified member (customer) for the current POS session. */
export interface MemberUser {
  id?: string;
  name: string;
  phone?: string;
}

interface AppState {
  language: Language;
  theme: Theme;
  /** The logged-in cashier/admin. Null when not authenticated. */
  user: AuthUser | null;
  /** The identified customer for the current transaction. Null if guest. */
  member: MemberUser | null;
  isMember: boolean;

  toggleLanguage: () => void;
  setTheme: (theme: Theme) => void;
  /** Set the authenticated cashier/admin and their member status. */
  setIdentity: (user: AuthUser, isMember: boolean) => void;
  /** Set the identified customer (member) for the current POS session. */
  setMemberIdentity: (member: MemberUser | null, isMember: boolean) => void;
  /** Clear current transaction member session without logging out the cashier. */
  clearSession: () => void;
  setIsMember: (val: boolean) => void;
  setLanguage: (lang: Language) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'id',
      theme: 'dark',
      user: null,
      member: null,
      isMember: false,

      toggleLanguage: () => set((state) => ({ language: state.language === 'id' ? 'en' : 'id' })),
      setTheme: (theme) => set({ theme }),
      setIdentity: (user, isMember) => set({ user, isMember }),
      setMemberIdentity: (member, isMember) => set({ member, isMember }),
      setIsMember: (val) => set({ isMember: val }),
      setLanguage: (lang) => set({ language: lang }),
      clearSession: () => set({ member: null, isMember: false }),
    }),
    { name: 'app-settings' }
  )
);

// Comprehensive Translation Dictionary
export const translations = {
  id: {
    START_CHECKOUT: "Mulai Kasir",
    SCANNER_READY: "Kamera siap",
    DETECTING: "AI Mencari Objek...",
    DETECTED: "Terdeteksi",
    SCAN_DONE: "Selesai",
    CART_TITLE: "Keranjang Belanja",
    EMPTY_CART: "Belum ada barang",
    IDENTITY_TITLE: "Cek Keanggotaan",
    IDENTITY_SUB: "Masukkan WhatsApp untuk cek promo atau tekan Lewati",
    WA_LABEL: "Nomor WhatsApp",
    WA_PLACEHOLDER: "08123456789",
    CEK_MEMBER: "Periksa Nomor",
    LEWATI: "Lewati sebagai Tamu",
    WA_NOT_FOUND: "Nomor tidak terdaftar. Lanjut sebagai Tamu.",
    VOUCHER_DISABLED: "Harus Login Member untuk pakai promo",
    PROCEED_PAYMENT: "Lanjut Pembayaran",
    TOTAL: "Total",
    SCAN_QRIS: "Scan Barcode QRIS",
    ALREADY_PAID: "Sudah Bayar",
    RECEIPT_SCAN: "Tunjukkan Bukti Pembayaran ke Kamera",
    VERIFYING: "Sistem Memverifikasi...",
    TRANS_SUCCESS: "Transaksi Berhasil!",
    AUTO_RESET_MSG: "Sistem mengulang otomatis dalam 5 detik",
  },
  en: {
    START_CHECKOUT: "Start Checkout",
    SCANNER_READY: "Camera ready",
    DETECTING: "AI Scanning...",
    DETECTED: "Detected",
    SCAN_DONE: "Done",
    CART_TITLE: "Shopping Cart",
    EMPTY_CART: "No items yet",
    IDENTITY_TITLE: "Identity Check",
    IDENTITY_SUB: "Enter WhatsApp to check promos or skip",
    WA_LABEL: "WhatsApp Number",
    WA_PLACEHOLDER: "08123456789",
    CEK_MEMBER: "Check Number",
    LEWATI: "Skip as Guest",
    WA_NOT_FOUND: "Number not registered. Proceeding as Guest.",
    VOUCHER_DISABLED: "Member login required for promos",
    PROCEED_PAYMENT: "Proceed to Payment",
    TOTAL: "Total",
    SCAN_QRIS: "Scan QRIS Barcode",
    ALREADY_PAID: "Already Paid",
    RECEIPT_SCAN: "Show Payment Proof to Camera",
    VERIFYING: "Verifying Payment...",
    TRANS_SUCCESS: "Transaction Successful!",
    AUTO_RESET_MSG: "System resetting in 5 seconds",
  }
};