export const handleSessionExpired = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");

    if (window.location.pathname !== "/login") {
        window.location.replace("/login?session=expired");
    }
};