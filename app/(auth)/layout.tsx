/**
 * Layout de las pantallas sin sesión.
 *
 * Sin isla ni barra: acá todavía no hay taller del que hablar.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col px-5 safe-x pt-[calc(var(--safe-top)+1rem)] pb-[calc(var(--safe-bottom)+1rem)]">
      {children}
    </div>
  );
}
