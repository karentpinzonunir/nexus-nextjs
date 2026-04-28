import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import Providers from "./Providers";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import { Container } from "react-bootstrap";

export const metadata = {
  title: "Nexus App - Librería y Coworking",
  description: "Actividad 1 de Desarrollo Web con Frameworks Front-End",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <header className="fixed-top">
            <Menu />
          </header>
          <Container className="mt-5 pt-5 app__cuerpo">
            {children}
          </Container>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}