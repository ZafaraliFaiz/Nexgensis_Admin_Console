/**
 * lib/api/products.ts
 *
 * Product catalog API module handling network requests for fetching products.
 *
 * Architectural Principles:
 * 1. Centralized Client: Uses the shared `axiosClient` instance with request/response interceptors.
 * 2. Explicit Contracts: Strongly typed parameters (`GetProductsParams`) and return objects.
 * 3. Separation of Concerns: Encapsulates query parameter formulation and response payload unpacking.
 */

import { axiosClient } from "./axiosClient";
import { Product, ProductListResponse } from "@/types";

export interface GetProductsParams {
  limit: number;
  skip: number;
}

export interface GetProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

/**
 * Fetches a paginated slice of products from DummyJSON GET /products.
 *
 * @param params - Object containing pagination slice { limit, skip }
 * @returns Promise resolving to products array, total count, limit, and skip values
 */
export async function getProducts({
  limit,
  skip,
}: GetProductsParams): Promise<GetProductsResponse> {
  const response = await axiosClient.get<ProductListResponse>("/products", {
    params: {
      limit,
      skip,
    },
  });

  return {
    products: response.data.products,
    total: response.data.total,
    skip: response.data.skip,
    limit: response.data.limit,
  };
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
