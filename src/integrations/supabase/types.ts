export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_rule_users: {
        Row: {
          assigned_at: string
          rule_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          rule_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          rule_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_rule_users_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "access_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      access_rules: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_user_credentials: {
        Row: {
          created_at: string
          generated_password: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_password: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generated_password?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      assistant_items: {
        Row: {
          content: string | null
          created_at: string
          id: string
          kind: string
          metadata: Json | null
          storage_path: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          kind: string
          metadata?: Json | null
          storage_path?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json | null
          storage_path?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assistant_messages: {
        Row: {
          content: Json
          created_at: string
          id: string
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "assistant_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          hours: number | null
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          hours?: number | null
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          hours?: number | null
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      candidates: {
        Row: {
          ai_score: number
          applied_date: string
          assigned_to: string | null
          attachments: Json
          created_at: string
          created_by: string | null
          email: string | null
          experience: string | null
          id: string
          job_posting_id: string | null
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          resume_url: string | null
          review_decision: string | null
          review_note: string | null
          reviewed_at: string | null
          skills: string[]
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          ai_score?: number
          applied_date?: string
          assigned_to?: string | null
          attachments?: Json
          created_at?: string
          created_by?: string | null
          email?: string | null
          experience?: string | null
          id?: string
          job_posting_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          resume_url?: string | null
          review_decision?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          skills?: string[]
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          ai_score?: number
          applied_date?: string
          assigned_to?: string | null
          attachments?: Json
          created_at?: string
          created_by?: string | null
          email?: string | null
          experience?: string | null
          id?: string
          job_posting_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          resume_url?: string | null
          review_decision?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          skills?: string[]
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversation_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_group: boolean
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_group?: boolean
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_group?: boolean
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      custom_roles: {
        Row: {
          allowed_sections: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          permissions: Json
          updated_at: string
          workflow_slot: string | null
        }
        Insert: {
          allowed_sections?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          permissions?: Json
          updated_at?: string
          workflow_slot?: string | null
        }
        Update: {
          allowed_sections?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          permissions?: Json
          updated_at?: string
          workflow_slot?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          budget: number | null
          created_at: string
          description: string | null
          id: string
          manager_id: string | null
          manager_name: string | null
          name: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          manager_name?: string | null
          name: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          manager_name?: string | null
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          approver_comment: string | null
          approver_id: string | null
          body_html: string | null
          category: string | null
          created_at: string
          description: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          owner_id: string
          priority: string
          receiver_name: string | null
          reviewed_at: string | null
          status: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          approver_comment?: string | null
          approver_id?: string | null
          body_html?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          owner_id: string
          priority?: string
          receiver_name?: string | null
          reviewed_at?: string | null
          status?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          approver_comment?: string | null
          approver_id?: string | null
          body_html?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          owner_id?: string
          priority?: string
          receiver_name?: string | null
          reviewed_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          avatar: string | null
          birthday: string | null
          created_at: string
          department: string | null
          email: string | null
          hire_date: string | null
          id: string
          location: string | null
          manager: string | null
          name: string
          organization_id: string | null
          performance_score: number | null
          phone: string | null
          position: string | null
          profile_id: string | null
          salary: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          birthday?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string
          location?: string | null
          manager?: string | null
          name: string
          organization_id?: string | null
          performance_score?: number | null
          phone?: string | null
          position?: string | null
          profile_id?: string | null
          salary?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          birthday?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string
          location?: string | null
          manager?: string | null
          name?: string
          organization_id?: string | null
          performance_score?: number | null
          phone?: string | null
          position?: string | null
          profile_id?: string | null
          salary?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          created_at: string
          department: string | null
          description: string | null
          id: string
          posted_by: string | null
          requirements: string[]
          salary: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          posted_by?: string | null
          requirements?: string[]
          salary?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          posted_by?: string | null
          requirements?: string[]
          salary?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          archived: boolean
          attachments: Json
          content: string
          conversation_id: string
          created_at: string
          edited: boolean
          forwarded: boolean
          id: string
          read_at: string | null
          reply_to_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          attachments?: Json
          content: string
          conversation_id: string
          created_at?: string
          edited?: boolean
          forwarded?: boolean
          id?: string
          read_at?: string | null
          reply_to_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          attachments?: Json
          content?: string
          conversation_id?: string
          created_at?: string
          edited?: boolean
          forwarded?: boolean
          id?: string
          read_at?: string | null
          reply_to_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_order_assignees: {
        Row: {
          created_at: string
          decided_at: string | null
          id: string
          note: string | null
          payment_order_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          id?: string
          note?: string | null
          payment_order_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          id?: string
          note?: string | null
          payment_order_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_order_assignees_payment_order_id_fkey"
            columns: ["payment_order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_orders: {
        Row: {
          budget: number
          created_at: string
          created_by: string
          currency: string
          department_id: string | null
          department_name: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          paid_at: string | null
          paid_by: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          budget?: number
          created_at?: string
          created_by: string
          currency?: string
          department_id?: string | null
          department_name?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget?: number
          created_at?: string
          created_by?: string
          currency?: string
          department_id?: string | null
          department_name?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_orders_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_orders_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allowed_sections: Json
          avatar_url: string | null
          birthday: string | null
          created_at: string
          department: string | null
          email: string
          guest_id: string | null
          id: string
          last_seen: string | null
          linked_employee: string | null
          name: string
          organization: string | null
          permissions: Json
          phone: string | null
          position: string | null
          preferred_language: string
          section_access: Json
          status: string
          updated_at: string
          username: string | null
        }
        Insert: {
          allowed_sections?: Json
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          department?: string | null
          email: string
          guest_id?: string | null
          id: string
          last_seen?: string | null
          linked_employee?: string | null
          name: string
          organization?: string | null
          permissions?: Json
          phone?: string | null
          position?: string | null
          preferred_language?: string
          section_access?: Json
          status?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          allowed_sections?: Json
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          department?: string | null
          email?: string
          guest_id?: string | null
          id?: string
          last_seen?: string | null
          linked_employee?: string | null
          name?: string
          organization?: string | null
          permissions?: Json
          phone?: string | null
          position?: string | null
          preferred_language?: string
          section_access?: Json
          status?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          checklist: Json | null
          created_at: string
          department: string | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          owner_id: string | null
          priority: string | null
          progress: number | null
          status: string | null
          tags: string[] | null
          team: Json | null
          updated_at: string
        }
        Insert: {
          checklist?: Json | null
          created_at?: string
          department?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          owner_id?: string | null
          priority?: string | null
          progress?: number | null
          status?: string | null
          tags?: string[] | null
          team?: Json | null
          updated_at?: string
        }
        Update: {
          checklist?: Json | null
          created_at?: string
          department?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          priority?: string | null
          progress?: number | null
          status?: string | null
          tags?: string[] | null
          team?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          color: string | null
          completed: boolean
          created_at: string
          date: string
          description: string | null
          id: string
          time: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          completed?: boolean
          created_at?: string
          date: string
          description?: string | null
          id?: string
          time?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          completed?: boolean
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          time?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          created_at: string
          date: string
          employee_id: string | null
          employee_name: string | null
          end_time: string
          id: string
          location: string | null
          notes: string | null
          role: string | null
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          employee_id?: string | null
          employee_name?: string | null
          end_time: string
          id?: string
          location?: string | null
          notes?: string | null
          role?: string | null
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          employee_id?: string | null
          employee_name?: string | null
          end_time?: string
          id?: string
          location?: string | null
          notes?: string | null
          role?: string | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      shooting_request_history: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          request_id: string
          to_status: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          request_id: string
          to_status?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          request_id?: string
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shooting_request_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "shooting_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      shooting_requests: {
        Row: {
          assignee_id: string | null
          created_at: string
          decline_reason: string | null
          description: string | null
          director_decided_at: string | null
          director_id: string | null
          director_note: string | null
          driver_assigned_at: string | null
          driver_id: string | null
          equipment: Json | null
          equipment_assigned_at: string | null
          equipment_note: string | null
          id: string
          location: string | null
          moderator_decided_at: string | null
          moderator_id: string | null
          moderator_note: string | null
          requester_id: string | null
          scheduled_date: string | null
          sensitive: boolean
          status: string | null
          tech_supply_id: string | null
          title: string
          updated_at: string
          vehicle_info: string | null
          workflow_status: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          decline_reason?: string | null
          description?: string | null
          director_decided_at?: string | null
          director_id?: string | null
          director_note?: string | null
          driver_assigned_at?: string | null
          driver_id?: string | null
          equipment?: Json | null
          equipment_assigned_at?: string | null
          equipment_note?: string | null
          id?: string
          location?: string | null
          moderator_decided_at?: string | null
          moderator_id?: string | null
          moderator_note?: string | null
          requester_id?: string | null
          scheduled_date?: string | null
          sensitive?: boolean
          status?: string | null
          tech_supply_id?: string | null
          title: string
          updated_at?: string
          vehicle_info?: string | null
          workflow_status?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          decline_reason?: string | null
          description?: string | null
          director_decided_at?: string | null
          director_id?: string | null
          director_note?: string | null
          driver_assigned_at?: string | null
          driver_id?: string | null
          equipment?: Json | null
          equipment_assigned_at?: string | null
          equipment_note?: string | null
          id?: string
          location?: string | null
          moderator_decided_at?: string | null
          moderator_id?: string | null
          moderator_note?: string | null
          requester_id?: string | null
          scheduled_date?: string | null
          sensitive?: boolean
          status?: string | null
          tech_supply_id?: string | null
          title?: string
          updated_at?: string
          vehicle_info?: string | null
          workflow_status?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assignee_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          order_index: number | null
          priority: string | null
          project_id: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          order_index?: number | null
          priority?: string | null
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          order_index?: number | null
          priority?: string | null
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_custom_roles: {
        Row: {
          assigned_at: string
          custom_role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          custom_role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          custom_role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_custom_roles_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          notifications: Json
          preferences: Json
          security: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          notifications?: Json
          preferences?: Json
          security?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          notifications?: Json
          preferences?: Json
          security?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicle_trips: {
        Row: {
          created_at: string
          driver_id: string
          end_mileage: number | null
          id: string
          miles_driven: number | null
          notes: string | null
          odometer_end_photo_url: string | null
          odometer_start_photo_url: string | null
          plate_photo_url: string | null
          shooting_request_id: string | null
          start_mileage: number
          status: string
          trip_date: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          end_mileage?: number | null
          id?: string
          miles_driven?: number | null
          notes?: string | null
          odometer_end_photo_url?: string | null
          odometer_start_photo_url?: string | null
          plate_photo_url?: string | null
          shooting_request_id?: string | null
          start_mileage?: number
          status?: string
          trip_date?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          end_mileage?: number | null
          id?: string
          miles_driven?: number | null
          notes?: string | null
          odometer_end_photo_url?: string | null
          odometer_start_photo_url?: string | null
          plate_photo_url?: string | null
          shooting_request_id?: string | null
          start_mileage?: number
          status?: string
          trip_date?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_trips_shooting_request_id_fkey"
            columns: ["shooting_request_id"]
            isOneToOne: false
            referencedRelation: "shooting_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          assigned_driver_id: string | null
          color: string | null
          created_at: string
          current_mileage: number
          id: string
          make: string | null
          model: string | null
          notes: string | null
          photo_url: string | null
          plate_number: string
          status: string
          updated_at: string
          year: number | null
        }
        Insert: {
          assigned_driver_id?: string | null
          color?: string | null
          created_at?: string
          current_mileage?: number
          id?: string
          make?: string | null
          model?: string | null
          notes?: string | null
          photo_url?: string | null
          plate_number: string
          status?: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          assigned_driver_id?: string | null
          color?: string | null
          created_at?: string
          current_mileage?: number
          id?: string
          make?: string | null
          model?: string | null
          notes?: string | null
          photo_url?: string | null
          plate_number?: string
          status?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      admin_user_credentials_masked: {
        Row: {
          created_at: string | null
          password_hint: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          password_hint?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          password_hint?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      departments_public: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          manager_name: string | null
          name: string | null
          organization_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          manager_name?: string | null
          name?: string | null
          organization_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          manager_name?: string | null
          name?: string | null
          organization_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations_public: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          name: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          status?: string | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          id: string | null
          last_seen: string | null
          name: string | null
          organization: string | null
          position: string | null
          preferred_language: string | null
          status: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          id?: string | null
          last_seen?: string | null
          name?: string | null
          organization?: string | null
          position?: string | null
          preferred_language?: string | null
          status?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          id?: string | null
          last_seen?: string | null
          name?: string | null
          organization?: string | null
          position?: string | null
          preferred_language?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_notification: {
        Args: {
          _actor_id: string
          _body: string
          _entity_id: string
          _entity_type: string
          _link: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
      get_public_document: {
        Args: { _id: string }
        Returns: {
          approver_name: string
          body_html: string
          category: string
          created_at: string
          description: string
          file_path: string
          file_type: string
          id: string
          owner_name: string
          receiver_name: string
          reviewed_at: string
          status: string
          title: string
          visibility: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_member: {
        Args: { _conv: string; _user: string }
        Returns: boolean
      }
      is_payment_order_assignee: {
        Args: { _order: string; _user: string }
        Returns: boolean
      }
      mark_messages_read: { Args: { _conv: string }; Returns: undefined }
      profile_privilege_fields_unchanged: {
        Args: {
          _allowed_sections: Json
          _id: string
          _permissions: Json
          _section_access: Json
        }
        Returns: boolean
      }
      set_user_system_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      sync_employee_from_profile: {
        Args: { _profile_id: string }
        Returns: undefined
      }
      touch_last_seen: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role:
        | "admin"
        | "hr"
        | "guest"
        | "shooting_moderator"
        | "director"
        | "tech_supply"
        | "driver"
        | "accountant"
        | "employee"
        | "head_of_drivers"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "hr",
        "guest",
        "shooting_moderator",
        "director",
        "tech_supply",
        "driver",
        "accountant",
        "employee",
        "head_of_drivers",
      ],
    },
  },
} as const
