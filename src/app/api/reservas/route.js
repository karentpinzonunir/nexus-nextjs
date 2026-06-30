// src/app/api/reservas/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { reservaSchema } from "@/lib/schemas";
import { ZodError } from "zod";

/** Helpers (mismas funciones de antes) */
function parseHourLabelTo24(label) {
    if (!label || typeof label !== "string") return null;
    const cleaned = label.trim().toLowerCase().replace(/\s+/g, " ");
    const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(a\.m\.|p\.m\.|am|pm)$/i);
    if (!match) return null;
    let hh = Number(match[1]);
    const mm = match[2];
    const period = match[3].replace(/\./g, "").toLowerCase();
    if (period === "a m" || period === "am" || period === "a.m.") {
        if (hh === 12) hh = 0;
    } else {
        if (hh !== 12) hh = hh + 12;
    }
    return `${String(hh).padStart(2, "0")}:${mm}`;
}

function buildIsoFromDateAndLabel(dateYYYYMMDD, label) {
    const hhmm = parseHourLabelTo24(label);
    if (!hhmm) return null;
    return `${dateYYYYMMDD}T${hhmm}:00Z`;
}

function normalizeSingleInput(body) {
    // Aceptar body en { data: {...} }
    if (body && typeof body === "object" && "data" in body && typeof body.data === "object") {
        body = body.data;
    }

    // Si por algún motivo body llegó como string JSON, intentar parsear
    if (typeof body === "string") {
        try {
            body = JSON.parse(body);
        } catch (err) {
            throw new Error("Payload inválido: body es string no JSON parseable");
        }
    }

    if (!body || typeof body !== "object") throw new Error("Payload inválido: se esperaba un objeto JSON");

    // Normalización de nombres (camelCase / snake_case)
    const usuario_id = body.usuario_id ?? body.usuarioId ?? body.userId ?? body.usuario ?? null;
    const espacio_id = body.espacio_id ?? body.espacioId ?? body.espacio ?? null;

    // Aceptar tanto ISO como labels en varios campos
    let fecha_hora_inicio = body.fecha_hora_inicio ?? body.fechaHoraInicio ?? body.horaInicio ?? body.start ?? null;
    let fecha_hora_fin = body.fecha_hora_fin ?? body.fechaHoraFin ?? body.horaFin ?? body.end ?? null;

    const dia = body.dia ?? body.date ?? null;

    // Si fecha_hora_inicio/fin ya son labels como "8:00 a.m.", convertirlos solo si tenemos 'dia'
    const looksLikeLabel = (v) => typeof v === "string" && /\b(am|pm|a\.m\.|p\.m\.)/i.test(v) || /^\d{1,2}:\d{2}\s*(a|p)/i.test(String(v));
    if (looksLikeLabel(fecha_hora_inicio) || looksLikeLabel(fecha_hora_fin)) {
        if (!dia) {
            throw new Error("Se recibieron horas en formato label (ej. '8:00 a.m.') pero falta el campo 'dia'. Enviar 'dia' (YYYY-MM-DD) + 'horaInicio'/'horaFin' o enviar ISO en 'fecha_hora_inicio'/'fecha_hora_fin'.");
        }
        // Convertir labels a ISO usando el dia
        if (looksLikeLabel(fecha_hora_inicio)) {
            fecha_hora_inicio = buildIsoFromDateAndLabel(dia, fecha_hora_inicio);
        }
        if (looksLikeLabel(fecha_hora_fin)) {
            fecha_hora_fin = buildIsoFromDateAndLabel(dia, fecha_hora_fin);
        }
    }

    // Si las horas vienen como timestamps numéricos, convertir a ISO
    if (typeof fecha_hora_inicio === "number") fecha_hora_inicio = new Date(fecha_hora_inicio).toISOString();
    if (typeof fecha_hora_fin === "number") fecha_hora_fin = new Date(fecha_hora_fin).toISOString();

    // Validaciones básicas y mensaje claro de campos faltantes
    const missing = [];
    if (usuario_id == null || Number.isNaN(Number(usuario_id))) missing.push("usuario_id / usuarioId");
    if (espacio_id == null || Number.isNaN(Number(espacio_id))) missing.push("espacio_id / espacioId");
    if (!fecha_hora_inicio) missing.push("fecha_hora_inicio (ISO) o dia+horaInicio");
    if (!fecha_hora_fin) missing.push("fecha_hora_fin (ISO) o dia+horaFin");

    if (missing.length > 0) {
        throw new Error("Campos faltantes o inválidos: " + missing.join(", "));
    }

    // Validar formato ISO simple (opcional)
    if (typeof fecha_hora_inicio === "string" && isNaN(Date.parse(fecha_hora_inicio))) {
        throw new Error("fecha_hora_inicio no es una fecha ISO válida: " + fecha_hora_inicio);
    }
    if (typeof fecha_hora_fin === "string" && isNaN(Date.parse(fecha_hora_fin))) {
        throw new Error("fecha_hora_fin no es una fecha ISO válida: " + fecha_hora_fin);
    }

    return {
        usuario_id: Number(usuario_id),
        espacio_id: Number(espacio_id),
        fecha_hora_inicio,
        fecha_hora_fin,
    };
}

/** GET */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const usuario = searchParams.get("usuario");
        const fecha = searchParams.get("fecha");
        const espacio = searchParams.get("espacio");

        let query = supabase
            .from("reserva")
            .select(
                `id_reserva, usuario_id, espacio_id, fecha_hora_inicio, fecha_hora_fin, fecha_creacion, fecha_pago, fecha_cancelacion,
         espacio_coworking(id_espacio, nombre, precio_hora)`
            );

        if (usuario) query = query.eq("usuario_id", usuario);
        if (espacio) query = query.eq("espacio_id", espacio);

        if (fecha) {
            const dayStartIso = new Date(`${fecha}T00:00:00Z`).toISOString();
            const dayEndIso = new Date(`${fecha}T23:59:59Z`).toISOString();
            query = query.lt("fecha_hora_inicio", dayEndIso).gt("fecha_hora_fin", dayStartIso);
        }

        const { data, error } = await query;
        if (error) {
            console.error("GET /api/reservas supabase error:", error);
            return NextResponse.json({ error: error.message ?? "Error al consultar reservas" }, { status: 500 });
        }
        return NextResponse.json({ data }, { status: 200 });
    } catch (err) {
        console.error("GET /api/reservas error:", err);
        return NextResponse.json({ error: "Error del servidor", details: String(err) }, { status: 500 });
    }
}

/** POST */
export async function POST(request) {
    try {
        const url = request.url;
        console.log("POST /api/reservas request to:", url);

        let body;
        try {
            body = await request.json();
        } catch (err) {
            console.error("POST /api/reservas: JSON parse error:", err);
            return NextResponse.json({ error: "Request body debe ser JSON válido" }, { status: 400 });
        }

        console.log("POST /api/reservas body:", JSON.stringify(body));

        const items = Array.isArray(body) ? body : [body];

        const normalized = items.map((it, idx) => {
            try {
                const n = normalizeSingleInput(it);
                console.log(`Normalized item ${idx + 1}:`, n);
                return n;
            } catch (err) {
                console.error(`Normalization error item ${idx + 1}:`, err);
                throw new Error(`Item ${idx + 1}: ${err.message}`);
            }
        });

        const toInsert = [];
        for (const item of normalized) {
            const { usuario_id, espacio_id, fecha_hora_inicio, fecha_hora_fin } = item;

            try {
                // Validación zod (si falla lanzará ZodError)
                reservaSchema.parse({ usuario_id, espacio_id, fecha_hora_inicio, fecha_hora_fin });
            } catch (zErr) {
                if (zErr instanceof ZodError) {
                    console.error("Validation ZodError:", zErr.errors);
                    return NextResponse.json({ error: "Payload inválido", details: zErr.errors }, { status: 400 });
                }
                throw zErr;
            }

            // Comprueba solapamiento: existing.start < newEnd AND existing.end > newStart
            const { data: ocupado, error: occErr } = await supabase
                .from("reserva")
                .select("id_reserva, fecha_hora_inicio, fecha_hora_fin, usuario_id")
                .eq("espacio_id", espacio_id)
                .is("fecha_cancelacion", null)
                .lt("fecha_hora_inicio", fecha_hora_fin)
                .gt("fecha_hora_fin", fecha_hora_inicio)
                .limit(1);

            if (occErr) {
                console.error("Error checking overlap:", occErr);
                return NextResponse.json({ error: "Error al comprobar solapamiento" }, { status: 500 });
            }

            if (ocupado && ocupado.length > 0) {
                console.warn("Conflict detected for insert:", { espacio_id, fecha_hora_inicio, fecha_hora_fin, conflict: ocupado[0] });
                return NextResponse.json({
                    error: "Conflicto de reserva",
                    message: `El espacio ${espacio_id} ya está ocupado en ese rango`,
                    conflict: ocupado[0]
                }, { status: 409 });
            }

            toInsert.push({ usuario_id, espacio_id, fecha_hora_inicio, fecha_hora_fin });
        }

        // Bulk insert (atomicity limitada por Supabase client)
        const { data: inserted, error: insertErr } = await supabase
            .from("reserva")
            .insert(toInsert)
            .select();

        if (insertErr) {
            console.error("Insert error:", insertErr);
            return NextResponse.json({ error: insertErr.message ?? "Error al insertar reservas" }, { status: 500 });
        }

        console.log("Inserted reservations:", inserted);
        return NextResponse.json({ data: inserted }, { status: 201 });

    } catch (error) {
        console.error("POST /api/reservas unexpected error:", error);
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: error.message ?? "Error al procesar reserva", details: String(error) }, { status: 400 });
    }
}