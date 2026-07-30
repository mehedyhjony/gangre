export interface Brand {
  id: string;
  brand_id?: string;
  label: string;
  models?: Model[];
  is_active?: boolean;
  sort_order?: number;
}

export interface Model {
  id: string;
  model_id?: string;
  brand_id: string;
  label: string;
  price: number;
  base_ram?: number;
  base_rom?: number;
  is_active?: boolean;
}

export interface Slider {
  id?: number;
  sort_order: number;
  image_url: string;
  eye_text: string;
  title_line1: string;
  title_line2: string;
  description: string;
  price_tag1: string;
  price_tag2: string;
  bg_color: string;
  is_active?: boolean;
}

export interface Deduction {
  id?: number;
  damage_key: string;
  label: string;
  percentage: number;
}

export interface SiteConfig {
  water_penalty: number;
  floor_price: number;
}

export interface Ticket {
  id?: number;
  ticket_id: string;
  device: string;
  tags: string; // comma-separated damage keys
  estimate: string;
  expected: number;
  name: string;
  phone: string;
  area: string;
  address: string;
  pickup_date?: string | null;
  pickup_slot?: string;
  status: 'New' | 'Scheduled' | 'Pickup' | 'Paid';
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id?: number;
  ticket_id: string;
  sender: 'user' | 'admin';
  message: string;
  image_url: string | null;
  is_read: boolean;
  created_at?: string;
}

export interface Testimonial {
  id?: number;
  name: string;
  message: string;
  rating: number;
  image_url?: string | null;
  is_active?: boolean;
  sort_order: number;
}

export interface FAQ {
  id: number;
  sort_order: number;
  keywords: string[];
  reply: string;
  quickReplies?: string[];
}

export interface PageContent {
  nav?: {
    brand: string;
    link1: string;
    link2: string;
  };
  hero?: {
    kicker_title: string;
    main_title: string;
    description: string;
    floor_text: string;
  };
  tp_cards?: Array<{
    icon: string;
    title: string;
    desc: string;
  }>;
  form?: {
    kicker: string;
    title: string;
    hint: string;
    water: string;
    brand_label: string;
    model_label: string;
    ram_label: string;
    rom_label: string;
    est_label: string;
    est_note: string;
    name_label: string;
    phone_label: string;
    address_label: string;
    submit_text: string;
  };
  safety?: {
    kicker: string;
    title: string;
    description: string;
    btn1: string;
    btn2: string;
  };
  cta?: {
    kicker: string;
    title: string;
    desc: string;
    btn1: string;
    btn2: string;
  };
  footer?: {
    brand: string;
    tagline: string;
    phone: string;
    admin: string;
    copyright: string;
  };
  chat?: {
    title: string;
    hello: string;
    placeholder: string;
  };
}
