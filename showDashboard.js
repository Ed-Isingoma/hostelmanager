import { showCards } from "./showCards.js";
import { doTotals, formatNumber } from "./getIcon.js";
import openForm from "./openForm.js";
import showToast from "./showToast.js";

export default async function showDashboard() {
  const header = document.createElement("h1");
  header.className = 'dashboard-head';
  header.textContent = "Kann Hostel Management";
  dashboardContainer.appendChild(header);

  const navbar = document.createElement("nav");
  navbar.className = "navbar";

  const menuItems = ["Log Out", "Add New Tenant", "Record Money Received", "Search Tenant", "Billing Periods"];
  if (user.role == 'admin') menuItems.unshift('Users');
  menuItems.forEach(item => {
    const menuOption = document.createElement("button");
    menuOption.className = "menu-item";
    menuOption.textContent = item;
    menuOption.onclick = () => openForm(item);
    navbar.appendChild(menuOption);
  });

  await showSemesters(navbar)

  dashboardContainer.appendChild(navbar);

  // Create the container for cards and pass it to showCards
  const cardContainer = document.createElement("div");
  cardContainer.className = "card-container";

  await showCards(cardContainer);
  document.body.appendChild(cardContainer);

  const footer = document.createElement("footer");
  footer.textContent = "(c) 2024 Kann Hostel. All Rights Reserved";
  dashboardContainer.appendChild(footer);
}

async function showSemesters(navbar) {
  try {
    const periodNames = await window.electron.call('getBillingPeriodNames');
    const semesterDropdown = document.createElement("select");
    semesterDropdown.className = "semester-dropdown";

    if (!periodNames.success) return showToast(periodNames.error)
    const currentPeriodName = getCurrentBillingPeriodName(periodNames.data)
    window.semesters = periodNames.data

    periodNames.data.forEach(semester => {
      const option = document.createElement("option");
      option.value = semester.periodNameId;
      option.textContent = semester.name;
      option.setAttribute("data-endDate", semester.endDate)
      semesterDropdown.appendChild(option);
    });

    if (!window.selectedPeriodNameId) {
      const now = new Date()
      if (currentPeriodName) {
        semesterDropdown.value = currentPeriodName.periodNameId;
        window.selectedPeriodNameId = currentPeriodName.periodNameId
        window.selectedPeriodNameName = currentPeriodName.name
        window.globalNow = now >= new Date(currentPeriodName.endDate).setHours(0, 0, 0, 0) ? now : new Date(currentPeriodName.endDate).setHours(0, 0, 0, 0)
      } else {
        window.selectedPeriodNameId = semesterDropdown.value
        const selectedOption = semesterDropdown.options[semesterDropdown.selectedIndex];
        window.selectedPeriodNameName = selectedOption.text
        window.globalNow = new Date(selectedOption.dataset.endDate).setHours(0, 0, 0, 0)
      }
    } else {
      semesterDropdown.value = selectedPeriodNameId
    }

    if (currentPeriodName) {
      window.currentPeriodNameId = currentPeriodName.periodNameId
    }

    semesterDropdown.addEventListener("change", async () => {
      window.selectedPeriodNameId = semesterDropdown.value;

      const selectedOption = semesterDropdown.options[semesterDropdown.selectedIndex];
      window.selectedPeriodNameName = selectedOption.text
      window.globalNow = new Date(selectedOption.dataset.endDate).setHours(0, 0, 0, 0)

      await doTotals()
      updateCardNumbers()
    });

    navbar.appendChild(semesterDropdown);
  } catch (e) {
    console.log(e);
  }
}

function getCurrentBillingPeriodName(semesters) {
  if (!Array.isArray(semesters) || semesters.length === 0) {
    showToast('No semesters to select from')
    return null
  }
  const now = new Date();

  semesters.sort((a, b) => new Date(a.startingDate) - new Date(b.startingDate));
  let currentPeriodName = null;

  for (let i = 0; i < semesters.length; i++) {
      const currentSemesterStart = new Date(semesters[i].startingDate);

      if (currentSemesterStart <= now) {
          const nextSemester = semesters[i + 1];
          if (!nextSemester || new Date(nextSemester.startingDate) > now) {
              currentPeriodName = semesters[i];
              break;
          }
      } else {
        currentPeriodName = semesters[0]
      }
  }

  return currentPeriodName
}

export function updateCardNumbers() {
  const cards = document.querySelectorAll(".dash-card");
  for (let card of cards) {
    const titleDiv = card.querySelector(".dash-card-title");
    if (titleDiv && titleDiv.textContent === "Number of Tenants") {
      const numberDiv = card.querySelector(".dash-card-number");
      if (numberDiv) {
        numberDiv.textContent = formatNumber(Number(window.totals.totalTenants)) 
      }
    } else if (titleDiv && titleDiv.textContent === "Free Space") {
      const numberDiv = card.querySelector(".dash-card-number");
      if (numberDiv) {
        numberDiv.textContent = formatNumber(Number(window.totals.totalFreeSpaces)) 
      }
    } else if (titleDiv && titleDiv.textContent === "Payments for this semester") {
      const numberDiv = card.querySelector(".dash-card-number");
      if (numberDiv) {
        numberDiv.textContent = formatNumber(Number(window.totals.totalPayments)) 
      }
    } else if (titleDiv && titleDiv.textContent === "Uncollected Amount this semester") {
      const numberDiv = card.querySelector(".dash-card-number");
      if (numberDiv) {
        numberDiv.textContent = formatNumber(Number(window.totals.totalOutstanding)) 
      }
    } else if (titleDiv && titleDiv.textContent === "Misc. Expenses for this semester") {
      const numberDiv = card.querySelector(".dash-card-number");
      if (numberDiv) {
        numberDiv.textContent = formatNumber(Number(window.totals.totalMisc)) 
      }
    } else if (titleDiv && titleDiv.textContent === "Previous Semester Tenants") {
      const numberDiv = card.querySelector(".dash-card-number");
      if (numberDiv) {
        numberDiv.textContent = formatNumber(Number(window.totals.totalPastTenants)) 
      }
    }
  }
}
