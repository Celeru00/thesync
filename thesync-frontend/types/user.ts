export interface UserResponse {
  id: string;
  role_id: number;
  role_name?: string | null;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  created_at: string;
}
