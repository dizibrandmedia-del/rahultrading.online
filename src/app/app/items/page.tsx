'use client';

import React, { useState, useEffect } from 'react';
import { formatINR } from '@/lib/currency';
import { Modal } from '@/components/ui/Modal';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Layers,
  DollarSign,
  Edit3,
  Trash2,
  Save,
  CheckCircle2,
  Tag
} from 'lucide-react';

export default function ItemsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Product Form
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [mrp, setMrp] = useState<number>(0);
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [openingStock, setOpeningStock] = useState<number>(10);
  const [minStock, setMinStock] = useState<number>(5);
  const [gstRate, setGstRate] = useState<number>(18);

  // Edit Product State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editHsnCode, setEditHsnCode] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editUnitId, setEditUnitId] = useState('');
  const [editPurchasePrice, setEditPurchasePrice] = useState<number>(0);
  const [editSalePrice, setEditSalePrice] = useState<number>(0);
  const [editMrp, setEditMrp] = useState<number>(0);
  const [editWholesalePrice, setEditWholesalePrice] = useState<number>(0);
  const [editCurrentStock, setEditCurrentStock] = useState<number>(0);
  const [editMinStock, setEditMinStock] = useState<number>(5);
  const [editGstRate, setEditGstRate] = useState<number>(18);

  // Delete Product State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        if (data.categories) setCategories(data.categories);
        if (data.units) setUnits(data.units);
      }
    } catch (e) {
      console.error('Error fetching inventory products:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          sku,
          barcode,
          hsnCode,
          categoryId: categoryId || null,
          unitId: unitId || null,
          purchasePrice,
          salePrice,
          mrp: mrp || salePrice,
          wholesalePrice: wholesalePrice || salePrice,
          openingStock,
          minStock,
          gstRate,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setName('');
        setSku('');
        setBarcode('');
        setHsnCode('');
        setCategoryId('');
        setUnitId('');
        setPurchasePrice(0);
        setSalePrice(0);
        setMrp(0);
        setWholesalePrice(0);
        setOpeningStock(10);
        setMinStock(5);
        showToast('Product added to inventory successfully!');
        fetchProducts();
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditModal = (p: any) => {
    setEditId(p.id);
    setEditName(p.name || '');
    setEditSku(p.sku || '');
    setEditBarcode(p.barcode || '');
    setEditHsnCode(p.hsnCode || '');
    setEditCategoryId(p.categoryId || p.category?.id || '');
    setEditUnitId(p.unitId || p.unit?.id || '');
    setEditPurchasePrice(Number(p.purchasePrice) || 0);
    setEditSalePrice(Number(p.salePrice) || 0);
    setEditMrp(Number(p.mrp) || Number(p.salePrice) || 0);
    setEditWholesalePrice(Number(p.wholesalePrice) || Number(p.salePrice) || 0);
    setEditCurrentStock(Number(p.currentStock) || 0);
    setEditMinStock(Number(p.minStock) || 5);
    setEditGstRate(Number(p.gstRate) !== undefined ? Number(p.gstRate) : 18);
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;

    try {
      setEditSaving(true);
      const res = await fetch(`/api/products/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          sku: editSku,
          barcode: editBarcode,
          hsnCode: editHsnCode,
          categoryId: editCategoryId || null,
          unitId: editUnitId || null,
          purchasePrice: editPurchasePrice,
          salePrice: editSalePrice,
          mrp: editMrp || editSalePrice,
          wholesalePrice: editWholesalePrice || editSalePrice,
          currentStock: editCurrentStock,
          minStock: editMinStock,
          gstRate: editGstRate,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsEditModalOpen(false);
        showToast('Product updated successfully!');
        fetchProducts();
      } else {
        alert('Failed to update product: ' + data.error);
      }
    } catch (err: any) {
      alert('Error updating product: ' + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleOpenDeleteModal = (p: any) => {
    setProductToDelete(p);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/products/${productToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
        setIsDeleteModalOpen(false);
        showToast(`"${productToDelete.name}" deleted successfully.`);
        setProductToDelete(null);
      } else {
        alert('Failed to delete product: ' + data.error);
      }
    } catch (err: any) {
      alert('Error deleting product: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const safeProducts = Array.isArray(products) ? products : [];

  const filteredProducts = safeProducts.filter(
    (p) =>
      (p?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p?.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p?.barcode && p.barcode.includes(search)) ||
      (p?.hsnCode && p.hsnCode.includes(search)) ||
      (p?.category?.name && p.category.name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalStockValue = safeProducts.reduce((acc, p) => acc + (Number(p?.stockValue) || (Number(p?.currentStock) || 0) * (Number(p?.purchasePrice) || 0)), 0);
  const lowStockCount = safeProducts.filter((p) => (Number(p?.currentStock) || 0) <= (Number(p?.minStock) || 5)).length;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-150">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            <span>Items & Inventory Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            Maintain stock quantities, purchase/sale pricing, HSN codes, barcode lookup, and item details
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              Total Stock Valuation
            </p>
            <h3 className="text-xl font-black text-amber-950 dark:text-amber-100 font-mono mt-1">
              {formatINR(totalStockValue)}
            </h3>
          </div>
          <div className="p-3 bg-amber-600 text-white rounded-xl shadow-sm">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
              Total Catalog SKUs
            </p>
            <h3 className="text-xl font-black text-blue-950 dark:text-blue-100 font-mono mt-1">
              {products.length} Items
            </h3>
          </div>
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
              Low Stock Alerts
            </p>
            <h3 className="text-xl font-black text-rose-950 dark:text-rose-100 font-mono mt-1">
              {lowStockCount} Reorder Items
            </h3>
          </div>
          <div className="p-3 bg-rose-600 text-white rounded-xl shadow-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors duration-150">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, SKU, barcode, HSN, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing <span className="font-bold text-slate-900 dark:text-slate-100">{filteredProducts.length}</span> of {products.length} items
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-150">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 whitespace-nowrap">Item Name</th>
                <th className="py-3 px-4 whitespace-nowrap">Category</th>
                <th className="py-3 px-4 whitespace-nowrap">HSN / Barcode</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Purchase Price</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Sale Price</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">GST %</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Current Stock</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Stock Value</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = (Number(p.currentStock) || 0) <= (Number(p.minStock) || 5);
                  const computedStockValue = Number(p.stockValue) || (Number(p.currentStock) || 0) * (Number(p.purchasePrice) || 0);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{p.name}</p>
                        {p.sku && <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">SKU: {p.sku}</p>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {p.category?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <p>HSN: {p.hsnCode || '-'}</p>
                        {p.barcode && <p className="text-[10px] text-slate-400 dark:text-slate-500">#{p.barcode}</p>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatINR(p.purchasePrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatINR(p.salePrice)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {p.gstRate}%
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-mono font-bold text-xs border ${
                            isLow
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 animate-pulse'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {p.currentStock} {p.unit?.shortName || 'PCS'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatINR(computedStockValue)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit Option */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/70 border border-amber-200 dark:border-amber-800/80 transition-all active:scale-95 flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-xs"
                            title={`Edit ${p.name}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* Delete Option */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(p)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/70 border border-rose-200 dark:border-rose-800/80 transition-all active:scale-95 flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-xs"
                            title={`Delete ${p.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Inventory Product"
        subtitle="Specify item details, category, GST rate, purchase/sale pricing, and safety stock levels"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Product / Item Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Tata Salt Vacuum Evaporated 1kg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="">Select Category (Optional)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit of Measurement</label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="">Select Unit (Default: PCS)</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.shortName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">SKU Code</label>
              <input
                type="text"
                placeholder="e.g. SALT-TATA-1K"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Barcode / EAN</label>
              <input
                type="text"
                placeholder="e.g. 8901030382910"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">HSN Code</label>
              <input
                type="text"
                placeholder="e.g. 2501"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Purchase Price (₹) *</label>
              <input
                type="number"
                step="any"
                required
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sale Price (₹) *</label>
              <input
                type="number"
                step="any"
                required
                value={salePrice}
                onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">GST Tax Rate</label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-blue-600 dark:text-blue-400"
              >
                <option value="0">0% (Nil / Exempt)</option>
                <option value="5">5% GST</option>
                <option value="12">12% GST</option>
                <option value="18">18% GST</option>
                <option value="28">28% GST</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Opening Stock Qty</label>
              <input
                type="number"
                step="any"
                value={openingStock}
                onChange={(e) => setOpeningStock(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Min Safety Threshold</label>
              <input
                type="number"
                step="any"
                value={minStock}
                onChange={(e) => setMinStock(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? 'Adding...' : 'Save Product'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Inventory Item"
        subtitle="Update item name, SKU, HSN, pricing, stock levels, or category"
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Product / Item Name *</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="">General / No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit of Measurement</label>
              <select
                value={editUnitId}
                onChange={(e) => setEditUnitId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="">Default Unit (PCS)</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.shortName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">SKU Code</label>
              <input
                type="text"
                placeholder="SKU Code"
                value={editSku}
                onChange={(e) => setEditSku(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Barcode / EAN</label>
              <input
                type="text"
                placeholder="Barcode"
                value={editBarcode}
                onChange={(e) => setEditBarcode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">HSN Code</label>
              <input
                type="text"
                placeholder="HSN Code"
                value={editHsnCode}
                onChange={(e) => setEditHsnCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Purchase Price (₹) *</label>
              <input
                type="number"
                step="any"
                required
                value={editPurchasePrice}
                onChange={(e) => setEditPurchasePrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sale Price (₹) *</label>
              <input
                type="number"
                step="any"
                required
                value={editSalePrice}
                onChange={(e) => setEditSalePrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">GST Tax Rate</label>
              <select
                value={editGstRate}
                onChange={(e) => setEditGstRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-blue-600 dark:text-blue-400"
              >
                <option value="0">0% (Nil / Exempt)</option>
                <option value="5">5% GST</option>
                <option value="12">12% GST</option>
                <option value="18">18% GST</option>
                <option value="28">28% GST</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Stock Qty</label>
              <input
                type="number"
                step="any"
                value={editCurrentStock}
                onChange={(e) => setEditCurrentStock(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Stock Value will automatically update to {formatINR(editCurrentStock * editPurchasePrice)}</p>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Min Safety Threshold</label>
              <input
                type="number"
                step="any"
                value={editMinStock}
                onChange={(e) => setEditMinStock(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSaving}
              className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{editSaving ? 'Updating...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) setIsDeleteModalOpen(false);
        }}
        title="Confirm Delete Product"
        subtitle="This action cannot be undone"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-900 dark:text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-rose-800 dark:text-rose-300">
                Delete &quot;{productToDelete?.name}&quot;?
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Are you sure you want to delete this product from your inventory catalog? This will remove the item entry and update stock valuation totals.
              </p>
            </div>
          </div>

          {productToDelete && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">SKU:</span>
                <span className="text-slate-900 dark:text-slate-100 font-bold">{productToDelete.sku || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Stock:</span>
                <span className="text-slate-900 dark:text-slate-100 font-bold">{productToDelete.currentStock} {productToDelete.unit?.shortName || 'PCS'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stock Value:</span>
                <span className="text-slate-900 dark:text-slate-100 font-bold">{formatINR(productToDelete.stockValue || (productToDelete.currentStock * productToDelete.purchasePrice))}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Item'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
