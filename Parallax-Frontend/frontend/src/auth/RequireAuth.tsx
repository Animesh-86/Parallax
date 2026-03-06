import { Navigate } from "react-router-dom";
import { JSX } from "react";
import { jwtDecode } from "jwt-decode";

export default function RequireAuth({ children }: { children: JSX.Element }) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const decoded: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
            localStorage.removeItem("access_token");
            return <Navigate to="/login" replace />;
        }
    } catch (error) {
        localStorage.removeItem("access_token");
        return <Navigate to="/login" replace />;
    }

    return children;
}
