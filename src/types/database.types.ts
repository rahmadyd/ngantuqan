export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "activity_logs": {
                  Row: {
                    "action": string,"admin_id": string | null,"created_at": string,"entity_id": string | null,"entity_type": string,"id": string,"metadata": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"admin_id"?: string | null,"created_at"?: string,"entity_id"?: string | null,"entity_type": string,"id"?: string,"metadata"?: NonNullable<Json>
                  }
                  Update: {
                    "action"?: string,"admin_id"?: string | null,"created_at"?: string,"entity_id"?: string | null,"entity_type"?: string,"id"?: string,"metadata"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "activity_logs_admin_id_fkey"
      columns: ["admin_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"categories": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"name": string,"slug": string,"translations": Json,"type": Database["public"]['Enums']["category_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"name": string,"slug": string,"translations"?: Json,"type": Database["public"]['Enums']["category_type"]
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"name"?: string,"slug"?: string,"translations"?: Json,"type"?: Database["public"]['Enums']["category_type"]
                  }
                  Relationships: [
                    
                  ]
                },"digital_order_items": {
                  Row: {
                    "digital_order_id": string,"id": string,"product_id": string | null,"product_title": string,"quantity": number,"unit_price": number
                  }
                  ComputedFields: never
                  Insert: {
                    "digital_order_id": string,"id"?: string,"product_id"?: string | null,"product_title": string,"quantity"?: number,"unit_price": number
                  }
                  Update: {
                    "digital_order_id"?: string,"id"?: string,"product_id"?: string | null,"product_title"?: string,"quantity"?: number,"unit_price"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "digital_order_items_digital_order_id_fkey"
      columns: ["digital_order_id"]
isOneToOne: false
      referencedRelation: "digital_orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "digital_order_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"digital_orders": {
                  Row: {
                    "created_at": string,"customer_email": string,"customer_id": string | null,"customer_name": string,"id": string,"order_number": string,"payment_provider": string,"payment_status": Database["public"]['Enums']["payment_status"],"subtotal": number,"total_amount": number,"transaction_reference": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"customer_email": string,"customer_id"?: string | null,"customer_name": string,"id"?: string,"order_number": string,"payment_provider"?: string,"payment_status"?: Database["public"]['Enums']["payment_status"],"subtotal": number,"total_amount": number,"transaction_reference"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"customer_email"?: string,"customer_id"?: string | null,"customer_name"?: string,"id"?: string,"order_number"?: string,"payment_provider"?: string,"payment_status"?: Database["public"]['Enums']["payment_status"],"subtotal"?: number,"total_amount"?: number,"transaction_reference"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "digital_orders_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"downloads": {
                  Row: {
                    "created_at": string,"digital_order_item_id": string,"download_count": number,"id": string,"last_downloaded_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"digital_order_item_id": string,"download_count"?: number,"id"?: string,"last_downloaded_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"digital_order_item_id"?: string,"download_count"?: number,"id"?: string,"last_downloaded_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "downloads_digital_order_item_id_fkey"
      columns: ["digital_order_item_id"]
isOneToOne: true
      referencedRelation: "digital_order_items"
      referencedColumns: ["id"]
    }
                  ]
                },"inquiries": {
                  Row: {
                    "company": string | null,"created_at": string,"email": string,"id": string,"inquiry_type": Database["public"]['Enums']["inquiry_type"],"is_read": boolean,"message": string,"name": string,"status": Database["public"]['Enums']["inquiry_status"],"subject": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company"?: string | null,"created_at"?: string,"email": string,"id"?: string,"inquiry_type"?: Database["public"]['Enums']["inquiry_type"],"is_read"?: boolean,"message": string,"name": string,"status"?: Database["public"]['Enums']["inquiry_status"],"subject": string,"updated_at"?: string
                  }
                  Update: {
                    "company"?: string | null,"created_at"?: string,"email"?: string,"id"?: string,"inquiry_type"?: Database["public"]['Enums']["inquiry_type"],"is_read"?: boolean,"message"?: string,"name"?: string,"status"?: Database["public"]['Enums']["inquiry_status"],"subject"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"media": {
                  Row: {
                    "alt_text": string | null,"bucket": string,"created_at": string,"file_name": string,"file_size": number | null,"height": number | null,"id": string,"mime_type": string | null,"path": string,"updated_at": string,"uploaded_by": string | null,"width": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "alt_text"?: string | null,"bucket": string,"created_at"?: string,"file_name": string,"file_size"?: number | null,"height"?: number | null,"id"?: string,"mime_type"?: string | null,"path": string,"updated_at"?: string,"uploaded_by"?: string | null,"width"?: number | null
                  }
                  Update: {
                    "alt_text"?: string | null,"bucket"?: string,"created_at"?: string,"file_name"?: string,"file_size"?: number | null,"height"?: number | null,"id"?: string,"mime_type"?: string | null,"path"?: string,"updated_at"?: string,"uploaded_by"?: string | null,"width"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "media_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"order_attachments": {
                  Row: {
                    "created_at": string,"file_name": string,"file_path": string,"file_size": number | null,"file_type": string | null,"id": string,"order_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"file_name": string,"file_path": string,"file_size"?: number | null,"file_type"?: string | null,"id"?: string,"order_id": string
                  }
                  Update: {
                    "created_at"?: string,"file_name"?: string,"file_path"?: string,"file_size"?: number | null,"file_type"?: string | null,"id"?: string,"order_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_attachments_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "service_orders"
      referencedColumns: ["id"]
    }
                  ]
                },"order_status_history": {
                  Row: {
                    "changed_by": string | null,"created_at": string,"id": string,"new_status": Database["public"]['Enums']["service_order_status"],"note": string | null,"old_status": Database["public"]['Enums']["service_order_status"] | null,"order_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "changed_by"?: string | null,"created_at"?: string,"id"?: string,"new_status": Database["public"]['Enums']["service_order_status"],"note"?: string | null,"old_status"?: Database["public"]['Enums']["service_order_status"] | null,"order_id": string
                  }
                  Update: {
                    "changed_by"?: string | null,"created_at"?: string,"id"?: string,"new_status"?: Database["public"]['Enums']["service_order_status"],"note"?: string | null,"old_status"?: Database["public"]['Enums']["service_order_status"] | null,"order_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_status_history_changed_by_fkey"
      columns: ["changed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_status_history_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "service_orders"
      referencedColumns: ["id"]
    }
                  ]
                },"product_files": {
                  Row: {
                    "created_at": string,"file_name": string,"file_size": number | null,"id": string,"mime_type": string | null,"product_id": string,"storage_path": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"file_name": string,"file_size"?: number | null,"id"?: string,"mime_type"?: string | null,"product_id": string,"storage_path": string
                  }
                  Update: {
                    "created_at"?: string,"file_name"?: string,"file_size"?: number | null,"id"?: string,"mime_type"?: string | null,"product_id"?: string,"storage_path"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_files_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"product_images": {
                  Row: {
                    "alt_text": string | null,"display_order": number,"id": string,"image_url": string,"product_id": string,"translations": Json
                  }
                  ComputedFields: never
                  Insert: {
                    "alt_text"?: string | null,"display_order"?: number,"id"?: string,"image_url": string,"product_id": string,"translations"?: Json
                  }
                  Update: {
                    "alt_text"?: string | null,"display_order"?: number,"id"?: string,"image_url"?: string,"product_id"?: string,"translations"?: Json
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_images_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "category_id": string | null,"compatibility": string | null,"cover_image": string | null,"created_at": string,"description": string,"discount_price": number | null,"file_format": string | null,"id": string,"includes": NonNullable<Json>,"is_featured": boolean,"is_published": boolean,"license_terms": string | null,"price": number,"slug": string,"title": string,"translations": Json,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id"?: string | null,"compatibility"?: string | null,"cover_image"?: string | null,"created_at"?: string,"description"?: string,"discount_price"?: number | null,"file_format"?: string | null,"id"?: string,"includes"?: NonNullable<Json>,"is_featured"?: boolean,"is_published"?: boolean,"license_terms"?: string | null,"price": number,"slug": string,"title": string,"translations"?: Json,"updated_at"?: string
                  }
                  Update: {
                    "category_id"?: string | null,"compatibility"?: string | null,"cover_image"?: string | null,"created_at"?: string,"description"?: string,"discount_price"?: number | null,"file_format"?: string | null,"id"?: string,"includes"?: NonNullable<Json>,"is_featured"?: boolean,"is_published"?: boolean,"license_terms"?: string | null,"price"?: number,"slug"?: string,"title"?: string,"translations"?: Json,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string,"full_name": string | null,"id": string,"role": Database["public"]['Enums']["profile_role"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"full_name"?: string | null,"id": string,"role"?: Database["public"]['Enums']["profile_role"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"full_name"?: string | null,"id"?: string,"role"?: Database["public"]['Enums']["profile_role"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"project_images": {
                  Row: {
                    "alt_text": string | null,"display_order": number,"id": string,"image_url": string,"project_id": string,"translations": Json
                  }
                  ComputedFields: never
                  Insert: {
                    "alt_text"?: string | null,"display_order"?: number,"id"?: string,"image_url": string,"project_id": string,"translations"?: Json
                  }
                  Update: {
                    "alt_text"?: string | null,"display_order"?: number,"id"?: string,"image_url"?: string,"project_id"?: string,"translations"?: Json
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_images_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"projects": {
                  Row: {
                    "category_id": string | null,"client_name": string | null,"cover_image": string | null,"created_at": string,"description": string,"id": string,"is_featured": boolean,"is_published": boolean,"project_year": number | null,"seo_description": string | null,"seo_title": string | null,"slug": string,"title": string,"translations": Json,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id"?: string | null,"client_name"?: string | null,"cover_image"?: string | null,"created_at"?: string,"description"?: string,"id"?: string,"is_featured"?: boolean,"is_published"?: boolean,"project_year"?: number | null,"seo_description"?: string | null,"seo_title"?: string | null,"slug": string,"title": string,"translations"?: Json,"updated_at"?: string
                  }
                  Update: {
                    "category_id"?: string | null,"client_name"?: string | null,"cover_image"?: string | null,"created_at"?: string,"description"?: string,"id"?: string,"is_featured"?: boolean,"is_published"?: boolean,"project_year"?: number | null,"seo_description"?: string | null,"seo_title"?: string | null,"slug"?: string,"title"?: string,"translations"?: Json,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "projects_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"rate_limits": {
                  Row: {
                    "bucket": string,"expires_at": string,"id": string,"identifier": string,"request_count": number,"window_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket": string,"expires_at": string,"id"?: string,"identifier": string,"request_count"?: number,"window_start": string
                  }
                  Update: {
                    "bucket"?: string,"expires_at"?: string,"id"?: string,"identifier"?: string,"request_count"?: number,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"service_orders": {
                  Row: {
                    "admin_notes": string | null,"budget": number | null,"created_at": string,"customer_email": string,"customer_id": string | null,"customer_name": string,"deadline": string | null,"design_references": string | null,"id": string,"order_number": string,"order_status": Database["public"]['Enums']["service_order_status"],"package_id": string | null,"payment_status": Database["public"]['Enums']["payment_status"],"preferred_colors": string | null,"project_description": string,"quoted_price": number | null,"requested_deliverables": string | null,"service_id": string,"target_audience": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "admin_notes"?: string | null,"budget"?: number | null,"created_at"?: string,"customer_email": string,"customer_id"?: string | null,"customer_name": string,"deadline"?: string | null,"design_references"?: string | null,"id"?: string,"order_number": string,"order_status"?: Database["public"]['Enums']["service_order_status"],"package_id"?: string | null,"payment_status"?: Database["public"]['Enums']["payment_status"],"preferred_colors"?: string | null,"project_description": string,"quoted_price"?: number | null,"requested_deliverables"?: string | null,"service_id": string,"target_audience"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "admin_notes"?: string | null,"budget"?: number | null,"created_at"?: string,"customer_email"?: string,"customer_id"?: string | null,"customer_name"?: string,"deadline"?: string | null,"design_references"?: string | null,"id"?: string,"order_number"?: string,"order_status"?: Database["public"]['Enums']["service_order_status"],"package_id"?: string | null,"payment_status"?: Database["public"]['Enums']["payment_status"],"preferred_colors"?: string | null,"project_description"?: string,"quoted_price"?: number | null,"requested_deliverables"?: string | null,"service_id"?: string,"target_audience"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "service_orders_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "service_orders_package_matches_service"
      columns: ["package_id","service_id"]
isOneToOne: false
      referencedRelation: "service_packages"
      referencedColumns: ["id","service_id"]
    },{
      foreignKeyName: "service_orders_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["id"]
    }
                  ]
                },"service_packages": {
                  Row: {
                    "delivery_days": number,"description": string | null,"features": NonNullable<Json>,"id": string,"is_active": boolean,"name": string,"price": number,"revision_count": number,"service_id": string,"translations": Json
                  }
                  ComputedFields: never
                  Insert: {
                    "delivery_days"?: number,"description"?: string | null,"features"?: NonNullable<Json>,"id"?: string,"is_active"?: boolean,"name": string,"price": number,"revision_count"?: number,"service_id": string,"translations"?: Json
                  }
                  Update: {
                    "delivery_days"?: number,"description"?: string | null,"features"?: NonNullable<Json>,"id"?: string,"is_active"?: boolean,"name"?: string,"price"?: number,"revision_count"?: number,"service_id"?: string,"translations"?: Json
                  }
                  Relationships: [
                    {
      foreignKeyName: "service_packages_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["id"]
    }
                  ]
                },"services": {
                  Row: {
                    "category_id": string | null,"cover_image": string | null,"created_at": string,"deliverables": NonNullable<Json>,"description": string,"id": string,"is_active": boolean,"revision_policy": string | null,"slug": string,"title": string,"translations": Json,"turnaround_days": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id"?: string | null,"cover_image"?: string | null,"created_at"?: string,"deliverables"?: NonNullable<Json>,"description"?: string,"id"?: string,"is_active"?: boolean,"revision_policy"?: string | null,"slug": string,"title": string,"translations"?: Json,"turnaround_days"?: number,"updated_at"?: string
                  }
                  Update: {
                    "category_id"?: string | null,"cover_image"?: string | null,"created_at"?: string,"deliverables"?: NonNullable<Json>,"description"?: string,"id"?: string,"is_active"?: boolean,"revision_policy"?: string | null,"slug"?: string,"title"?: string,"translations"?: Json,"turnaround_days"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "services_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"site_settings": {
                  Row: {
                    "id": string,"is_public": boolean,"setting_key": string,"setting_value": NonNullable<Json>,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"is_public"?: boolean,"setting_key": string,"setting_value"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "id"?: string,"is_public"?: boolean,"setting_key"?: string,"setting_value"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"testimonials": {
                  Row: {
                    "avatar_url": string | null,"content": string,"created_at": string,"customer_name": string,"customer_role": string | null,"id": string,"is_featured": boolean,"is_published": boolean,"project_id": string | null,"translations": Json,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"content": string,"created_at"?: string,"customer_name": string,"customer_role"?: string | null,"id"?: string,"is_featured"?: boolean,"is_published"?: boolean,"project_id"?: string | null,"translations"?: Json,"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"content"?: string,"created_at"?: string,"customer_name"?: string,"customer_role"?: string | null,"id"?: string,"is_featured"?: boolean,"is_published"?: boolean,"project_id"?: string | null,"translations"?: Json,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "testimonials_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_counts":
{ Args: Record<PropertyKey, never>; Returns: {
              "active_services": number,"pending_service_orders": number,"published_products": number,"published_projects": number,"total_inquiries": number,"total_projects": number,"total_services": number,"unread_inquiries": number
            }[]
                           },
"admin_revenue_summary":
{ Args: Record<PropertyKey, never>; Returns: {
              "completed_projects_count": number,"digital_orders_count": number,"digital_revenue": number,"paid_orders_count": number,"pending_orders_count": number,"service_revenue": number
            }[]
                           },
"check_rate_limit":
{ Args: { "p_bucket": string,"p_identifier": string,"p_max_requests"?: number,"p_window_seconds"?: number }; Returns: {
              "allowed": boolean,"remaining": number,"retry_after_seconds": number
            }[]
                           },
"claim_guest_orders":
{ Args: { "p_email": string }; Returns: number
                           },
"confirm_digital_order_payment":
{ Args: { "p_order_number": string,"p_transaction_reference"?: string }; Returns: boolean
                           },
"confirm_digital_order_payment_from_provider":
{ Args: { "p_order_number": string,"p_provider"?: string,"p_transaction_reference"?: string }; Returns: boolean
                           },
"current_customer_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"log_activity":
{ Args: { "p_action": string,"p_entity_id"?: string,"p_entity_type": string,"p_metadata"?: Json }; Returns: undefined
                           },
"record_download":
{ Args: { "p_order_item_id": string }; Returns: {
              "file_name": string,"storage_path": string
            }[]
                           },
"record_order_download":
{ Args: { "p_email": string,"p_order_number": string }; Returns: {
              "file_name": string,"storage_path": string
            }[]
                           },
"record_purchase":
{ Args: { "p_customer_email": string,"p_customer_name": string,"p_items": Json,"p_payment_provider"?: string }; Returns: {
              "order_number": string,"total": number
            }[]
                           },
"record_service_order":
{ Args: { "p_brief": Json }; Returns: {
              "id": string,"order_number": string
            }[]
                           },
"show_limit":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"show_trgm":
{ Args: { "": string }; Returns: (string)[]
                           }
          }
          Enums: {
            "category_type": "PORTFOLIO"|"SERVICE"|"PRODUCT","inquiry_status": "NEW"|"IN_PROGRESS"|"RESOLVED"|"SPAM","inquiry_type": "GENERAL"|"DESIGN_SERVICE"|"COLLABORATION"|"PARTNERSHIP"|"OTHER","payment_status": "PENDING"|"PAID"|"FAILED"|"REFUNDED","profile_role": "ADMIN"|"CUSTOMER","service_order_status": "NEW_INQUIRY"|"CONTACTED"|"QUOTED"|"WAITING_FOR_PAYMENT"|"IN_PROGRESS"|"REVISION"|"COMPLETED"|"CANCELLED"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "category_type": ["PORTFOLIO", "SERVICE", "PRODUCT"],"inquiry_status": ["NEW", "IN_PROGRESS", "RESOLVED", "SPAM"],"inquiry_type": ["GENERAL", "DESIGN_SERVICE", "COLLABORATION", "PARTNERSHIP", "OTHER"],"payment_status": ["PENDING", "PAID", "FAILED", "REFUNDED"],"profile_role": ["ADMIN", "CUSTOMER"],"service_order_status": ["NEW_INQUIRY", "CONTACTED", "QUOTED", "WAITING_FOR_PAYMENT", "IN_PROGRESS", "REVISION", "COMPLETED", "CANCELLED"]
          }
        }
} as const
