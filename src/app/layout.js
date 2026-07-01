// src/app/layout.js  (modifica tu archivo actual)
import "./globals.css";

export const metadata = {
  title: "Nexus App - Librería y Coworking",
  description: "Actividad 1 de Desarrollo Web con Frameworks Front-End",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}