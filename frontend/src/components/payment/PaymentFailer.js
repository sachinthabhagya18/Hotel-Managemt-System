import Link from "next/link";
export default function PaymentFailer() {
  return (
    <main>
     <div className="container d-flex flex-column min-vh-100">
      <div className="row justify-content-center align-items-center flex-grow-1">
        <div className="col-md-8 col-lg-6 text-center">
          {/* Error Icon and Message */}
          <div className="mb-4">
            <h1 className="display-5 fw-bold mb-3">Payment Failed</h1>
            <p className="lead text-muted">Invoice: HMS-001</p>
            <p className="text-danger mt-2">
              Your payment could not be processed. Please try again.
            </p>
          </div>

          {/* Additional Help Text */}
          <div className="alert alert-warning mb-4">
            <p className="mb-0">
              If the amount was deducted from your account, it will be refunded within 3-5 business days.
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="d-grid gap-3 d-sm-flex justify-content-sm-center">
            <Link href="/checkout" className="btn btn-danger btn-lg px-4 gap-3">
              Try Payment Again
            </Link>
            <Link href="/" className="btn btn-outline-secondary btn-lg px-4">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
    </main>
  );
}
