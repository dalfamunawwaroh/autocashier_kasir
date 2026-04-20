"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, Edit2, Trash2, X, AlertCircle, Box } from "lucide-react"
import { categories, formatCurrency, type Product } from "@/lib/data"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <Badge className="bg-red-100 text-red-700 border border-red-300 hover:bg-red-100/80 font-medium">
        Out of Stock
      </Badge>
    )
  }
  if (stock < 10) {
    return (
      <Badge className="bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-100/80 font-medium">
        Low Stock
      </Badge>
    )
  }
  return (
    <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-100/80 font-medium">
      In Stock
    </Badge>
  )
}

function InventoryPageContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const filterParam = searchParams.get("filter")
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [selectedStatus, setSelectedStatus] = useState<"all" | "in-stock" | "low-stock" | "out-of-stock">(
    filterParam === "out-of-stock" ? "out-of-stock" : "all"
  )
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [productList, setProductList] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      if (data.success) {
        setProductList(data.data)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({ title: "Error", description: "Failed to fetch products", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [toast])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string>("")
  const [newProduct, setNewProduct] = useState<Product>({
    sku: "",
    name: "",
    category: "",
    price: 0,
    stock: 0,
    ai_label: "",
    image: "",
    image_url: "",
  })
  const [imagePreview, setImagePreview] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  const filteredProducts = productList.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === "All Categories" ||
      product.category === selectedCategory
    
    // Apply status filter
    let matchesStatus = true
    if (selectedStatus === "in-stock") {
      matchesStatus = product.stock >= 10
    } else if (selectedStatus === "low-stock") {
      matchesStatus = product.stock > 0 && product.stock < 10
    } else if (selectedStatus === "out-of-stock") {
      matchesStatus = product.stock === 0
    }
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleAddProduct = async () => {
    if (newProduct.sku && newProduct.name) {
      try {
        // Ensure standard fields are populated correctly for MongoDB
        const payload = {
          ...newProduct,
          image_url: newProduct.image_url || newProduct.image // fallback mapped
        }
        
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        const data = await res.json()
        if (data.success) {
          toast({ title: "Success", description: "Product added successfully." })
          setNewProduct({
            sku: "",
            name: "",
            category: "",
            price: 0,
            stock: 0,
            ai_label: "",
            image: "",
            image_url: "",
          })
          setImagePreview("")
          setIsDialogOpen(false)
          fetchProducts() // Re-fetch to update the table immediately
        } else {
          toast({ title: "Error", description: data.message || "Failed to add product.", variant: "destructive" })
        }
      } catch (error) {
        toast({ title: "Error", description: "Network error", variant: "destructive" })
      }
    } else {
      toast({ title: "Error", description: "SKU and Name are required.", variant: "destructive" })
    }
  }

  const handleDeleteProduct = (sku: string) => {
    setProductList(productList.filter((p) => p.sku !== sku))
  }

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (productToDelete) {
      handleDeleteProduct(productToDelete.sku)
      toast({
        title: "Product deleted",
        description: `${productToDelete.name} has been successfully deleted.`,
        variant: "default",
      })
      setIsDeleteConfirmOpen(false)
      setProductToDelete(null)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setImagePreview(result)
        setNewProduct({ ...newProduct, image: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl)
    setIsImageModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct({ ...product })
    setEditImagePreview(product.image || "")
    setIsEditDialogOpen(true)
  }

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setEditImagePreview(result)
        if (editingProduct) {
          setEditingProduct({ ...editingProduct, image: result })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveChanges = () => {
    if (editingProduct && editingProduct.name) {
      const updatedList = productList.map((p) =>
        p.sku === editingProduct.sku ? editingProduct : p
      )
      setProductList(updatedList)
      setEditingProduct(null)
      setEditImagePreview("")
      setIsEditDialogOpen(false)
    }
  }

  return (
    <DashboardLayout
      title="Product Inventory"
      description="Manage your store products and stock levels."
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Products</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 sm:w-64"
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  setSelectedStatus(value as "all" | "in-stock" | "low-stock" | "out-of-stock")
                }
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="image">Product Image</Label>
                      <div className="flex flex-col gap-3">
                        <input
                          ref={fileInputRef}
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full"
                        >
                          Choose Image
                        </Button>
                        {imagePreview && (
                          <button
                            onClick={() => handleImageClick(imagePreview)}
                            className="relative w-20 h-20 rounded-lg overflow-hidden border border-border hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer group"
                            title="Click to preview"
                          >
                            <Image
                              src={imagePreview}
                              alt="Preview"
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                Click to preview
                              </span>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={newProduct.sku}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, sku: e.target.value })
                        }
                        placeholder="SKU013"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={newProduct.name}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, name: e.target.value })
                        }
                        placeholder="Product name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newProduct.category}
                        onValueChange={(value) =>
                          setNewProduct({ ...newProduct, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.slice(1).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="price">Price (IDR)</Label>
                        <Input
                          id="price"
                          type="number"
                          value={newProduct.price || ""}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              price: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="stock">Stock</Label>
                        <Input
                          id="stock"
                          type="number"
                          value={newProduct.stock || ""}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              stock: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ai_label">AI Label</Label>
                      <Input
                        id="ai_label"
                        value={newProduct.ai_label}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            ai_label: e.target.value,
                          })
                        }
                        placeholder="product_type"
                      />
                    </div>
                    <Button onClick={handleAddProduct} className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                      Add Product
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.sku}>
                      <TableCell>
                        {product.image_url || product.image ? (
                          <div className="relative w-10 h-10 rounded-md overflow-hidden border border-border">
                            <Image
                              src={product.image_url || product.image || ""}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-muted-foreground">
                            <Box className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.sku}
                      </TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.stock}
                      </TableCell>
                      <TableCell>
                        <StockBadge stock={product.stock} />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-100"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-100"
                            onClick={() => handleDeleteClick(product)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredProducts.length} of {productList.length} products
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && productToDelete && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setIsDeleteConfirmOpen(false)
            setProductToDelete(null)
          }}
        >
          <div
            className="relative w-full max-w-sm mx-4 rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setIsDeleteConfirmOpen(false)
                setProductToDelete(null)
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Content */}
            <div className="p-6">
              {/* Warning Icon */}
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>

              {/* Title and Description */}
              <h2 className="text-center text-lg font-semibold text-foreground mb-2">
                Delete Product
              </h2>
              <p className="text-center text-sm text-muted-foreground mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-foreground">
                  {productToDelete.name}
                </span>
                ? This action cannot be undone.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setIsDeleteConfirmOpen(false)
                    setProductToDelete(null)
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium"
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {isImageModalOpen && selectedImageUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="relative max-w-2xl max-h-[80vh] w-11/12"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors p-1"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Image Container */}
            <div className="relative w-full h-full bg-white rounded-lg overflow-hidden shadow-xl">
              <Image
                src={selectedImageUrl}
                alt="Product preview"
                width={800}
                height={800}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit Product: {editingProduct?.name}
            </DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-image">Product Image</Label>
                <div className="flex flex-col gap-3">
                  <input
                    ref={editFileInputRef}
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => editFileInputRef.current?.click()}
                    className="w-full"
                  >
                    Change Image
                  </Button>
                  {editImagePreview && (
                    <button
                      onClick={() => handleImageClick(editImagePreview)}
                      className="relative w-20 h-20 rounded-lg overflow-hidden border border-border hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer group"
                      title="Click to preview"
                    >
                      <Image
                        src={editImagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to preview
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-sku">SKU</Label>
                <Input
                  id="edit-sku"
                  value={editingProduct.sku}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Product Name</Label>
                <Input
                  id="edit-name"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      name: e.target.value,
                    })
                  }
                  placeholder="Product name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editingProduct.category}
                  onValueChange={(value) =>
                    setEditingProduct({
                      ...editingProduct,
                      category: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.slice(1).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-price">Price (IDR)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editingProduct.price || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-stock">Stock</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={editingProduct.stock || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-ai_label">AI Label</Label>
                <Input
                  id="edit-ai_label"
                  value={editingProduct.ai_label}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      ai_label: e.target.value,
                    })
                  }
                  placeholder="product_type"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleSaveChanges}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={() => {
                    setEditingProduct(null)
                    setEditImagePreview("")
                    setIsEditDialogOpen(false)
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <InventoryPageContent />
    </Suspense>
  )
}
