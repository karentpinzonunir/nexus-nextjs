"use client";

import { Container, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import { useAuth } from "@/context/AuthContext";
import { useCompras } from "@/context/ComprasContext";
import useFetch from "@/hooks/useFetch";
import "@/css/MisCompras.css";

export default function MisComprasPage() {
  const { usuario } = useAuth();
  const { comprasLocales } = useCompras();

  const {
    data: comprasServidor,
    cargando,
    error,
  } = useFetch(
    usuario
      ? `https://mock.apidog.com/m1/1188124-1182752-default/api/usuarios/${usuario.id}/compras`
      : null
  );

  const todasLasCompras = [...comprasLocales, ...(comprasServidor || [])].sort(
    (a, b) => new Date(b.fecha) - new Date(a.fecha)
  );

  if (cargando) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">
          Error al cargar el historial de compras.
        </Alert>
      </Container>
    );
  }

  if (todasLasCompras.length === 0) {
    return (
      <Container className="mt-5 text-center">
        <Alert variant="info">
          <h4>No tienes compras registradas</h4>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <h2 className="mb-4 text-center">Mis Compras</h2>
      <Row>
        {todasLasCompras.map((compra) => (
          <Col key={compra.id} md={12} className="mb-4">
            <Card className="shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center bg-white">
                <span className="fw-bold">Pedido #{compra.id}</span>
                <small className="text-muted">
                  {new Date(compra.fecha).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </small>
              </Card.Header>

              <Card.Body>
                {compra.items &&
                  compra.items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`d-flex align-items-center ${
                        idx !== 0 ? "mt-3" : ""
                      }`}
                    >
                      <img
                        src={item.portada}
                        alt={item.titulo}
                        className="rounded me-3 shadow-sm mis-compras__item-miniatura"
                      />
                      <div>
                        <p className="mb-0 fw-bold">{item.titulo}</p>
                        <p className="mb-0 text-muted small">{item.autor}</p>
                        <small>
                          Cantidad: <strong>{item.cantidad}</strong> • Unitario:{" "}
                          {Number(item.precio).toLocaleString("es-ES", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </small>
                      </div>
                    </div>
                  ))}
              </Card.Body>

              <Card.Footer className="bg-white d-flex justify-content-end align-items-center">
                <span className="me-2 text-muted">Total pagado:</span>
                <h5 className="mb-0 text-success fw-bold">
                  {Number(compra.precioTotal).toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </h5>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}
