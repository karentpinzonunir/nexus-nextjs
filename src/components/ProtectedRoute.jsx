// src/components/ProtectedRoute.jsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Modal, Container, Alert } from "react-bootstrap";
import Login from "@/components/Login";

export default function ProtectedRoute({
  children,
  dict = {},
  locale = "es-ES",
}) {
  const { usuario } = useAuth();
  const d = dict.protected || {};

  const [showLogin, setShowLogin] = useState(!usuario);

  useEffect(() => {
    // sincroniza el modal cuando cambie el usuario (p. ej. al iniciar/cerrar sesión)
    setShowLogin(!usuario);
  }, [usuario]);

  const handleCloseLogin = () => setShowLogin(false);

  if (!usuario) {
    return (
      <>
        <Modal show={showLogin} onHide={handleCloseLogin} centered>
          <Modal.Header closeButton>
            <Modal.Title>{d.modal_title || "Iniciar Sesión"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Login closeModal={handleCloseLogin} dict={dict} locale={locale} />
          </Modal.Body>
        </Modal>

        <Container>
          <Alert variant="warning" className="text-center">
            <Alert.Heading>
              {d.alert_heading || "Acceso Restringido"}
            </Alert.Heading>
            <p>
              {d.alert_text || "Debes iniciar sesión para ver esta página."}
            </p>
          </Alert>
        </Container>
      </>
    );
  }

  return children;
}
