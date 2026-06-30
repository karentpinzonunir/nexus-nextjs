// src/app/api/productos/[id]/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET(request, { params }) {
    try {
        const { id } = await params; // <- IMPORTANT: await params
        if (!id) {
            return NextResponse.json({ error: "Missing product id" }, { status: 400 });
        }

        // intentar con número primero
        const idNum = Number(id);
        if (!Number.isNaN(idNum)) {
            const { data, error } = await supabase
                .from("producto_editorial")
                .select("*")
                .eq("id_producto", idNum)
                .maybeSingle();

            if (!error && data) return NextResponse.json({ data }, { status: 200 });
        }

        // fallback con string
        const { data: data2, error: error2 } = await supabase
            .from("producto_editorial")
            .select("*")
            .eq("id_producto", String(id))
            .maybeSingle();

        if (!error2 && data2) return NextResponse.json({ data: data2 }, { status: 200 });

        // fallback a otra tabla
        const { data: data3, error: error3 } = await supabase
            .from("productos")
            .select("*")
            .or(`id_producto.eq.${id},id.eq.${id}`)
            .maybeSingle();

        if (!error3 && data3) return NextResponse.json({ data: data3 }, { status: 200 });

        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    } catch (err) {
        console.error("API /api/productos/[id] error:", err);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: "Missing product id" }, { status: 400 });

        const body = await request.json();
        // valida según tu esquema (mantén productoSchema si lo usas)
        // Aquí asumo que productoSchema está disponible si lo necesitas
        // const validData = productoSchema.partial().parse(body);

        const { data, error } = await supabase
            .from("producto_editorial")
            .update(body)
            .eq("id_producto", id)
            .select()
            .maybeSingle();

        if (error || !data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        console.error("PUT /api/productos/[id] error:", error);
        return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: "Missing product id" }, { status: 400 });

        const { error } = await supabase.from("producto_editorial").delete().eq("id_producto", id);
        if (error) return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
        return new NextResponse(null, { status: 204 });
    } catch (err) {
        console.error("DELETE /api/productos/[id] error:", err);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}