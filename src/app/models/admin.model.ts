export interface DashboardStats {
  totalProducts: number;
  outOfStockProducts: number;
  totalCategories: number;
  totalOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalSales: number;
}

export interface LowStockProduct {
  productId: number;
  name: string;
  stock: number;
  price: number;
  status: 'Available' | 'OutOfStock';
  productImgUrl: string;
}

export interface BestSellingBrand {
  brandId: number;
  brandName: string;
  totalSold: number;
}

/** The API returns "Pending" | "Delivered" | "Cancelled" but expects upper-case when updating. */
export type OrderStatus = 'Pending' | 'Delivered' | 'Cancelled';

export interface OrderApi {
  orderId: number;
  totalAmount: number;
  paymentMethod: string;
  orderStatus: OrderStatus;
  createdAt: string;
  shippingAddress: string;
  customerPhoneNumber: string;
  customerFullName: string;
  userId: number;
}

export interface OrderItemApi {
  orderItemId: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderDetailsApi extends OrderApi {
  items: OrderItemApi[];
}

export interface LookupItem {
  id: number;
  name: string;
}

export type LookupKind = 'category' | 'brand';

/** Values of the product form in the admin panel. */
export interface ProductForm {
  name: string;
  description: string;
  price: number | null;
  warranty: string;
  stock: number | null;          // only used when creating (later changes go through "adjust stock")
  isFeatured: boolean;
  brandId: number | null;
  categoryId: number | null;
  specifications: { name: string; value: string }[];
}

export function emptyProductForm(): ProductForm {
  return {
    name: '', description: '', price: null, warranty: '', stock: 0,
    isFeatured: false, brandId: null, categoryId: null, specifications: []
  };
}
