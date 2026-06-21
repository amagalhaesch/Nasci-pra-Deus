export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contatos: {
        Row: {
          atualizado_em: string
          celular: string
          coluna_id: string
          criado_em: string
          data_nascimento: string
          id: string
          ministerio_id: string
          nome_completo: string
        }
        Insert: {
          atualizado_em?: string
          celular: string
          coluna_id: string
          criado_em?: string
          data_nascimento: string
          id?: string
          ministerio_id: string
          nome_completo: string
        }
        Update: {
          atualizado_em?: string
          celular?: string
          coluna_id?: string
          criado_em?: string
          data_nascimento?: string
          id?: string
          ministerio_id?: string
          nome_completo?: string
        }
        Relationships: [
          {
            foreignKeyName: "contatos_coluna_id_fkey"
            columns: ["coluna_id"]
            isOneToOne: false
            referencedRelation: "kanban_colunas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contatos_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
        ]
      }
      cronometro_estado: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          cor_fundo: string
          duracao_segundos: number
          intervalo_carrossel_segundos: number
          ministerio_id: string
          modo: Database["public"]["Enums"]["cronometro_modo"]
          restante_ao_pausar_segundos: number | null
          started_at: string | null
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          cor_fundo?: string
          duracao_segundos?: number
          intervalo_carrossel_segundos?: number
          ministerio_id: string
          modo?: Database["public"]["Enums"]["cronometro_modo"]
          restante_ao_pausar_segundos?: number | null
          started_at?: string | null
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          cor_fundo?: string
          duracao_segundos?: number
          intervalo_carrossel_segundos?: number
          ministerio_id?: string
          modo?: Database["public"]["Enums"]["cronometro_modo"]
          restante_ao_pausar_segundos?: number | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cronometro_estado_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: true
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
        ]
      }
      cronometro_imagens: {
        Row: {
          criado_em: string
          criado_por: string | null
          id: string
          ministerio_id: string
          ordem: number
          storage_path: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          ministerio_id: string
          ordem?: number
          storage_path: string
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          ministerio_id?: string
          ordem?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "cronometro_imagens_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_colunas: {
        Row: {
          criado_em: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          criado_em?: string
          id?: string
          nome: string
          ordem: number
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      ministerio_membros: {
        Row: {
          ministerio_id: string
          profile_id: string
        }
        Insert: {
          ministerio_id: string
          profile_id: string
        }
        Update: {
          ministerio_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministerio_membros_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministerio_membros_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ministerios: {
        Row: {
          criado_em: string
          id: string
          nome: string
          slug: string
        }
        Insert: {
          criado_em?: string
          id?: string
          nome: string
          slug: string
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          criado_em: string
          id: string
          nome_completo: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          criado_em?: string
          id: string
          nome_completo: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          criado_em?: string
          id?: string
          nome_completo?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_master: { Args: Record<string, never>; Returns: boolean }
      is_membro: { Args: { _ministerio_id: string }; Returns: boolean }
      storage_ministerio_id: { Args: { _path: string }; Returns: string }
    }
    Enums: {
      cronometro_modo: "parado" | "rodando" | "pausado"
      user_role: "lider" | "master"
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

export type Ministerio = Tables<"ministerios">
export type Profile = Tables<"profiles">
export type Contato = Tables<"contatos">
export type KanbanColuna = Tables<"kanban_colunas">
export type CronometroEstado = Tables<"cronometro_estado">
export type CronometroImagem = Tables<"cronometro_imagens">
