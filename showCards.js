import openForm from "./openForm.js";
import showDashboard from "./showDashboard.js";
import showToast from "./showToast.js";

function showCards() {
  const cardData = [
    { title: "Number of Tenants", icon: "people", number: 12456, func: numOfTenants },
    { title: "Free Space", icon: "spaceship", number: 3042 },
    { title: "Payments in last 30 days", icon: "payment", number: 55000 },
    { title: "Outstanding Amount", icon: "balance", number: 75230 },
    { title: "Misc. Expenses", icon: "expenses", number: 13330, func: miscExpenses },
    { title: "Past Tenants", icon: "past-tenants", number: 2890 },
  ];

  const cardContainer = document.createElement("div");
  cardContainer.className = "dash-card-container";

  cardData.forEach(data => {
    const card = document.createElement("div");
    card.className = "dash-card";
    card.onclick = data.func

    const icon = document.createElement("div");
    icon.className = "dash-card-icon";
    icon.innerHTML = getIcon(data.icon);

    const number = document.createElement("div");
    number.className = "dash-card-number";
    number.textContent = formatNumber(data.number);

    const title = document.createElement("div");
    title.className = "dash-card-title";
    title.textContent = data.title;

    card.appendChild(icon);
    card.appendChild(number);
    card.appendChild(title);
    cardContainer.appendChild(card);
  });

  dashboardContainer.appendChild(cardContainer);
}

async function numOfTenants() {
  try {
    const tenants = await window.electron.call('getTenantsPlusOutstandingBalanceAll');
    if (tenants.success) {
      displayTenants(tenants.data);
    }
  } catch (e) {
    console.log(e);
    showToast(e);
  }
}

function displayTenants(tenantsData) {
  window.dashboardContainer.innerHTML = '';

  const table = document.createElement('table');
  table.className = 'modal-show-table';

  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th>Name</th>
    <th>Gender</th>
    <th>Course</th>
    <th>Own Contact</th>
    <th>Owing Amount</th>
  `;
  table.appendChild(headerRow);

  if (tenantsData.length === 0) {
    const noDataRow = document.createElement('tr');
    noDataRow.innerHTML = `<td colspan="5">No tenants available</td>`;
    table.appendChild(noDataRow);
  } else {
    tenantsData.forEach(tenant => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${tenant.name}</td>
        <td>${tenant.gender}</td>
        <td>${tenant.course}</td>
        <td>${tenant.ownContact}</td>
        <td>${tenant.owingAmount}</td>
      `;
      table.appendChild(row);
    });
  }

  const backButton = document.createElement('button');
  backButton.className = 'modal-show-back';
  backButton.innerText = 'Back';
  backButton.onclick = () => {
    dashboardContainer.innerHTML = '';
    showDashboard()
  };

  const addButton = document.createElement("button");
  addButton.className = "menu-item";
  addButton.textContent = 'Add New Tenant';
  addButton.onclick = () => openForm('Add New Tenant')

  dashboardContainer.appendChild(table);
  dashboardContainer.appendChild(addButton);
  dashboardContainer.appendChild(backButton);
}

async function miscExpenses(someDate = null) {
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 3);
  const monthsAgo = monthAgo.toISOString().split('T')[0];
  try {
    const expenses = await window.electron.call('getMiscExpensesByDate', [someDate ?? monthsAgo]);
    if (expenses.success) {
      displayExpenses(expenses.data);
    }
  } catch (e) {
    console.log(e);
    showToast(e);
  }
}

function displayExpenses(expensesData) {
  dashboardContainer.innerHTML = '';

  const table = document.createElement('table');
  table.className = 'modal-show-table';

  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th>Date</th>
    <th>Description</th>
    <th>Qty</th>
    <th>Amount</th>
    <th>Entered By</th>    
  `;
  table.appendChild(headerRow);

  if (expensesData.length === 0) {
    const noDataRow = document.createElement('tr');
    noDataRow.innerHTML = `<td colspan="5">No expenses since 3 months ago</td>`;
    table.appendChild(noDataRow);
  } else {
    expensesData.forEach(expense => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${expense.date}</td>
        <td>${expense.description}</td>
        <td>${expense.quantity}</td>
        <td>${expense.amount}</td>
        <td>${expense.operatorName}</td>
      `;
      table.appendChild(row);
    });
  }

  const backButton = document.createElement('button');
  backButton.className = 'modal-show-back';
  backButton.innerText = 'Back';
  backButton.onclick = () => {
    dashboardContainer.innerHTML = '';
    showDashboard()
  };

  const addButton = document.createElement("button");
  addButton.className = "menu-item";
  addButton.textContent = 'Add Misc. Expense';
  addButton.onclick = () => {
    openForm('Add Misc. Expense')
  }

  dashboardContainer.appendChild(table);
  dashboardContainer.appendChild(addButton);
  dashboardContainer.appendChild(backButton);
}

function getIcon(iconName) {
  const icons = {
    people: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="green" d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm-1.8 2c-3.31 0-6 2.69-6 6h2c0-2.21 1.79-4 4-4h4c2.21 0 4 1.79 4 4h2c0-3.31-2.69-6-6-6h-4zm7.8-4c0 2.21 1.79 4 4 4s4-1.79 4-4-1.79-4-4-4-4 1.79-4 4z"/></svg>`,
    spaceship: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="green" d="M12 0l-6 12h4v8l-3 4h8l-3-4v-8h4l-6-12z"/></svg>`,
    payment: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="green" d="M20 4H4c-1.1 0-2 .9-2 2v4h20V6c0-1.1-.9-2-2-2zm0 10H4c-1.1 0-2 .9-2 2v4h20v-4c0-1.1-.9-2-2-2z"/></svg>`,
    balance: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="green" d="M12 2l-4 4h3v12h2V6h3l-4-4z"/></svg>`,
    expenses: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="green" d="M12 3C7.58 3 4 6.58 4 11c0 4.42 3.58 8 8 8s8-3.58 8-8c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/></svg>`,
    "past-tenants": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="green" d="M12 4c1.66 0 2.99 1.34 2.99 3S13.66 10 12 10s-3-1.34-3-3S10.34 4 12 4zm0 4.5c.83 0 1.5-.67 1.5-1.5S12.83 5.5 12 5.5 10.5 6.17 10.5 7 11.17 8.5 12 8.5zm4 7.5h-8c-2.21 0-4 1.79-4 4h16c0-2.21-1.79-4-4-4z"/></svg>`
  };
  return icons[iconName] || "";
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export {showCards, miscExpenses}