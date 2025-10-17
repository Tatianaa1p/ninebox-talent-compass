import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string;
          nombre: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          created_at?: string;
        };
      };
      equipos: {
        Row: {
          id: string;
          nombre: string;
          empresa_id: string;
          manager_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          empresa_id: string;
          manager_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          empresa_id?: string;
          manager_id?: string;
          created_at?: string;
        };
      };
      tableros: {
        Row: {
          id: string;
          nombre: string;
          equipo_id: string;
          empresa_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          equipo_id: string;
          empresa_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          equipo_id?: string;
          empresa_id?: string;
          created_at?: string;
        };
      };
      evaluaciones: {
        Row: {
          id: string;
          persona_nombre: string;
          potencial_score: number;
          desempeño_score: number;
          equipo_id: string;
          tablero_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          persona_nombre: string;
          potencial_score: number;
          desempeño_score: number;
          equipo_id: string;
          tablero_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          persona_nombre?: string;
          potencial_score?: number;
          desempeño_score?: number;
          equipo_id?: string;
          tablero_id?: string;
          created_at?: string;
        };
      };
    };
  };
};
