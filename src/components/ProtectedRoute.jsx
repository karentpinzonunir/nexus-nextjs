import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Modal, Container, Alert } from "react-bootstrap";
import Login from "../components/Login";

const ProtectedRoute = ({ children }) => {
  const { usuario } = useAuth();
  const [showLogin, setShowLogin] = useState(!usuario);

  if (!usuario) {
    return (
      <>
        <Modal show={showLogin} onHide={() => setShowLogin(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Iniciar Sesión</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Login closeModal={() => setShowLogin(false)} />
          </Modal.Body>
        </Modal>

        <Container>
          <Alert variant="warning" className="text-center">
            <Alert.Heading>Acceso Restringido</Alert.Heading>
            <p>Debes iniciar sesión para ver esta página.</p>
          </Alert>
        </Container>
      </>
    );
  }

  return children;
};

export default ProtectedRoute;
