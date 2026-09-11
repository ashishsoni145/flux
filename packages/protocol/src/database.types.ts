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
      agent_checkpoints: {
        Row: {
          changed_files: Json
          created_at: string
          description: string
          diff_content: string | null
          git_commit_hash: string | null
          id: string
          parent_checkpoint_id: string | null
          project_id: string
          run_id: string
          status: string
          storage_path: string | null
          user_id: string
        }
        Insert: {
          changed_files?: Json
          created_at?: string
          description: string
          diff_content?: string | null
          git_commit_hash?: string | null
          id?: string
          parent_checkpoint_id?: string | null
          project_id: string
          run_id: string
          status?: string
          storage_path?: string | null
          user_id: string
        }
        Update: {
          changed_files?: Json
          created_at?: string
          description?: string
          diff_content?: string | null
          git_commit_hash?: string | null
          id?: string
          parent_checkpoint_id?: string | null
          project_id?: string
          run_id?: string
          status?: string
          storage_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_checkpoints_parent_checkpoint_id_fkey"
            columns: ["parent_checkpoint_id"]
            isOneToOne: false
            referencedRelation: "agent_checkpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_checkpoints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_checkpoints_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_events: {
        Row: {
          actor: string
          created_at: string
          duration_ms: number
          event_type: string
          id: string
          input_metadata: Json
          output_metadata: Json
          run_id: string
          status: string
          tool: string | null
        }
        Insert: {
          actor?: string
          created_at?: string
          duration_ms?: number
          event_type: string
          id?: string
          input_metadata?: Json
          output_metadata?: Json
          run_id: string
          status?: string
          tool?: string | null
        }
        Update: {
          actor?: string
          created_at?: string
          duration_ms?: number
          event_type?: string
          id?: string
          input_metadata?: Json
          output_metadata?: Json
          run_id?: string
          status?: string
          tool?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_events_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_permissions: {
        Row: {
          command_pattern: string | null
          created_at: string
          decision: string
          expires_at: string | null
          id: string
          organization_id: string | null
          permission_type: string
          project_id: string | null
          scope: string
          tool_name: string
          user_id: string
        }
        Insert: {
          command_pattern?: string | null
          created_at?: string
          decision: string
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          permission_type?: string
          project_id?: string | null
          scope?: string
          tool_name: string
          user_id: string
        }
        Update: {
          command_pattern?: string | null
          created_at?: string
          decision?: string
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          permission_type?: string
          project_id?: string | null
          scope?: string
          tool_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_permissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_plans: {
        Row: {
          affected_files: Json
          created_at: string
          dependencies: Json
          goal: string
          id: string
          required_permissions: Json
          risks: Json
          run_id: string
          status: string
          steps: Json
          verification_requirements: Json
        }
        Insert: {
          affected_files?: Json
          created_at?: string
          dependencies?: Json
          goal: string
          id?: string
          required_permissions?: Json
          risks?: Json
          run_id: string
          status?: string
          steps?: Json
          verification_requirements?: Json
        }
        Update: {
          affected_files?: Json
          created_at?: string
          dependencies?: Json
          goal?: string
          id?: string
          required_permissions?: Json
          risks?: Json
          run_id?: string
          status?: string
          steps?: Json
          verification_requirements?: Json
        }
        Relationships: [
          {
            foreignKeyName: "agent_plans_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_runs: {
        Row: {
          agent_type: string
          completion_time: string | null
          confidence: number | null
          conversation_id: string | null
          created_at: string
          current_step: string | null
          failure_reason: string | null
          goal: string
          id: string
          metadata: Json
          organization_id: string | null
          plan: Json
          project_id: string | null
          selected_model: string | null
          start_time: string
          status: string
          summary: string | null
          user_id: string
        }
        Insert: {
          agent_type?: string
          completion_time?: string | null
          confidence?: number | null
          conversation_id?: string | null
          created_at?: string
          current_step?: string | null
          failure_reason?: string | null
          goal: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          plan?: Json
          project_id?: string | null
          selected_model?: string | null
          start_time?: string
          status?: string
          summary?: string | null
          user_id: string
        }
        Update: {
          agent_type?: string
          completion_time?: string | null
          confidence?: number | null
          conversation_id?: string | null
          created_at?: string
          current_step?: string | null
          failure_reason?: string | null
          goal?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          plan?: Json
          project_id?: string | null
          selected_model?: string | null
          start_time?: string
          status?: string
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_runs_selected_model_fkey"
            columns: ["selected_model"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_models: {
        Row: {
          capabilities: Json
          context_window: number
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          is_free_tier: boolean
          metadata: Json
          model_name: string
          pricing_credits_input_1k: number
          pricing_credits_output_1k: number
          pricing_input_1m: number
          pricing_output_1m: number
          provider_id: string
          supports_reasoning: boolean
          supports_tools: boolean
          supports_vision: boolean
        }
        Insert: {
          capabilities?: Json
          context_window?: number
          created_at?: string
          display_name: string
          id: string
          is_active?: boolean
          is_free_tier?: boolean
          metadata?: Json
          model_name: string
          pricing_credits_input_1k?: number
          pricing_credits_output_1k?: number
          pricing_input_1m?: number
          pricing_output_1m?: number
          provider_id: string
          supports_reasoning?: boolean
          supports_tools?: boolean
          supports_vision?: boolean
        }
        Update: {
          capabilities?: Json
          context_window?: number
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          is_free_tier?: boolean
          metadata?: Json
          model_name?: string
          pricing_credits_input_1k?: number
          pricing_credits_output_1k?: number
          pricing_input_1m?: number
          pricing_output_1m?: number
          provider_id?: string
          supports_reasoning?: boolean
          supports_tools?: boolean
          supports_vision?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ai_models_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_providers: {
        Row: {
          api_base_url: string | null
          created_at: string
          id: string
          is_active: boolean
          metadata: Json
          name: string
        }
        Insert: {
          api_base_url?: string | null
          created_at?: string
          id: string
          is_active?: boolean
          metadata?: Json
          name: string
        }
        Update: {
          api_base_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
        }
        Relationships: []
      }
      ai_requests: {
        Row: {
          agent_run_id: string | null
          created_at: string
          credits_consumed: number
          error_details: Json | null
          id: string
          input_tokens: number
          latency_ms: number
          model: string
          output_tokens: number
          project_id: string | null
          provider: string
          provider_cost: number
          request_status: string
          total_tokens: number
          user_id: string
        }
        Insert: {
          agent_run_id?: string | null
          created_at?: string
          credits_consumed?: number
          error_details?: Json | null
          id?: string
          input_tokens?: number
          latency_ms?: number
          model: string
          output_tokens?: number
          project_id?: string | null
          provider: string
          provider_cost?: number
          request_status?: string
          total_tokens?: number
          user_id: string
        }
        Update: {
          agent_run_id?: string | null
          created_at?: string
          credits_consumed?: number
          error_details?: Json | null
          id?: string
          input_tokens?: number
          latency_ms?: number
          model?: string
          output_tokens?: number
          project_id?: string | null
          provider?: string
          provider_cost?: number
          request_status?: string
          total_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_requests_agent_run"
            columns: ["agent_run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string | null
          id: string
          posted_at: string | null
          posted_by: string
          scope: Database["public"]["Enums"]["announcement_scope"]
          scope_id: string | null
          title: string
        }
        Insert: {
          body?: string | null
          id?: string
          posted_at?: string | null
          posted_by: string
          scope?: Database["public"]["Enums"]["announcement_scope"]
          scope_id?: string | null
          title: string
        }
        Update: {
          body?: string | null
          id?: string
          posted_at?: string | null
          posted_by?: string
          scope?: Database["public"]["Enums"]["announcement_scope"]
          scope_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          section_id: string
          subject_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          section_id: string
          subject_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          section_id?: string
          subject_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          created_at: string | null
          date: string
          id: string
          marked_by: string | null
          section_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          marked_by?: string | null
          section_id: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          marked_by?: string | null
          section_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string | null
          id: string
          name: string
          school_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          school_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      code_files: {
        Row: {
          content_hash: string
          file_path: string
          id: string
          indexed_at: string
          language: string | null
          project_id: string
          size_bytes: number
        }
        Insert: {
          content_hash: string
          file_path: string
          id?: string
          indexed_at?: string
          language?: string | null
          project_id: string
          size_bytes?: number
        }
        Update: {
          content_hash?: string
          file_path?: string
          id?: string
          indexed_at?: string
          language?: string | null
          project_id?: string
          size_bytes?: number
        }
        Relationships: [
          {
            foreignKeyName: "code_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      code_relationships: {
        Row: {
          id: string
          project_id: string
          relationship_type: string
          source_symbol_id: string
          target_symbol_id: string
        }
        Insert: {
          id?: string
          project_id: string
          relationship_type: string
          source_symbol_id: string
          target_symbol_id: string
        }
        Update: {
          id?: string
          project_id?: string
          relationship_type?: string
          source_symbol_id?: string
          target_symbol_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_relationships_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "code_relationships_source_symbol_id_fkey"
            columns: ["source_symbol_id"]
            isOneToOne: false
            referencedRelation: "code_symbols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "code_relationships_target_symbol_id_fkey"
            columns: ["target_symbol_id"]
            isOneToOne: false
            referencedRelation: "code_symbols"
            referencedColumns: ["id"]
          },
        ]
      }
      code_reviews: {
        Row: {
          affected_files: Json
          created_at: string
          findings: Json
          id: string
          line_references: Json
          project_id: string
          recommendation: string | null
          resolution_status: string
          review_status: string
          reviewer_model: string
          run_id: string
          severity: string
        }
        Insert: {
          affected_files?: Json
          created_at?: string
          findings?: Json
          id?: string
          line_references?: Json
          project_id: string
          recommendation?: string | null
          resolution_status?: string
          review_status?: string
          reviewer_model: string
          run_id: string
          severity?: string
        }
        Update: {
          affected_files?: Json
          created_at?: string
          findings?: Json
          id?: string
          line_references?: Json
          project_id?: string
          recommendation?: string | null
          resolution_status?: string
          review_status?: string
          reviewer_model?: string
          run_id?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "code_reviews_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      code_symbols: {
        Row: {
          documentation: string | null
          embedding: string | null
          file_id: string
          id: string
          line_end: number
          line_start: number
          name: string
          project_id: string
          symbol_type: string
        }
        Insert: {
          documentation?: string | null
          embedding?: string | null
          file_id: string
          id?: string
          line_end: number
          line_start: number
          name: string
          project_id: string
          symbol_type: string
        }
        Update: {
          documentation?: string | null
          embedding?: string | null
          file_id?: string
          id?: string
          line_end?: number
          line_start?: number
          name?: string
          project_id?: string
          symbol_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_symbols_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "code_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "code_symbols_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          mode: string
          project_id: string | null
          selected_model: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          mode?: string
          project_id?: string | null
          selected_model?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          mode?: string
          project_id?: string | null
          selected_model?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_selected_model_fkey"
            columns: ["selected_model"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          amount: number
          class_id: string
          created_at: string | null
          due_date: string | null
          id: string
          title: string
        }
        Insert: {
          amount: number
          class_id: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          title: string
        }
        Update: {
          amount?: number
          class_id?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_events: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          event_date: string | null
          id: string
          scope: Database["public"]["Enums"]["gallery_scope"]
          scope_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          event_date?: string | null
          id?: string
          scope?: Database["public"]["Enums"]["gallery_scope"]
          scope_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          event_date?: string | null
          id?: string
          scope?: Database["public"]["Enums"]["gallery_scope"]
          scope_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_photos: {
        Row: {
          caption: string | null
          event_id: string
          id: string
          image_url: string
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          caption?: string | null
          event_id: string
          id?: string
          image_url: string
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          caption?: string | null
          event_id?: string
          id?: string
          image_url?: string
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "gallery_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      git_commits: {
        Row: {
          author_email: string | null
          author_name: string
          commit_hash: string
          committed_at: string
          created_at: string
          files_changed: Json
          id: string
          message: string
          project_id: string
          stats: Json
        }
        Insert: {
          author_email?: string | null
          author_name: string
          commit_hash: string
          committed_at: string
          created_at?: string
          files_changed?: Json
          id?: string
          message: string
          project_id: string
          stats?: Json
        }
        Update: {
          author_email?: string | null
          author_name?: string
          commit_hash?: string
          committed_at?: string
          created_at?: string
          files_changed?: Json
          id?: string
          message?: string
          project_id?: string
          stats?: Json
        }
        Relationships: [
          {
            foreignKeyName: "git_commits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_integrations: {
        Row: {
          connection_status: string
          created_at: string
          id: string
          integration_type: string
          metadata: Json
          name: string
          organization_id: string | null
          project_id: string | null
          scopes: Json
          server_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_status?: string
          created_at?: string
          id?: string
          integration_type: string
          metadata?: Json
          name: string
          organization_id?: string | null
          project_id?: string | null
          scopes?: Json
          server_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_status?: string
          created_at?: string
          id?: string
          integration_type?: string
          metadata?: Json
          name?: string
          organization_id?: string | null
          project_id?: string | null
          scopes?: Json
          server_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcp_integrations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          model: string | null
          role: string
          sender_id: string | null
          token_usage: Json | null
          tool_calls: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          model?: string | null
          role: string
          sender_id?: string | null
          token_usage?: Json | null
          tool_calls?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          model?: string | null
          role?: string
          sender_id?: string | null
          token_usage?: Json | null
          tool_calls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json
          organization_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json
          organization_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json
          organization_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          joined_at: string
          organization_id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          organization_id: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          organization_id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          plan: string
          settings: Json
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          plan?: string
          settings?: Json
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          plan?: string
          settings?: Json
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_paid: number
          created_at: string | null
          fee_structure_id: string
          gateway_ref: string | null
          id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          student_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          fee_structure_id: string
          gateway_ref?: string | null
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          fee_structure_id?: string
          gateway_ref?: string | null
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          permissions: Json
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: Json
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: Json
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_memories: {
        Row: {
          category: string
          confidence: number
          content: string
          created_at: string
          embedding: string | null
          id: string
          is_active: boolean
          key: string
          project_id: string
          source: string
          updated_at: string
        }
        Insert: {
          category: string
          confidence?: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          is_active?: boolean
          key: string
          project_id: string
          source?: string
          updated_at?: string
        }
        Update: {
          category?: string
          confidence?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          is_active?: boolean
          key?: string
          project_id?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_memories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_rules: {
        Row: {
          applies_to_globs: Json
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          name: string
          project_id: string
          rule_content: string
          rule_identifier: string
          severity: string
          source: string
        }
        Insert: {
          applies_to_globs?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          name: string
          project_id: string
          rule_content: string
          rule_identifier: string
          severity?: string
          source?: string
        }
        Update: {
          applies_to_globs?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          name?: string
          project_id?: string
          rule_content?: string
          rule_identifier?: string
          severity?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          default_branch: string
          description: string | null
          id: string
          local_path_hash: string | null
          name: string
          organization_id: string | null
          owner_id: string
          project_settings: Json
          repo_url: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_branch?: string
          description?: string | null
          id?: string
          local_path_hash?: string | null
          name: string
          organization_id?: string | null
          owner_id: string
          project_settings?: Json
          repo_url?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_branch?: string
          description?: string | null
          id?: string
          local_path_hash?: string | null
          name?: string
          organization_id?: string | null
          owner_id?: string
          project_settings?: Json
          repo_url?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      proof_of_work: {
        Row: {
          build_passed: boolean
          confidence: number | null
          files_analyzed: Json
          files_modified: Json
          generated_at: string
          id: string
          project_id: string
          remaining_risks: Json
          reviews_summary: Json
          run_id: string
          security_checks_passed: boolean
          summary: string
          tests_executed: number
          tests_failed: number
          tests_passed: number
        }
        Insert: {
          build_passed?: boolean
          confidence?: number | null
          files_analyzed?: Json
          files_modified?: Json
          generated_at?: string
          id?: string
          project_id: string
          remaining_risks?: Json
          reviews_summary?: Json
          run_id: string
          security_checks_passed?: boolean
          summary: string
          tests_executed?: number
          tests_failed?: number
          tests_passed?: number
        }
        Update: {
          build_passed?: boolean
          confidence?: number | null
          files_analyzed?: Json
          files_modified?: Json
          generated_at?: string
          id?: string
          project_id?: string
          remaining_risks?: Json
          reviews_summary?: Json
          run_id?: string
          security_checks_passed?: boolean
          summary?: string
          tests_executed?: number
          tests_failed?: number
          tests_passed?: number
        }
        Relationships: [
          {
            foreignKeyName: "proof_of_work_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proof_of_work_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: true
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      quota_accounts: {
        Row: {
          allocated_credits: number
          created_at: string
          id: string
          organization_id: string | null
          plan: string
          quota_period: string
          remaining_credits: number
          reserved_credits: number
          reset_date: string
          status: string
          updated_at: string
          used_credits: number
          user_id: string
        }
        Insert: {
          allocated_credits?: number
          created_at?: string
          id?: string
          organization_id?: string | null
          plan?: string
          quota_period?: string
          remaining_credits?: number
          reserved_credits?: number
          reset_date?: string
          status?: string
          updated_at?: string
          used_credits?: number
          user_id: string
        }
        Update: {
          allocated_credits?: number
          created_at?: string
          id?: string
          organization_id?: string | null
          plan?: string
          quota_period?: string
          remaining_credits?: number
          reserved_credits?: number
          reset_date?: string
          status?: string
          updated_at?: string
          used_credits?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quota_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          class_id: string
          created_at: string | null
          id: string
          name: string
          teacher_id: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          name: string
          teacher_id?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          name?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sections_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json
          organization_id: string | null
          project_id: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          organization_id?: string | null
          project_id?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          organization_id?: string | null
          project_id?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_audit_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_parents: {
        Row: {
          parent_id: string
          student_id: string
        }
        Insert: {
          parent_id: string
          student_id: string
        }
        Update: {
          parent_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_parents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_parents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string | null
          dob: string | null
          id: string
          roll_no: string | null
          section_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dob?: string | null
          id?: string
          roll_no?: string | null
          section_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          dob?: string | null
          id?: string
          roll_no?: string | null
          section_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string | null
          id: string
          name: string
          section_id: string
          teacher_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          section_id: string
          teacher_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          section_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          assignment_id: string
          feedback: string | null
          file_url: string | null
          grade: number | null
          graded_at: string | null
          id: string
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          assignment_id: string
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          graded_at?: string | null
          id?: string
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          assignment_id?: string
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          graded_at?: string | null
          id?: string
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string
          customer_id: string | null
          id: string
          metadata: Json
          organization_id: string | null
          plan: string
          provider: string
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          customer_id?: string | null
          id?: string
          metadata?: Json
          organization_id?: string | null
          plan?: string
          provider?: string
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          customer_id?: string | null
          id?: string
          metadata?: Json
          organization_id?: string | null
          plan?: string
          provider?: string
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_slots: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          section_id: string
          start_time: string
          subject_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          section_id: string
          start_time: string
          subject_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          section_id?: string
          start_time?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_slots_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_executions: {
        Row: {
          created_at: string
          duration_ms: number
          id: string
          input_arguments: Json
          output_result: Json
          permission_id: string | null
          run_id: string
          status: string
          tool_name: string
          tool_type: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number
          id?: string
          input_arguments?: Json
          output_result?: Json
          permission_id?: string | null
          run_id: string
          status?: string
          tool_name: string
          tool_type?: string
        }
        Update: {
          created_at?: string
          duration_ms?: number
          id?: string
          input_arguments?: Json
          output_result?: Json
          permission_id?: string | null
          run_id?: string
          status?: string
          tool_name?: string
          tool_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_executions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "agent_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_executions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          agent_run_id: string | null
          ai_request_id: string | null
          conversation_id: string | null
          created_at: string
          credits_consumed: number
          currency: string
          id: string
          input_tokens: number
          metadata: Json
          model: string
          organization_id: string | null
          output_tokens: number
          project_id: string | null
          provider: string
          provider_cost: number
          request_status: string
          total_tokens: number
          user_id: string
        }
        Insert: {
          agent_run_id?: string | null
          ai_request_id?: string | null
          conversation_id?: string | null
          created_at?: string
          credits_consumed?: number
          currency?: string
          id?: string
          input_tokens?: number
          metadata?: Json
          model: string
          organization_id?: string | null
          output_tokens?: number
          project_id?: string | null
          provider: string
          provider_cost?: number
          request_status?: string
          total_tokens?: number
          user_id: string
        }
        Update: {
          agent_run_id?: string | null
          ai_request_id?: string | null
          conversation_id?: string | null
          created_at?: string
          credits_consumed?: number
          currency?: string
          id?: string
          input_tokens?: number
          metadata?: Json
          model?: string
          organization_id?: string | null
          output_tokens?: number
          project_id?: string | null
          provider?: string
          provider_cost?: number
          request_status?: string
          total_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_usage_events_agent_run"
            columns: ["agent_run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_usage_events_conversation"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          onboarding_completed: boolean
          preferences: Json
          updated_at: string
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          onboarding_completed?: boolean
          preferences?: Json
          updated_at?: string
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          onboarding_completed?: boolean
          preferences?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          default_agent_mode: string
          default_model: string
          editor_preferences: Json
          id: string
          notification_preferences: Json
          settings_json: Json
          telemetry_enabled: boolean
          theme: string
          updated_at: string
        }
        Insert: {
          default_agent_mode?: string
          default_model?: string
          editor_preferences?: Json
          id: string
          notification_preferences?: Json
          settings_json?: Json
          telemetry_enabled?: boolean
          theme?: string
          updated_at?: string
        }
        Update: {
          default_agent_mode?: string
          default_model?: string
          editor_preferences?: Json
          id?: string
          notification_preferences?: Json
          settings_json?: Json
          telemetry_enabled?: boolean
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          command: string
          created_at: string
          duration_ms: number
          exit_code: number | null
          failed_count: number
          id: string
          output_storage_path: string | null
          output_text: string | null
          passed_count: number
          project_id: string
          run_id: string
          status: string
          test_count: number
          verification_type: string
        }
        Insert: {
          command: string
          created_at?: string
          duration_ms?: number
          exit_code?: number | null
          failed_count?: number
          id?: string
          output_storage_path?: string | null
          output_text?: string | null
          passed_count?: number
          project_id: string
          run_id: string
          status?: string
          test_count?: number
          verification_type: string
        }
        Update: {
          command?: string
          created_at?: string
          duration_ms?: number
          exit_code?: number | null
          failed_count?: number
          id?: string
          output_storage_path?: string | null
          output_text?: string | null
          passed_count?: number
          project_id?: string
          run_id?: string
          status?: string
          test_count?: number
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "verifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_parent_section_ids: { Args: never; Returns: string[] }
      get_student_id: { Args: never; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_school_id: { Args: never; Returns: string }
      is_parent_of: { Args: { p_student_id: string }; Returns: boolean }
      is_project_accessible: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      reserve_ai_quota: {
        Args: { p_estimated_credits: number; p_user_id: string }
        Returns: Json
      }
      settle_ai_quota: {
        Args: {
          p_actual_credits: number
          p_reserved_credits: number
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      announcement_scope: "school" | "class" | "section"
      attendance_status: "present" | "absent" | "late"
      gallery_scope: "school" | "class" | "section"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      user_role: "admin" | "teacher" | "parent" | "student"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      announcement_scope: ["school", "class", "section"],
      attendance_status: ["present", "absent", "late"],
      gallery_scope: ["school", "class", "section"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      user_role: ["admin", "teacher", "parent", "student"],
    },
  },
} as const
