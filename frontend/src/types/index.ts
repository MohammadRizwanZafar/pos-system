export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface Role {
  id: number;
  name: "super_admin" | "admin" | "cashier";
  guard_name: string;
}

export interface Shop {
  id: number;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  owner?: User | null;
  users?: User[];
  cashiers_count?: number;
  store_setting?: StoreSettings | null;
  created_at?: string;
}

export interface User {
  id: number;
  shop_id: number | null;
  name: string;
  email: string;
  is_active: boolean;
  roles: Role[];
  shop?: Shop | null;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface Product {
  id: number;
  category_id: number | null;
  name: string;
  sku: string | null;
  barcode: string | null;
  image: string | null;
  image_url: string | null;
  price: string;
  cost: string | null;
  stock: number;
  is_active: boolean;
  category?: Category | null;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  price: string;
  cost?: string;
  quantity: number;
  total: string;
  product?: Product;
}

export interface Sale {
  id: number;
  invoice_no: string;
  user_id: number;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  amount_paid: string;
  change_amount: string;
  note: string | null;
  status?: "completed" | "partially_returned" | "fully_returned";
  refunded_amount?: string;
  net_total?: number;
  created_at: string;
  updated_at: string;
  user?: User;
  items?: SaleItem[];
}

export interface ReturnableSaleItem {
  id: number;
  product_id: number;
  product_name: string;
  price: string;
  quantity: number;
  returned_quantity: number;
  remaining_quantity: number;
  total: string;
}

export interface ReturnableSale {
  id: number;
  invoice_no: string;
  created_at: string;
  total: string;
  user?: User;
  items: ReturnableSaleItem[];
}

export interface SaleReturnItem {
  id: number;
  sale_return_id: number;
  sale_item_id: number;
  product_id: number;
  product_name: string;
  price: string;
  quantity: number;
  total: string;
}

export interface SaleReturn {
  id: number;
  sale_id: number;
  user_id: number;
  return_no: string;
  refund_amount: string;
  note: string | null;
  returned_at: string;
  created_at: string;
  user?: User;
  sale?: Sale;
  items?: SaleReturnItem[];
}

export interface CreateSalePayload {
  items: { product_id: number; quantity: number }[];
  discount?: number;
  amount_paid: number;
  note?: string;
}

export interface Expense {
  id: number;
  user_id: number;
  title: string;
  category: string;
  amount: string;
  expense_date: string;
  note: string | null;
  user?: User;
}

export interface OpeningCash {
  id: number;
  user_id: number;
  business_date: string;
  amount: string;
  note: string | null;
  user?: User;
}

export interface StoreSettings {
  id: number;
  store_name: string;
  address: string | null;
  phone: string | null;
  tax_percent: string;
  currency_symbol: string;
  receipt_footer: string | null;
}

export interface DashboardStats {
  period: string;
  from_date: string;
  to_date: string;
  opening_cash: number;
  total_sales: number;
  order_count: number;
  total_expenses: number;
  cash_in_hand: number;
  profit: number;
  net_profit: number;
}

export interface SoldProductItem {
  sold_date: string;
  product_id: number | null;
  product_name: string;
  sku: string | null;
  quantity_sold: number;
  times_sold: number;
  unit_cost: number;
  total_cost: number;
  net_amount: number;
}

export interface SoldProductsData {
  period: string;
  from_date: string;
  to_date: string;
  product_count: number;
  total_quantity: number;
  total_cost: number;
  total_amount: number;
  items: SoldProductItem[];
  meta?: PaginationMeta | null;
}

export interface ReportData {
  type: string;
  from_date: string;
  to_date: string;
  total_sales: number;
  order_count: number;
  profit?: number;
  sales?: Sale[];
  sales_meta?: PaginationMeta | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
