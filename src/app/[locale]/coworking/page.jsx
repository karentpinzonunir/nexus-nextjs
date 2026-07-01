// src/app/[locale]/coworking/page.jsx
import CoworkingClient from "@/components/CoworkingClient";
import { getDictionary } from "@/lib/get-dictionary";

export default async function Page({ params }) {
  // params puede ser una Promise — awaitear antes de acceder a sus propiedades
  const resolvedParams = await params;
  const { locale = "es-ES" } = resolvedParams ?? {};

  const dict = (await getDictionary(locale)) || {};
  return <CoworkingClient locale={locale} dict={dict} />;
}