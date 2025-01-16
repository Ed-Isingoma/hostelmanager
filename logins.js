import showDashboard from "./showDashboard.js";
import showToast from "./showToast.js";

async function showLoginPrompt() {
  const loginContainer = document.createElement("div");
  loginContainer.className = "login-container";

  document.body.className = "login-page";  

  const title = document.createElement("h2");
  title.textContent = "Login";
  loginContainer.appendChild(title);

  const usernameInput = document.createElement("input");
  usernameInput.type = "text";
  usernameInput.placeholder = "Username";
  loginContainer.appendChild(usernameInput);

  const passwordInput = document.createElement("input");
  passwordInput.type = "password";
  passwordInput.placeholder = "Password";
  loginContainer.appendChild(passwordInput);

  const loginButton = document.createElement("button");
  loginButton.textContent = "Login";
  loginContainer.appendChild(loginButton);

  document.body.appendChild(loginContainer);

  loginButton.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showToast("Please enter both username and password.");
      return;
    }

    try {
      const response = await window.electron.call("login", [username, password]);
      if (response.success) {
        showToast("Login successful");
        loginContainer.remove();
        showDashboard(); // Display the dashboard
        window.user = response.data;
      } else {
        showToast(response.message || "Invalid username or password.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      showToast("An error occurred while logging in.");
    }
  });
}

showLoginPrompt();
