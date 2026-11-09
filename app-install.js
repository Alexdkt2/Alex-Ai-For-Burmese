(() => {
  let installPrompt = null;

  const button = document.createElement("button");
  button.type = "button";
  button.id = "install-app-button";
  button.textContent = "📲 Install Alex AI App";
  button.setAttribute("aria-label", "Install Alex AI For Burmese");
  Object.assign(button.style, {
    position: "fixed",
    right: "16px",
    bottom: "16px",
    zIndex: "9999",
    width: "auto",
    maxWidth: "calc(100vw - 32px)",
    padding: "13px 18px",
    border: "0",
    borderRadius: "999px",
    background: "#0284c7",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "700",
    boxShadow: "0 5px 20px rgba(0,0,0,.35)",
    cursor: "pointer",
    display: "none"
  });

  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(button);
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      button.remove();
    }
  });

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
    button.style.display = "block";
  });

  button.addEventListener("click", async () => {
    if (!installPrompt) {
      alert("To install: open Chrome menu ⋮ and choose 'Add to Home screen' or 'Install app'.");
      return;
    }

    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    button.style.display = "none";
  });

  window.addEventListener("appinstalled", () => {
    button.remove();
    installPrompt = null;
  });
})();
