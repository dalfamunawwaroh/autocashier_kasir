"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  Store,
} from "lucide-react"

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Product Inventory", href: "/inventory", icon: Package },
  { name: "Transaction History", href: "/transactions", icon: Receipt },
  { name: "Store Settings", href: "/settings", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <Store className="h-6 w-6 text-indigo-400" />
          <span className="text-xl font-bold text-sidebar-foreground">
            AutoCashier
          </span>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-sidebar-foreground/70 hover:bg-indigo-600/20 hover:text-indigo-400"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-indigo-400")} />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-medium text-sidebar-accent-foreground">
                AC
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-sidebar-foreground">
                Admin User
              </p>
              <p className="text-xs text-sidebar-foreground/60">
                admin@autocashier.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
