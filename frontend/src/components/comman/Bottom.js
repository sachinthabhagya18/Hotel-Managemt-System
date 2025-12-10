export default function Bottom(){
    return(
<footer className="bg-dark text-white pt-5 pb-4">
      <div className="container">
        <hr className="my-4 bg-secondary" />
        <div className="row align-items-center">
          <div className="col-md-6 text-center text-md-start">
            <p className="text-muted mb-0 text-white-50">
              &copy; {new Date().getFullYear()} YourCompany. All rights reserved.
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <a href="#" className="text-muted text-decoration-none me-3">Privacy Policy</a>
            <a href="#" className="text-muted text-decoration-none me-3">Terms of Service</a>
            <a href="#" className="text-muted text-decoration-none">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>

    );
}