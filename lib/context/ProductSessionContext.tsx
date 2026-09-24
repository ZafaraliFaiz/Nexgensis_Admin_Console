"use client";

/**
 * lib/context/ProductSessionContext.tsx
 *
 * Client-Side Session Overlay Store for DummyJSON Write Simulation.
 *
 * Architectural Rationale:
 * 1. The Core Problem: DummyJSON is a public read-only mock API. When calling POST /products/add,
 *    PUT /products/:id, or DELETE /products/:id, DummyJSON responds with simulated success objects,
 *    but DOES NOT persist writes to its database. Subsequent GET calls return original static data.
 *
 * 2. The Solution (Session Overlay Pattern):
 *    We implement an in-memory & `sessionStorage`-backed overlay layer that intercepts and combines
 *    server-fetched data with client mutations (added items, edited overrides, and deleted IDs).
 *    - New products are prepended to lists.
 *    - Updated fields override static server data.
 *    - Deleted IDs are filtered out of all listings and detail views.
 *
 * 3. Session Durability:
 *    Storing mutations in `sessionStorage` ensures state survives browser page refreshes,
 *    providing a realistic, uninterrupted enterprise admin experience throughout the walkthrough.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Product } from "@/types";

interface SessionStoreData {
  addedProducts: Product[];
  updatedProducts: Record<string, Product>;
  deletedProductIds: string[];
}

interface ProductSessionContextType {
  // Session mutation recorders
  recordProductAdded: (product: Product) => void;
  recordProductUpdated: (product: Product) => void;
  recordProductDeleted: (id: number | string) => void;

  // Overlay application helpers
  applySessionOverlay: (
    fetchedProducts: Product[],
    serverTotal: number,
    options?: { category?: string; query?: string }
  ) => { products: Product[]; total: number };

  getSessionProduct: (id: number | string) => Product | null | "DELETED";
  isProductDeleted: (id: number | string) => boolean;
  clearSessionOverlay: () => void;
}

const SESSION_STORAGE_KEY = "nexgensis_product_session_overlay";

const ProductSessionContext = createContext<ProductSessionContextType | null>(null);

export function ProductSessionProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<SessionStoreData>({
    addedProducts: [],
    updatedProducts: {},
    deletedProductIds: [],
  });

  // Hydrate session store from sessionStorage on client mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setStore({
          addedProducts: Array.isArray(parsed.addedProducts) ? parsed.addedProducts : [],
          updatedProducts: parsed.updatedProducts || {},
          deletedProductIds: Array.isArray(parsed.deletedProductIds) ? parsed.deletedProductIds : [],
        });
      }
    } catch {
      // Gracefully handle storage parsing edge cases
    }
  }, []);

  // Persist updates to sessionStorage
  const persistStore = (newStore: SessionStoreData) => {
    setStore(newStore);
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newStore));
    } catch {
      // Gracefully handle storage quota or private mode restrictions
    }
  };

  /**
   * Records a newly created product in the session overlay.
   */
  const recordProductAdded = useCallback((product: Product) => {
    setStore((prev) => {
      // Remove any previous entry with matching ID if re-added
      const filtered = prev.addedProducts.filter((p) => String(p.id) !== String(product.id));
      const newStore: SessionStoreData = {
        ...prev,
        addedProducts: [product, ...filtered],
        // If it was previously marked as deleted, un-delete it
        deletedProductIds: prev.deletedProductIds.filter((id) => id !== String(product.id)),
      };
      persistStore(newStore);
      return newStore;
    });
  }, []);

  /**
   * Records an update/edit override for a specific product.
   */
  const recordProductUpdated = useCallback((product: Product) => {
    setStore((prev) => {
      const idStr = String(product.id);
      // If it was a locally added product, update it inside addedProducts too
      const updatedAdded = prev.addedProducts.map((p) =>
        String(p.id) === idStr ? { ...p, ...product } : p
      );

      const newStore: SessionStoreData = {
        ...prev,
        addedProducts: updatedAdded,
        updatedProducts: {
          ...prev.updatedProducts,
          [idStr]: { ...(prev.updatedProducts[idStr] || {}), ...product },
        },
      };
      persistStore(newStore);
      return newStore;
    });
  }, []);

  /**
   * Records a deletion in the session overlay.
   */
  const recordProductDeleted = useCallback((id: number | string) => {
    const idStr = String(id);
    setStore((prev) => {
      const newStore: SessionStoreData = {
        ...prev,
        addedProducts: prev.addedProducts.filter((p) => String(p.id) !== idStr),
        deletedProductIds: prev.deletedProductIds.includes(idStr)
          ? prev.deletedProductIds
          : [...prev.deletedProductIds, idStr],
      };
      persistStore(newStore);
      return newStore;
    });
  }, []);

  /**
   * Checks if a product ID has been deleted in this session.
   */
  const isProductDeleted = useCallback(
    (id: number | string): boolean => {
      return store.deletedProductIds.includes(String(id));
    },
    [store.deletedProductIds]
  );

  /**
   * Looks up a product in the session overlay:
   * - Returns "DELETED" if product was deleted in session
   * - Returns updated or added Product if found
   * - Returns null if not in session store (caller should use server data)
   */
  const getSessionProduct = useCallback(
    (id: number | string): Product | null | "DELETED" => {
      const idStr = String(id);
      if (store.deletedProductIds.includes(idStr)) {
        return "DELETED";
      }

      // Check updated products
      if (store.updatedProducts[idStr]) {
        return store.updatedProducts[idStr];
      }

      // Check added products
      const added = store.addedProducts.find((p) => String(p.id) === idStr);
      if (added) {
        return added;
      }

      return null;
    },
    [store]
  );

  /**
   * Combines server-fetched products with the local session overlay:
   * 1. Replaces updated items with client-edited overrides.
   * 2. Filters out items marked as deleted.
   * 3. Prepends matching session-added products.
   * 4. Accurately adjusts total count.
   */
  const applySessionOverlay = useCallback(
    (
      fetchedProducts: Product[],
      serverTotal: number,
      options?: { category?: string; query?: string }
    ): { products: Product[]; total: number } => {
      const deletedSet = new Set(store.deletedProductIds);

      // 1. Overlay updates and filter deletions on server results
      const mapped = fetchedProducts
        .filter((p) => !deletedSet.has(String(p.id)))
        .map((p) => {
          const idStr = String(p.id);
          return store.updatedProducts[idStr] ? { ...p, ...store.updatedProducts[idStr] } : p;
        });

      // 2. Identify relevant session-added products that match active filter/search
      const relevantAdded = store.addedProducts
        .filter((p) => !deletedSet.has(String(p.id)))
        .map((p) => {
          const idStr = String(p.id);
          return store.updatedProducts[idStr] ? { ...p, ...store.updatedProducts[idStr] } : p;
        })
        .filter((p) => {
          // Apply category filter if active
          if (options?.category && p.category.toLowerCase() !== options.category.toLowerCase()) {
            return false;
          }

          // Apply search query filter if active
          if (options?.query) {
            const q = options.query.toLowerCase();
            const matchTitle = p.title.toLowerCase().includes(q);
            const matchDesc = p.description.toLowerCase().includes(q);
            const matchBrand = p.brand?.toLowerCase().includes(q);
            if (!matchTitle && !matchDesc && !matchBrand) return false;
          }

          return true;
        });

      // Avoid duplicate keys if added products are somehow returned by server
      const existingIds = new Set(mapped.map((p) => String(p.id)));
      const uniqueAdded = relevantAdded.filter((p) => !existingIds.has(String(p.id)));

      // Combine added items at top of list
      const combinedProducts = [...uniqueAdded, ...mapped];
      const adjustedTotal = Math.max(
        0,
        serverTotal + uniqueAdded.length - store.deletedProductIds.length
      );

      return {
        products: combinedProducts,
        total: adjustedTotal,
      };
    },
    [store]
  );

  /**
   * Clears the entire session overlay (useful on logout or manual reset).
   */
  const clearSessionOverlay = useCallback(() => {
    const empty: SessionStoreData = {
      addedProducts: [],
      updatedProducts: {},
      deletedProductIds: [],
    };
    persistStore(empty);
  }, []);

  return (
    <ProductSessionContext.Provider
      value={{
        recordProductAdded,
        recordProductUpdated,
        recordProductDeleted,
        applySessionOverlay,
        getSessionProduct,
        isProductDeleted,
        clearSessionOverlay,
      }}
    >
      {children}
    </ProductSessionContext.Provider>
  );
}

export function useProductSession() {
  const context = useContext(ProductSessionContext);
  if (!context) {
    throw new Error("useProductSession must be used within a ProductSessionProvider");
  }
  return context;
}
