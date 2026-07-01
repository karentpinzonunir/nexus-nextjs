// src/app/[locale]/layout.js
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../globals.css";
import Providers from "../Providers"; // ruta relativa dentro de app
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import { Container } from "react-bootstrap";
import { LOCALES } from "@/lib/i18n";
import { getDictionary } from "@/lib/get-dictionary"; // IMPORT CORRECTO

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }) {
  // Unwrap params (required)
  const { locale } = await params;
  const currentLocale = locale ?? "es-ES";

  const dict = await getDictionary(currentLocale);

  return (
    <Providers>
      <header className="fixed-top">
        <Menu dict={dict} locale={currentLocale} />
      </header>

      <Container className="mt-5 pt-5 app__cuerpo">{children}</Container>

      <Footer dict={dict} locale={currentLocale} />
    </Providers>
  );
}