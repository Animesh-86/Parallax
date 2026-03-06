import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const OAuthSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // Try multiple possible param names
    const accessToken =
      params.get("access") ||
      params.get("access_token") ||
      params.get("token");

    console.log("OAuth access token from backend:", accessToken);

    if (accessToken) {
      try {
        // SAME KEY as in Login.tsx
        localStorage.setItem("access_token", accessToken);
        console.log("Access token saved to localStorage.");

        // Optional: Validate token with backend before navigating
        // Example: fetch('/api/validate-token', { headers: { Authorization: `Bearer ${accessToken}` } })
        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error("Error saving access token or navigating:", error);
        navigate("/login", { replace: true });
      }
    } else {
      console.warn("No access token found in URL parameters.");
      navigate("/login", { replace: true });
    }
  }, [location, navigate]);

  return <p style={{ color: "white" }}>Finishing sign-in with Google…</p>;
};

export default OAuthSuccessPage;
