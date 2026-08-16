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
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      checklist_plantilla: {
        Row: {
          activa: boolean
          creado_en: string
          id: string
          nombre: string
          taller_id: string
        }
        Insert: {
          activa?: boolean
          creado_en?: string
          id?: string
          nombre?: string
          taller_id: string
        }
        Update: {
          activa?: boolean
          creado_en?: string
          id?: string
          nombre?: string
          taller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_plantilla_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_plantilla_item: {
        Row: {
          activo: boolean
          categoria: string | null
          etiqueta: string
          id: string
          orden: number
          plantilla_id: string
          requiere_nota: boolean
          taller_id: string
        }
        Insert: {
          activo?: boolean
          categoria?: string | null
          etiqueta: string
          id?: string
          orden?: number
          plantilla_id: string
          requiere_nota?: boolean
          taller_id: string
        }
        Update: {
          activo?: boolean
          categoria?: string | null
          etiqueta?: string
          id?: string
          orden?: number
          plantilla_id?: string
          requiere_nota?: boolean
          taller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_plantilla_item_plantilla_id_fkey"
            columns: ["plantilla_id"]
            isOneToOne: false
            referencedRelation: "checklist_plantilla"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_plantilla_item_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      cierre_caja: {
        Row: {
          creado_en: string
          fecha: string
          id: string
          notas: string | null
          taller_id: string
          total: number
          totales: Json
          usuario_id: string | null
        }
        Insert: {
          creado_en?: string
          fecha: string
          id?: string
          notas?: string | null
          taller_id: string
          total?: number
          totales?: Json
          usuario_id?: string | null
        }
        Update: {
          creado_en?: string
          fecha?: string
          id?: string
          notas?: string | null
          taller_id?: string
          total?: number
          totales?: Json
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cierre_caja_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cierre_caja_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cliente: {
        Row: {
          apellido: string
          archivado: boolean
          creado_en: string
          documento: string | null
          email: string | null
          id: string
          nombre: string
          notas: string | null
          taller_id: string
          telefono: string | null
        }
        Insert: {
          apellido?: string
          archivado?: boolean
          creado_en?: string
          documento?: string | null
          email?: string | null
          id?: string
          nombre: string
          notas?: string | null
          taller_id: string
          telefono?: string | null
        }
        Update: {
          apellido?: string
          archivado?: boolean
          creado_en?: string
          documento?: string | null
          email?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          taller_id?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliente_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      compra: {
        Row: {
          comprobante: string | null
          creado_en: string
          creado_por: string | null
          fecha: string
          id: string
          notas: string | null
          proveedor_id: string | null
          taller_id: string
          total: number
        }
        Insert: {
          comprobante?: string | null
          creado_en?: string
          creado_por?: string | null
          fecha?: string
          id?: string
          notas?: string | null
          proveedor_id?: string | null
          taller_id: string
          total?: number
        }
        Update: {
          comprobante?: string | null
          creado_en?: string
          creado_por?: string | null
          fecha?: string
          id?: string
          notas?: string | null
          proveedor_id?: string | null
          taller_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "compra_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compra_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compra_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      compra_item: {
        Row: {
          cantidad: number
          compra_id: string
          costo_unitario: number
          id: string
          producto_id: string
          subtotal: number | null
          taller_id: string
        }
        Insert: {
          cantidad: number
          compra_id: string
          costo_unitario: number
          id?: string
          producto_id: string
          subtotal?: number | null
          taller_id: string
        }
        Update: {
          cantidad?: number
          compra_id?: string
          costo_unitario?: number
          id?: string
          producto_id?: string
          subtotal?: number | null
          taller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compra_item_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compra_item_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "producto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compra_item_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      ficha_tecnica: {
        Row: {
          aceite_litros: number | null
          aceite_norma: string | null
          aceite_viscosidad: string | null
          actualizado_en: string
          caja_aceite: string | null
          caja_tipo: string | null
          creado_en: string
          diferencial: string | null
          direccion_hidraulica: string | null
          estado: Database["public"]["Enums"]["estado_catalogo"]
          filtro_aceite: string | null
          filtro_aire: string | null
          filtro_combustible: string | null
          filtro_habitaculo: string | null
          liquido_frenos: string | null
          motorizacion_id: string
          notas: string | null
          refrigerante: string | null
          service_km: number | null
          service_meses: number | null
          taller_origen_id: string | null
          verificada: boolean
        }
        Insert: {
          aceite_litros?: number | null
          aceite_norma?: string | null
          aceite_viscosidad?: string | null
          actualizado_en?: string
          caja_aceite?: string | null
          caja_tipo?: string | null
          creado_en?: string
          diferencial?: string | null
          direccion_hidraulica?: string | null
          estado?: Database["public"]["Enums"]["estado_catalogo"]
          filtro_aceite?: string | null
          filtro_aire?: string | null
          filtro_combustible?: string | null
          filtro_habitaculo?: string | null
          liquido_frenos?: string | null
          motorizacion_id: string
          notas?: string | null
          refrigerante?: string | null
          service_km?: number | null
          service_meses?: number | null
          taller_origen_id?: string | null
          verificada?: boolean
        }
        Update: {
          aceite_litros?: number | null
          aceite_norma?: string | null
          aceite_viscosidad?: string | null
          actualizado_en?: string
          caja_aceite?: string | null
          caja_tipo?: string | null
          creado_en?: string
          diferencial?: string | null
          direccion_hidraulica?: string | null
          estado?: Database["public"]["Enums"]["estado_catalogo"]
          filtro_aceite?: string | null
          filtro_aire?: string | null
          filtro_combustible?: string | null
          filtro_habitaculo?: string | null
          liquido_frenos?: string | null
          motorizacion_id?: string
          notas?: string | null
          refrigerante?: string | null
          service_km?: number | null
          service_meses?: number | null
          taller_origen_id?: string | null
          verificada?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ficha_tecnica_motorizacion_id_fkey"
            columns: ["motorizacion_id"]
            isOneToOne: true
            referencedRelation: "motorizacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ficha_tecnica_taller_origen_id_fkey"
            columns: ["taller_origen_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      filtro_equivalencia: {
        Row: {
          codigo_a: string
          codigo_b: string
          creado_en: string
          estado: Database["public"]["Enums"]["estado_catalogo"]
          id: string
          marca_a: string | null
          marca_b: string | null
          taller_origen_id: string | null
          tipo: string | null
        }
        Insert: {
          codigo_a: string
          codigo_b: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_catalogo"]
          id?: string
          marca_a?: string | null
          marca_b?: string | null
          taller_origen_id?: string | null
          tipo?: string | null
        }
        Update: {
          codigo_a?: string
          codigo_b?: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_catalogo"]
          id?: string
          marca_a?: string | null
          marca_b?: string | null
          taller_origen_id?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "filtro_equivalencia_taller_origen_id_fkey"
            columns: ["taller_origen_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      intento_auth: {
        Row: {
          clave: string
          creado_en: string
          id: number
        }
        Insert: {
          clave: string
          creado_en?: string
          id?: number
        }
        Update: {
          clave?: string
          creado_en?: string
          id?: number
        }
        Relationships: []
      }
      invitacion: {
        Row: {
          aceptada_en: string | null
          creado_en: string
          email: string
          expira_en: string
          id: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          taller_id: string
          token: string
        }
        Insert: {
          aceptada_en?: string | null
          creado_en?: string
          email: string
          expira_en: string
          id?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          taller_id: string
          token: string
        }
        Update: {
          aceptada_en?: string | null
          creado_en?: string
          email?: string
          expira_en?: string
          id?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          taller_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitacion_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      marca: {
        Row: {
          activa: boolean
          alias: string[]
          creado_en: string
          estado: Database["public"]["Enums"]["estado_catalogo"]
          id: string
          nombre: string
          nombre_norm: string | null
          origen: Database["public"]["Enums"]["origen_catalogo"]
          taller_origen_id: string | null
        }
        Insert: {
          activa?: boolean
          alias?: string[]
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_catalogo"]
          id?: string
          nombre: string
          nombre_norm?: string | null
          origen?: Database["public"]["Enums"]["origen_catalogo"]
          taller_origen_id?: string | null
        }
        Update: {
          activa?: boolean
          alias?: string[]
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_catalogo"]
          id?: string
          nombre?: string
          nombre_norm?: string | null
          origen?: Database["public"]["Enums"]["origen_catalogo"]
          taller_origen_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marca_taller_origen_id_fkey"
            columns: ["taller_origen_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      modelo: {
        Row: {
          anio_desde: number | null
          anio_hasta: number | null
          creado_en: string
          estado: Database["public"]["Enums"]["estado_catalogo"]
          fusionado_en_id: string | null
          id: string
          marca_id: string
          nombre: string
          nombre_norm: string | null
          origen: Database["public"]["Enums"]["origen_catalogo"]
          taller_origen_id: string | null
        }
        Insert: {
          anio_desde?: number | null
          anio_hasta?: number | null
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_catalogo"]
          fusionado_en_id?: string | null
          id?: string
          marca_id: string
          nombre: string
          nombre_norm?: string | null
          origen?: Database["public"]["Enums"]["origen_catalogo"]
          taller_origen_id?: string | null
        }
        Update: {
          anio_desde?: number | null
          anio_hasta?: number | null
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_catalogo"]
          fusionado_en_id?: string | null
          id?: string
          marca_id?: string
          nombre?: string
          nombre_norm?: string | null
          origen?: Database["public"]["Enums"]["origen_catalogo"]
          taller_origen_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modelo_fusionado_en_id_fkey"
            columns: ["fusionado_en_id"]
            isOneToOne: false
            referencedRelation: "modelo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modelo_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modelo_taller_origen_id_fkey"
            columns: ["taller_origen_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      motorizacion: {
        Row: {
          anio_desde: number | null
          anio_hasta: number | null
          cilindrada_cc: number | null
          combustible: Database["public"]["Enums"]["tipo_combustible"] | null
          creado_en: string
          estado: Database["public"]["Enums"]["estado_catalogo"]
          fusionado_en_id: string | null
          id: string
          modelo_id: string
          nombre: string
          nombre_norm: string | null
          origen: Database["public"]["Enums"]["origen_catalogo"]
          potencia_cv: number | null
          taller_origen_id: string | null
        }
        Insert: {
          anio_desde?: number | null
          anio_hasta?: number | null
          cilindrada_cc?: number | null
          combustible?: Database["public"]["Enums"]["tipo_combustible"] | null
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_catalogo"]
          fusionado_en_id?: string | null
          id?: string
          modelo_id: string
          nombre: string
          nombre_norm?: string | null
          origen?: Database["public"]["Enums"]["origen_catalogo"]
          potencia_cv?: number | null
          taller_origen_id?: string | null
        }
        Update: {
          anio_desde?: number | null
          anio_hasta?: number | null
          cilindrada_cc?: number | null
          combustible?: Database["public"]["Enums"]["tipo_combustible"] | null
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_catalogo"]
          fusionado_en_id?: string | null
          id?: string
          modelo_id?: string
          nombre?: string
          nombre_norm?: string | null
          origen?: Database["public"]["Enums"]["origen_catalogo"]
          potencia_cv?: number | null
          taller_origen_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "motorizacion_fusionado_en_id_fkey"
            columns: ["fusionado_en_id"]
            isOneToOne: false
            referencedRelation: "motorizacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "motorizacion_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "modelo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "motorizacion_taller_origen_id_fkey"
            columns: ["taller_origen_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      movimiento_stock: {
        Row: {
          cantidad: number
          compra_id: string | null
          compra_item_id: string | null
          costo_unitario: number
          creado_en: string
          id: string
          motivo: string | null
          ot_id: string | null
          ot_item_id: string | null
          producto_id: string
          secuencia: number
          taller_id: string
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          usuario_id: string | null
        }
        Insert: {
          cantidad: number
          compra_id?: string | null
          compra_item_id?: string | null
          costo_unitario?: number
          creado_en?: string
          id?: string
          motivo?: string | null
          ot_id?: string | null
          ot_item_id?: string | null
          producto_id: string
          secuencia?: never
          taller_id: string
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          usuario_id?: string | null
        }
        Update: {
          cantidad?: number
          compra_id?: string | null
          compra_item_id?: string | null
          costo_unitario?: number
          creado_en?: string
          id?: string
          motivo?: string | null
          ot_id?: string | null
          ot_item_id?: string | null
          producto_id?: string
          secuencia?: never
          taller_id?: string
          tipo?: Database["public"]["Enums"]["tipo_movimiento"]
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimiento_stock_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimiento_stock_compra_item_id_fkey"
            columns: ["compra_item_id"]
            isOneToOne: false
            referencedRelation: "compra_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimiento_stock_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "orden_trabajo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimiento_stock_ot_item_id_fkey"
            columns: ["ot_item_id"]
            isOneToOne: false
            referencedRelation: "ot_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimiento_stock_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "producto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimiento_stock_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimiento_stock_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["user_id"]
          },
        ]
      }
      orden_trabajo: {
        Row: {
          anulada_en: string | null
          aprobado_cliente_en: string | null
          asignado_a: string | null
          cliente_id: string | null
          creado_en: string
          creado_por: string | null
          estado: Database["public"]["Enums"]["estado_ot"]
          fecha_entrega: string | null
          fecha_ingreso: string
          id: string
          km_ingreso: number | null
          motivo_anulacion: string | null
          numero: string
          observaciones: string | null
          taller_id: string
          tipo: Database["public"]["Enums"]["tipo_ot"]
          token_expira_en: string | null
          token_publico: string | null
          total: number
          total_mano_obra: number
          total_repuestos: number
          vehiculo_id: string
        }
        Insert: {
          anulada_en?: string | null
          aprobado_cliente_en?: string | null
          asignado_a?: string | null
          cliente_id?: string | null
          creado_en?: string
          creado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_ot"]
          fecha_entrega?: string | null
          fecha_ingreso?: string
          id?: string
          km_ingreso?: number | null
          motivo_anulacion?: string | null
          numero: string
          observaciones?: string | null
          taller_id: string
          tipo?: Database["public"]["Enums"]["tipo_ot"]
          token_expira_en?: string | null
          token_publico?: string | null
          total?: number
          total_mano_obra?: number
          total_repuestos?: number
          vehiculo_id: string
        }
        Update: {
          anulada_en?: string | null
          aprobado_cliente_en?: string | null
          asignado_a?: string | null
          cliente_id?: string | null
          creado_en?: string
          creado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_ot"]
          fecha_entrega?: string | null
          fecha_ingreso?: string
          id?: string
          km_ingreso?: number | null
          motivo_anulacion?: string | null
          numero?: string
          observaciones?: string | null
          taller_id?: string
          tipo?: Database["public"]["Enums"]["tipo_ot"]
          token_expira_en?: string | null
          token_publico?: string | null
          total?: number
          total_mano_obra?: number
          total_repuestos?: number
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orden_trabajo_asignado_a_fkey"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orden_trabajo_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_trabajo_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orden_trabajo_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_trabajo_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculo"
            referencedColumns: ["id"]
          },
        ]
      }
      ot_checklist: {
        Row: {
          actualizado_en: string
          actualizado_por: string | null
          estado: Database["public"]["Enums"]["estado_checklist"] | null
          etiqueta_snapshot: string
          id: string
          item_id: string | null
          nota: string | null
          orden: number
          ot_id: string
          taller_id: string
        }
        Insert: {
          actualizado_en?: string
          actualizado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_checklist"] | null
          etiqueta_snapshot: string
          id?: string
          item_id?: string | null
          nota?: string | null
          orden?: number
          ot_id: string
          taller_id: string
        }
        Update: {
          actualizado_en?: string
          actualizado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_checklist"] | null
          etiqueta_snapshot?: string
          id?: string
          item_id?: string | null
          nota?: string | null
          orden?: number
          ot_id?: string
          taller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ot_checklist_actualizado_por_fkey"
            columns: ["actualizado_por"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ot_checklist_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_plantilla_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_checklist_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "orden_trabajo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_checklist_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      ot_estado_log: {
        Row: {
          creado_en: string
          estado_anterior: Database["public"]["Enums"]["estado_ot"] | null
          estado_nuevo: Database["public"]["Enums"]["estado_ot"]
          id: string
          ot_id: string
          taller_id: string
          usuario_id: string | null
        }
        Insert: {
          creado_en?: string
          estado_anterior?: Database["public"]["Enums"]["estado_ot"] | null
          estado_nuevo: Database["public"]["Enums"]["estado_ot"]
          id?: string
          ot_id: string
          taller_id: string
          usuario_id?: string | null
        }
        Update: {
          creado_en?: string
          estado_anterior?: Database["public"]["Enums"]["estado_ot"] | null
          estado_nuevo?: Database["public"]["Enums"]["estado_ot"]
          id?: string
          ot_id?: string
          taller_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ot_estado_log_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "orden_trabajo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_estado_log_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_estado_log_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ot_foto: {
        Row: {
          creado_en: string
          id: string
          nota: string | null
          orden: number
          ot_id: string
          path: string
          subido_por: string | null
          taller_id: string
          tipo: Database["public"]["Enums"]["tipo_foto_ot"]
        }
        Insert: {
          creado_en?: string
          id?: string
          nota?: string | null
          orden?: number
          ot_id: string
          path: string
          subido_por?: string | null
          taller_id: string
          tipo?: Database["public"]["Enums"]["tipo_foto_ot"]
        }
        Update: {
          creado_en?: string
          id?: string
          nota?: string | null
          orden?: number
          ot_id?: string
          path?: string
          subido_por?: string | null
          taller_id?: string
          tipo?: Database["public"]["Enums"]["tipo_foto_ot"]
        }
        Relationships: [
          {
            foreignKeyName: "ot_foto_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "orden_trabajo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_foto_subido_por_fkey"
            columns: ["subido_por"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ot_foto_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      ot_item: {
        Row: {
          cantidad: number
          costo_unitario: number
          creado_en: string
          creado_por: string | null
          descripcion: string
          id: string
          orden: number
          ot_id: string
          precio_unitario: number
          producto_id: string | null
          subtotal: number | null
          taller_id: string
          tipo: Database["public"]["Enums"]["tipo_item_ot"]
        }
        Insert: {
          cantidad?: number
          costo_unitario?: number
          creado_en?: string
          creado_por?: string | null
          descripcion: string
          id?: string
          orden?: number
          ot_id: string
          precio_unitario?: number
          producto_id?: string | null
          subtotal?: number | null
          taller_id: string
          tipo: Database["public"]["Enums"]["tipo_item_ot"]
        }
        Update: {
          cantidad?: number
          costo_unitario?: number
          creado_en?: string
          creado_por?: string | null
          descripcion?: string
          id?: string
          orden?: number
          ot_id?: string
          precio_unitario?: number
          producto_id?: string | null
          subtotal?: number | null
          taller_id?: string
          tipo?: Database["public"]["Enums"]["tipo_item_ot"]
        }
        Relationships: [
          {
            foreignKeyName: "ot_item_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ot_item_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "orden_trabajo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_item_producto_fk"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "producto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_item_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      ot_nota: {
        Row: {
          creado_en: string
          creado_por: string | null
          id: string
          orden: number
          ot_id: string
          precio_estimado: number | null
          responde_a_id: string | null
          taller_id: string
          texto: string
          tipo: Database["public"]["Enums"]["tipo_nota_ot"]
          visible_cliente: boolean
        }
        Insert: {
          creado_en?: string
          creado_por?: string | null
          id?: string
          orden?: number
          ot_id: string
          precio_estimado?: number | null
          responde_a_id?: string | null
          taller_id: string
          texto: string
          tipo: Database["public"]["Enums"]["tipo_nota_ot"]
          visible_cliente?: boolean
        }
        Update: {
          creado_en?: string
          creado_por?: string | null
          id?: string
          orden?: number
          ot_id?: string
          precio_estimado?: number | null
          responde_a_id?: string | null
          taller_id?: string
          texto?: string
          tipo?: Database["public"]["Enums"]["tipo_nota_ot"]
          visible_cliente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ot_nota_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ot_nota_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "orden_trabajo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_nota_responde_a_id_fkey"
            columns: ["responde_a_id"]
            isOneToOne: false
            referencedRelation: "ot_nota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_nota_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      ot_recepcion: {
        Row: {
          cedula_payload: string | null
          combustible: number | null
          creado_en: string
          firma_entrega_url: string | null
          firma_recepcion_url: string | null
          km: number | null
          objetos_valor: string | null
          observaciones: string | null
          ot_id: string
          recibido_por: string | null
          taller_id: string
        }
        Insert: {
          cedula_payload?: string | null
          combustible?: number | null
          creado_en?: string
          firma_entrega_url?: string | null
          firma_recepcion_url?: string | null
          km?: number | null
          objetos_valor?: string | null
          observaciones?: string | null
          ot_id: string
          recibido_por?: string | null
          taller_id: string
        }
        Update: {
          cedula_payload?: string | null
          combustible?: number | null
          creado_en?: string
          firma_entrega_url?: string | null
          firma_recepcion_url?: string | null
          km?: number | null
          objetos_valor?: string | null
          observaciones?: string | null
          ot_id?: string
          recibido_por?: string | null
          taller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ot_recepcion_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: true
            referencedRelation: "orden_trabajo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_recepcion_recibido_por_fkey"
            columns: ["recibido_por"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ot_recepcion_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      ot_sugerencia_ia: {
        Row: {
          acerto: boolean | null
          causa_real: string | null
          creado_en: string
          creado_por: string | null
          entrada: string
          id: string
          modelo: string
          ot_id: string
          salida: Json
          taller_id: string
          tipo: string
          tokens_entrada: number | null
          tokens_salida: number | null
        }
        Insert: {
          acerto?: boolean | null
          causa_real?: string | null
          creado_en?: string
          creado_por?: string | null
          entrada: string
          id?: string
          modelo: string
          ot_id: string
          salida: Json
          taller_id: string
          tipo: string
          tokens_entrada?: number | null
          tokens_salida?: number | null
        }
        Update: {
          acerto?: boolean | null
          causa_real?: string | null
          creado_en?: string
          creado_por?: string | null
          entrada?: string
          id?: string
          modelo?: string
          ot_id?: string
          salida?: Json
          taller_id?: string
          tipo?: string
          tokens_entrada?: number | null
          tokens_salida?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ot_sugerencia_ia_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ot_sugerencia_ia_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "orden_trabajo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_sugerencia_ia_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      pago: {
        Row: {
          fecha: string
          id: string
          metodo: Database["public"]["Enums"]["metodo_pago"]
          monto: number
          notas: string | null
          ot_id: string
          taller_id: string
          usuario_id: string | null
        }
        Insert: {
          fecha?: string
          id?: string
          metodo?: Database["public"]["Enums"]["metodo_pago"]
          monto: number
          notas?: string | null
          ot_id: string
          taller_id: string
          usuario_id?: string | null
        }
        Update: {
          fecha?: string
          id?: string
          metodo?: Database["public"]["Enums"]["metodo_pago"]
          monto?: number
          notas?: string | null
          ot_id?: string
          taller_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pago_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "orden_trabajo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pago_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pago_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["user_id"]
          },
        ]
      }
      perfil: {
        Row: {
          activo: boolean
          creado_en: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          taller_id: string
          user_id: string
          vistas_permitidas: string[] | null
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          taller_id: string
          user_id: string
          vistas_permitidas?: string[] | null
        }
        Update: {
          activo?: boolean
          creado_en?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          taller_id?: string
          user_id?: string
          vistas_permitidas?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "perfil_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      registro_actividad_usuario: {
        Row: {
          id: string
          taller_id: string
          user_id: string
          fecha: string
          segundos_activos: number
          minutos_activos?: number
          ultima_actividad: string
          online_hasta: string
          pantallas_visitadas: string[]
          creado_en: string
          actualizado_en: string
        }
        Insert: {
          id?: string
          taller_id: string
          user_id: string
          fecha?: string
          segundos_activos?: number
          ultima_actividad?: string
          online_hasta?: string
          pantallas_visitadas?: string[]
          creado_en?: string
          actualizado_en?: string
        }
        Update: {
          id?: string
          taller_id?: string
          user_id?: string
          fecha?: string
          segundos_activos?: number
          ultima_actividad?: string
          online_hasta?: string
          pantallas_visitadas?: string[]
          creado_en?: string
          actualizado_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "registro_actividad_usuario_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      producto: {
        Row: {
          activo: boolean
          bajo_stock: boolean | null
          categoria: string | null
          codigo_barras: string | null
          creado_en: string
          id: string
          marca: string | null
          nombre: string
          precio_venta: number
          sku: string | null
          stock: number
          stock_min: number
          taller_id: string
          ubicacion: string | null
          unidad: string
        }
        Insert: {
          activo?: boolean
          bajo_stock?: boolean | null
          categoria?: string | null
          codigo_barras?: string | null
          creado_en?: string
          id?: string
          marca?: string | null
          nombre: string
          precio_venta?: number
          sku?: string | null
          stock?: number
          stock_min?: number
          taller_id: string
          ubicacion?: string | null
          unidad?: string
        }
        Update: {
          activo?: boolean
          bajo_stock?: boolean | null
          categoria?: string | null
          codigo_barras?: string | null
          creado_en?: string
          id?: string
          marca?: string | null
          nombre?: string
          precio_venta?: number
          sku?: string | null
          stock?: number
          stock_min?: number
          taller_id?: string
          ubicacion?: string | null
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "producto_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      producto_equivalencia: {
        Row: {
          modelo_id: string
          producto_id: string
          taller_id: string
        }
        Insert: {
          modelo_id: string
          producto_id: string
          taller_id: string
        }
        Update: {
          modelo_id?: string
          producto_id?: string
          taller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "producto_equivalencia_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "modelo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producto_equivalencia_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "producto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producto_equivalencia_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedor: {
        Row: {
          activo: boolean
          creado_en: string
          email: string | null
          id: string
          nombre: string
          notas: string | null
          taller_id: string
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          email?: string | null
          id?: string
          nombre: string
          notas?: string | null
          taller_id: string
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          creado_en?: string
          email?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          taller_id?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proveedor_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      recordatorio: {
        Row: {
          contactado_en: string | null
          creado_en: string
          estado: Database["public"]["Enums"]["estado_recordatorio"]
          fecha_objetivo: string | null
          id: string
          km_objetivo: number | null
          ot_origen_id: string | null
          taller_id: string
          tipo: string
          vehiculo_id: string
        }
        Insert: {
          contactado_en?: string | null
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_recordatorio"]
          fecha_objetivo?: string | null
          id?: string
          km_objetivo?: number | null
          ot_origen_id?: string | null
          taller_id: string
          tipo?: string
          vehiculo_id: string
        }
        Update: {
          contactado_en?: string | null
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_recordatorio"]
          fecha_objetivo?: string | null
          id?: string
          km_objetivo?: number | null
          ot_origen_id?: string | null
          taller_id?: string
          tipo?: string
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recordatorio_ot_origen_id_fkey"
            columns: ["ot_origen_id"]
            isOneToOne: false
            referencedRelation: "orden_trabajo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordatorio_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordatorio_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculo"
            referencedColumns: ["id"]
          },
        ]
      }
      servicio: {
        Row: {
          activo: boolean
          creado_en: string
          id: string
          nombre: string
          precio_mano_obra: number
          taller_id: string
          tiempo_estimado: string | null
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          id?: string
          nombre: string
          precio_mano_obra?: number
          taller_id: string
          tiempo_estimado?: string | null
        }
        Update: {
          activo?: boolean
          creado_en?: string
          id?: string
          nombre?: string
          precio_mano_obra?: number
          taller_id?: string
          tiempo_estimado?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servicio_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      taller: {
        Row: {
          config: Json
          creado_en: string
          cuit: string | null
          direccion: string | null
          estado_suscripcion: string
          id: string
          logo_url: string | null
          nombre: string
          plan: string
          telefono: string | null
        }
        Insert: {
          config?: Json
          creado_en?: string
          cuit?: string | null
          direccion?: string | null
          estado_suscripcion?: string
          id?: string
          logo_url?: string | null
          nombre: string
          plan?: string
          telefono?: string | null
        }
        Update: {
          config?: Json
          creado_en?: string
          cuit?: string | null
          direccion?: string | null
          estado_suscripcion?: string
          id?: string
          logo_url?: string | null
          nombre?: string
          plan?: string
          telefono?: string | null
        }
        Relationships: []
      }
      taller_contador: {
        Row: {
          anio: number
          taller_id: string
          ultimo: number
        }
        Insert: {
          anio: number
          taller_id: string
          ultimo?: number
        }
        Update: {
          anio?: number
          taller_id?: string
          ultimo?: number
        }
        Relationships: [
          {
            foreignKeyName: "taller_contador_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      vehiculo: {
        Row: {
          anio: number | null
          color: string | null
          combustible: Database["public"]["Enums"]["tipo_combustible"] | null
          creado_en: string
          formato_especial: boolean
          id: string
          km_actual: number | null
          km_actualizado_en: string | null
          marca_id: string | null
          modelo_id: string | null
          motorizacion_id: string | null
          notas: string | null
          patente: string
          patente_norm: string | null
          taller_id: string
          vin: string | null
        }
        Insert: {
          anio?: number | null
          color?: string | null
          combustible?: Database["public"]["Enums"]["tipo_combustible"] | null
          creado_en?: string
          formato_especial?: boolean
          id?: string
          km_actual?: number | null
          km_actualizado_en?: string | null
          marca_id?: string | null
          modelo_id?: string | null
          motorizacion_id?: string | null
          notas?: string | null
          patente: string
          patente_norm?: string | null
          taller_id: string
          vin?: string | null
        }
        Update: {
          anio?: number | null
          color?: string | null
          combustible?: Database["public"]["Enums"]["tipo_combustible"] | null
          creado_en?: string
          formato_especial?: boolean
          id?: string
          km_actual?: number | null
          km_actualizado_en?: string | null
          marca_id?: string | null
          modelo_id?: string | null
          motorizacion_id?: string | null
          notas?: string | null
          patente?: string
          patente_norm?: string | null
          taller_id?: string
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehiculo_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehiculo_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "modelo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehiculo_motorizacion_id_fkey"
            columns: ["motorizacion_id"]
            isOneToOne: false
            referencedRelation: "motorizacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehiculo_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
        ]
      }
      vehiculo_cliente: {
        Row: {
          cliente_id: string
          creado_en: string
          desde: string
          hasta: string | null
          id: string
          taller_id: string
          vehiculo_id: string
        }
        Insert: {
          cliente_id: string
          creado_en?: string
          desde?: string
          hasta?: string | null
          id?: string
          taller_id: string
          vehiculo_id: string
        }
        Update: {
          cliente_id?: string
          creado_en?: string
          desde?: string
          hasta?: string | null
          id?: string
          taller_id?: string
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehiculo_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehiculo_cliente_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "taller"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehiculo_cliente_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculo"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aceptar_invitacion: { Args: { p_token: string }; Returns: string }
      antecedentes_modelo: {
        Args: { p_limite?: number; p_vehiculo: string }
        Returns: {
          anomalia: string
          descargo: string
          fecha: string
          patente: string
        }[]
      }
      anular_orden: { Args: { p_motivo: string; p_ot: string }; Returns: Json }
      aprobar_presupuesto_publico: { Args: { p_token: string }; Returns: Json }
      catalogo_pendiente: {
        Args: never
        Returns: {
          contexto: string
          creado_en: string
          id: string
          nivel: string
          nombre: string
        }[]
      }
      chequear_rate_limit: {
        Args: { p_clave: string; p_max?: number; p_ventana?: string }
        Returns: Json
      }
      compra_detalle: {
        Args: { p_compra: string }
        Returns: {
          cantidad: number
          costo_unitario: number
          item_id: string
          producto: string
          producto_id: string
          subtotal: number
          unidad: string
        }[]
      }
      costo_actual_producto: { Args: { p_producto: string }; Returns: number }
      crear_checklist_default: { Args: { p_taller: string }; Returns: string }
      crear_taller: {
        Args: {
          p_cuit?: string
          p_nombre: string
          p_nombre_usuario?: string
          p_telefono?: string
        }
        Returns: string
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      equivalencias_filtro: {
        Args: { p_codigo: string }
        Returns: {
          codigo: string
          marca: string
          tipo: string
        }[]
      }
      es_dueno: { Args: never; Returns: boolean }
      ficha_de_vehiculo: { Args: { p_vehiculo: string }; Returns: Json }
      generar_token_seguimiento: {
        Args: { p_dias?: number; p_ot: string }
        Returns: string
      }
      limpiar_rate_limit: { Args: { p_clave: string }; Returns: undefined }
      metricas_taller: {
        Args: { p_desde?: string; p_hasta?: string }
        Returns: Json
      }
      normalizar: { Args: { t: string }; Returns: string }
      ot_costos: {
        Args: { p_ot: string }
        Returns: {
          cantidad: number
          costo_unitario: number
          descripcion: string
          item_id: string
          margen: number
          precio_unitario: number
        }[]
      }
      precio_sugerido_producto: { Args: { p_producto: string }; Returns: Json }
      proponer_marca: { Args: { p_nombre: string }; Returns: string }
      proponer_modelo: {
        Args: { p_marca_id: string; p_nombre: string }
        Returns: string
      }
      proponer_motorizacion: {
        Args: { p_modelo_id: string; p_nombre: string }
        Returns: string
      }
      recordatorios_a_contactar: {
        Args: { p_dias_antes?: number }
        Returns: {
          cliente_nombre: string
          descripcion: string
          fecha_objetivo: string
          id: string
          km_actual: number
          km_objetivo: number
          patente: string
          telefono: string
          vehiculo_id: string
          vence_por: string
        }[]
      }
      resolver_catalogo: {
        Args: {
          p_estado: Database["public"]["Enums"]["estado_catalogo"]
          p_fusionar_en?: string
          p_id: string
          p_nivel: string
        }
        Returns: undefined
      }
      resolver_vehiculo_cedula: {
        Args: { p_marca?: string; p_modelo?: string }
        Returns: {
          marca_id: string
          modelo_id: string
        }[]
      }
      rol_actual: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      seguimiento_por_patente: { Args: { p_patente: string }; Returns: Json }
      seguimiento_por_token: { Args: { p_token: string }; Returns: Json }
      siguiente_numero_ot: { Args: { p_taller: string }; Returns: string }
      taller_actual: { Args: never; Returns: string }
      tiempo_promedio_taller: { Args: { p_desde?: string }; Returns: number }
      total_recomendado: { Args: { p_ot: string }; Returns: number }
      verificar_saldos_stock: {
        Args: never
        Returns: {
          nombre: string
          producto_id: string
          stock_guardado: number
          stock_ledger: number
        }[]
      }
    }
    Enums: {
      estado_catalogo: "aprobado" | "pendiente" | "rechazado"
      estado_checklist: "ok" | "observado" | "critico" | "no_aplica"
      estado_ot:
        | "presupuesto"
        | "aprobado"
        | "recibido"
        | "en_trabajo"
        | "esperando_repuesto"
        | "listo"
        | "entregado"
        | "cerrado"
        | "anulado"
      estado_recordatorio:
        | "pendiente"
        | "contactado"
        | "cumplido"
        | "descartado"
      metodo_pago:
        | "efectivo"
        | "transferencia"
        | "tarjeta_debito"
        | "tarjeta_credito"
        | "mercado_pago"
        | "otro"
      origen_catalogo: "seed" | "vpic" | "manual"
      rol_usuario: "dueno" | "mostrador" | "mecanico"
      tipo_combustible: "nafta" | "diesel" | "gnc" | "hibrido" | "electrico"
      tipo_foto_ot: "cedula" | "estado_ingreso" | "dano" | "comprobante"
      tipo_item_ot: "repuesto" | "mano_obra" | "servicio" | "insumo" | "tercero"
      tipo_movimiento:
        | "compra"
        | "consumo"
        | "devolucion"
        | "ajuste"
        | "inicial"
      tipo_nota_ot: "anomalia" | "descargo" | "recomendado"
      tipo_ot: "lubricentro" | "mecanica" | "mixto"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      estado_catalogo: ["aprobado", "pendiente", "rechazado"],
      estado_checklist: ["ok", "observado", "critico", "no_aplica"],
      estado_ot: [
        "presupuesto",
        "aprobado",
        "recibido",
        "en_trabajo",
        "esperando_repuesto",
        "listo",
        "entregado",
        "cerrado",
        "anulado",
      ],
      estado_recordatorio: [
        "pendiente",
        "contactado",
        "cumplido",
        "descartado",
      ],
      metodo_pago: [
        "efectivo",
        "transferencia",
        "tarjeta_debito",
        "tarjeta_credito",
        "mercado_pago",
        "otro",
      ],
      origen_catalogo: ["seed", "vpic", "manual"],
      rol_usuario: ["dueno", "mostrador", "mecanico"],
      tipo_combustible: ["nafta", "diesel", "gnc", "hibrido", "electrico"],
      tipo_foto_ot: ["cedula", "estado_ingreso", "dano", "comprobante"],
      tipo_item_ot: ["repuesto", "mano_obra", "servicio", "insumo", "tercero"],
      tipo_movimiento: ["compra", "consumo", "devolucion", "ajuste", "inicial"],
      tipo_nota_ot: ["anomalia", "descargo", "recomendado"],
      tipo_ot: ["lubricentro", "mecanica", "mixto"],
    },
  },
} as const
