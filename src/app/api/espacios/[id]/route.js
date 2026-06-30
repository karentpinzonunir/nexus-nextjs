// src/app/api/espacios/[id]/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/** Normaliza el objeto espacio con nombres claros para el frontend */
function normalizeEspacio(e) {
    return {
        id: e.id_espacio ?? e.id ?? null,
        nombre: e.nombre ?? "",
        capacidad: e.capacidad ?? 0,
        descripcion: e.descripcion ?? "",
        precio: e.precio_hora ?? e.precio ?? 0
    };
}

/** Formatea el label para la UI: "8:00 a.m." */
function hourLabel(h) {
    const hour12 = ((h + 11) % 12) + 1;
    const ampm = h < 12 ? "a.m." : "p.m.";
    return `${hour12}:00 ${ampm}`;
}

/** Genera slots de 1 hora entre las 8 y las 20 */
function buildSlotsForDate(dateStr, startHour = 8, endHour = 20) {
    const slots = [];
    const base = new Date(`${dateStr}T00:00:00Z`);
    for (let h = startHour; h < endHour; h++) {
        const slotStart = new Date(base.getTime() + h * 3600 * 1000);
        const slotEnd = new Date(slotStart.getTime() + 3600 * 1000);
        slots.push({
            hour: h,
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            label: hourLabel(h),
            available: true
        });
    }
    return slots;
}

/** Verifica solapamiento de rangos de tiempo */
function intervalsOverlap(aStartIso, aEndIso, bStartIso, bEndIso) {
    return new Date(aStartIso) < new Date(bEndIso) && new Date(aEndIso) > new Date(bStartIso);
}

export async function GET(request, { params }) {
    try {
        const realParams = params && typeof params.then === "function" ? await params : params;
        let id = realParams?.id;

        if (!id) {
            const url = new URL(request.url);
            id = url.searchParams.get("id");
        }

        if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

        // Consulta básica
        const { data: espacioData, error: espacioError } = await supabase
            .from("espacio_coworking")
            .select("id_espacio, nombre, capacidad, descripcion, precio_hora")
            .eq("id_espacio", id)
            .single();

        if (espacioError || !espacioData) return NextResponse.json({ error: "Espacio no encontrado" }, { status: 404 });

        const espacio = normalizeEspacio(espacioData);
        const url = new URL(request.url);
        const fecha = url.searchParams.get("fecha");

        // Si solo piden el espacio
        if (!fecha) {
            return NextResponse.json({ data: { espacio } }, { status: 200 });
        }

        // Lógica de disponibilidad
        const windowStartIso = new Date(`${fecha}T08:00:00Z`).toISOString();
        const windowEndIso = new Date(`${fecha}T20:00:00Z`).toISOString();

        const { data: reservas, error: reservasError } = await supabase
            .from("reserva")
            .select("fecha_hora_inicio, fecha_hora_fin")
            .eq("espacio_id", id)
            .is("fecha_cancelacion", null)
            .lt("fecha_hora_inicio", windowEndIso)
            .gt("fecha_hora_fin", windowStartIso);

        if (reservasError) return NextResponse.json({ error: "Error al consultar reservas" }, { status: 500 });

        const slots = buildSlotsForDate(fecha, 8, 20);

        for (const slot of slots) {
            for (const r of reservas || []) {
                if (intervalsOverlap(r.fecha_hora_inicio, r.fecha_hora_fin, slot.start, slot.end)) {
                    slot.available = false;
                    break;
                }
            }
        }

        return NextResponse.json({
            data: {
                espacio,
                disponibilidad: {
                    fecha,
                    slots: slots.filter(s => s.available)
                }
            }
        }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}