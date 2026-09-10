import { cn } from "@/lib/utils";
import { detectarFormato, formatearPatente } from "@/lib/patente";

interface PlacaPatenteProps {
  patente: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function MercosurEmblem({ className = "w-3 h-2" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {/* 4 estrellas de la Cruz del Sur */}
      <circle cx="12" cy="3.5" r="1.2" fill="#FFFFFF" />
      <circle cx="12" cy="11.5" r="1.2" fill="#FFFFFF" />
      <circle cx="7" cy="7.5" r="1.2" fill="#FFFFFF" />
      <circle cx="16.5" cy="6.5" r="0.9" fill="#FFFFFF" />
      {/* Arco Mercosur */}
      <path d="M4 14C8 10.5 16 10.5 20 14" stroke="#60A5FA" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function BanderaArgentina({ className = "w-3.5 h-2.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 15" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="24" height="15" fill="#75AADB" rx="1" />
      <rect y="5" width="24" height="5" fill="#FFFFFF" />
      <circle cx="12" cy="7.5" r="1.8" fill="#F6B40E" />
      <circle cx="12" cy="7.5" r="1" fill="#B45309" opacity="0.35" />
    </svg>
  );
}

function EscudoArgentino({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {/* Sol de Mayo */}
      <circle cx="12" cy="3" r="1.8" fill="#F59E0B" />
      <path d="M12 0.5V1.8M9 1.5L9.8 2.5M15 1.5L14.2 2.5" stroke="#F59E0B" strokeWidth="0.8" strokeLinecap="round" />
      {/* Laureles */}
      <path
        d="M4 14C3.5 9.5 5.5 6 8.5 4M20 14C20.5 9.5 18.5 6 15.5 4"
        stroke="#16A34A"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Óvalo interior dividido: celeste arriba, blanco abajo */}
      <ellipse cx="12" cy="13" rx="5.5" ry="7" fill="#FFFFFF" />
      <path d="M6.5 13C6.5 9.13 8.96 6 12 6C15.04 6 17.5 9.13 17.5 13Z" fill="#38BDF8" />
      {/* Pica vertical y Gorro Frigio */}
      <line x1="12" y1="8.5" x2="12" y2="17.5" stroke="#78350F" strokeWidth="0.9" />
      <circle cx="12" cy="8.2" r="1" fill="#DC2626" />
      {/* Manos entrelazadas */}
      <ellipse cx="12" cy="13" rx="2" ry="1" fill="#FBBF24" />
      {/* Borde del óvalo */}
      <ellipse cx="12" cy="13" rx="5.5" ry="7" stroke="#94A3B8" strokeWidth="0.6" fill="none" />
    </svg>
  );
}

function RanuraChapa({ className = "" }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded-[1px] bg-zinc-300/90 border border-zinc-400 shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.6),0_0.5px_0_rgba(255,255,255,0.9)] pointer-events-none shrink-0",
        className,
      )}
      aria-hidden
    />
  );
}

function Tornillo({ className = "" }: { className?: string }) {
  return (
    <span
      className={cn(
        "absolute rounded-full bg-zinc-900 border border-zinc-400/80 shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.9),0_0.5px_0.5px_rgba(255,255,255,0.7)] pointer-events-none opacity-85",
        className,
      )}
      aria-hidden
    />
  );
}

export function PlacaPatente({ patente, className, size = "md" }: PlacaPatenteProps) {
  const formato = detectarFormato(patente);
  const textoFormateado = formatearPatente(patente);

  const esMercosurAR = formato === "auto_mercosur" || formato === "moto_mercosur";
  const esMercosurBR = formato === "br_mercosur" || formato === "br_moto_mercosur";
  const esArgentinaVieja = formato === "auto_viejo" || formato === "moto_vieja";
  const esBrasilAntigua = formato === "br_antigua";
  const esEspanaUE = formato === "es_actual" || formato === "es_provincial";
  const esChile = formato === "cl_nuevo" || formato === "cl_antiguo";
  const esColombia = formato === "co_moto";

  // 1. PATENTE MERCOSUR ARGENTINA (Fotorrealista: marco exterior negro, bisel metálico blanco, cabecera azul oficial #0038A8, Cruz del Sur, Bandera Argentina con Sol de Mayo y tipografía vehicular estampada en relieve)
  if (esMercosurAR) {
    if (size === "sm") {
      return (
        <div
          className={cn(
            "relative inline-flex flex-col items-center justify-between rounded-[4px] border-[1.5px] border-black bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] overflow-hidden select-none min-w-[80px] h-[26px]",
            className,
          )}
        >
          <Tornillo className="top-[2px] left-[15%] h-1 w-1" />
          <Tornillo className="top-[2px] right-[15%] h-1 w-1" />
          <div className="flex w-full items-center justify-between bg-[#0038A8] px-1 py-[0.5px] text-[6px] font-black tracking-widest text-white shadow-[inset_0_-0.5px_0_rgba(0,0,0,0.3)]">
            <MercosurEmblem className="w-2.5 h-1.5" />
            <span className="text-[5.5px] font-black uppercase tracking-wider text-white">REPÚBLICA ARGENTINA</span>
            <BanderaArgentina className="w-2.5 h-1.5" />
          </div>
          <span
            className="text-display font-black text-zinc-950 pb-0.5 leading-none text-[12px] tracking-[0.12em]"
            style={{ textShadow: "0 0.5px 0 rgba(255,255,255,0.8), 0 0.5px 1px rgba(0,0,0,0.35)" }}
          >
            {textoFormateado}
          </span>
        </div>
      );
    }

    if (size === "lg") {
      return (
        <div
          className={cn(
            "relative inline-flex flex-col items-center justify-between rounded-[8px] border-[2.5px] border-black bg-white shadow-[0_3px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.95)] overflow-hidden select-none min-w-[170px] h-[52px]",
            className,
          )}
        >
          <Tornillo className="top-[4px] left-[16%] h-2 w-2" />
          <Tornillo className="top-[4px] right-[16%] h-2 w-2" />
          <div className="flex w-full items-center justify-between bg-[#0038A8] px-2.5 py-[2.5px] text-[9px] font-black tracking-widest text-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.4)]">
            <MercosurEmblem className="w-4 h-2.5" />
            <span className="text-[8px] font-black uppercase tracking-widest text-white drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.5)]">
              REPÚBLICA ARGENTINA
            </span>
            <BanderaArgentina className="w-4 h-2.5" />
          </div>
          <span
            className="text-display font-black text-zinc-950 pb-1 leading-none text-[22px] tracking-[0.16em]"
            style={{ textShadow: "0 1px 0 rgba(255,255,255,0.9), 0 1px 2px rgba(0,0,0,0.4)" }}
          >
            {textoFormateado}
          </span>
        </div>
      );
    }

    // Default: size === "md"
    return (
      <div
        className={cn(
          "relative inline-flex flex-col items-center justify-between rounded-[6px] border-[2px] border-black bg-white shadow-[0_2px_4px_rgba(0,0,0,0.25),inset_0_1px_0.5px_rgba(255,255,255,0.9)] overflow-hidden select-none min-w-[115px] h-[36px]",
          className,
        )}
      >
        <Tornillo className="top-[2.5px] left-[16%] h-1.5 w-1.5" />
        <Tornillo className="top-[2.5px] right-[16%] h-1.5 w-1.5" />
        <div className="flex w-full items-center justify-between bg-[#0038A8] px-1.5 py-[1.5px] text-[7px] font-black tracking-widest text-white shadow-[inset_0_-0.5px_0_rgba(0,0,0,0.3)]">
          <MercosurEmblem className="w-3 h-2" />
          <span className="text-[6.5px] font-black uppercase tracking-wider text-white drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.5)]">
            REPÚBLICA ARGENTINA
          </span>
          <BanderaArgentina className="w-3 h-2" />
        </div>
        <span
          className="text-display font-black text-zinc-950 pb-0.5 leading-none text-[15px] tracking-[0.14em]"
          style={{ textShadow: "0 0.75px 0 rgba(255,255,255,0.85), 0 0.5px 1.5px rgba(0,0,0,0.35)" }}
        >
          {textoFormateado}
        </span>
      </div>
    );
  }

  // 2. PATENTE ANTERIOR ARGENTINA 1995-2016 (Fotorrealista: marco exterior blanco reflectivo, Escudo Nacional a la izquierda, "ARGENTINA" en celeste oficial centrado, 4 ranuras de fijación y recuadro central negro con letras estampadas en relieve blanco)
  if (esArgentinaVieja) {
    if (size === "sm") {
      return (
        <div
          className={cn(
            "relative inline-flex flex-col items-center justify-between rounded-[4px] border border-zinc-400/90 bg-gradient-to-b from-[#FFFFFF] via-[#F3F4F6] to-[#E5E7EB] shadow-[0_1.5px_3px_rgba(0,0,0,0.25),inset_0_1px_0.5px_rgba(255,255,255,0.95)] overflow-hidden select-none min-w-[84px] h-[28px] p-[2px]",
            className,
          )}
        >
          {/* Cabecera superior: Escudo + Ranura + ARGENTINA celeste + Ranura */}
          <div className="flex w-full items-center justify-between px-0.5 leading-none">
            <EscudoArgentino className="w-2.5 h-2.5 shrink-0" />
            <RanuraChapa className="w-2.5 h-[1.5px]" />
            <span className="text-[5.5px] font-black uppercase tracking-[0.14em] text-[#2E9CDA] drop-shadow-[0_0.2px_0_rgba(255,255,255,0.8)]">
              ARGENTINA
            </span>
            <RanuraChapa className="w-2.5 h-[1.5px]" />
          </div>

          {/* Recuadro central negro con borde metálico y tipografía blanca en relieve */}
          <div className="flex w-full items-center justify-center rounded-[2px] border border-zinc-300/90 bg-[#0B0B0D] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_0.5px_0_rgba(255,255,255,0.7)] px-1 h-[15px]">
            <span
              className="text-display font-black text-white leading-none text-[11.5px] tracking-[0.16em]"
              style={{ textShadow: "0 0.5px 0 rgba(255,255,255,0.85), 0 1px 1.5px rgba(0,0,0,0.9)" }}
            >
              {textoFormateado}
            </span>
          </div>

          {/* Ranuras inferiores */}
          <div className="flex w-full items-center justify-between px-3 leading-none h-[2px]">
            <RanuraChapa className="w-2.5 h-[1px]" />
            <RanuraChapa className="w-2.5 h-[1px]" />
          </div>
        </div>
      );
    }

    if (size === "lg") {
      return (
        <div
          className={cn(
            "relative inline-flex flex-col items-center justify-between rounded-[7px] border-[2px] border-zinc-400/90 bg-gradient-to-b from-[#FFFFFF] via-[#F3F4F6] to-[#E5E7EB] shadow-[0_3px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.95)] overflow-hidden select-none min-w-[175px] h-[56px] p-[3.5px]",
            className,
          )}
        >
          {/* Cabecera superior */}
          <div className="flex w-full items-center justify-between px-1.5 leading-none">
            <EscudoArgentino className="w-5 h-5 shrink-0" />
            <RanuraChapa className="w-5 h-[3px]" />
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#2E9CDA] drop-shadow-[0_0.5px_0_rgba(255,255,255,0.9)]">
              ARGENTINA
            </span>
            <RanuraChapa className="w-5 h-[3px]" />
          </div>

          {/* Recuadro central negro */}
          <div className="flex w-full items-center justify-center rounded-[4px] border-[1.5px] border-zinc-300 bg-[#0B0B0D] shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.85),0_0.5px_0_rgba(255,255,255,0.8)] px-2.5 h-[31px]">
            <span
              className="text-display font-black text-white leading-none text-[23px] tracking-[0.2em]"
              style={{ textShadow: "0 1px 0 rgba(255,255,255,0.9), 0 1.5px 3px rgba(0,0,0,0.9)" }}
            >
              {textoFormateado}
            </span>
          </div>

          {/* Ranuras inferiores */}
          <div className="flex w-full items-center justify-between px-7 leading-none h-[4px]">
            <RanuraChapa className="w-5 h-[2px]" />
            <RanuraChapa className="w-5 h-[2px]" />
          </div>
        </div>
      );
    }

    // Default: size === "md"
    return (
      <div
        className={cn(
          "relative inline-flex flex-col items-center justify-between rounded-[5px] border-[1.5px] border-zinc-400/90 bg-gradient-to-b from-[#FFFFFF] via-[#F3F4F6] to-[#E5E7EB] shadow-[0_2px_5px_rgba(0,0,0,0.25),inset_0_1px_0.5px_rgba(255,255,255,0.95)] overflow-hidden select-none min-w-[122px] h-[39px] p-[2.5px]",
          className,
        )}
      >
        {/* Cabecera superior */}
        <div className="flex w-full items-center justify-between px-1 leading-none">
          <EscudoArgentino className="w-3.5 h-3.5 shrink-0" />
          <RanuraChapa className="w-3.5 h-[2px]" />
          <span className="text-[7.5px] font-black uppercase tracking-[0.16em] text-[#2E9CDA] drop-shadow-[0_0.3px_0_rgba(255,255,255,0.8)]">
            ARGENTINA
          </span>
          <RanuraChapa className="w-3.5 h-[2px]" />
        </div>

        {/* Recuadro central negro */}
        <div className="flex w-full items-center justify-center rounded-[3px] border-[1.5px] border-zinc-300/90 bg-[#0B0B0D] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_0.5px_0_rgba(255,255,255,0.7)] px-2 h-[22px]">
          <span
            className="text-display font-black text-white leading-none text-[16px] tracking-[0.18em]"
            style={{ textShadow: "0 0.75px 0 rgba(255,255,255,0.85), 0 1px 2px rgba(0,0,0,0.9)" }}
          >
            {textoFormateado}
          </span>
        </div>

        {/* Ranuras inferiores */}
        <div className="flex w-full items-center justify-between px-5 leading-none h-[3px]">
          <RanuraChapa className="w-3.5 h-[1.5px]" />
          <RanuraChapa className="w-3.5 h-[1.5px]" />
        </div>
      </div>
    );
  }

  // 3. BRASIL ANTIGUA
  if (esBrasilAntigua) {
    return (
      <div
        className={cn(
          "relative inline-flex flex-col items-center justify-center rounded-[5px] border-[2px] border-zinc-400 bg-zinc-200 text-zinc-900 font-mono font-black shadow-sm select-none px-2 py-0.5",
          className,
        )}
      >
        {textoFormateado}
      </div>
    );
  }

  // 3. MERCOSUL BRASIL
  if (esMercosurBR) {
    const sizeConfig = {
      sm: { box: "min-w-[80px] h-[26px]", text: "text-[12px]", bar: "text-[6px] py-[0.5px]" },
      md: { box: "min-w-[115px] h-[36px]", text: "text-[15px]", bar: "text-[7px] py-[1.5px]" },
      lg: { box: "min-w-[170px] h-[52px]", text: "text-[22px]", bar: "text-[9px] py-[2.5px]" },
    }[size];

    return (
      <div
        className={cn(
          "relative inline-flex flex-col items-center justify-between rounded-[5px] border-[2px] border-black bg-white shadow-sm overflow-hidden select-none",
          sizeConfig.box,
          className,
        )}
      >
        <Tornillo className="top-[2.5px] left-[15%] h-1.5 w-1.5" />
        <Tornillo className="top-[2.5px] right-[15%] h-1.5 w-1.5" />
        <div className={cn("flex w-full items-center justify-between bg-[#0038A8] px-1.5 text-white font-black tracking-widest", sizeConfig.bar)}>
          <MercosurEmblem className="w-3 h-2" />
          <span className="uppercase font-extrabold tracking-wider">BRASIL</span>
          <span className="text-[9px]">🇧🇷</span>
        </div>
        <span className={cn("text-display font-black text-zinc-950 pb-0.5 tracking-[0.14em]", sizeConfig.text)}>
          {textoFormateado}
        </span>
      </div>
    );
  }

  // 4. ESPAÑA / UNIÓN EUROPEA (Eurobanda azul)
  if (esEspanaUE) {
    const sizeConfig = {
      sm: { box: "min-w-[78px] h-[26px] text-[12px]", band: "px-1 text-[7px]" },
      md: { box: "min-w-[110px] h-[36px] text-[15px]", band: "px-1.5 text-[9px]" },
      lg: { box: "min-w-[155px] h-[50px] text-[21px]", band: "px-2.5 text-[11px]" },
    }[size];

    return (
      <div
        className={cn(
          "relative inline-flex items-stretch rounded-[5px] border-[2px] border-black bg-white shadow-sm overflow-hidden select-none",
          sizeConfig.box,
          className,
        )}
      >
        <div className={cn("bg-[#0038A8] flex flex-col items-center justify-center text-white", sizeConfig.band)}>
          <span className="text-[7px] text-amber-300 leading-none">★</span>
          <span className="font-black leading-none pt-0.5">E</span>
        </div>
        <span className="text-display font-black text-zinc-950 self-center px-2 tracking-[0.16em]">
          {textoFormateado}
        </span>
      </div>
    );
  }

  // 5. COLOMBIA (Fondo amarillo reflectivo)
  if (esColombia) {
    const sizeConfig = {
      sm: { box: "min-w-[75px] h-[26px]", text: "text-[11px]", label: "text-[5.5px]" },
      md: { box: "min-w-[105px] h-[36px]", text: "text-[14px]", label: "text-[7px]" },
      lg: { box: "min-w-[145px] h-[48px]", text: "text-[20px]", label: "text-[9px]" },
    }[size];

    return (
      <div
        className={cn(
          "relative inline-flex flex-col items-center justify-center rounded-[5px] border-[2px] border-zinc-950 bg-[#FACC15] font-black text-zinc-950 shadow-sm select-none",
          sizeConfig.box,
          className,
        )}
      >
        <Tornillo className="top-[2px] left-[15%] h-1.5 w-1.5 bg-zinc-950" />
        <Tornillo className="top-[2px] right-[15%] h-1.5 w-1.5 bg-zinc-950" />
        <span className={cn("text-display font-black tracking-[0.15em]", sizeConfig.text)}>
          {textoFormateado}
        </span>
        <span className={cn("font-black uppercase tracking-widest opacity-85 -mt-0.5", sizeConfig.label)}>
          COLOMBIA
        </span>
      </div>
    );
  }

  // 6. CHILE (Blanca con ribete azul)
  if (esChile) {
    const sizeConfig = {
      sm: { box: "min-w-[75px] h-[26px]", text: "text-[11px]", label: "text-[5.5px]" },
      md: { box: "min-w-[105px] h-[36px]", text: "text-[14px]", label: "text-[7px]" },
      lg: { box: "min-w-[145px] h-[48px]", text: "text-[20px]", label: "text-[9px]" },
    }[size];

    return (
      <div
        className={cn(
          "relative inline-flex flex-col items-center justify-center rounded-[5px] border-[2px] border-blue-900 bg-white font-black text-blue-950 shadow-sm select-none",
          sizeConfig.box,
          className,
        )}
      >
        <span className={cn("text-display font-black tracking-[0.14em]", sizeConfig.text)}>
          {textoFormateado}
        </span>
        <span className={cn("font-black uppercase tracking-widest text-blue-900 opacity-85 -mt-0.5", sizeConfig.label)}>
          CHILE
        </span>
      </div>
    );
  }

  // 7. Fallback / Internacional
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] rounded-md min-w-[70px]",
    md: "px-3 py-1 text-sm rounded-lg min-w-[100px]",
    lg: "px-4 py-1.5 text-lg rounded-xl min-w-[140px]",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center border-2 border-border bg-card font-mono font-black uppercase text-foreground shadow-sm select-none",
        sizeClasses[size],
        className,
      )}
    >
      {textoFormateado}
    </div>
  );
}
