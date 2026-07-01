// src/app/[locale]/coworking/[id]/page.jsx
import CoworkingDetalleClient from "@/components/CoworkingDetalleClient"; // Asegúrate de que el nombre coincida
import { getDictionary } from "@/lib/get-dictionary";

export default async function Page({ params }) {
  // 1. Resolvemos params (importante para Next.js 15+)
  const resolvedParams = await params;
  const { locale = "es-ES", id } = resolvedParams ?? {};

  // 2. Cargamos el diccionario
  const dict = (await getDictionary(locale)) || {};

  // 3. Pasamos id, locale y dict al componente cliente
  return (
    <CoworkingDetalleClient 
      id={id} 
      locale={locale} 
      dict={dict} 
    />
  );
}