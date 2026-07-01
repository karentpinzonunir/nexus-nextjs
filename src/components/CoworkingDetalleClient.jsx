// src/components/CoworkingDetalleClient.jsx
"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Spinner,
  Alert,
  Modal,
  Form,
  Button,
} from "react-bootstrap";
import { useRouter, useParams } from "next/navigation";
import useFetch from "@/hooks/useFetch";
import { useAuth } from "@/context/AuthContext";
import { useReservas } from "@/context/ReservasContext";
import Login from "@/components/Login";
import CheckoutForm from "@/components/CheckoutForm";
import MySwal from "@/utils/swal";
import "@/css/CoworkingDetalle.css";

/**
 * Props soportados:
 * - id (opcional) : si el componente se monta desde server puede recibir el id
 * - locale (opcional) : "es-ES" por defecto
 * - dict (opcional) : diccionario de traducción
 */
export default function CoworkingDetalleClient({
  id: propId = null,
  locale = "es-ES",
  dict = {},
}) {
  const params = useParams(); // en rutas /[locale]/coworking/[id] params puede contener { locale, id }
  const routeId = params?.id ?? params?.espacioId ?? null;
  const id = propId ?? routeId;
  const { usuario } = useAuth();
  const { agregarReserva } = useReservas();
  const router = useRouter();

  const todayString = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  const {
    data: espacioRaw,
    cargando,
    error,
  } = useFetch(id ? `/api/espacios/${encodeURIComponent(id)}` : null);

  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarPago, setMostrarPago] = useState(false);
  const [checkoutPendiente, setCheckoutPendiente] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [loadingReservasFecha, setLoadingReservasFecha] = useState(false);
  const [reservasFecha, setReservasFecha] = useState([]);
  const [occupiedHoursSet, setOccupiedHoursSet] = useState(new Set());

  const [selectedHours, setSelectedHours] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolvedRawEspacio = (() => {
    if (!espacioRaw) return null;
    if (Array.isArray(espacioRaw)) return espacioRaw[0] ?? null;
    if (
      espacioRaw.data &&
      typeof espacioRaw.data === "object" &&
      "espacio" in espacioRaw.data
    ) {
      return espacioRaw.data.espacio ?? null;
    }
    if (espacioRaw.data && Array.isArray(espacioRaw.data))
      return espacioRaw.data[0] ?? null;
    if (espacioRaw.espacio && typeof espacioRaw.espacio === "object")
      return espacioRaw.espacio;
    return espacioRaw;
  })();

  const espacio = resolvedRawEspacio
    ? {
        id: resolvedRawEspacio.id_espacio ?? resolvedRawEspacio.id,
        nombre: resolvedRawEspacio.nombre,
        capacidad: resolvedRawEspacio.capacidad,
        descripcion: resolvedRawEspacio.descripcion,
        zona: resolvedRawEspacio.ubicacion ?? resolvedRawEspacio.zona,
        precio:
          resolvedRawEspacio.precio_hora ?? resolvedRawEspacio.precio ?? 0,
      }
    : null;

  function hourLabel(h) {
    // Formato simple; si quieres localizar AM/PM puedes extender según locale
    const hour12 = ((h + 11) % 12) + 1;
    const ampm =
      h < 12
        ? dict.coworking?.am_label || "a.m."
        : dict.coworking?.pm_label || "p.m.";
    return `${hour12}:00 ${ampm}`;
  }

  function buildDailyHours() {
    const arr = [];
    for (let h = 8; h < 20; h++) arr.push(h);
    return arr;
  }

  function parseHourFromISOString(isoString) {
    const date = new Date(isoString);
    return date.getUTCHours();
  }

  useEffect(() => {
    let mounted = true;

    async function fetchReservas() {
      if (!selectedDate) {
        // solo actualizamos si el estado no está ya vacío (evitar re-renders innecesarios)
        setReservasFecha((prev) =>
          Array.isArray(prev) && prev.length === 0 ? prev : [],
        );
        setOccupiedHoursSet((prev) =>
          prev instanceof Set && prev.size === 0 ? prev : new Set(),
        );
        setSelectedHours((prev) =>
          prev instanceof Set && prev.size === 0 ? prev : new Set(),
        );
        return;
      }

      setLoadingReservasFecha(true);
      try {
        const res = await fetch(
          `/api/reservas?fecha=${encodeURIComponent(selectedDate)}&espacio=${encodeURIComponent(id)}`,
        );
        if (!res.ok)
          throw new Error(
            dict.coworking?.fetch_reservations_error ||
              "Error al consultar reservas",
          );
        const json = await res.json();
        const data = Array.isArray(json) ? json : (json?.data ?? []);
        if (!mounted) return;

        // Si los datos no han cambiado (misma longitud y elementos por id/hora), opcionalmente evitar set
        setReservasFecha((prev) => {
          if (Array.isArray(prev) && prev.length === data.length) {
            let same = true;
            for (let i = 0; i < data.length; i++) {
              if (JSON.stringify(prev[i]) !== JSON.stringify(data[i])) {
                same = false;
                break;
              }
            }
            if (same) return prev;
          }
          return data;
        });

        const occupied = new Set();
        const reservasParaEspacio = data;

        for (const reserva of reservasParaEspacio) {
          const inicioHora = parseHourFromISOString(reserva.fecha_hora_inicio);
          const finHora = parseHourFromISOString(reserva.fecha_hora_fin);

          for (let h = inicioHora; h < finHora; h++) {
            if (h >= 8 && h < 20) {
              occupied.add(h);
            }
          }
        }

        setOccupiedHoursSet((prev) => {
          // evitar set si el Set resultante tiene los mismos elementos
          if (prev instanceof Set && prev.size === occupied.size) {
            let equal = true;
            for (const v of occupied)
              if (!prev.has(v)) {
                equal = false;
                break;
              }
            if (equal) return prev;
          }
          return occupied;
        });

        setSelectedHours((prev) => {
          // eliminar de selectedHours las horas que ahora están ocupadas
          if (!(prev instanceof Set)) return new Set();
          const clone = new Set(prev);
          for (const s of Array.from(clone)) {
            if (occupied.has(s)) clone.delete(s);
          }
          // si no cambió, devolver prev para evitar re-render
          if (clone.size === prev.size) {
            let same = true;
            for (const v of clone)
              if (!prev.has(v)) {
                same = false;
                break;
              }
            if (same) return prev;
          }
          return clone;
        });
      } catch (err) {
        console.error("Error fetch reservas por fecha:", err);
        // solo seteamos si no están ya vacíos (evitar re-render en bucle)
        setReservasFecha((prev) =>
          Array.isArray(prev) && prev.length === 0 ? prev : [],
        );
        setOccupiedHoursSet((prev) =>
          prev instanceof Set && prev.size === 0 ? prev : new Set(),
        );
        setSelectedHours((prev) =>
          prev instanceof Set && prev.size === 0 ? prev : new Set(),
        );
      } finally {
        if (mounted) setLoadingReservasFecha(false);
      }
    }

    fetchReservas();
    return () => {
      mounted = false;
    };
    // NOTE: dejamos fuera `dict` intencionalmente para evitar re-ejecuciones por referencia.
  }, [selectedDate, id]);

  const toggleSelectHour = (h) => {
    if (occupiedHoursSet.has(h)) return;
    setSelectedHours((prev) => {
      const clone = new Set(prev);
      if (clone.has(h)) clone.delete(h);
      else clone.add(h);
      return clone;
    });
  };

  const onReservarClick = async () => {
    if (!selectedDate || selectedHours.size === 0) {
      await MySwal.fire({
        icon: "info",
        title:
          dict.coworking?.select_date_title || "Selecciona fecha y horario",
        text:
          dict.coworking?.select_date_text ||
          "Elige una fecha y al menos un horario antes de reservar.",
      });
      return;
    }

    const horasArray = Array.from(selectedHours).sort((a, b) => a - b);
    const horasLabel = horasArray.map((h) => hourLabel(h)).join(", ");

    if (!usuario) {
      setReservaSeleccionada({
        dia: selectedDate,
        hours: horasArray,
        horasLabel,
      });
      setCheckoutPendiente(true);
      const res = await MySwal.fire({
        icon: "info",
        title: dict.coworking?.login_required_title || "Inicia sesión",
        text:
          dict.coworking?.login_required_text ||
          "Necesitas una cuenta para reservar.",
        confirmButtonText: dict.menu?.login || "Entrar",
        showCancelButton: true,
      });
      if (res.isConfirmed) setMostrarLogin(true);
      return;
    }

    setReservaSeleccionada({
      dia: selectedDate,
      hours: horasArray,
      horasLabel,
    });
    setMostrarPago(true);
  };

  useEffect(() => {
    if (usuario && checkoutPendiente) {
      setMostrarLogin(false);
      setCheckoutPendiente(false);
      setMostrarPago(true);
    }
  }, [usuario, checkoutPendiente]);

  const onPagoExitoso = async () => {
    try {
      const { dia, hours } = reservaSeleccionada || {};
      if (!Array.isArray(hours) || hours.length === 0)
        throw new Error(
          dict.coworking?.no_hours_error || "No hay horas seleccionadas.",
        );

      setIsSubmitting(true);

      const toInsert = hours.map((h) => ({
        usuario_id: Number(usuario?.id),
        espacio_id: Number(id),
        fecha_hora_inicio: `${dia}T${String(h).padStart(2, "0")}:00:00Z`,
        fecha_hora_fin: `${dia}T${String(h + 1).padStart(2, "0")}:00:00Z`,
      }));

      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toInsert),
      });

      const text = await res.text().catch(() => null);
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch (e) {
        json = null;
      }

      if (!res.ok) {
        const message =
          (json && (json.error || json.message)) ||
          text ||
          dict.coworking?.reserve_error ||
          `Error al reservar (${res.status})`;
        throw new Error(message);
      }

      const inserted = (json && (json.data || json.inserted || json)) ?? null;

      if (Array.isArray(inserted) && inserted.length > 0) {
        inserted.forEach((ins) => {
          const espacioIdRet =
            ins.espacio_id ?? ins.espacioId ?? ins.espacio ?? Number(id);
          const horaInicioRaw =
            ins.fecha_hora_inicio ?? ins.start ?? ins.horaInicio;
          const horaFinRaw = ins.fecha_hora_fin ?? ins.end ?? ins.horaFin;
          agregarReserva({
            usuarioId: ins.usuario_id ?? ins.usuarioId ?? usuario?.id,
            espacioId: Number(espacioIdRet),
            nombreEspacio: espacio?.nombre,
            dia: dia,
            hora: hourLabel(new Date(horaInicioRaw).getUTCHours()),
            horaFin: hourLabel(new Date(horaFinRaw).getUTCHours()),
            precio: espacio?.precio,
          });
        });
      } else {
        hours.forEach((h) => {
          agregarReserva({
            usuarioId: usuario?.id,
            espacioId: Number(id),
            nombreEspacio: espacio?.nombre,
            dia: dia,
            hora: hourLabel(h),
            horaFin: hourLabel(h + 1),
            precio: espacio?.precio,
          });
        });
      }

      setMostrarPago(false);
      setSelectedHours(new Set());
      await MySwal.fire({
        icon: "success",
        title: dict.coworking?.reserved_title || "¡Reservado!",
        text: (
          dict.coworking?.reserved_text ||
          "Se crearon {count} reserva(s) para {date}."
        )
          .replace("{count}", String(hours.length))
          .replace("{date}", dia),
      });
      router.push(`/${locale}/mis-reservas`);
    } catch (error) {
      console.error("Pago/Reserva error:", error);
      await MySwal.fire({
        icon: "error",
        title: dict.coworking?.error_title || "Error",
        text: error.message || String(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading =
    cargando || ((espacioRaw === null || espacioRaw === undefined) && !error);
  if (isLoading)
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
      </div>
    );

  if (error)
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );

  if (!espacio)
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          {dict.coworking?.not_found || "Espacio no encontrado"}
        </Alert>
      </Container>
    );

  const hours = buildDailyHours();
  const chunkedHours = [];
  for (let i = 0; i < hours.length; i += 3)
    chunkedHours.push(hours.slice(i, i + 3));

  const currency =
    dict.coworking?.currency || (locale === "en-US" ? "USD" : "EUR");
  const formatCurrency = (value) =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(
      value,
    );

  return (
    <>
      <Container className="mb-5">
        <div className="text-center mb-4 pb-3 border-bottom">
          <h2>{espacio.nombre}</h2>
          <div className="d-flex justify-content-center gap-4">
            <span>
              <i className="bi bi-people-fill text-primary me-2" />
              {dict.coworking?.capacity_label || "Capacidad:"}{" "}
              {espacio.capacidad}
            </span>
          </div>

          <div className="mt-2">
            <span className="fw-bold text-success">
              {formatCurrency(Number(espacio.precio))}{" "}
              {dict.coworking?.per_hour || "/ hora"}
            </span>
          </div>
        </div>

        <h5 className="text-center mb-3">
          {dict.coworking?.select_date || "Selecciona fecha"}
        </h5>
        <div className="d-flex justify-content-center mb-4">
          <Form.Control
            type="date"
            value={selectedDate ?? ""}
            min={todayString}
            onChange={(e) => {
              const v = e.target.value;
              if (v < todayString) {
                MySwal.fire({
                  icon: "warning",
                  title: dict.coworking?.invalid_date_title || "Fecha inválida",
                  text:
                    dict.coworking?.invalid_date_text ||
                    "Selecciona una fecha de hoy en adelante.",
                });
                return;
              }
              setSelectedDate(v);
            }}
            style={{ maxWidth: 220 }}
          />
        </div>

        {selectedDate && (
          <>
            <h6 className="text-center mb-2">
              {dict.coworking?.available_hours_for ||
                "Horarios disponibles para"}{" "}
              {selectedDate}
            </h6>
            {loadingReservasFecha ? (
              <div className="text-center my-3">
                <Spinner animation="border" />
              </div>
            ) : (
              <div className="d-flex flex-column gap-2 align-items-center">
                {chunkedHours.map((row, ri) => (
                  <div
                    key={ri}
                    className="d-flex gap-3 justify-content-center"
                    style={{ width: "100%", maxWidth: 720 }}
                  >
                    {row.map((h) => {
                      const occupied = occupiedHoursSet.has(h);
                      const checked = selectedHours.has(h);
                      return (
                        <Form.Check
                          key={h}
                          type="checkbox"
                          onChange={() => toggleSelectHour(h)}
                          checked={checked}
                          disabled={occupied}
                          label={
                            <div>
                              <div className="fw-medium">{hourLabel(h)}</div>
                            </div>
                          }
                          style={{ minWidth: 180 }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            <div className="text-center mt-3 text-muted">
              <small>
                {dict.coworking?.time_blocks_note ||
                  "Los horarios muestran bloques de 1 hora (08:00–09:00 … 19:00–20:00). Los ocupados aparecen deshabilitados."}
              </small>
            </div>

            <div className="text-center mt-4">
              <Button
                variant="success"
                disabled={selectedHours.size === 0 || isSubmitting}
                onClick={onReservarClick}
              >
                {dict.coworking?.reserve_button || "Reservar"}
              </Button>
            </div>
          </>
        )}
      </Container>

      <Modal show={mostrarLogin} onHide={() => setMostrarLogin(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{dict.login?.title || "Login"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Login
            closeModal={() => setMostrarLogin(false)}
            dict={dict}
            locale={locale}
          />
        </Modal.Body>
      </Modal>

      <Modal
        show={mostrarPago}
        onHide={() => setMostrarPago(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {dict.coworking?.confirm_title || "Confirmar Reserva"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {reservaSeleccionada && (
            <div className="mb-4 p-3 bg-light rounded">
              <h5>{espacio.nombre}</h5>
              <p className="mb-1">
                {dict.coworking?.date_label || "Fecha"}:{" "}
                {reservaSeleccionada.dia}
              </p>
              <p className="mb-1">
                {dict.coworking?.hours_label || "Horas"}:{" "}
                {reservaSeleccionada.horasLabel}
              </p>
              <div className="d-flex justify-content-between border-top pt-2 mt-2">
                <span>{dict.coworking?.total_label || "Total:"}</span>
                <span className="h4 text-success fw-bold">
                  {formatCurrency(
                    Number(
                      espacio.precio * (reservaSeleccionada.hours?.length ?? 1),
                    ),
                  )}
                </span>
              </div>
            </div>
          )}
          <CheckoutForm
            totalPrecio={
              espacio.precio * (reservaSeleccionada?.hours?.length ?? 1)
            }
            onPagoExitoso={onPagoExitoso}
            isSubmitting={isSubmitting}
            dict={dict}
            locale={locale}
          />
        </Modal.Body>
      </Modal>
    </>
  );
}
