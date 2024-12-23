// types/index.ts
export * from "./api";

export interface Spores {
  id: string;
  content: string;
  cluster_id: string;
  is_burned: boolean;
  owner_address: string;
  content_type: string;
  created_at: string;
  updated_at: string;
}

export interface BitList {
  domainlist: string[];
  bondingdomain: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}
