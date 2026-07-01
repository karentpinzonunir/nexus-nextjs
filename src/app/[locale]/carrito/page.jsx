// src/app/[locale]/carrito/page.jsx
import CarritoClient from "@/components/CarritoClient";
import { getDictionary } from "@/lib/get-dictionary";
import { LOCALES } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function CarritoPageServer({ params }) {
  const { locale } = await params;

  const dict = await getDictionary(locale);

  return <CarritoClient locale={locale} dict={dict} />;
}
