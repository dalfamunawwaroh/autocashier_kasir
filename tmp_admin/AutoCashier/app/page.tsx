"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DollarSign,
  Receipt,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  products,
  transactions,
  weeklySalesData,
  monthlySalesData,
  yearlySalesData,
  formatCurrency,
} from "@/lib/data"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

export default function OverviewPage() {
  const router = useRouter()
  const [chartFilter, setChartFilter] = useState<"weekly" | "monthly" | "yearly">(
    "monthly"
  )
  
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  const currentDate = new Date("2026-03-28") // March 28, 2026
  const currentMonth = (currentDate.getMonth() + 1).toString()
  const currentYear = "2026"
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedYearForYearly, setSelectedYearForYearly] = useState("2026")

  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0)
  const totalTransactions = transactions.length
  const outOfStockItems = products.filter((p) => p.stock === 0).length
  const topSellingProducts = products
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 3)

  const getChartTitle = () => {
    if (chartFilter === "monthly") {
      const monthName = months[parseInt(selectedMonth) - 1]
      return `Sales Trends - ${monthName} ${selectedYear}`
    } else if (chartFilter === "yearly") {
      return `Sales Trends - ${selectedYearForYearly}`
    }
    return "Sales Trends"
  }

  const chartData = {
    weekly: weeklySalesData,
    monthly: monthlySalesData,
    yearly: yearlySalesData,
  }

  const currentChartData =
    chartFilter === "weekly"
      ? weeklySalesData
      : chartFilter === "monthly"
        ? monthlySalesData
        : yearlySalesData

  const handleOutOfStockClick = () => {
    router.push("/inventory?filter=out-of-stock")
  }

  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      change: "+12.5%",
      trend: "up",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200",
    },
    {
      title: "Total Transactions",
      value: totalTransactions.toString(),
      icon: Receipt,
      change: "+8.2%",
      trend: "up",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
    },
    {
      title: "Out of Stock Items",
      value: outOfStockItems.toString(),
      icon: AlertTriangle,
      change: "-2",
      trend: "down",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      borderColor: "border-amber-200",
      clickable: true,
    },
    {
      title: "Top Selling Products",
      value: topSellingProducts.length.toString(),
      icon: TrendingUp,
      change: "+3",
      trend: "up",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      borderColor: "border-indigo-200",
    },
  ]

  return (
    <DashboardLayout
      title="Overview"
      description="Welcome back! Here's what's happening with your store today."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className={`${stat.bgColor} border ${stat.borderColor} ${
              "clickable" in stat && stat.clickable ? "cursor-pointer hover:shadow-lg transition-shadow" : ""
            }`}
            onClick={() => {
              if ("clickable" in stat && stat.clickable) {
                handleOutOfStockClick()
              }
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground/70">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center text-xs text-foreground/60">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-red-600" />
                )}
                <span
                  className={
                    stat.trend === "up" ? "text-emerald-600 font-medium" : "text-red-600 font-medium"
                  }
                >
                  {stat.change}
                </span>
                <span className="ml-1">from last week</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="space-y-4 pb-4">
            {/* Title and Toggle Row */}
            <div className="flex flex-row items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{getChartTitle()}</CardTitle>
              </div>
              <Select
                value={chartFilter}
                onValueChange={(value) =>
                  setChartFilter(value as "weekly" | "monthly" | "yearly")
                }
              >
                <SelectTrigger className="w-32 ml-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Contextual Selectors - Left aligned */}
            {chartFilter === "monthly" && (
              <div className="flex gap-2">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-28 text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={month} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-20 text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {chartFilter === "yearly" && (
              <Select value={selectedYearForYearly} onValueChange={setSelectedYearForYearly}>
                <SelectTrigger className="w-24 text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            )}
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={currentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis
                  dataKey={chartFilter === "weekly" ? "day" : chartFilter === "monthly" ? "day" : "month"}
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(tick) => {
                    if (chartFilter === "monthly") {
                      // Extract just the number from "Day 1", "Day 2", etc.
                      const dayMatch = tick.match(/\d+/)
                      return dayMatch ? dayMatch[0] : tick
                    }
                    return tick
                  }}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Sales"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ fill: "#4f46e5", r: 4 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.transaction_id}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <Receipt className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {transaction.transaction_id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.items} items
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(transaction.total)}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {transaction.payment_method}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 3 Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {topSellingProducts.map((product, index) => (
                <div
                  key={product.sku}
                  className="flex flex-col items-center gap-3 rounded-lg border border-border p-4 text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-lg">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{product.name}</p>
                    <p className="text-sm text-emerald-600 font-medium">
                      {product.stock} pcs sold
                    </p>
                  </div>
                  <div className="w-full border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
