export type Database = {
  public: {
    Tables: {
      asset_types: {
        Row: {
          id: string
          name: string
          category: string
          icon: string
          color: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          icon?: string
          color?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          icon?: string
          color?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          domain: string | null
          status: "active" | "inactive" | "suspended"
          tier: "basic" | "standard" | "premium" | "enterprise"
          health_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain?: string | null
          status?: "active" | "inactive" | "suspended"
          tier?: "basic" | "standard" | "premium" | "enterprise"
          health_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string | null
          status?: "active" | "inactive" | "suspended"
          tier?: "basic" | "standard" | "premium" | "enterprise"
          health_score?: number
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          display_name: string | null
          avatar_url: string | null
          phone: string | null
          role: "admin" | "manager" | "agent" | "user"
          department: string | null
          timezone: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: "admin" | "manager" | "agent" | "user"
          department?: string | null
          timezone?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: "admin" | "manager" | "agent" | "user"
          department?: string | null
          timezone?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          ticket_number: string
          title: string
          description: string | null
          type: "incident" | "request" | "problem" | "change" | "general_query"
          category: string | null
          subcategory: string | null
          item: string | null
          priority: "critical" | "high" | "medium" | "low"
          urgency: "high" | "medium" | "low"
          impact: "high" | "medium" | "low"
          status:
            | "new"
            | "open"
            | "in_progress"
            | "pending_approval"
            | "under_investigation"
            | "scheduled"
            | "resolved"
            | "closed"
            | "cancelled"
            | "on_hold"
          severity: "critical" | "major" | "minor" | "cosmetic" | null
          requester_id: string | null
          assignee_id: string | null
          organization_id: string | null
          department_id: string | null
          parent_ticket_id: string | null
          sla_policy_id: string | null
          business_impact: string | null
          affected_services: string[] | null
          workaround: string | null
          root_cause: string | null
          resolution_summary: string | null
          created_at: string
          updated_at: string
          due_date: string | null
          resolved_at: string | null
          closed_at: string | null
          sla_breached: boolean
          first_response_at: string | null
          channel: "web" | "email" | "phone" | "chat" | "api"
          ai_confidence: number | null
          escalation_level: number
          tags: string[] | null
          custom_fields: any | null
        }
        Insert: {
          id?: string
          ticket_number?: string
          title: string
          description?: string | null
          type?: "incident" | "request" | "problem" | "change" | "general_query"
          category?: string | null
          subcategory?: string | null
          item?: string | null
          priority?: "critical" | "high" | "medium" | "low"
          urgency?: "high" | "medium" | "low"
          impact?: "high" | "medium" | "low"
          status?:
            | "new"
            | "open"
            | "in_progress"
            | "pending_approval"
            | "under_investigation"
            | "scheduled"
            | "resolved"
            | "closed"
            | "cancelled"
            | "on_hold"
          severity?: "critical" | "major" | "minor" | "cosmetic" | null
          requester_id?: string | null
          assignee_id?: string | null
          organization_id?: string | null
          department_id?: string | null
          parent_ticket_id?: string | null
          sla_policy_id?: string | null
          business_impact?: string | null
          affected_services?: string[] | null
          workaround?: string | null
          root_cause?: string | null
          resolution_summary?: string | null
          created_at?: string
          updated_at?: string
          due_date?: string | null
          resolved_at?: string | null
          closed_at?: string | null
          sla_breached?: boolean
          first_response_at?: string | null
          channel?: "web" | "email" | "phone" | "chat" | "api"
          ai_confidence?: number | null
          escalation_level?: number
          tags?: string[] | null
          custom_fields?: any | null
        }
        Update: {
          id?: string
          ticket_number?: string
          title?: string
          description?: string | null
          type?: "incident" | "request" | "problem" | "change" | "general_query"
          category?: string | null
          subcategory?: string | null
          item?: string | null
          priority?: "critical" | "high" | "medium" | "low"
          urgency?: "high" | "medium" | "low"
          impact?: "high" | "medium" | "low"
          status?:
            | "new"
            | "open"
            | "in_progress"
            | "pending_approval"
            | "under_investigation"
            | "scheduled"
            | "resolved"
            | "closed"
            | "cancelled"
            | "on_hold"
          severity?: "critical" | "major" | "minor" | "cosmetic" | null
          requester_id?: string | null
          assignee_id?: string | null
          organization_id?: string | null
          department_id?: string | null
          parent_ticket_id?: string | null
          sla_policy_id?: string | null
          business_impact?: string | null
          affected_services?: string[] | null
          workaround?: string | null
          root_cause?: string | null
          resolution_summary?: string | null
          created_at?: string
          updated_at?: string
          due_date?: string | null
          resolved_at?: string | null
          closed_at?: string | null
          sla_breached?: boolean
          first_response_at?: string | null
          channel?: "web" | "email" | "phone" | "chat" | "api"
          ai_confidence?: number | null
          escalation_level?: number
          tags?: string[] | null
          custom_fields?: any | null
        }
      }
      assets: {
        Row: {
          id: string
          asset_id: string
          name: string
          asset_type_id: string | null
          category: string
          subcategory: string | null
          hostname: string | null
          ip_address: string | null
          mac_address: string | null
          serial_number: string | null
          model: string | null
          manufacturer: string | null
          operating_system: string | null
          cpu: string | null
          memory: string | null
          storage: string | null
          status: "active" | "inactive" | "maintenance" | "retired" | "disposed"
          criticality: "critical" | "high" | "medium" | "low"
          location: string | null
          owner_id: string | null
          department_id: string | null
          organization_id: string | null
          purchase_date: string | null
          warranty_expiry: string | null
          cost: number | null
          vendor: string | null
          notes: string | null
          metadata: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          asset_id?: string
          name: string
          asset_type_id?: string | null
          category: string
          subcategory?: string | null
          hostname?: string | null
          ip_address?: string | null
          mac_address?: string | null
          serial_number?: string | null
          model?: string | null
          manufacturer?: string | null
          operating_system?: string | null
          cpu?: string | null
          memory?: string | null
          storage?: string | null
          status?: "active" | "inactive" | "maintenance" | "retired" | "disposed"
          criticality?: "critical" | "high" | "medium" | "low"
          location?: string | null
          owner_id?: string | null
          department_id?: string | null
          organization_id?: string | null
          purchase_date?: string | null
          warranty_expiry?: string | null
          cost?: number | null
          vendor?: string | null
          notes?: string | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          name?: string
          asset_type_id?: string | null
          category?: string
          subcategory?: string | null
          hostname?: string | null
          ip_address?: string | null
          mac_address?: string | null
          serial_number?: string | null
          model?: string | null
          manufacturer?: string | null
          operating_system?: string | null
          cpu?: string | null
          memory?: string | null
          storage?: string | null
          status?: "active" | "inactive" | "maintenance" | "retired" | "disposed"
          criticality?: "critical" | "high" | "medium" | "low"
          location?: string | null
          owner_id?: string | null
          department_id?: string | null
          organization_id?: string | null
          purchase_date?: string | null
          warranty_expiry?: string | null
          cost?: number | null
          vendor?: string | null
          notes?: string | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      service_requests: {
        Row: {
          id: string
          request_id: string
          request_name: string
          service_name: string
          service_category: string
          description: string
          business_justification: string | null
          additional_requirements: string | null
          requestor_id: string | null
          requestor_name: string | null
          department_id: string | null
          organization_id: string | null
          approver_id: string | null
          approver_email: string | null
          approved_at: string | null
          status: "pending" | "approved" | "in_progress" | "completed" | "rejected" | "on_hold" | "cancelled"
          priority: "critical" | "high" | "medium" | "low"
          urgency: "high" | "medium" | "low"
          cost_center: string | null
          estimated_cost: number | null
          actual_cost: number | null
          request_date: string
          expected_delivery: string | null
          actual_delivery: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          request_id?: string
          request_name: string
          service_name: string
          service_category: string
          description: string
          business_justification?: string | null
          additional_requirements?: string | null
          requestor_id?: string | null
          requestor_name?: string | null
          department_id?: string | null
          organization_id?: string | null
          approver_id?: string | null
          approver_email?: string | null
          approved_at?: string | null
          status?: "pending" | "approved" | "in_progress" | "completed" | "rejected" | "on_hold" | "cancelled"
          priority?: "critical" | "high" | "medium" | "low"
          urgency?: "high" | "medium" | "low"
          cost_center?: string | null
          estimated_cost?: number | null
          actual_cost?: number | null
          request_date?: string
          expected_delivery?: string | null
          actual_delivery?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          request_name?: string
          service_name?: string
          service_category?: string
          description?: string
          business_justification?: string | null
          additional_requirements?: string | null
          requestor_id?: string | null
          requestor_name?: string | null
          department_id?: string | null
          organization_id?: string | null
          approver_id?: string | null
          approver_email?: string | null
          approved_at?: string | null
          status?: "pending" | "approved" | "in_progress" | "completed" | "rejected" | "on_hold" | "cancelled"
          priority?: "critical" | "high" | "medium" | "low"
          urgency?: "high" | "medium" | "low"
          cost_center?: string | null
          estimated_cost?: number | null
          actual_cost?: number | null
          request_date?: string
          expected_delivery?: string | null
          actual_delivery?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      knowledge_base_articles: {
        Row: {
          id: string
          title: string
          slug: string
          content: string
          excerpt: string | null
          category_id: string | null
          author_id: string | null
          organization_id: string | null
          status: "draft" | "published" | "archived"
          featured: boolean
          view_count: number
          helpful_count: number
          not_helpful_count: number
          tags: string[] | null
          metadata: any | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug?: string
          content: string
          excerpt?: string | null
          category_id?: string | null
          author_id?: string | null
          organization_id?: string | null
          status?: "draft" | "published" | "archived"
          featured?: boolean
          view_count?: number
          helpful_count?: number
          not_helpful_count?: number
          tags?: string[] | null
          metadata?: any | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: string
          excerpt?: string | null
          category_id?: string | null
          author_id?: string | null
          organization_id?: string | null
          status?: "draft" | "published" | "archived"
          featured?: boolean
          view_count?: number
          helpful_count?: number
          not_helpful_count?: number
          tags?: string[] | null
          metadata?: any | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
