import Link from "next/link";
export default function PaymentSuccess() {
  return (
    <main>
     <div className="container d-flex flex-column min-vh-100">
      <div className="row justify-content-center align-items-center flex-grow-1">
        <div className="col-md-8 col-lg-6 text-center">
          {/* Thank You Message */}
          <div className="mb-5">
            <h1 className="display-4 fw-bold mb-3">Thank you</h1>
            <p className="lead text-muted">Invoice: HMS-001</p>
          </div>

          {/* Navigation Buttons */}
          <div className="d-grid gap-3 d-sm-flex justify-content-sm-center">
            <Link href="/" className="btn btn-primary btn-lg px-4 gap-3">
              Home
            </Link>
            <Link href="/dashboard" className="btn btn-outline-secondary btn-lg px-4">
              My Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
    </main>
  );
}
