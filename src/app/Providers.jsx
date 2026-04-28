"use client";
import { AuthProvider } from "@/context/AuthContext";
import { CarritoProvider } from "@/context/CarritoContext";
import { ComprasProvider } from "@/context/ComprasContext";
import { ReservasProvider } from "@/context/ReservasContext";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CarritoProvider>
        <ComprasProvider>
          <ReservasProvider>{children}</ReservasProvider>
        </ComprasProvider>
      </CarritoProvider>
    </AuthProvider>
  );
}
