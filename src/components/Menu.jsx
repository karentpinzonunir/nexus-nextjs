"use client";
import { useState } from "react";
import { Navbar, Nav, Container, Image, Modal, Badge } from "react-bootstrap";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useCarrito } from "../context/CarritoContext";
import Login from "./Login";
const logo = "/assets/logo.png";

const Menu = () => {
  const { usuario, logout } = useAuth();
  const { totalItems } = useCarrito();
  const [mostrarLogin, setMostrarLogin] = useState(false);

  const cerrarSesion = () => {
    logout();
  };

  return (
    <>
      <Navbar bg="info-subtle" variant="info-subtle" expand="lg">
        <Container>
          <Navbar.Brand as={Link} href="/">
            <Image src={logo} alt="Nexus" height="40" />
          </Navbar.Brand>

          <Nav className="d-lg-none align-items-center flex-row gap-2">
            <Nav.Link
              as={Link}
              href="/carrito"
              className="position-relative me-1"
            >
              <i className="bi bi-cart3 fs-5 text-primary"></i>
              {totalItems > 0 && (
                <Badge bg="danger" pill className="position-absolute top-0">
                  {totalItems}
                </Badge>
              )}
            </Nav.Link>
            {usuario && (
              <Navbar.Text className="me-3">
                Hola, {usuario.nombre} {usuario.apellidos}
              </Navbar.Text>
            )}
          </Nav>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link className="link-primary" as={Link} href="/">
                Inicio
              </Nav.Link>
              <Nav.Link className="link-primary" as={Link} href="/libreria">
                Librería
              </Nav.Link>
              <Nav.Link className="link-primary" as={Link} href="/coworking">
                Coworking
              </Nav.Link>
              {usuario && (
                <>
                  <Nav.Link
                    className="link-primary"
                    as={Link}
                    href="/mis-compras"
                  >
                    Mis Compras
                  </Nav.Link>
                  <Nav.Link
                    className="link-primary"
                    as={Link}
                    href="/mis-reservas"
                  >
                    Mis Reservas
                  </Nav.Link>
                </>
              )}
            </Nav>
            <Nav className="align-items-lg-center">
              <Nav.Link
                as={Link}
                href="/carrito"
                className="position-relative me-3 d-none d-lg-block"
              >
                <i className="bi bi-cart3 fs-5 text-primary"></i>
                {totalItems > 0 && (
                  <Badge bg="danger" pill className="position-absolute top-0">
                    {totalItems}
                  </Badge>
                )}
              </Nav.Link>

              {usuario ? (
                <>
                  <Navbar.Text className="me-3 d-none d-lg-block">
                    Hola, {usuario.nombre} {usuario.apellidos}
                  </Navbar.Text>
                  <Nav.Link className="link-primary" onClick={cerrarSesion}>
                    Cerrar Sesión
                  </Nav.Link>
                </>
              ) : (
                <Nav.Link
                  className="link-primary"
                  onClick={() => setMostrarLogin(true)}
                >
                  Iniciar Sesión
                </Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Modal show={mostrarLogin} onHide={() => setMostrarLogin(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Iniciar Sesión</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Login closeModal={() => setMostrarLogin(false)} />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Menu;
