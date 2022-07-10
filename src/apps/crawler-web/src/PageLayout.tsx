import "./PageLayout.css";
import "bootstrap/dist/css/bootstrap.css";

import { Outlet, Link, NavLink } from "react-router-dom";

export default function PageLayout() {
    return (
        <div className="App">
            <header className="bg-info bg-gradient d-flex align-items-center">
                <Link to="/" className="deco-none">
                    <h1>Web crawler</h1>
                </Link>
                <nav className="nav nav-pills ps-5">
                    <NavLink to="records" className="nav-link text-dark">
                        Records
                    </NavLink>
                    <NavLink to="executions" className="nav-link text-dark">
                        Executions
                    </NavLink>
                </nav>
            </header>
            <Outlet />
        </div>
    );
}
