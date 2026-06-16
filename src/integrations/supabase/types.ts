export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      buyer_profiles: {
        Row: {
          address: string | null;
          business_name: string;
          business_type: string | null;
          city: string | null;
          created_at: string;
          id: string;
          maps_url: string | null;
          phone: string | null;
          user_id: string;
        };
        Insert: {
          address?: string | null;
          business_name: string;
          business_type?: string | null;
          city?: string | null;
          created_at?: string;
          id?: string;
          maps_url?: string | null;
          phone?: string | null;
          user_id: string;
        };
        Update: {
          address?: string | null;
          business_name?: string;
          business_type?: string | null;
          city?: string | null;
          created_at?: string;
          id?: string;
          maps_url?: string | null;
          phone?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          rating: number;
          supplier_id: string;
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          rating: number;
          supplier_id: string;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          rating?: number;
          supplier_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          link: string | null;
          read: boolean;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          read?: boolean;
          title: string;
          type?: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          read?: boolean;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          created_at: string;
          id: string;
          product_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          product_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          product_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      financing_requests: {
        Row: {
          admin_note: string | null;
          amount: number;
          business_name: string | null;
          buyer_id: string;
          cr_doc_path: string | null;
          cr_number: string | null;
          created_at: string;
          credit_limit: number | null;
          details: string | null;
          id: string;
          id_doc_path: string | null;
          id_number: string | null;
          items: Json;
          promissory_no: string | null;
          status: string;
          term_months: number | null;
          updated_at: string;
        };
        Insert: {
          admin_note?: string | null;
          amount: number;
          business_name?: string | null;
          buyer_id: string;
          cr_doc_path?: string | null;
          cr_number?: string | null;
          created_at?: string;
          credit_limit?: number | null;
          details?: string | null;
          id?: string;
          id_doc_path?: string | null;
          id_number?: string | null;
          items?: Json;
          promissory_no?: string | null;
          status?: string;
          term_months?: number | null;
          updated_at?: string;
        };
        Update: {
          admin_note?: string | null;
          amount?: number;
          business_name?: string | null;
          buyer_id?: string;
          cr_doc_path?: string | null;
          cr_number?: string | null;
          created_at?: string;
          credit_limit?: number | null;
          details?: string | null;
          id?: string;
          id_doc_path?: string | null;
          id_number?: string | null;
          items?: Json;
          promissory_no?: string | null;
          status?: string;
          term_months?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      quote_requests: {
        Row: {
          accepted_at: string | null;
          buyer_comment: string | null;
          buyer_id: string;
          buyer_rating: number | null;
          cancelled_at: string | null;
          courier_phone: string | null;
          created_at: string;
          custom_product: string | null;
          delivered_at: string | null;
          id: string;
          invoice_number: string | null;
          note: string | null;
          paid_at: string | null;
          product_id: string | null;
          quantity: number;
          quoted_at: string | null;
          quoted_price: number | null;
          shipped_at: string | null;
          shipping_info: string | null;
          status: Database["public"]["Enums"]["quote_status"];
          supplier_comment: string | null;
          supplier_id: string;
          supplier_rating: number | null;
          supplier_reply: string | null;
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          buyer_comment?: string | null;
          buyer_id: string;
          buyer_rating?: number | null;
          cancelled_at?: string | null;
          courier_phone?: string | null;
          created_at?: string;
          custom_product?: string | null;
          delivered_at?: string | null;
          id?: string;
          invoice_number?: string | null;
          note?: string | null;
          paid_at?: string | null;
          product_id?: string | null;
          quantity?: number;
          quoted_at?: string | null;
          quoted_price?: number | null;
          shipped_at?: string | null;
          shipping_info?: string | null;
          status?: Database["public"]["Enums"]["quote_status"];
          supplier_comment?: string | null;
          supplier_id: string;
          supplier_rating?: number | null;
          supplier_reply?: string | null;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          buyer_comment?: string | null;
          buyer_id?: string;
          buyer_rating?: number | null;
          cancelled_at?: string | null;
          courier_phone?: string | null;
          created_at?: string;
          custom_product?: string | null;
          delivered_at?: string | null;
          id?: string;
          invoice_number?: string | null;
          note?: string | null;
          paid_at?: string | null;
          product_id?: string | null;
          quantity?: number;
          quoted_at?: string | null;
          quoted_price?: number | null;
          shipped_at?: string | null;
          shipping_info?: string | null;
          status?: Database["public"]["Enums"]["quote_status"];
          supplier_comment?: string | null;
          supplier_id?: string;
          supplier_rating?: number | null;
          supplier_reply?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quote_requests_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quote_requests_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      quote_messages: {
        Row: {
          attachment_name: string | null;
          attachment_path: string | null;
          attachment_type: string | null;
          body: string;
          created_at: string;
          id: string;
          quote_id: string;
          sender_id: string;
        };
        Insert: {
          attachment_name?: string | null;
          attachment_path?: string | null;
          attachment_type?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          quote_id: string;
          sender_id: string;
        };
        Update: {
          attachment_name?: string | null;
          attachment_path?: string | null;
          attachment_type?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          quote_id?: string;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quote_messages_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quote_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          icon: string;
          id: string;
          name: string;
        };
        Insert: {
          icon?: string;
          id: string;
          name: string;
        };
        Update: {
          icon?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      offers: {
        Row: {
          created_at: string;
          id: string;
          moq: number;
          price: number;
          product_id: string;
          stock: number | null;
          supplier_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          moq?: number;
          price: number;
          product_id: string;
          stock?: number | null;
          supplier_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          moq?: number;
          price?: number;
          product_id?: string;
          stock?: number | null;
          supplier_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "offers_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offers_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category_id: string;
          created_at: string;
          icon: string;
          id: string;
          image_url: string | null;
          name: string;
          spec: string | null;
          unit: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          icon?: string;
          id?: string;
          image_url?: string | null;
          name: string;
          spec?: string | null;
          unit: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          image_url?: string | null;
          name?: string;
          spec?: string | null;
          unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
        };
        Relationships: [];
      };
      suppliers: {
        Row: {
          address: string | null;
          city: string;
          created_at: string;
          description: string | null;
          id: string;
          joined_year: number;
          logo: string | null;
          maps_url: string | null;
          name: string;
          phone: string;
          rating: number;
          reviews_count: number;
          user_id: string | null;
          verified: boolean;
          whatsapp: string;
        };
        Insert: {
          address?: string | null;
          city: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          joined_year?: number;
          logo?: string | null;
          maps_url?: string | null;
          name: string;
          phone: string;
          rating?: number;
          reviews_count?: number;
          user_id?: string | null;
          verified?: boolean;
          whatsapp: string;
        };
        Update: {
          address?: string | null;
          city?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          joined_year?: number;
          logo?: string | null;
          maps_url?: string | null;
          name?: string;
          phone?: string;
          rating?: number;
          reviews_count?: number;
          user_id?: string | null;
          verified?: boolean;
          whatsapp?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      product_price_stats: {
        Row: {
          avg_price: number | null;
          max_price: number | null;
          min_price: number | null;
          offers_count: number | null;
          product_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "offers_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "supplier" | "shop_owner" | "admin";
      quote_status: "pending" | "quoted" | "rejected" | "closed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["supplier", "shop_owner", "admin"],
      quote_status: ["pending", "quoted", "rejected", "closed"],
    },
  },
} as const;
