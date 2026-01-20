export default function setColorTheme() {
  const theme = localStorage.getItem("theme"); // "dark" | "light" | null
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}
