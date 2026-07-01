"use client";
import { useState } from "react";
import { Navbar, Nav, Container, Image, Modal, Badge, NavDropdown } from "react-bootstrap";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useCarrito } from "../context/CarritoContext";
import Login from "./Login";

const logo = "/assets/logo.png";

// Definimos los idiomas disponibles
const idiomas = [
  { code: "es-ES", label: "ES" },
  { code: "en-US", label: "EN" },
  { code: "fr-FR", label: "FR" },
  { code: "it-IT", label: "IT" },
  { code: "de-DE", label: "DE" },
];

const Menu = ({ dict = {}, locale = "es-ES" }) => {
  const { usuario, logout } = useAuth();
  const { totalItems } = useCarrito();
  const [mostrarLogin, setMostrarLogin] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();

  const cerrarSesion = () => {
    logout();
  };

  // Función para cambiar de idioma sin perder la página actual
  const cambiarIdioma = (nuevoLocale) => {
    const segments = pathname.split("/");
    segments[1] = nuevoLocale;
    router.push(segments.join("/"));
  };

  return (
    <>
      <Navbar bg="info-subtle" variant="info-subtle" expand="lg">
        <Container>
          <Navbar.Brand as={Link} href={`/${locale}`}>
            <Image src={logo} alt="Nexus" height="40" />
          </Navbar.Brand>

          <Nav className="d-lg-none align-items-center flex-row gap-2">
            <Nav.Link
              as={Link}
              href={`/${locale}/carrito`}
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
                {dict.menu?.welcome || "Hola"}, {usuario.nombre}
              </Navbar.Text>
            )}
          </Nav>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link className="link-primary" as={Link} href={`/${locale}`}>
                {dict.menu?.home || "Inicio"}
              </Nav.Link>
              <Nav.Link className="link-primary" as={Link} href={`/${locale}/libreria`}>
                {dict.menu?.libreria || "Librería"}
              </Nav.Link>
              <Nav.Link className="link-primary" as={Link} href={`/${locale}/coworking`}>
                {dict.menu?.coworking || "Coworking"}
              </Nav.Link>
              {usuario && (
                <>
                  <Nav.Link className="link-primary" as={Link} href={`/${locale}/mis-compras`}>
                    {dict.menu?.my_purchases || "Mis Compras"}
                  </Nav.Link>
                  <Nav.Link className="link-primary" as={Link} href={`/${locale}/mis-reservas`}>
                    {dict.menu?.my_bookings || "Mis Reservas"}
                  </Nav.Link>
                </>
              )}
            </Nav>
            <Nav className="align-items-lg-center">             

              <Nav.Link
                as={Link}
                href={`/${locale}/carrito`}
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
                    {dict.menu?.welcome || "Hola"}, {usuario.nombre} {usuario.apellidos}
                  </Navbar.Text>
                  <Nav.Link className="link-primary" onClick={cerrarSesion}>
                    {dict.menu?.logout || "Cerrar Sesión"}
                  </Nav.Link>
                </>
              ) : (
                <Nav.Link className="link-primary" onClick={() => setMostrarLogin(true)}>
                  {dict.menu?.login || "Iniciar Sesión"}
                </Nav.Link>
              )}
              <NavDropdown title={idiomas.find(i => i.code === locale)?.label || "ES"} id="language-dropdown" className="me-3">
                {idiomas.map((idioma) => (
                  <NavDropdown.Item 
                    key={idioma.code} 
                    onClick={() => cambiarIdioma(idioma.code)}
                    active={locale === idioma.code}
                  >
                    {idioma.label}
                  </NavDropdown.Item>
                ))}
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Modal show={mostrarLogin} onHide={() => setMostrarLogin(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{dict.login?.title || "Iniciar Sesión"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Login closeModal={() => setMostrarLogin(false)} dict={dict} />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Menu;