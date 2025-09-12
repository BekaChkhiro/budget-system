export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// User role type
export type UserRole = 'user' | 'admin';

// User profile type
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          title: string
          total_budget: number
          payment_type: 'single' | 'installment'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          total_budget: number
          payment_type: 'single' | 'installment'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          total_budget?: number
          payment_type?: 'single' | 'installment'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_installments: {
        Row: {
          id: string
          project_id: string
          installment_number: number
          amount: number
          due_date: string
          is_paid: boolean
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          installment_number: number
          amount: number
          due_date: string
          is_paid?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          installment_number?: number
          amount?: number
          due_date?: string
          is_paid?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_installments_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          project_id: string
          installment_id: string | null
          amount: number
          transaction_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          installment_id?: string | null
          amount: number
          transaction_date?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          installment_id?: string | null
          amount?: number
          transaction_date?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_installment_id_fkey"
            columns: ["installment_id"]
            referencedRelation: "payment_installments"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      project_summary: {
        Row: {
          id: string
          title: string
          total_budget: number
          payment_type: 'single' | 'installment'
          created_at: string
          updated_at: string
          total_received: number
          remaining_amount: number
          payment_progress: number
          is_completed: boolean
        }
        Relationships: []
      }
      installment_summary: {
        Row: {
          id: string
          project_id: string
          installment_number: number
          amount: number
          due_date: string
          is_paid: boolean
          created_at: string
          paid_amount: number
          remaining_amount: number
          is_fully_paid: boolean
          is_overdue: boolean
          days_until_due: number
        }
        Relationships: []
      }
      dashboard_stats: {
        Row: {
          total_projects_count: number
          active_projects_count: number
          total_budget_sum: number
          total_received_sum: number
          total_remaining_sum: number
          overdue_installments_count: number
        }
        Relationships: []
      }
    }
    Functions: {
      get_project_balance: {
        Args: {
          project_uuid: string
        }
        Returns: number
      }
      check_installment_sum: {
        Args: {
          project_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      payment_type: 'single' | 'installment'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}