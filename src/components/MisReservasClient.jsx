// src/components/MisReservasClient.jsx
"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Alert,
  Badge,
  Spinner,
} from "react-bootstrap";
import { useAuth } from "@/context/AuthContext";

const currencyByLocale = {
  "en-US": "USD",
  "es-ES": "EUR",
  "fr-FR": "EUR",
  "it-IT": "EUR",
  "de-DE": "EUR",
};

export default function MisReservasClient({ locale = "es-ES", dict = {} }) {
  const { usuario } = useAuth();

  const [misReservas, setMisReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const d = dict.mis_reservas || {};
  const spaceLabels = dict.space_labels || {};

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadReservas = async () => {
      if (!usuario?.id) {
        setMisReservas([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const url = `/api/reservas?usuario_id=${encodeURIComponent(usuario.id)}`;
        const res = await fetch(url, { signal: controller.signal });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `HTTP ${res.status}`);
        }

        const json = await res.json().catch(() => ({}));
        const rawArray = Array.isArray(json) ? json : (json?.data ?? []);

        const mapped = rawArray
          .filter((r) => String(r.usuario_id) === String(usuario.id))
          .map((r) => {
            const fechaInicio = r.fecha_hora_inicio
              ? new Date(r.fecha_hora_inicio)
              : null;
            const fechaFin = r.fecha_hora_fin
              ? new Date(r.fecha_hora_fin)
              : null;
            const fechaCreacion = r.fecha_creacion
              ? new Date(r.fecha_creacion)
              : null;

            const duracionHoras =
              fechaInicio && fechaFin
                ? Math.max(
                    0,
                    (fechaFin.getTime() - fechaInicio.getTime()) /
                      (1000 * 60 * 60),
                  )
                : 0;

            const espacio = r.espacio_coworking ?? {};
            const precioHora = Number(
              espacio.precio_hora ?? espacio.precio ?? 0,
            );
            const total = Number((duracionHoras * precioHora).toFixed(2));

            // formato con Intl usando locale
            const dayFormatter = new Intl.DateTimeFormat(locale, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            const timeFormatter = new Intl.DateTimeFormat(locale, {
              hour: "2-digit",
              minute: "2-digit",
            });
            const creationFormatter = new Intl.DateTimeFormat(locale, {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            const diaDisplay = fechaInicio
              ? dayFormatter.format(fechaInicio)
              : "—";
            const horaInicioDisplay = fechaInicio
              ? timeFormatter.format(fechaInicio)
              : "—";
            const horaFinDisplay = fechaFin
              ? timeFormatter.format(fechaFin)
              : "—";
            const fechaCreacionDisplay = fechaCreacion
              ? creationFormatter.format(fechaCreacion)
              : "";

            return {
              id: r.id_reserva ?? r.id ?? null,
              id_reserva: r.id_reserva ?? r.id ?? null,
              usuarioId: r.usuario_id ?? null,
              nombreEspacio:
                espacio.nombre ??
                espacio.nombre_espacio ??
                (spaceLabels.default_space_name || "Espacio"),
              fecha: fechaInicio,
              fecha_hora_inicio: fechaInicio,
              fecha_hora_fin: fechaFin,
              fecha_creacion: fechaCreacion,
              fecha_creacion_display: fechaCreacionDisplay,
              fecha_pago: r.fecha_pago ?? null,
              fecha_cancelacion: r.fecha_cancelacion ?? null,
              duracion_horas: duracionHoras,
              precio: r.total ?? total,
              precioHora,
              diaDisplay,
              horaInicioDisplay,
              horaFinDisplay,
              raw: r,
            };
          })
          .sort(
            (a, b) =>
              new Date(b.fecha_creacion ?? b.fecha ?? 0) -
              new Date(a.fecha_creacion ?? a.fecha ?? 0),
          );

        if (mounted) setMisReservas(mapped);
      } catch (err) {
        if (mounted) {
          if (err.name === "AbortError") {
            // aborted
          } else {
            console.error("Error cargando reservas:", err);
            setError(String(err.message ?? err));
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadReservas();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [usuario, locale, dict]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyByLocale[locale] || "EUR",
    }).format(Number(value || 0));

  if (!usuario) {
    return (
      <Container className="mt-5 text-center">
        <Alert variant="info">
          {d.login_prompt || "Inicia sesión para ver tus reservas."}
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">
          {d.loading_text || "Cargando reservas..."}
        </p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          {d.fetch_error || "Error al cargar las reservas"}: {error}
        </Alert>
      </Container>
    );
  }

  if (!misReservas || misReservas.length === 0) {
    return (
      <Container className="mt-5 text-center">
        <Alert variant="warning">
          <h4>{d.no_reservations_title || "No tienes reservas registradas"}</h4>
          {d.no_reservations_text && (
            <p className="mb-0">{d.no_reservations_text}</p>
          )}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4 text-center">
        {d.page_title || "Mis Reservas de Coworking"}
      </h2>
      <Row>
        {misReservas.map((reserva) => (
          <Col key={reserva.id ?? reserva.id_reserva} md={12} className="mb-4">
            <Card className="shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center bg-white">
                <div>
                  <span className="fw-bold">
                    {d.reservation_label || "Reserva"} #
                    {reserva.id ?? reserva.id_reserva}
                  </span>
                  <div className="text-muted small">
                    {reserva.fecha_creacion_display ||
                      d.unknown_date ||
                      "Fecha desconocida"}
                  </div>
                </div>

                <div className="text-end">
                  <Badge bg={reserva.fecha_pago ? "success" : "warning"}>
                    {reserva.fecha_pago
                      ? d.status_confirmed || "Confirmada"
                      : d.status_pending || "Pendiente"}
                  </Badge>
                </div>
              </Card.Header>

              <Card.Body>
                <div className="d-flex align-items-start">
                  <div className="me-3">
                    <i className="bi bi-building fs-1 text-primary"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="mb-2">{reserva.nombreEspacio}</h5>

                    <p className="mb-1">
                      <i className="bi bi-calendar-event me-2 text-info"></i>
                      <strong>{d.day_label || "Día"}:</strong>{" "}
                      {reserva.diaDisplay}
                    </p>

                    <p className="mb-1">
                      <i className="bi bi-clock me-2 text-warning"></i>
                      <strong>{d.time_label || "Hora"}:</strong>{" "}
                      {reserva.horaInicioDisplay} {" - "}
                      {reserva.horaFinDisplay}
                    </p>

                    <p className="mb-1">
                      <strong>{d.duration_label || "Duración"}:</strong>{" "}
                      {Number(reserva.duracion_horas).toFixed(2)}{" "}
                      {d.hours_label || "h"}
                    </p>

                    <p className="mb-1">
                      <strong>
                        {d.price_per_hour_label || "Precio por hora"}:
                      </strong>{" "}
                      {formatCurrency(reserva.precioHora || 0)}
                    </p>
                  </div>
                </div>
              </Card.Body>

              <Card.Footer className="bg-white d-flex justify-content-end align-items-center">
                <span className="me-2 text-muted">
                  {d.total_paid_label || "Total pagado"}:
                </span>
                <h5 className="mb-0 text-success fw-bold">
                  {formatCurrency(reserva.precio || 0)}
                </h5>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
