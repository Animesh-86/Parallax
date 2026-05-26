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

        // Redirect to onboarding if user hasn't completed setup
        if (decoded.onboardingComplete === false || decoded.onboardingComplete === "false") {
            return <Navigate to="/onboarding" replace />;
        }
    } catch (error) {
        localStorage.removeItem("access_token");
        return <Navigate to="/login" replace />;
    }

    return children;
}
