import showDashboard from "./showDashboard.js";
import showToast from "./showToast.js";

async function showLoginPrompt() {
  const loginContainer = document.createElement("div");
  loginContainer.className = "login-container";

  // Set body class to apply specific styling to the login page
  document.body.className = 'login-page';  // Add this line to apply the background styles


  const title = document.createElement("h2");
  title.className = "login-title";
  title.textContent = "Login";
  loginContainer.appendChild(title);

  const usernameInput = document.createElement("input");
  usernameInput.type = "text";
  usernameInput.placeholder = "Username";
  usernameInput.className = "input-field";
  loginContainer.appendChild(usernameInput);

  const passwordInput = document.createElement("input");
  passwordInput.type = "password";
  passwordInput.placeholder = "Password";
  passwordInput.className = "input-field";
  loginContainer.appendChild(passwordInput);

  const loginButton = document.createElement("button");
  loginButton.className = "btn";
  loginButton.textContent = "Login";
  loginContainer.appendChild(loginButton);

  const switchToSignup = document.createElement("p");
  switchToSignup.className = "switch-text";
  switchToSignup.textContent = "Don't have an account? Sign up";
  switchToSignup.addEventListener("click", () => {
    loginContainer.remove();
    showSignupPrompt();
  });
  loginContainer.appendChild(switchToSignup);

  document.body.appendChild(loginContainer);

  loginButton.addEventListener("click", async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;

    if (username && password) {
      try {
        const response = await window.electron.call('login', [username, password]);
        if (response.success && response.data.length > 0) {
          showToast("Login successful");
          loginContainer.remove();
          window.dashboardContainer = document.createElement('div')
          document.body.appendChild(dashboardContainer)
          window.user = response.data[0]
          showDashboard()
        } else {
          showToast("Invalid username or password.");
        }
      } catch (error) {
        console.error("Login failed:", error);
        showToast("An error occurred while logging in.");
      }
    } else {
      showToast("Please enter both username and password.");
    }
  });
}

async function showSignupPrompt() {
  const signupContainer = document.createElement("div");
  signupContainer.className = "signup-container";

  const title = document.createElement("h2");
  title.className = "signup-title";
  title.textContent = "Create Account";
  signupContainer.appendChild(title);

  const usernameInput = document.createElement("input");
  usernameInput.type = "text";
  usernameInput.placeholder = "Username";
  usernameInput.className = "input-field";
  signupContainer.appendChild(usernameInput);

  const passwordInput = document.createElement("input");
  passwordInput.type = "password";
  passwordInput.placeholder = "Password";
  passwordInput.className = "input-field";
  signupContainer.appendChild(passwordInput);

  const confirmPasswordInput = document.createElement("input");
  confirmPasswordInput.type = "password";
  confirmPasswordInput.placeholder = "Confirm Password";
  confirmPasswordInput.className = "input-field";
  signupContainer.appendChild(confirmPasswordInput);

  const signupButton = document.createElement("button");
  signupButton.className = "btn";
  signupButton.textContent = "Sign Up";
  signupContainer.appendChild(signupButton);

  const switchToLogin = document.createElement("p");
  switchToLogin.className = "switch-text";
  switchToLogin.textContent = "Already have an account? Login";
  switchToLogin.addEventListener("click", () => {
    signupContainer.remove();
    showLoginPrompt();
  });
  signupContainer.appendChild(switchToLogin);

  document.body.appendChild(signupContainer);

  signupButton.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!username || !password || !confirmPassword) {
      showToast("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match.");
      return;
    }

    try {
      const response = await window.electron.call('createAccount', [username, password]);
      if (response.success) {
        showToast("Account created, pending Admin approval.");
        signupContainer.remove();
        showLoginPrompt();
      } else {
        showToast(response.error);
      }
    } catch (error) {
      showToast("An error occurred: " + error);
    }
  });
}

function showWelcomeMessage() {
  const welcomeMessage = document.createElement("div");
  welcomeMessage.className = "welcome-message";
  welcomeMessage.textContent = "Welcome";
  document.body.appendChild(welcomeMessage);

  setTimeout(() => {
    welcomeMessage.remove();
    showLoginPrompt();
  }, 3000);
}

showWelcomeMessage()

export { showLoginPrompt, showSignupPrompt };