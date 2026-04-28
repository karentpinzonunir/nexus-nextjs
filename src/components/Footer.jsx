import { Container, Row, Col } from "react-bootstrap";

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <Container>
        <Row className="align-items-center">
          <Col md={4} className="text-center text-md-start mb-3 mb-md-0">
            <h5 className="mb-1">Librería Nexus</h5>
          </Col>

          <Col md={4} className="text-center mb-3 mb-md-0">
            <p className="small mb-0">
              © {new Date().getFullYear()} UNIR - Desarrollo Web con Frameworks
              Front-end
            </p>
          </Col>

          <Col md={4} className="text-center text-md-end">
            <div className="d-flex justify-content-center justify-content-md-end gap-3">
              <h6 className="small mb-0 d-md-flex align-items-center d-none">
                Síguenos
              </h6>
              <a
                href="https://www.facebook.com/nexuspublicaciones/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light fs-4"
                title="Facebook"
              >
                <i className="bi bi-facebook"></i>
              </a>
              <a
                href="https://www.instagram.com/nexuslibreria/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light fs-4"
                title="Instagram"
              >
                <i className="bi bi-instagram"></i>
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
