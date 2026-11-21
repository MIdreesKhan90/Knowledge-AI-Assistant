export default function Button({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  onClick,
  type = "button",
  className = "",
}) {
  const styles = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white",
    secondary: "bg-slate-800 hover:bg-slate-700 text-white",
    danger: "bg-red-600 hover:bg-red-500 text-white",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`rounded-xl px-5 py-3 text-sm font-medium transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}