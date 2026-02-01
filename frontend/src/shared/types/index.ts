// Shared domain models used across features

export interface User {
  user_id: number;
  email: string;
  role: string;
  email_verified: boolean;
  google_id?: string;
  created_at?: Date;
  last_login_at?: Date;
}

export interface UserProfile {
  profile_id: number;
  user_id: number;
  first_name?: string;
  last_name?: string;
  bio?: string;
  skills?: string;
  location?: string;
  profile_avatar?: string;
  updated_at?: Date;
}

export interface Project {
  project_id: number;
  user_id: number;
  project_name: string;
  title?: string;
  description?: string;
  image_url?: string;
  created_at?: Date;
}

export interface Portfolio {
  portfolio_id: number;
  user_id: number;
  portfolio_url?: string;
  is_public: boolean;
}

export interface Category {
  category_id: number;
  category_name: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export type AsyncResult<T> = Promise<ApiResponse<T>>;
