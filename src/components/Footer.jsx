// src/components/Footer.jsx
import Link from "next/link";
import { Container, Row, Col } from "react-bootstrap";

const Footer = ({ dict = {}, locale = "es-ES" }) => {
  const title = dict.footer?.title || "Librería Nexus";
  const followText = dict.footer?.follow_us || "Síguenos";
  const unirText =
    dict.footer?.unir_text ||
    `© ${new Date().getFullYear()} UNIR - Desarrollo Web con Frameworks Front-end`;

  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <Container>
        <Row className="align-items-center">
          <Col md={4} className="text-center text-md-start mb-3 mb-md-0">
            <h5 className="mb-1">
              <Link
                href={`/${locale}`}
                className="text-decoration-none text-light"
              >
                {title}
              </Link>
            </h5>
          </Col>

          <Col md={4} className="text-center mb-3 mb-md-0">
            <p className="small mb-0">{unirText}</p>
          </Col>

          <Col md={4} className="text-center text-md-end">
            <div className="d-flex justify-content-center justify-content-md-end gap-3">
              <h6 className="small mb-0 d-md-flex align-items-center d-none">
                {followText}
              </h6>
              <a
                href="https://www.facebook.com/nexuspublicaciones/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light fs-4"
                title="Facebook"
                aria-label="Facebook"
              >
                <i className="bi bi-facebook"></i>
              </a>
              <a
                href="https://www.instagram.com/nexuslibreria/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light fs-4"
                title="Instagram"
                aria-label="Instagram"
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
