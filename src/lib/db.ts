import Dexie, { type EntityTable } from 'dexie';

export type LocalCategory = {
  id: string;
  name: string;
  slug: string;
  sync_status?: 'synced' | 'pending';
};

export type LocalProduct = {
  id: string;
  category_id: string;
  name: string;
  price: number;
  image_url: string;
  image_urls?: string[];
  is_available?: boolean;
  track_inventory?: boolean;
  inventory_count?: number;
  sync_status?: 'synced' | 'pending';
  is_archived?: boolean;
};

export type LocalOrder = {
  id: string; // uuid
  customer_name: string;
  table_number: string;
  order_type: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  created_at: string;
  receipt_number: string;
  sync_status: 'synced' | 'pending';
  discount?: number;
  discount_type?: 'percent' | 'amount';
  notes?: string;
};

export type LocalOrderItem = {
  id?: number; // auto-increment locally
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  notes: string;
};

export type LocalNotification = {
  id: string; // uuid
  type: 'order' | 'stock' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sync_status: 'synced' | 'pending';
};

export type LocalDiscount = {
  id: string;
  name: string;
  type: 'percent' | 'amount';
  value: number;
  is_active: boolean;
  sync_status?: 'synced' | 'pending';
};

export type LocalTable = {
  id: string;
  name: string;
  capacity?: number;
  is_active: boolean;
  sync_status?: 'synced' | 'pending';
};

class PosDatabase extends Dexie {
  categories!: EntityTable<LocalCategory, 'id'>;
  products!: EntityTable<LocalProduct, 'id'>;
  orders!: EntityTable<LocalOrder, 'id'>;
  orderItems!: EntityTable<LocalOrderItem, 'id'>;
  notifications!: EntityTable<LocalNotification, 'id'>;
  discounts!: EntityTable<LocalDiscount, 'id'>;
  diningTables!: EntityTable<LocalTable, 'id'>;

  constructor() {
    super('PosDatabase');
    this.version(2).stores({
      categories: 'id, slug', 
      products: 'id, category_id',
      orders: 'id, sync_status, created_at', 
      orderItems: '++id, order_id',
      notifications: 'id, is_read, sync_status, created_at'
    });
    this.version(3).stores({
      categories: 'id, slug, sync_status', 
      products: 'id, category_id, sync_status'
    });
    this.version(4).stores({
      discounts: 'id, is_active, sync_status'
    });
    this.version(5).stores({
      diningTables: 'id, is_active, sync_status'
    });
  }
}

export const db = new PosDatabase();
