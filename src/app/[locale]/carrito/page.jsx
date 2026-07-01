// src/app/[locale]/carrito/page.jsx
import CarritoClient from "@/components/CarritoClient";
import { getDictionary } from "@/lib/get-dictionary";
import { LOCALES } from "@/lib/i18n";

// Forzamos que sea dinámico porque el carrito depende del estado del usuario/sesión
export const dynamic = "force-dynamic";

// Opcional: Para que Next.js sepa qué rutas de carrito existen (SSG)
export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function CarritoPageServer({ params }) {
  // Desempaquetamos el locale de la URL
  const { locale } = await params;

  // Cargamos el diccionario (traducciones)
  const dict = await getDictionary(locale);

  // Pasamos el locale y el dict al componente de cliente
  return <CarritoClient locale={locale} dict={dict} />;
}
