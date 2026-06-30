// src/app/api/top-ventas/route.js
import { NextResponse } from "next/server";
import { getTopVentas } from "@/lib/reports";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const limite = parseInt(searchParams.get("limite") || "10", 10);

        const topVentas = await getTopVentas(limite);
        return NextResponse.json({ data: topVentas }, { status: 200 });
    } catch (error) {
        console.error("Error en Top Ventas (route):", error);
        return NextResponse.json({ error: "Error al generar el reporte" }, { status: 500 });
    }
}