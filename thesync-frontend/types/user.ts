export interface User {
  id: string;
  role_id: number;
  role_name?: string | null;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  identifier?: string | null;
  department?: string | null;
  created_at: string;
}

/** Expanded user response returned by API-facing models */
export type UserResponse = User;
