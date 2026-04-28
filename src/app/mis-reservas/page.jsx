"use client";

import { Container, Row, Col, Card, Alert, Badge } from "react-bootstrap";
import { useAuth } from "@/context/AuthContext";
import { useReservas } from "@/context/ReservasContext";

export default function MisReservasPage() {
  const { usuario } = useAuth();
  const { reservasLocales } = useReservas();

  const misReservas = reservasLocales
    .filter((r) => r.usuarioId === usuario?.id)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (misReservas.length === 0) {
    return (
      <Container className="mt-5 text-center">
        <Alert variant="warning">
          <h4>No tienes reservas registradas</h4>
        </Alert>
      </Container>
    );
  }

  const diasNombres = {
    lunes: "Lunes",
    martes: "Martes",
    miercoles: "Miércoles",
    jueves: "Jueves",
    viernes: "Viernes",
    sabado: "Sábado",
    domingo: "Domingo",
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4 text-center">Mis Reservas de Coworking</h2>
      <Row>
        {misReservas.map((reserva) => (
          <Col key={reserva.id} md={12} className="mb-4">
            <Card className="shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center bg-white">
                <span className="fw-bold">Reserva #{reserva.id}</span>
                <small className="text-muted">
                  {new Date(reserva.fecha).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </small>
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
                      <strong>Día:</strong> {diasNombres[reserva.dia]}
                    </p>
                    <p className="mb-1">
                      <i className="bi bi-clock me-2 text-warning"></i>
                      <strong>Horario:</strong> {reserva.hora} -{" "}
                      {reserva.horaFin}
                    </p>
                    <Badge bg="success" className="mt-2">
                      Confirmada
                    </Badge>
                  </div>
                </div>
              </Card.Body>

              <Card.Footer className="bg-white d-flex justify-content-end align-items-center">
                <span className="me-2 text-muted">Total pagado:</span>
                <h5 className="mb-0 text-success fw-bold">
                  {reserva.precio.toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR",
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
