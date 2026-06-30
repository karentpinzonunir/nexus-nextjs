// src/components/MisReservasClient.jsx
"use client";

import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Alert, Badge, Spinner } from "react-bootstrap";
import { useAuth } from "@/context/AuthContext";

export default function MisReservasClient() {
    const { usuario } = useAuth();

    const [misReservas, setMisReservas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        const controller = new AbortController();

        const loadReservas = async () => {
            // Si no hay usuario, limpiamos y aseguramos que no quede en loading
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
                    throw new Error(`HTTP ${res.status} ${res.statusText} ${txt}`);
                }

                const json = await res.json().catch(() => ({}));
                const rawArray = Array.isArray(json) ? json : json?.data ?? [];

                const mapped = rawArray
                    .filter((r) => String(r.usuario_id) === String(usuario.id))
                    .map((r) => {
                        const fechaInicio = r.fecha_hora_inicio ? new Date(r.fecha_hora_inicio) : null;
                        const fechaFin = r.fecha_hora_fin ? new Date(r.fecha_hora_fin) : null;
                        const fechaCreacion = r.fecha_creacion ? new Date(r.fecha_creacion) : null;

                        const duracionHoras =
                            fechaInicio && fechaFin
                                ? Math.max(0, (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60))
                                : 0;

                        const espacio = r.espacio_coworking ?? {};
                        const precioHora = Number(espacio.precio_hora ?? espacio.precio ?? 0);
                        const total = Number((duracionHoras * precioHora).toFixed(2));

                        const diaDisplay = fechaInicio
                            ? fechaInicio.toLocaleDateString("es-ES", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })
                            : "—";

                        const horaInicioDisplay = fechaInicio
                            ? fechaInicio.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                            : "—";

                        const horaFinDisplay = fechaFin
                            ? fechaFin.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                            : "—";

                        return {
                            id: r.id_reserva ?? r.id ?? null,
                            id_reserva: r.id_reserva ?? r.id ?? null,
                            usuarioId: r.usuario_id ?? null,
                            nombreEspacio: espacio.nombre ?? espacio.nombre_espacio ?? "Espacio",
                            fecha: fechaInicio,
                            fecha_hora_inicio: fechaInicio,
                            fecha_hora_fin: fechaFin,
                            fecha_creacion: fechaCreacion,
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
                    .sort((a, b) => new Date(b.fecha_creacion ?? b.fecha ?? 0) - new Date(a.fecha_creacion ?? a.fecha ?? 0));

                if (mounted) setMisReservas(mapped);
            } catch (err) {
                if (mounted) {
                    if (err.name === "AbortError") {
                        // fetch aborted
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
    }, [usuario]);

    if (!usuario) {
        return (
            <Container className="mt-5 text-center">
                <Alert variant="info">Inicia sesión para ver tus reservas.</Alert>
            </Container>
        );
    }

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">Error al cargar las reservas: {error}</Alert>
            </Container>
        );
    }

    if (!misReservas || misReservas.length === 0) {
        return (
            <Container className="mt-5 text-center">
                <Alert variant="warning">
                    <h4>No tienes reservas registradas</h4>
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <h2 className="mb-4 text-center">Mis Reservas de Coworking</h2>
            <Row>
                {misReservas.map((reserva) => (
                    <Col key={reserva.id ?? reserva.id_reserva} md={12} className="mb-4">
                        <Card className="shadow-sm">
                            <Card.Header className="d-flex justify-content-between align-items-center bg-white">
                                <div>
                                    <span className="fw-bold">Reserva #{reserva.id ?? reserva.id_reserva}</span>
                                    <div className="text-muted small">
                                        {reserva.fecha_creacion
                                            ? reserva.fecha_creacion.toLocaleDateString("es-ES", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })
                                            : "Fecha desconocida"}
                                    </div>
                                </div>

                                <div className="text-end">
                                    <Badge bg={reserva.fecha_pago ? "success" : "warning"}>
                                        {reserva.fecha_pago ? "Confirmada" : "Pendiente"}
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
                                            <strong>Día:</strong> {reserva.diaDisplay}
                                        </p>

                                        <p className="mb-1">
                                            <i className="bi bi-clock me-2 text-warning"></i>
                                            <strong>Hora:</strong> {reserva.horaInicioDisplay} {" - "}
                                            {reserva.horaFinDisplay}
                                        </p>

                                        <p className="mb-1">
                                            <strong>Duración:</strong> {Number(reserva.duracion_horas).toFixed(2)} h
                                        </p>

                                        <p className="mb-1">
                                            <strong>Precio por hora:</strong>{" "}
                                            {Number(reserva.precioHora || 0).toLocaleString("en-US", {
                                                style: "currency",
                                                currency: "USD",
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </Card.Body>

                            <Card.Footer className="bg-white d-flex justify-content-end align-items-center">
                                <span className="me-2 text-muted">Total pagado:</span>
                                <h5 className="mb-0 text-success fw-bold">
                                    {Number(reserva.precio || 0).toLocaleString("en-US", {
                                        style: "currency",
                                        currency: "USD",
                                    })}
                                </h5>
                            </Card.Footer>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
}