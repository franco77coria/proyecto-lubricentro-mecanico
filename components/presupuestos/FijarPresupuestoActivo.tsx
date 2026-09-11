"use client";

import { useEffect } from "react";
import { useIsla } from "@/components/isla/IslaContext";

export function FijarPresupuestoActivo({
  presupuestoId,
  numero,
  patente,
  estado,
  telefonoCliente,
  total,
  vehiculoModelo,
  clienteNombre,
}: {
  presupuestoId: string;
  numero: string;
  patente: string;
  estado: string;
  telefonoCliente?: string | null;
  total?: number | null;
  vehiculoModelo?: string | null;
  clienteNombre?: string | null;
}) {
  const { fijarPresupuesto } = useIsla();

  useEffect(() => {
    fijarPresupuesto({
      tipo: "presupuesto",
      presupuestoId,
      numero,
      patente,
      estado,
      telefonoCliente,
      total,
      vehiculoModelo,
      clienteNombre,
    });
  }, [
    presupuestoId,
    numero,
    patente,
    estado,
    telefonoCliente,
    total,
    vehiculoModelo,
    clienteNombre,
    fijarPresupuesto,
  ]);

  return null;
}
