const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");

themeToggle.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);

  localStorage.setItem("theme", newTheme);

  updateThemeButton(newTheme);
});

function updateThemeButton(theme) {
  if (theme === "dark") {
    savedTheme.textContent = "Light Mode";
  } else {
    savedTheme.textContent = "Dark Mode";
  }
}

if (savedTheme) {
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeButton(savedTheme);
} else {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const defaultTheme = prefersDark ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", defaultTheme);
  updateThemeButton(defaultTheme);
}
