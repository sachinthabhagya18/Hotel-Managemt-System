import Link from "next/link";

export default function Footer(){
    return(
    <footer className="bg-dark text-white pt-5 pb-4">
      <div className="container">
        <div className="row">
          {/* Company Info */}
          <div className="col-md-4 mb-4">
            <h5 className="fw-bold mb-3">YourCompany</h5>
            <p className="text-muted text-white-50">
              Making the world a better place through technology and innovation.
            </p>
            <div className="mt-3">
              <a href="#" className="text-white me-3 text-white-50">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="#" className="text-white me-3">
                <i className="bi bi-twitter"></i>
              </a>
              <a href="#" className="text-white me-3">
                <i className="bi bi-instagram"></i>
              </a>
              <a href="#" className="text-white">
                <i className="bi bi-linkedin"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-md-2 mb-4">
            <h5 className="fw-bold mb-3">Quick Links</h5>
            <ul className="list-unstyled">
              <li className="mb-2 text-white-50">
                <Link href="/" className="text-muted text-decoration-none text-white-50">Home</Link>
              </li>
              <li className="mb-2 text-white-50">
                <Link href="/about" className="text-muted text-decoration-none text-white-50">About</Link>
              </li>
              <li className="mb-2 text-white-50">
                <Link href="/service" className="text-muted text-decoration-none text-white-50">Services</Link>
              </li>
              <li className="mb-2 text-white-50">
                <Link href="/career" className="text-muted text-decoration-none text-white-50">Career</Link>
              </li>
              <li className="text-white-50">
                <a href="#" className="text-muted text-decoration-none text-white-50">Contact</a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="col-md-2 mb-4">
            <h5 className="fw-bold mb-3">Services</h5>
            <ul className="list-unstyled">
              <li className="mb-2 text-white-50">
                <a href="#" className="text-muted text-decoration-none text-white-50">Web Design</a>
              </li>
              <li className="mb-2 text-white-50">
                <a href="#" className="text-muted text-decoration-none text-white-50">App Development</a>
              </li>
              <li className="mb-2 text-white-50">
                <a href="#" className="text-muted text-decoration-none text-white-50">Cloud Solutions</a>
              </li>
              <li className="mb-2 text-white-50">
                <a href="#" className="text-muted text-decoration-none text-white-50">Digital Marketing</a>
              </li>
              <li className="text-white-50">
                <a href="#" className="text-muted text-decoration-none text-white-50">SEO</a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-md-4 mb-4">
            <h5 className="fw-bold mb-3">Contact Us</h5>
            <ul className="list-unstyled text-muted">
              <li className="mb-2 text-white-50">
                <i className="bi bi-geo-alt-fill me-2"></i> 123 Tech Street, Silicon Valley, CA
              </li>
              <li className="mb-2 text-white-50">
                <i className="bi bi-telephone-fill me-2"></i> +1 (555) 123-4567
              </li>
              <li className="mb-2 text-white-50">
                <i className="bi bi-envelope-fill me-2"></i> info@yourcompany.com
              </li>
              <li className="text-white-50">
                <i className="bi bi-clock-fill me-2"></i> Mon-Fri: 9AM - 5PM
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
    );
}