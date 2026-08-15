/**
 * Utilidad de feedback háptico (vibración) para dispositivos móviles en taller.
 * No genera excepciones si el navegador o dispositivo no soporta Vibration API.
 */
export function vibrar(patron: number | number[] = 15): void {
  if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
    try {
      navigator.vibrate(patron);
    } catch {
      // Ignorar de forma silenciosa en dispositivos sin soporte de vibración
    }
  }
}

export const vibrarToque = () => vibrar(10);
export const vibrarExito = () => vibrar([15, 60, 25]);
export const vibrarAlerta = () => vibrar([40, 40, 40]);
