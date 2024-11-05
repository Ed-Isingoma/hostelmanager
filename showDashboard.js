export default function showDashboard() {
  const welcomeMessage = document.createElement("div");
  welcomeMessage.className = "dashboard-placeholder";
  welcomeMessage.textContent = "Write dashboard code here";
  document.body.appendChild(welcomeMessage);
}