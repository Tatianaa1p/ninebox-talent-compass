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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      boards: {
        Row: {
          company_id: string | null
          id: string
          name: string
          team_id: string | null
        }
        Insert: {
          company_id?: string | null
          id?: string
          name: string
          team_id?: string | null
        }
        Update: {
          company_id?: string | null
          id?: string
          name?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      calibracion_gauss: {
        Row: {
          competencia: string
          created_at: string | null
          empleado_email: string
          equipo: string
          familia_cargo: string
          fecha_calibracion: string | null
          fecha_evaluacion: string
          id: string
          nombre_completo: string | null
          pais: string
          posicion: string
          score_calibrado: number
          score_original: number
          seniority: string
          tablero_id: string | null
          ultima_calibracion_por: string | null
          updated_at: string | null
        }
        Insert: {
          competencia: string
          created_at?: string | null
          empleado_email: string
          equipo: string
          familia_cargo: string
          fecha_calibracion?: string | null
          fecha_evaluacion?: string
          id?: string
          nombre_completo?: string | null
          pais: string
          posicion: string
          score_calibrado: number
          score_original: number
          seniority: string
          tablero_id?: string | null
          ultima_calibracion_por?: string | null
          updated_at?: string | null
        }
        Update: {
          competencia?: string
          created_at?: string | null
          empleado_email?: string
          equipo?: string
          familia_cargo?: string
          fecha_calibracion?: string | null
          fecha_evaluacion?: string
          id?: string
          nombre_completo?: string | null
          pais?: string
          posicion?: string
          score_calibrado?: number
          score_original?: number
          seniority?: string
          tablero_id?: string | null
          ultima_calibracion_por?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calibracion_gauss_tablero_id_fkey"
            columns: ["tablero_id"]
            isOneToOne: false
            referencedRelation: "tableros"
            referencedColumns: ["id"]
          },
        ]
      }
      calibraciones: {
        Row: {
          calibrado_por: string
          created_at: string | null
          empleado_id: string
          id: string
          performance_score: number
          potential_score: number
          tablero_id: string
          updated_at: string | null
        }
        Insert: {
          calibrado_por?: string
          created_at?: string | null
          empleado_id: string
          id?: string
          performance_score?: number
          potential_score?: number
          tablero_id: string
          updated_at?: string | null
        }
        Update: {
          calibrado_por?: string
          created_at?: string | null
          empleado_id?: string
          id?: string
          performance_score?: number
          potential_score?: number
          tablero_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calibraciones_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calibraciones_tablero_id_fkey"
            columns: ["tablero_id"]
            isOneToOne: false
            referencedRelation: "tableros"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      config: {
        Row: {
          created_at: string | null
          id: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          value?: string
        }
        Relationships: []
      }
      empleados: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
          performance: number | null
          potencial: number | null
          tablero_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nombre: string
          performance?: number | null
          potencial?: number | null
          tablero_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
          performance?: number | null
          potencial?: number | null
          tablero_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empleados_tablero_id_fkey"
            columns: ["tablero_id"]
            isOneToOne: false
            referencedRelation: "tableros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tablero"
            columns: ["tablero_id"]
            isOneToOne: false
            referencedRelation: "tableros"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      empresas_usuarios: {
        Row: {
          created_at: string | null
          empresa_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresas_usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      equipos: {
        Row: {
          created_at: string | null
          empresa_id: string
          id: string
          manager_id: string | null
          nombre: string
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          id?: string
          manager_id?: string | null
          nombre: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          id?: string
          manager_id?: string | null
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluaciones: {
        Row: {
          created_at: string | null
          desempeno_score: number
          desempeno_score_original: number | null
          empresa_id: string | null
          equipo_id: string
          id: string
          persona_nombre: string
          potencial_score: number
          potencial_score_original: number | null
          tablero_id: string | null
        }
        Insert: {
          created_at?: string | null
          desempeno_score: number
          desempeno_score_original?: number | null
          empresa_id?: string | null
          equipo_id: string
          id?: string
          persona_nombre: string
          potencial_score: number
          potencial_score_original?: number | null
          tablero_id?: string | null
        }
        Update: {
          created_at?: string | null
          desempeno_score?: number
          desempeno_score_original?: number | null
          empresa_id?: string | null
          equipo_id?: string
          id?: string
          persona_nombre?: string
          potencial_score?: number
          potencial_score_original?: number | null
          tablero_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_tablero_id_fkey"
            columns: ["tablero_id"]
            isOneToOne: false
            referencedRelation: "tableros"
            referencedColumns: ["id"]
          },
        ]
      }
      gauss_user_roles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: Database["public"]["Enums"]["gauss_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          role: Database["public"]["Enums"]["gauss_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["gauss_role"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          role: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          role?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          empresa_id: string
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      tableros: {
        Row: {
          created_at: string | null
          empresa_id: string | null
          equipo_id: string | null
          id: string
          modulo_origen: string
          nombre: string
          pais: string | null
        }
        Insert: {
          created_at?: string | null
          empresa_id?: string | null
          equipo_id?: string | null
          id?: string
          modulo_origen?: string
          nombre: string
          pais?: string | null
        }
        Update: {
          created_at?: string | null
          empresa_id?: string | null
          equipo_id?: string | null
          id?: string
          modulo_origen?: string
          nombre?: string
          pais?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tableros_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tableros_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string | null
          empresas_acceso: string[]
          id: string
          permisos_globales: Json
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          empresas_acceso?: string[]
          id?: string
          permisos_globales?: Json
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          empresas_acceso?: string[]
          id?: string
          permisos_globales?: Json
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      usuarios_empresas: {
        Row: {
          created_at: string | null
          empresa_id: string
          id: string
          rol: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          id?: string
          rol?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          id?: string
          rol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_gauss_role: { Args: { _user_id: string }; Returns: boolean }
      has_gauss_role: {
        Args: {
          _role: Database["public"]["Enums"]["gauss_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_hrb_apu: {
        Args: { _empresa_id: string; _user_id: string }
        Returns: boolean
      }
      is_hrb_apu_any: { Args: { _user_id: string }; Returns: boolean }
      user_has_empresa_access: {
        Args: { _empresa_nombre: string; _user_id: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user" | "hrbp"
      gauss_role:
        | "hrbp"
        | "hrbp_cl"
        | "manager"
        | "manager_cl"
        | "hrbp_apu"
        | "manager_apu"
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
      app_role: ["admin", "manager", "user", "hrbp"],
      gauss_role: [
        "hrbp",
        "hrbp_cl",
        "manager",
        "manager_cl",
        "hrbp_apu",
        "manager_apu",
      ],
    },
  },
} as const
