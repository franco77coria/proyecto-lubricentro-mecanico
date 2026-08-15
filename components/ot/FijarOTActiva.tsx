"use client";

import { useEffect } from "react";
import { useIsla } from "@/components/isla/IslaContext";

export function FijarOTActiva({
  otId,
  numero,
  patente,
  estado,
  telefonoCliente,
}: {
  otId: string;
  numero: string;
  patente: string;
  estado: string;
  telefonoCliente?: string | null;
}) {
  const { fijarOT } = useIsla();

  useEffect(() => {
    fijarOT({
      tipo: "ot",
      otId,
      numero,
      patente,
      estado,
      telefonoCliente,
    });

    return () => {
      fijarOT(null);
    };
  }, [otId, numero, patente, estado, telefonoCliente, fijarOT]);

  return null;
}
