// src/app/[locale]/libreria/page.jsx
import LibreriaClient from "@/components/LibreriaClient";
import { getDictionary } from "@/lib/get-dictionary";
import { LOCALES } from "@/lib/i18n";

export async function generateStaticParams() {
  return (LOCALES || []).map((locale) => ({ locale }));
}

export default async function LibreriaPageServer({ params }) {
  const resolved = await params;
  const { locale = "es-ES" } = resolved || {};

  const dict = (await getDictionary(locale)) || {};

  return <LibreriaClient locale={locale} dict={dict} />;
}
