// src/app/[locale]/mis-compras/page.jsx
export const dynamic = "force-dynamic";

import MisComprasClient from "@/components/MisComprasClient";
import { getDictionary } from "@/lib/get-dictionary";
import { LOCALES } from "@/lib/i18n";

// Opcional: Next puede prerenderizar la página de "mis compras" por cada locale
export async function generateStaticParams() {
  return (LOCALES || []).map((locale) => ({ locale }));
}

export default async function MisComprasPageServer({ params }) {
  const resolved = await params;
  const { locale = "es-ES" } = resolved || {};

  // Cargar traducciones para este locale
  const dict = (await getDictionary(locale)) || {};

  // Pasar locale y dict al componente cliente
  return <MisComprasClient locale={locale} dict={dict} />;
}
