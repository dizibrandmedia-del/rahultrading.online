'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Package, Search, X, Check, Layers, AlertCircle } from 'lucide-react';
import { formatINR } from '@/lib/currency';

export interface ItemSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectProduct: (product: any) => void;
  products: any[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  priceType?: 'sale' | 'purchase';
  className?: string;
}

export function ItemSearchInput({
  value,
  onChange,
  onSelectProduct,
  products = [],
  placeholder = 'Item name (e.g. JAU AATA)',
  required = false,
  disabled = false,
  priceType = 'sale',
  className = '',
}: ItemSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    const query = (value || '').trim().toLowerCase();
    if (!query) {
      return [];
    }

    return products.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const barcode = (p.barcode || '').toLowerCase();
      const hsn = (p.hsnCode || '').toLowerCase();
      const category = (p.category?.name || '').toLowerCase();

      return (
        name.includes(query) ||
        sku.includes(query) ||
        barcode.includes(query) ||
        hsn.includes(query) ||
        category.includes(query)
      );
    });
  }, [value, products]);

  // Reset highlighted index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(filteredProducts.length > 0 ? 0 : -1);
  }, [filteredProducts]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (product: any) => {
    onSelectProduct(product);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredProducts.length === 0) {
      if (e.key === 'ArrowDown' && filteredProducts.length > 0) {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredProducts.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < filteredProducts.length) {
        e.preventDefault();
        handleSelect(filteredProducts[highlightedIndex]);
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleFocus = () => {
    if ((value || '').trim().length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className={`w-full px-2.5 py-1.5 pr-7 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-normal focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all ${className}`}
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Clear item name"
            tabIndex={-1}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown Popover */}
      {isOpen && (value || '').trim().length > 0 && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[300px] max-w-[440px] z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {filteredProducts.length > 0 ? (
            <div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Package className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                  Inventory Matches ({filteredProducts.length})
                </span>
                <span className="text-[9px] font-normal text-slate-400">↑↓ to navigate, ↵ to pick</span>
              </div>

              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
                {filteredProducts.map((prod, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  const price = priceType === 'purchase' ? prod.purchasePrice : prod.salePrice;
                  const unitName = prod.unit?.shortName || prod.unit?.name || 'Unit';
                  const stock = prod.currentStock ?? 0;

                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleSelect(prod)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                        isHighlighted
                          ? 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-950 dark:text-cyan-50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                          <span>{prod.name}</span>
                          {prod.category?.name && (
                            <span className="text-[10px] font-normal px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                              {prod.category.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {prod.hsnCode && <span>HSN: {prod.hsnCode}</span>}
                          {prod.sku && <span>SKU: {prod.sku}</span>}
                          {prod.barcode && <span>Bar: {prod.barcode}</span>}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {formatINR(price || 0)}
                          <span className="text-[10px] font-normal text-slate-400">/{unitName}</span>
                        </div>
                        <div className="mt-0.5">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium ${
                              stock > 5
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : stock > 0
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            Stock: {stock} {unitName}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
              <p className="font-medium text-slate-700 dark:text-slate-300">
                No inventory item found matching &quot;{value}&quot;
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Press Enter or continue typing to use as a custom product name.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
