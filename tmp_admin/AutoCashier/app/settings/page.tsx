"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Store, Bell, Printer, CreditCard, Save } from "lucide-react"

export default function SettingsPage() {
  const [storeSettings, setStoreSettings] = useState({
    storeName: "AutoCashier Minimarket",
    storeAddress: "Jl. Contoh No. 123, Jakarta",
    storePhone: "+62 21 1234 5678",
    currency: "IDR",
    taxRate: "11",
  })

  const [notifications, setNotifications] = useState({
    lowStock: true,
    dailyReport: true,
    transactions: false,
  })

  const [printer, setPrinter] = useState({
    autoPrint: true,
    paperSize: "80mm",
  })

  return (
    <DashboardLayout
      title="Store Settings"
      description="Manage your store configuration and preferences."
    >
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <CardTitle>Store Information</CardTitle>
            </div>
            <CardDescription>
              Basic information about your store
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={storeSettings.storeName}
                onChange={(e) =>
                  setStoreSettings({ ...storeSettings, storeName: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="storeAddress">Address</Label>
              <Input
                id="storeAddress"
                value={storeSettings.storeAddress}
                onChange={(e) =>
                  setStoreSettings({ ...storeSettings, storeAddress: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="storePhone">Phone Number</Label>
              <Input
                id="storePhone"
                value={storeSettings.storePhone}
                onChange={(e) =>
                  setStoreSettings({ ...storeSettings, storePhone: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={storeSettings.currency}
                  onValueChange={(value) =>
                    setStoreSettings({ ...storeSettings, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  value={storeSettings.taxRate}
                  onChange={(e) =>
                    setStoreSettings({ ...storeSettings, taxRate: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Configure alert and notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Low Stock Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when products are running low
                </p>
              </div>
              <Switch
                checked={notifications.lowStock}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, lowStock: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily Sales Report</p>
                <p className="text-sm text-muted-foreground">
                  Receive daily summary via email
                </p>
              </div>
              <Switch
                checked={notifications.dailyReport}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, dailyReport: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Transaction Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get notified for each transaction
                </p>
              </div>
              <Switch
                checked={notifications.transactions}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, transactions: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              <CardTitle>Receipt Printer</CardTitle>
            </div>
            <CardDescription>
              Configure receipt printing settings
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto Print Receipt</p>
                <p className="text-sm text-muted-foreground">
                  Automatically print receipt after each transaction
                </p>
              </div>
              <Switch
                checked={printer.autoPrint}
                onCheckedChange={(checked) =>
                  setPrinter({ ...printer, autoPrint: checked })
                }
              />
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label>Paper Size</Label>
              <Select
                value={printer.paperSize}
                onValueChange={(value) =>
                  setPrinter({ ...printer, paperSize: value })
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58mm">58mm</SelectItem>
                  <SelectItem value="80mm">80mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Payment Methods</CardTitle>
            </div>
            <CardDescription>
              Manage accepted payment methods
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cash</p>
                <p className="text-sm text-muted-foreground">
                  Accept cash payments
                </p>
              </div>
              <Switch checked={true} disabled />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">QRIS</p>
                <p className="text-sm text-muted-foreground">
                  Accept QRIS/QR Code payments
                </p>
              </div>
              <Switch checked={true} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Debit/Credit Card</p>
                <p className="text-sm text-muted-foreground">
                  Accept card payments via EDC
                </p>
              </div>
              <Switch checked={true} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button size="lg">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
