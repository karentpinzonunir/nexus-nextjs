// src/app/[locale]/mis-reservas/page.jsx
export const dynamic = "force-dynamic";

import MisReservasClient from "@/components/MisReservasClient";
import { getDictionary } from "@/lib/get-dictionary";
import { LOCALES } from "@/lib/i18n";

export async function generateStaticParams() {
  return (LOCALES || []).map((locale) => ({ locale }));
}

export default async function MisReservasPageServer({ params }) {
  // defensivo: algunas versiones de Next pasan params como Promise
  const resolved = await params;
  const { locale = "es-ES" } = resolved || {};

  // cargar traducciones para este locale
  const dict = (await getDictionary(locale)) || {};

  // pasar locale y dict al componente cliente
  return <MisReservasClient locale={locale} dict={dict} />;
}
