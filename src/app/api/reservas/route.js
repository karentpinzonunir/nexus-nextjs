// src/app/api/reservas/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { auth0 } from "@/lib/auth0";

/* Helpers de sesión (compatible con distintas exportaciones) */
async function getSessionSafe(request) {
    try {
        return await auth0.getSession(request);
    } catch (e) {
        try {
            return await auth0.getSession();
        } catch (err) {
            console.error("auth0.getSession errors:", e, err);
            return null;
        }
    }
}

/* Helper fecha: devuelve ISO inicio y fin del día en UTC */
function dayRangeIso(fechaYYYYMMDD) {
    const dayStart = new Date(`${fechaYYYYMMDD}T00:00:00Z`);
    const dayEnd = new Date(`${fechaYYYYMMDD}T23:59:59Z`);
    return { dayStartIso: dayStart.toISOString(), dayEndIso: dayEnd.toISOString() };
}

/* GET flexible: por usuario, por espacio y/o por fecha */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const qUsuarioId = searchParams.get("usuarioId") ?? searchParams.get("usuario_id");
        const qEspacioId = searchParams.get("espacioId") ?? searchParams.get("espacio_id") ?? searchParams.get("espacio");
        const qFecha = searchParams.get("fecha"); // formato esperado: YYYY-MM-DD

        // Intentamos leer sesión (si existe)
        const session = await getSessionSafe(request);
        const sessionSub = session?.user?.sub ?? null;

        // Si usuarioId = "me", lo reemplazamos por el sub de la sesión
        let usuarioFilter = qUsuarioId;
        if (usuarioFilter === "me") {
            if (!sessionSub) {
                return NextResponse.json({ error: "No autenticado" }, { status: 401 });
            }
            usuarioFilter = sessionSub;
        }

        // Si se consulta por usuarioId, requerimos sesión y que coincida con la sesión
        if (usuarioFilter) {
            if (!sessionSub) {
                return NextResponse.json({ error: "No autenticado para consultar por usuario" }, { status: 401 });
            }
            if (usuarioFilter !== sessionSub) {
                // Aquí podríamos permitir admin; por ahora denegamos
                return NextResponse.json({ error: "Acceso denegado: no puedes ver reservas de otro usuario" }, { status: 403 });
            }
        }

        // Si no hay ningún filtro y no hay sesión, pedimos que se especifique uno o se autentique
        if (!usuarioFilter && !qEspacioId && !sessionSub) {
            return NextResponse.json({ error: "Debes especificar usuarioId, espacioId, fecha o iniciar sesión" }, { status: 400 });
        }

        // Construir la consulta dinámica
        let query = supabase
            .from("reserva")
            .select(`
        id_reserva,
        usuario_id,
        espacio_id,
        fecha_hora_inicio,
        fecha_hora_fin,
        fecha_creacion,
        fecha_pago,
        fecha_cancelacion,
        espacio_coworking(id_espacio, nombre, precio_hora)
      `)
            .is("fecha_cancelacion", null);

        // Aplicar filtros
        if (usuarioFilter) {
            query = query.eq("usuario_id", usuarioFilter);
        }

        if (qEspacioId) {
            // aceptar valores numéricos o strings
            query = query.eq("espacio_id", isNaN(Number(qEspacioId)) ? qEspacioId : Number(qEspacioId));
        }

        if (qFecha) {
            // Filtrar reservas que solapen con ese día:
            // existing.start < dayEnd AND existing.end > dayStart
            const { dayStartIso, dayEndIso } = dayRangeIso(qFecha);
            query = query.lt("fecha_hora_inicio", dayEndIso).gt("fecha_hora_fin", dayStartIso);
        }

        // Ejecutar consulta
        const { data, error } = await query.order("fecha_hora_inicio", { ascending: true });

        if (error) {
            console.error("GET /api/reservas supabase error:", error);
            return NextResponse.json({ error: error.message ?? "Error al consultar reservas" }, { status: 500 });
        }

        return NextResponse.json({ data }, { status: 200 });
    } catch (err) {
        console.error("GET /api/reservas unexpected error:", err);
        return NextResponse.json({ error: "Error del servidor", details: String(err) }, { status: 500 });
    }
}

export async function POST(request) {
  try {
    // 1) sesión obligatoria
    const session = await getSessionSafe(request);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Debes iniciar sesión para reservar" }, { status: 401 });
    }
    const usuario_id = session.user.sub;

    // 2) parseo robusto del body (JSON, texto JSON, FormData)
    let body = null;
    try {
      body = await request.json();
    } catch (jsonErr) {
      try {
        const txt = await request.text();
        body = txt ? JSON.parse(txt) : null;
      } catch (txtErr) {
        try {
          const form = await request.formData();
          if (form && typeof form.entries === "function") {
            body = {};
            for (const [k, v] of form.entries()) body[k] = v;
          }
        } catch (formErr) {
          console.error("No se pudo parsear body:", jsonErr, txtErr, formErr);
        }
      }
    }

    console.log("DEBUG raw body:", JSON.stringify(body));

    // 3) Si viene como array [ {...} ], extraer el primer elemento
    if (Array.isArray(body)) {
      if (body.length === 0) {
        return NextResponse.json({ error: "Body array vacío" }, { status: 400 });
      }
      console.log("DEBUG body was an array — taking first element");
      body = body[0];
      console.log("DEBUG unwrapped array element:", JSON.stringify(body));
    }

    // 4) Unwrapping comunes (data / payload)
    if (body && typeof body === "object") {
      if ("data" in body && typeof body.data === "object") {
        body = body.data;
        console.log("DEBUG unwrapped .data");
      } else if ("payload" in body && typeof body.payload === "object") {
        body = body.payload;
        console.log("DEBUG unwrapped .payload");
      }
    }

    console.log("DEBUG body after unwrapping:", JSON.stringify(body));

    // 5) Extracción flexible de campos
    const espacio_id_raw =
      body?.espacio_id ?? body?.espacioId ?? body?.espacio ?? body?.spaceId ?? body?.space ?? null;
    let fecha_hora_inicio =
      body?.fecha_hora_inicio ?? body?.fechaHoraInicio ?? body?.horaInicio ?? body?.start ?? null;
    let fecha_hora_fin =
      body?.fecha_hora_fin ?? body?.fechaHoraFin ?? body?.horaFin ?? body?.end ?? null;
    const dia = body?.dia ?? body?.date ?? null;
    const horaInicio = body?.horaInicio ?? body?.startLabel ?? null;
    const horaFin = body?.horaFin ?? body?.endLabel ?? null;

    console.log("DEBUG extracted raw fields:", { espacio_id_raw, fecha_hora_inicio, fecha_hora_fin, dia, horaInicio, horaFin });

    // 6) Soportar labels + dia si aplica
    if ((!fecha_hora_inicio || !fecha_hora_fin) && dia && horaInicio && horaFin) {
      fecha_hora_inicio = buildIsoFromDateAndLabel(dia, horaInicio);
      fecha_hora_fin = buildIsoFromDateAndLabel(dia, horaFin);
      console.log("DEBUG built ISO from labels:", { fecha_hora_inicio, fecha_hora_fin });
    }

    // 7) Validación final
    if (espacio_id_raw == null || fecha_hora_inicio == null || fecha_hora_fin == null) {
      console.error("Faltan campos requeridos (after tolerant parse)", { espacio_id_raw, fecha_hora_inicio, fecha_hora_fin, rawBody: body });
      return NextResponse.json({
        error: "Faltan campos requeridos (espacio_id, fecha_hora_inicio, fecha_hora_fin)",
        received: { espacio_id_raw, fecha_hora_inicio, fecha_hora_fin, rawBody: body }
      }, { status: 400 });
    }

    const espacio_id = Number(espacio_id_raw);
    if (!Number.isFinite(espacio_id)) {
      return NextResponse.json({ error: "espacio_id inválido" }, { status: 400 });
    }

    // 8) comprobar solapamiento
    const { data: ocupado, error: occErr } = await supabase
      .from("reserva")
      .select("id_reserva")
      .eq("espacio_id", espacio_id)
      .is("fecha_cancelacion", null)
      .lt("fecha_hora_inicio", fecha_hora_fin)
      .gt("fecha_hora_fin", fecha_hora_inicio)
      .limit(1);

    if (occErr) {
      console.error("Overlap check error:", occErr);
      return NextResponse.json({ error: "Error al comprobar solapamiento" }, { status: 500 });
    }
    if (ocupado?.length > 0) {
      return NextResponse.json({ error: "Horario no disponible", conflict: ocupado[0] }, { status: 409 });
    }

    // 9) insertar reserva con usuario desde la sesión (ignorar usuario enviado por cliente)
    const { data, error: insertErr } = await supabase
      .from("reserva")
      .insert([{
        usuario_id,
        espacio_id,
        fecha_hora_inicio,
        fecha_hora_fin
      }])
      .select()
      .single();

    if (insertErr) {
      console.error("Error insertando reserva:", insertErr);
      return NextResponse.json({ error: "Error al insertar reserva", details: insertErr }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/reservas unexpected:", err);
    return NextResponse.json({ error: "Error del servidor", details: String(err) }, { status: 500 });
  }
}