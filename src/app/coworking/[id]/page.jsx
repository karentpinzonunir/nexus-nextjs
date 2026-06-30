"use client";

import { useState, useEffect } from "react";
import { Container, Spinner, Alert, Modal, Form, Button } from "react-bootstrap";
import { useRouter, useParams } from "next/navigation";
import useFetch from "@/hooks/useFetch";
import { useAuth } from "@/context/AuthContext";
import { useReservas } from "@/context/ReservasContext";
import Login from "@/components/Login";
import CheckoutForm from "@/components/CheckoutForm";
import MySwal from "@/utils/swal";
import "@/css/CoworkingDetalle.css";

export default function CoworkingDetallePage() {
  const { id } = useParams();
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

  const { data: espacioRaw, cargando, error } = useFetch(`/api/espacios/${encodeURIComponent(id)}`);

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
    if (espacioRaw.data && typeof espacioRaw.data === "object" && "espacio" in espacioRaw.data) {
      return espacioRaw.data.espacio ?? null;
    }
    if (espacioRaw.data && Array.isArray(espacioRaw.data)) return espacioRaw.data[0] ?? null;
    if (espacioRaw.espacio && typeof espacioRaw.espacio === "object") return espacioRaw.espacio;
    return espacioRaw;
  })();

  const espacio = resolvedRawEspacio
    ? {
      id: resolvedRawEspacio.id_espacio ?? resolvedRawEspacio.id,
      nombre: resolvedRawEspacio.nombre,
      capacidad: resolvedRawEspacio.capacidad,
      descripcion: resolvedRawEspacio.descripcion,
      zona: resolvedRawEspacio.ubicacion ?? resolvedRawEspacio.zona,
      precio: resolvedRawEspacio.precio_hora ?? resolvedRawEspacio.precio ?? 0,
    }
    : null;

  function hourLabel(h) {
    const hour12 = ((h + 11) % 12) + 1;
    const ampm = h < 12 ? "a.m." : "p.m.";
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
        setReservasFecha([]);
        setOccupiedHoursSet(new Set());
        setSelectedHours(new Set());
        return;
      }

      setLoadingReservasFecha(true);
      try {
        const res = await fetch(
          `/api/reservas?fecha=${encodeURIComponent(selectedDate)}&espacio=${encodeURIComponent(id)}`
        );
        if (!res.ok) throw new Error("Error al consultar reservas");
        const json = await res.json();
        const data = Array.isArray(json) ? json : json?.data ?? [];
        if (!mounted) return;
        setReservasFecha(data);

        const occupied = new Set();
        const hours = buildDailyHours();
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

        setOccupiedHoursSet(occupied);

        setSelectedHours((prev) => {
          const clone = new Set(prev);
          for (const s of Array.from(clone)) {
            if (occupied.has(s)) clone.delete(s);
          }
          return clone;
        });
      } catch (err) {
        console.error("Error fetch reservas por fecha:", err);
        setReservasFecha([]);
        setOccupiedHoursSet(new Set());
        setSelectedHours(new Set());
      } finally {
        if (mounted) setLoadingReservasFecha(false);
      }
    }

    fetchReservas();
    return () => {
      mounted = false;
    };
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
        title: "Selecciona fecha y horario",
        text: "Elige una fecha y al menos un horario antes de reservar.",
      });
      return;
    }

    const horasArray = Array.from(selectedHours).sort((a, b) => a - b);
    const horasLabel = horasArray.map((h) => hourLabel(h)).join(", ");

    if (!usuario) {
      setReservaSeleccionada({ dia: selectedDate, hours: horasArray, horasLabel });
      setCheckoutPendiente(true);
      const res = await MySwal.fire({
        icon: "info",
        title: "Inicia sesión",
        text: "Necesitas una cuenta para reservar.",
        confirmButtonText: "Entrar",
        showCancelButton: true,
      });
      if (res.isConfirmed) setMostrarLogin(true);
      return;
    }

    setReservaSeleccionada({ dia: selectedDate, hours: horasArray, horasLabel });
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
      if (!Array.isArray(hours) || hours.length === 0) throw new Error("No hay horas seleccionadas.");

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
        const message = (json && (json.error || json.message)) || text || `Error al reservar (${res.status})`;
        throw new Error(message);
      }

      const inserted = (json && (json.data || json.inserted || json)) ?? null;

      if (Array.isArray(inserted) && inserted.length > 0) {
        inserted.forEach((ins) => {
          const espacioIdRet = ins.espacio_id ?? ins.espacioId ?? ins.espacio ?? Number(id);
          const horaInicioRaw = ins.fecha_hora_inicio ?? ins.start ?? ins.horaInicio;
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
        title: "¡Reservado!",
        text: `Se crearon ${hours.length} reserva(s) para ${dia}.`,
      });
      router.push("/mis-reservas");
    } catch (error) {
      console.error("Pago/Reserva error:", error);
      await MySwal.fire({ icon: "error", title: "Error", text: error.message || String(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = cargando || ((espacioRaw === null || espacioRaw === undefined) && !error);
  if (isLoading) return <div className="text-center my-5"><Spinner animation="border" /></div>;

  if (error) return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;

  if (!espacio) return <Container className="mt-4"><Alert variant="warning">Espacio no encontrado</Alert></Container>;

  const hours = buildDailyHours();
  const chunkedHours = [];
  for (let i = 0; i < hours.length; i += 3) chunkedHours.push(hours.slice(i, i + 3));

  return (
    <>
      <Container className="mb-5">
        <div className="text-center mb-4 pb-3 border-bottom">
          <h2>{espacio.nombre}</h2>
          <div className="d-flex justify-content-center gap-4">
            <span>
              <i className="bi bi-people-fill text-primary me-2" />
              Capacidad: {espacio.capacidad}
            </span>
          </div>

          <div className="mt-2">
            <span className="fw-bold text-success">
              {Number(espacio.precio).toLocaleString("en-US", { style: "currency", currency: "USD" })} / hora
            </span>
          </div>
        </div>

        <h5 className="text-center mb-3">Selecciona fecha</h5>
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
                  title: "Fecha inválida",
                  text: "Selecciona una fecha de hoy en adelante.",
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
            <h6 className="text-center mb-2">Horarios disponibles para {selectedDate}</h6>
            {loadingReservasFecha ? (
              <div className="text-center my-3">
                <Spinner animation="border" />
              </div>
            ) : (
              <div className="d-flex flex-column gap-2 align-items-center">
                {chunkedHours.map((row, ri) => (
                  <div key={ri} className="d-flex gap-3 justify-content-center" style={{ width: "100%", maxWidth: 720 }}>
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
                Los horarios muestran bloques de 1 hora (08:00–09:00 … 19:00–20:00). Los ocupados aparecen deshabilitados.
              </small>
            </div>

            <div className="text-center mt-4">
              <Button
                variant="success"
                disabled={selectedHours.size === 0 || isSubmitting}
                onClick={onReservarClick}
              >
                Reservar
              </Button>
            </div>
          </>
        )}
      </Container>

      <Modal show={mostrarLogin} onHide={() => setMostrarLogin(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Login</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Login closeModal={() => setMostrarLogin(false)} />
        </Modal.Body>
      </Modal>

      <Modal show={mostrarPago} onHide={() => setMostrarPago(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Reserva</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {reservaSeleccionada && (
            <div className="mb-4 p-3 bg-light rounded">
              <h5>{espacio.nombre}</h5>
              <p className="mb-1">Fecha: {reservaSeleccionada.dia}</p>
              <p className="mb-1">Horas: {reservaSeleccionada.horasLabel}</p>
              <div className="d-flex justify-content-between border-top pt-2 mt-2">
                <span>Total:</span>
                <span className="h4 text-success fw-bold">
                  {Number(espacio.precio * (reservaSeleccionada.hours?.length ?? 1)).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </span>
              </div>
            </div>
          )}
          <CheckoutForm
            totalPrecio={espacio.precio * (reservaSeleccionada?.hours?.length ?? 1)}
            onPagoExitoso={onPagoExitoso}
            isSubmitting={isSubmitting}
          />
        </Modal.Body>
      </Modal>
    </>
  );
}