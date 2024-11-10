import showCards from "./showCards.js";
import openForm from "./openForm.js";

export default async function showDashboard(user) {
  
  // Create the header
  const header = document.createElement("h1");
  header.className = 'dashboard-head';
  header.textContent = "Kann Hostel Management";
  document.body.appendChild(header);

  // Create the navbar
  const navbar = document.createElement("nav");
  navbar.className = "navbar";

  const menuItems = ["Log Out", "Add New Tenant", "Record Money Received", "Update Tenant"];
  if (user.role == 'admin') menuItems.unshift('Users');
  menuItems.forEach(item => {
    const menuOption = document.createElement("button");
    menuOption.className = "menu-item";
    menuOption.textContent = item;
    menuOption.onclick = () => openForm(item);
    navbar.appendChild(menuOption);
  });

  // Create the search field
  const searchField = document.createElement("input");
  searchField.type = "text";
  searchField.placeholder = "Search";
  searchField.className = "search-field";
  navbar.appendChild(searchField);

  // Call the function to show the semesters
  await showSemesters(navbar);
  document.body.appendChild(navbar);

  // Create the container for cards and pass it to showCards
  const cardContainer = document.createElement("div");
  cardContainer.className = "card-container";
  
  // Ensure showCards appends to this container
  showCards(cardContainer);

  // Add the card container to the body
  document.body.appendChild(cardContainer);

  // Create and append the footer
  const footer = document.createElement("footer");
  footer.textContent = "(c) 2024 Kann Hostel. All Rights Reserved";
  document.body.appendChild(footer);

  // Close form functionality
  window.closeForm = function () {
    document.querySelector(".overlay")?.remove();
    document.querySelector(".modal-form")?.remove();
  };
}

async function showSemesters(navbar) {
  try {
    const periodNames = await window.electron.call('getBillingPeriodNames');
    const currentPeriodName = await window.electron.call('getCurrentBillingPeriodName');
    const semesterDropdown = document.createElement("select");
    semesterDropdown.className = "semester-dropdown";
    
    periodNames.data.forEach(semester => {
      const option = document.createElement("option");
      option.value = semester.id;
      option.textContent = semester.name;
      semesterDropdown.appendChild(option);
    });
    
    if (currentPeriodName.data.length) {
      semesterDropdown.value = currentPeriodName.data[0].id;
      window.selectedPeriodNameId = currentPeriodName.data[0].id
    }

    semesterDropdown.addEventListener("change", () => {
      window.selectedPeriodNameId = semesterDropdown.value;
      console.log("Selected Period Name ID:", window.selectedPeriodNameId)
    });

    navbar.appendChild(semesterDropdown);
  } catch (e) {
    console.log(e);
  }
}
