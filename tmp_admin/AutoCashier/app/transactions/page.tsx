"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, CreditCard, Wallet, QrCode, Eye } from "lucide-react"
import { formatCurrency } from "@/lib/data"

function PaymentMethodBadge({ method }: { method: string }) {
  const variants: Record<string, { icon: React.ElementType; className: string }> = {
    Cash: { icon: Wallet, className: "bg-green-100 text-green-700 border-green-200" },
    QRIS: { icon: QrCode, className: "bg-blue-100 text-blue-700 border-blue-200" },
    "Debit Card": { icon: CreditCard, className: "bg-purple-100 text-purple-700 border-purple-200" },
  }

  const config = variants[method] || variants.Cash
  const Icon = config.icon

  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="mr-1 h-3 w-3" />
      {method}
    </Badge>
  )
}

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("All")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [store, setStore] = useState<any>(null)

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch('/api/transactions')
        const data = await res.json()
        if (data.success) {
          setTransactions(data.data)
        }
      } catch (error) {
        console.error("Error fetching transactions:", error)
      } finally {
        setIsLoading(false)
      }
    }
    async function fetchStore() {
      try {
        const res = await fetch('/api/store')
        const data = await res.json()
        if (data.success) {
          setStore(data.data)
        }
      } catch (error) {
        console.error("Error fetching store:", error)
      }
    }
    fetchTransactions()
    fetchStore()
  }, [])

  const paymentMethods = ["All", "Cash", "QRIS", "Debit Card"]

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.transaction_id
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesPayment =
      paymentFilter === "All" || transaction.payment_method === paymentFilter

    const txDate = transaction.timestamp.split(" ")[0]
    const matchesStartDate = !startDate || txDate >= startDate
    const matchesEndDate = !endDate || txDate <= endDate

    return matchesSearch && matchesPayment && matchesStartDate && matchesEndDate
  })

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.total, 0)
  const totalItems = filteredTransactions.reduce((sum, t) => sum + t.items, 0)

  return (
    <DashboardLayout
      title="Transaction History"
      description="View and manage all store transactions."
    >
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTransactions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Items Sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">Transaction History</CardTitle>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full sm:w-[130px] h-9 text-xs"
                />
                <span className="text-muted-foreground text-sm">-</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full sm:w-[130px] h-9 text-xs"
                />
              </div>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-full sm:w-36 h-9">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 sm:w-48 h-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-foreground">Transaction ID</TableHead>
                  <TableHead className="font-semibold text-foreground">Date & Time</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Items</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Total</TableHead>
                  <TableHead className="font-semibold text-foreground">Payment Method</TableHead>
                  <TableHead className="font-semibold text-foreground">Cashier</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.transaction_id} className="last:border-0 hover:bg-muted/50">
                      <TableCell className="font-medium py-4">
                        {transaction.transaction_id}
                      </TableCell>
                      <TableCell className="py-4 text-muted-foreground">{transaction.timestamp}</TableCell>
                      <TableCell className="text-right py-4 text-muted-foreground">
                        {transaction.items}
                      </TableCell>
                      <TableCell className="text-right font-medium py-4">
                        {formatCurrency(transaction.total)}
                      </TableCell>
                      <TableCell className="py-4">
                        <PaymentMethodBadge method={transaction.payment_method} />
                      </TableCell>
                      <TableCell className="py-4 text-muted-foreground">{transaction.cashier}</TableCell>
                      <TableCell className="text-right py-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTransaction(transaction)
                            setIsModalOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredTransactions.length} of {transactions.length}{" "}
            transactions
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="border-b border-border pb-4">
            {store && (
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">{store.name}</h2>
                <p className="text-xs text-muted-foreground">{store.address}</p>
                <p className="text-xs text-muted-foreground">{store.phone} • {store.email}</p>
              </div>
            )}
            <DialogTitle className="text-xl font-mono uppercase tracking-widest text-center">Digital Receipt</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Transaction ID</p>
                  <p className="text-sm font-semibold">{selectedTransaction.transaction_id}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Date & Time</p>
                  <p className="text-sm font-semibold">{selectedTransaction.timestamp}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Cashier</p>
                  <p className="text-sm font-semibold">{selectedTransaction.cashier}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Payment Method</p>
                  <div>
                    <PaymentMethodBadge method={selectedTransaction.payment_method} />
                  </div>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-muted-foreground">Total Items</span>
                  <span className="font-medium">{selectedTransaction.items}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold">Grand Total</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(selectedTransaction.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
