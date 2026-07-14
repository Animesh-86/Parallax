import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const OAuthSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken =
      params.get("access") ||
      params.get("access_token") ||
      params.get("token");

    if (accessToken) {
      try {
        localStorage.setItem("access_token", accessToken);
        console.log("Access token saved to localStorage.");

        // Check if user needs onboarding
        const decoded: any = jwtDecode(accessToken);
        if (decoded.onboardingComplete === false || decoded.onboardingComplete === "false") {
          navigate("/onboarding", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
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
