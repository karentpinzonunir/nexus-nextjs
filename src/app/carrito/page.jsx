"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  ListGroup,
  Alert,
  Modal,
} from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCarrito } from "@/context/CarritoContext";
import { useAuth } from "@/context/AuthContext";
import { useCompras } from "@/context/ComprasContext";
import Login from "@/components/Login";
import CheckoutForm from "@/components/CheckoutForm";
import MySwal from "@/utils/swal";

export default function CarritoPage() {
  const { usuario } = useAuth();
  const {
    itemsCarrito,
    eliminarDelCarrito,
    actualizarCantidad,
    vaciarCarrito,
    totalPrecio,
  } = useCarrito();
  const { agregarCompra } = useCompras();
  const router = useRouter();

  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarPago, setMostrarPago] = useState(false);
  const [checkoutPendiente, setCheckoutPendiente] = useState(false);

  const onProcederPago = async () => {
    if (!usuario) {
      setCheckoutPendiente(true);
      const res = await MySwal.fire({
        icon: "info",
        title: "Inicia sesión para pagar",
        text: "Necesitas una cuenta para procesar tu pedido.",
        confirmButtonText: "Iniciar sesión",
        showCancelButton: true,
        cancelButtonText: "Cancelar",
      });

      if (res.isConfirmed) setMostrarLogin(true);
      return;
    }
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
      const promesas = itemsCarrito.map((item) =>
        fetch(
          "https://mock.apidog.com/m1/1188124-1182752-default/api/compras",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              usuarioId: usuario.id,
              libroId: item.id,
              cantidad: item.cantidad,
            }),
          }
        )
      );

      const resultados = await Promise.all(promesas);

      const algunError = resultados.some((res) => !res.ok);
      if (algunError) {
        throw new Error(
          "Hubo un problema registrando la compra en el servidor."
        );
      }

      agregarCompra(itemsCarrito, usuario.id);

      vaciarCarrito();
      setMostrarPago(false);

      await MySwal.fire({
        icon: "success",
        title: "¡Compra exitosa!",
        text: "Tu pedido ha sido procesado correctamente.",
        confirmButtonText: "Ver mis compras",
      });

      router.push("/mis-compras");
    } catch (error) {
      await MySwal.fire({
        icon: "error",
        title: "Error en el pago",
        text: error.message,
      });
    }
  };

  if (itemsCarrito.length === 0) {
    return (
      <Container className="mt-5 text-center">
        <Alert variant="info">
          <h4>Tu carrito está vacío</h4>
          <p>Explora nuestra librería y añade libros a tu carrito.</p>
          <Button as={Link} href="/" variant="primary">
            Ir a la tienda
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Container className="mt-4">
        <h2 className="mb-4">Mi Carrito de Compras</h2>
        <Row>
          <Col md={8}>
            <ListGroup variant="flush" className="shadow-sm rounded">
              {itemsCarrito.map((item) => (
                <ListGroup.Item key={item.id} className="py-3">
                  <Row className="align-items-center">
                    <Col xs={3} md={2}>
                      <img
                        src={item.portada}
                        alt={item.titulo}
                        className="img-fluid rounded"
                      />
                    </Col>
                    <Col xs={9} md={4}>
                      <h6 className="mb-0">{item.titulo}</h6>
                      <small className="text-muted">{item.autor}</small>
                    </Col>
                    <Col xs={4} md={2} className="text-center fw-bold">
                      {Number(item.precio).toLocaleString("es-ES", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </Col>
                    <Col xs={4} md={2} className="text-center">
                      <div className="d-flex align-items-center justify-content-center border rounded">
                        <Button
                          size="sm"
                          variant="link"
                          className="text-decoration-none"
                          onClick={() =>
                            actualizarCantidad(item.id, item.cantidad - 1)
                          }
                        >
                          -
                        </Button>
                        <span className="mx-2">{item.cantidad}</span>
                        <Button
                          size="sm"
                          variant="link"
                          className="text-decoration-none"
                          onClick={() =>
                            actualizarCantidad(item.id, item.cantidad + 1)
                          }
                        >
                          +
                        </Button>
                      </div>
                    </Col>
                    <Col xs={4} md={2} className="text-center">
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => eliminarDelCarrito(item.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
            <Button
              variant="link"
              className="text-danger mt-3 p-0"
              onClick={vaciarCarrito}
            >
              Vaciar Carrito
            </Button>
          </Col>

          <Col md={4}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <Card.Title className="mb-4">Resumen del Pedido</Card.Title>
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal:</span>
                  <span>
                    {totalPrecio.toLocaleString("es-ES", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-4">
                  <span className="h5">Total:</span>
                  <span className="h5 text-success fw-bold">
                    {totalPrecio.toLocaleString("es-ES", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                </div>
                <Button
                  variant="success"
                  size="lg"
                  className="w-100"
                  onClick={onProcederPago}
                >
                  Proceder al Pago
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal
        show={mostrarLogin}
        onHide={() => {
          setMostrarLogin(false);
          setCheckoutPendiente(false);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Iniciar Sesión</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Login closeModal={() => setMostrarLogin(false)} />
        </Modal.Body>
      </Modal>

      <Modal
        show={mostrarPago}
        onHide={() => setMostrarPago(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Finalizar Compra</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="mb-4 p-3 bg-light rounded d-flex justify-content-between align-items-center">
            <span>Monto total a pagar:</span>
            <span className="h4 mb-0 text-success fw-bold">
              {totalPrecio.toLocaleString("es-ES", {
                style: "currency",
                currency: "EUR",
              })}
            </span>
          </div>
          <CheckoutForm
            totalPrecio={totalPrecio}
            onPagoExitoso={onPagoExitoso}
          />
        </Modal.Body>
      </Modal>
    </>
  );
}
