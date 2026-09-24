/**
 * lib/api/products.ts
 *
 * Product catalog API module handling network requests for fetching, searching,
 * category filtering, and sorting products from DummyJSON.
 *
 * Architectural Principles:
 * 1. Single Shared Client: Uses the central `axiosClient` instance with auth/error interceptors.
 * 2. Explicit Typing: Strongly typed inputs and outputs without complex generic abstractions.
 * 3. Cancellation Support: All endpoints accept an optional `AbortSignal` for race-condition prevention.
 */

import { axiosClient } from "./axiosClient";
import { Product, ProductListResponse, CategoryItem, SortField, SortOrder } from "@/types";

export interface GetProductsParams {
  limit: number;
  skip: number;
  sortBy?: SortField;
  order?: SortOrder;
  signal?: AbortSignal;
}

export interface SearchProductsParams extends GetProductsParams {
  q: string;
}

export interface CategoryProductsParams extends GetProductsParams {
  category: string;
}

export interface GetProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

/**
 * Fetches a paginated and optionally sorted list of products.
 * Endpoint: GET /products?limit=&skip=&sortBy=&order=
 *
 * @param params - Pagination and optional sorting parameters
 * @returns Promise resolving to products list and total count
 */
export async function getProducts({
  limit,
  skip,
  sortBy,
  order,
  signal,
}: GetProductsParams): Promise<GetProductsResponse> {
  const response = await axiosClient.get<ProductListResponse>("/products", {
    params: {
      limit,
      skip,
      sortBy: sortBy || undefined,
      order: order || undefined,
    },
    signal,
  });

  return {
    products: response.data.products,
    total: response.data.total,
    skip: response.data.skip,
    limit: response.data.limit,
  };
}

/**
 * Searches products by title or description query string.
 * Endpoint: GET /products/search?q=&limit=&skip=&sortBy=&order=
 *
 * Note: DummyJSON supports sorting on search results, but cannot simultaneously
 * filter by category.
 *
 * @param params - Search query, pagination, and sorting parameters
 * @returns Promise resolving to matching products list and total count
 */
export async function searchProducts({
  q,
  limit,
  skip,
  sortBy,
  order,
  signal,
}: SearchProductsParams): Promise<GetProductsResponse> {
  const response = await axiosClient.get<ProductListResponse>("/products/search", {
    params: {
      q: q.trim(),
      limit,
      skip,
      sortBy: sortBy || undefined,
      order: order || undefined,
    },
    signal,
  });

  return {
    products: response.data.products,
    total: response.data.total,
    skip: response.data.skip,
    limit: response.data.limit,
  };
}

/**
 * Fetches products scoped to a specific category.
 * Endpoint: GET /products/category/:category?limit=&skip=&sortBy=&order=
 *
 * @param params - Category slug, pagination, and sorting parameters
 * @returns Promise resolving to category products list and total count
 */
export async function getProductsByCategory({
  category,
  limit,
  skip,
  sortBy,
  order,
  signal,
}: CategoryProductsParams): Promise<GetProductsResponse> {
  const response = await axiosClient.get<ProductListResponse>(
    `/products/category/${encodeURIComponent(category)}`,
    {
      params: {
        limit,
        skip,
        sortBy: sortBy || undefined,
        order: order || undefined,
      },
      signal,
    }
  );

  return {
    products: response.data.products,
    total: response.data.total,
    skip: response.data.skip,
    limit: response.data.limit,
  };
}

/**
 * Fetches the available catalog categories from DummyJSON.
 * Endpoint: GET /products/categories
 *
 * Normalizes both string[] and object[] schemas returned across DummyJSON versions
 * into standard CategoryItem objects.
 *
 * @returns Promise resolving to list of CategoryItem objects
 */
export async function getCategories(): Promise<CategoryItem[]> {
  const response = await axiosClient.get<unknown>("/products/categories");
  const data = response.data;

  if (Array.isArray(data)) {
    return data.map((item) => {
      if (typeof item === "string") {
        return {
          slug: item,
          name: item.charAt(0).toUpperCase() + item.slice(1).replace(/-/g, " "),
          url: `https://dummyjson.com/products/category/${item}`,
        };
      }
      return {
        slug: item.slug || String(item),
        name: item.name || (item.slug ? item.slug.charAt(0).toUpperCase() + item.slug.slice(1).replace(/-/g, " ") : String(item)),
        url: item.url,
      };
    });
  }

  return [];
}

/**
 * Fetches a single product by unique ID from DummyJSON GET /products/:id.
 *
 * @param id - Unique numeric product ID
 * @returns Promise resolving to the complete Product record
 */
export async function getProductById(id: number | string): Promise<Product> {
  const response = await axiosClient.get<Product>(`/products/${id}`);
  return response.data;
}
