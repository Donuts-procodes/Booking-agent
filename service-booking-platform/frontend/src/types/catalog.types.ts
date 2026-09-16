export interface Category {
  id: string;
  merchant_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  category_id: string;
  name: string;
  description: string;
  image_url: string;
  price_range: string | null;
  duration_minutes?: number | null;
  is_active: boolean;
  created_at: string;
}
