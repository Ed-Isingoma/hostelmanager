import { doTotals, formatNumber, getIcon, loadWholeScreen, showTenantsPopUp } from "./getIcon.js";
import openForm from "./openForm.js";
import showDashboard from "./showDashboard.js";
import showToast from "./showToast.js";
import { caller } from "./caller.js";

async function showCards() {
  await doTotals()
  const cardData = [
    { title: "Number of Present Tenants", icon: "people", number: window.totals.totalTenants, func: numOfTenants },
    { title: "Free Space", icon: "spaceship", number: window.totals.totalFreeSpaces, func: showRooms },
    { title: "Payments for this semester", icon: "payment", number: window.totals.totalPayments, func: collectedMoneys },
    { title: "Uncollected For this semester", icon: "balance", number: window.totals.totalOutstanding, func: uncollectedMoneys },
    { title: "Misc. Expenses for this semester", icon: "expenses", number: window.totals.totalMisc, func: miscExpenses },
    { title: "Previous Semester Tenants", icon: "past-tenants", number: window.totals.totalPastTenants, func: olderTenants },
  ];

  const cardContainer = document.createElement("div");
  cardContainer.className = "card-container";  

  cardData.forEach(data => {
    const card = document.createElement("div");
    card.className = "dash-card";
    card.onclick = data.func;

    const icon = document.createElement("div");
    icon.className = "dash-card-icon";
    icon.innerHTML = getIcon(data.icon);

    const number = document.createElement("div");
    number.className = "dash-card-number";
    number.textContent = formatNumber(Number(data.number));

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
  loadWholeScreen()
  try {
    const tenants = await caller('getTenantsPlusOutstandingBalanceAll', [selectedPeriodNameId]);
    if (tenants.success) {
      displayTenants(tenants.data);
    } else {
      showToast(tenants.error)
    }
  } catch (e) {
    console.log(e);
    showToast(e);
  } finally {
    const overl = document.querySelector(".whiteover")
    if (dashboardContainer.contains(overl)) dashboardContainer.removeChild(overl)
  }
}

async function showRooms() {
  loadWholeScreen()
  try {
    const levels = await caller('getLevels');
    if (levels.success) {
      const levelsData = []
      for (let level of levels.data) {
        const cardData = await caller('getRoomsAndOccupancyByLevel', [level.levelNumber, selectedPeriodNameId])
        if (cardData.success) {
          levelsData.push(cardData.data)
        } else {
          showToast(cardData.error)
        }
      }
      displayRooms(levelsData)
    } else {
      showToast(levels.error)
    }
  } catch (e) {
    console.log(e);
    showToast(e);
  } finally {
    const overl = document.querySelector(".whiteover")
    if (dashboardContainer.contains(overl)) dashboardContainer.removeChild(overl)
  }
}

async function miscExpenses() {
  loadWholeScreen()
  try {
    const expenses = await caller('getMiscExpensesForBillingPeriodName', [window.selectedPeriodNameId]);
    if (expenses.success) {
      displayExpenses(expenses.data);
    } else {
      showToast(expenses.error)
    }
  } catch (e) {
    console.log(e);
    showToast(e);
  } finally {
    const overl = document.querySelector(".whiteover")
    if (dashboardContainer.contains(overl)) dashboardContainer.removeChild(overl)
  }
}

async function uncollectedMoneys() {
  loadWholeScreen()
  try {
    const moneys = await caller('getOnlyTenantsWithOwingAmt', [window.selectedPeriodNameId]);
    if (moneys.success) {
      displayMoneys(moneys.data);
    } else {
      showToast(moneys.error)
    }
  } catch (e) {
    console.log(e);
    showToast(e);
  } finally {
    const overl = document.querySelector(".whiteover")
    if (dashboardContainer.contains(overl)) dashboardContainer.removeChild(overl)
  }
}

async function collectedMoneys() {
  loadWholeScreen()
  try {
    const moneys = await caller('getTransactionsByPeriodNameIdWithMetaData', [selectedPeriodNameId]);
    if (moneys.success) {
      displayPayments(moneys.data);
    } else {
      showToast(moneys.error)
    }
  } catch (e) {
    console.log(e);
    showToast(e);
  } finally {
    const overl = document.querySelector(".whiteover")
    if (dashboardContainer.contains(overl)) dashboardContainer.removeChild(overl)
  }
}

async function olderTenants() {
  loadWholeScreen()
  try {
    const olders = await caller('getOlderTenantsThan', [selectedPeriodNameId]);
    if (olders.success) {
      displayOlders(olders.data);
    } else {
      showToast(olders.error)
    }
  } catch (e) {
    console.log(e);
    showToast(e);
  } finally {
    const overl = document.querySelector(".whiteover")
    if (dashboardContainer.contains(overl)) dashboardContainer.removeChild(overl)
  }
}

function displayRooms(levelsData) {
  dashboardContainer.innerHTML = '';

  const container = document.createElement('div');
  container.classList.add('rooms-levels-container');

  levelsData.forEach(levelData => {
    const levelBox = document.createElement('div');
    levelBox.classList.add('rooms-level-box');

    const levelTitle = document.createElement('div');
    levelTitle.classList.add('rooms-level-title');
    levelTitle.innerHTML = `Level ${levelData[0]?.levelNumber || "unnamed"}`;
    levelBox.appendChild(levelTitle);

    const roomsContainer = document.createElement('div');
    roomsContainer.classList.add('rooms-rooms-container');

    levelData.forEach(room => {
      const roomBox = document.createElement('div');
      roomBox.classList.add('rooms-room-box');

      const roomNameBox = document.createElement('div');
      roomNameBox.classList.add('rooms-room-name');
      roomNameBox.innerHTML = room.roomName;
      roomBox.appendChild(roomNameBox);

      const occupancyContainer = document.createElement('div');
      // occupancyContainer.setAttribute("data-roomId", room.roomId)
      occupancyContainer.classList.add('rooms-occupancy-container');

      for (let i = 0; i < 2; i++) {
        const occupancyBox = document.createElement('div');
        occupancyBox.classList.add('rooms-occupancy-box');
        if (room.occupancyRate == 100 || (room.occupancyRate >= 50 && i == 0)) {
          occupancyBox.classList.add('occupied');
        } else {
          occupancyBox.classList.add('empty');
        }
        occupancyContainer.appendChild(occupancyBox);
      }
      occupancyContainer.addEventListener("click", async () => {
        loadWholeScreen()
        try {
          const tenants = await caller('getTenantsAndOwingAmtByRoom', [room.roomId, selectedPeriodNameId]);
          if (tenants.success) {
            showTenantsPopUp(tenants.data, room.roomName);
          } else {
            showToast(tenants.error);
          }
        } catch (e) {
          console.log(e);
          showToast(e);
        } finally {
          const overl = document.querySelector(".whiteover")
          if (dashboardContainer.contains(overl)) dashboardContainer.removeChild(overl)
        }
      }); 

      roomBox.appendChild(occupancyContainer);
      roomsContainer.appendChild(roomBox);
    });

    levelBox.appendChild(roomsContainer);
    container.appendChild(levelBox);
  });

  const backButton = document.createElement('button');
  backButton.className = 'modal-show-back';
  backButton.innerText = 'Back';
  backButton.onclick = () => {
    dashboardContainer.innerHTML = '';
    showDashboard();
  };

  dashboardContainer.appendChild(container);
  dashboardContainer.appendChild(backButton);
}

function displayTenants(tenantsData) {
  dashboardContainer.innerHTML = '';

  const subHeading = document.createElement("h3");
  subHeading.textContent = "Tenants for billing period: " + selectedPeriodNameName;
  dashboardContainer.appendChild(subHeading);

  const tableDiv = document.createElement('div')
  tableDiv.style.maxHeight = "calc(100vh - 160px)"
  tableDiv.style.overflowY = "auto"

  const table = document.createElement('table');
  table.className = 'modal-show-table';

  const headerRow = document.createElement('tr');
  headerRow.style.position = "sticky"
  headerRow.innerHTML = `
    <th>Name</th>
    <th>Gender</th>
    <th>Room</th>
    <th>Contact</th>
    <th>Pays Monthly</th>
    <th>Owing Amount</th>
  `;
  table.appendChild(headerRow);

  if (tenantsData.length === 0) {
    const noDataRow = document.createElement('tr');
    noDataRow.innerHTML = `<td colspan="6">No tenants available</td>`;
    table.appendChild(noDataRow);
  } else {
    tenantsData.sort((a, b) => {
      if (a.ownEndDate && !b.ownEndDate) return -1;
      if (!a.ownEndDate && b.ownEndDate) return 1;
      return a.name.localeCompare(b.name);
    });

    tenantsData.forEach(tenant => {
      const row = document.createElement('tr');
      row.innerHTML = `
      <td>${tenant.name}</td>
      <td>${tenant.gender.charAt(0).toUpperCase() + tenant.gender.slice(1).toLowerCase()}</td>
      <td>${tenant.roomName}</td>
      <td>${tenant.ownContact || '<i>unset</i>'}</td>
      <td>${tenant.ownEndDate ? 'Yes' : 'No'}</td>
      <td>${formatNumber(tenant.owingAmount)}</td>
      `;

      if (tenant.ownEndDate) {
        const ownEndDate = new Date(tenant.ownEndDate);
        const timeDifference = Math.floor((ownEndDate - window.globalNow) / (1000 * 60 * 60 * 24));

        if (timeDifference >= 0 && timeDifference <= 7) {
          row.classList.add('almostdone');
        }
      }
      row.querySelector('td:first-of-type').onclick = () => openForm(`tenant-${tenant.tenantId}-${tenant.name}`);
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
  addButton.className = "table-add-button";
  addButton.textContent = 'Add New Tenant';
  addButton.onclick = () => openForm('Add New Tenant')

  tableDiv.appendChild(table);
  dashboardContainer.appendChild(tableDiv)
  dashboardContainer.appendChild(addButton);
  dashboardContainer.appendChild(backButton);
}

function displayPayments(moneysData) {
  dashboardContainer.innerHTML = '';

  const subHeading = document.createElement("h3");
  subHeading.textContent = "Payments made for " + selectedPeriodNameName;
  dashboardContainer.appendChild(subHeading);

  const tableDiv = document.createElement('div')
  tableDiv.style.maxHeight = "calc(100vh - 160px)"
  tableDiv.style.overflowY = "auto"

  const table = document.createElement('table');
  table.className = 'modal-show-table';

  const headerRow = document.createElement('tr');
  headerRow.style.position = "sticky"
  headerRow.innerHTML = `
    <th>Date</th>
    <th>Amount Paid</th> 
    <th>Tenant Name</th>
    <th>Room</th>    
    <th>Balance</th>   
    <th>Transaction ID</th>   
  `;
  table.appendChild(headerRow);
  if (moneysData.length === 0) {
    const noDataRow = document.createElement('tr');
    noDataRow.innerHTML = `<td colspan="6">No expenses for current semester/ period</td>`;
    table.appendChild(noDataRow);
  } else {
    moneysData.forEach(money => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(money.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
        <td>${formatNumber(money.amount)}</td>
        <td>${money.tenantName}</td>
        <td>${money.roomName}</td>
        <td>${formatNumber(money.owingAmount)}</td>
        <td>K${money.transactionId}</td>
      `;
      row.querySelector('td:nth-of-type(3)').onclick = () => openForm(`tenant-${money.tenantId}-${money.tenantName}`);

      table.appendChild(row);
    });
  }

  const addButton = document.createElement("button");
  addButton.className = "table-add-button";
  addButton.textContent = 'Add New Payment';
  addButton.onclick = () => {
    openForm('Record Money Received')
  }

  const backButton = document.createElement('button');
  backButton.className = 'modal-show-back';
  backButton.innerText = 'Back';
  backButton.onclick = () => {
    dashboardContainer.innerHTML = '';
    showDashboard()
  };

  tableDiv.appendChild(table);
  dashboardContainer.appendChild(tableDiv)
  dashboardContainer.appendChild(addButton)
  dashboardContainer.appendChild(backButton);
}

function displayMoneys(moneysData) {
  dashboardContainer.innerHTML = '';

  const subHeading = document.createElement("h3");
  subHeading.textContent = "Uncollected Amounts In " + selectedPeriodNameName;
  dashboardContainer.appendChild(subHeading);
  
  const tableDiv = document.createElement('div')
  tableDiv.style.maxHeight = "calc(100vh - 160px)"
  tableDiv.style.overflowY = "auto"

  const table = document.createElement('table');
  table.className = 'modal-show-table';

  const headerRow = document.createElement('tr');
  headerRow.style.position = "sticky"
  headerRow.innerHTML = `
    <th>Name</th> 
    <th>Room</th>
    <th>Amount Paid</th>    
    <th>Amount Due</th>
    <th>To Be Reminded On</th>
    <th>Pays Monthly</th>
    <th>Last Paid On</th>   
    <th>Full Hostel Fee</th>
    <th>Contact</th> 
  `;
  table.appendChild(headerRow);

  if (moneysData.length === 0) {
    const noDataRow = document.createElement('tr');
    noDataRow.innerHTML = `<td colspan="9">No expenses for current semester/period</td>`;
    table.appendChild(noDataRow);
  } else {
  
    moneysData.sort((a, b) => {
      const dateA = a.demandNoticeDate ? new Date(a.demandNoticeDate) : null;
      const dateB = b.demandNoticeDate ? new Date(b.demandNoticeDate) : null;
  
      if (dateA === dateB) return 0;
      if (dateA === null) return 1; // Null values go to the end
      if (dateB === null) return -1; // Null values go to the end
  
      if (dateA > globalNow && dateB > globalNow) return dateA - dateB; // Sort future dates
      if (dateA > globalNow) return 1; // Future dates after today
      if (dateB > globalNow) return -1; // Future dates after today
  
      // Sort descending for past dates (today, yesterday, etc.)
      return dateB - dateA;
    });
  
    moneysData.forEach(money => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${money.name}</td>
        <td>${money.roomName}</td>
        <td>${formatNumber(money.agreedPrice - money.owingAmount)}</td>
        <td>${formatNumber(money.owingAmount)}</td>
        <td class=${money.demandNoticeDate && new Date(money.demandNoticeDate) == globalNow ?
           'orangebg': ''}>${money.demandNoticeDate ? new Date(money.demandNoticeDate).toLocaleDateString('en-GB', 
            { year: 'numeric', month: 'long', day: 'numeric' }) : '<i>unset</i>'}</td>
        <td>${money.paysMonthly || '<i>unset</i>'}</td>
        <td>${money.lastPaymentDate ? new Date(money.lastPaymentDate).toLocaleDateString('en-GB', 
          { year: 'numeric', month: 'long', day: 'numeric' }) : '<i>N/A</i>'}</td>
        <td>${formatNumber(money.agreedPrice)}</td>
        <td>${money.ownContact || '<i>unset</i>'}</td>
      `;
      row.querySelector('td:nth-of-type(1)').onclick = () => openForm(`tenant-${money.tenantId}-${money.name}`);
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

  tableDiv.appendChild(table)
  dashboardContainer.appendChild(tableDiv);
  dashboardContainer.appendChild(backButton);
}

function displayExpenses(expensesData) {
  dashboardContainer.innerHTML = '';

  const subHeading = document.createElement("h3");
  subHeading.textContent = "Misc. Expenses for period: " + selectedPeriodNameName;
  dashboardContainer.appendChild(subHeading);

  const tableDiv = document.createElement('div')
  tableDiv.style.maxHeight = "calc(100vh - 160px)"
  tableDiv.style.overflowY = "auto"

  const table = document.createElement('table');
  table.className = 'modal-show-table';

  const headerRow = document.createElement('tr');
  headerRow.style.position = "sticky"
  headerRow.innerHTML = `
    <th>Payment Date</th>
    <th>Description</th>
    <th>Qty</th>
    <th>Amount</th>
    <th>Entered By</th>    
  `;
  table.appendChild(headerRow);
  if (expensesData.length === 0) {
    const noDataRow = document.createElement('tr');
    noDataRow.innerHTML = `<td colspan="5">No expenses for current semester/ period</td>`;
    table.appendChild(noDataRow);
  } else {
    expensesData.forEach(expense => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(expense.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
        <td>${expense.description || '<i>unset</i>'}</td>
        <td>${expense.quantity}</td>
        <td>${formatNumber(expense.amount)}</td>
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
  addButton.className = "table-add-button";
  addButton.textContent = 'Add Misc. Expense';
  addButton.onclick = () => {
    openForm('Add Misc. Expense')
  }

  tableDiv.appendChild(table);
  dashboardContainer.appendChild(tableDiv)
  dashboardContainer.appendChild(addButton);
  dashboardContainer.appendChild(backButton);
}

function displayOlders(oldersData) {
  dashboardContainer.innerHTML = '';

  const subHeading = document.createElement("h3");
  subHeading.textContent = `Tenants who already left in ${selectedPeriodNameName} or the semester before`
  dashboardContainer.appendChild(subHeading);

  const tableDiv = document.createElement('div')
  tableDiv.style.maxHeight = "calc(100vh - 160px)"
  tableDiv.style.overflowY = "auto"

  const table = document.createElement('table');
  table.className = 'modal-show-table';

  const headerRow = document.createElement('tr');
  headerRow.style.position = "sticky"
  headerRow.innerHTML = `
    <th>Name</th>
    <th>Gender</th>
    <th>Present During</th>
    <th>Room</th>
    <th>Pays Monthly</th>
    <th>Contact</th>
    <th>Unpaid Amount</th>    
  `;
  table.appendChild(headerRow);
  if (oldersData.length === 0) {
    const noDataRow = document.createElement('tr');
    noDataRow.innerHTML = `<td colspan="7">No data older than current semester/ period</td>`;
    table.appendChild(noDataRow);
  } else {
    oldersData.forEach(older => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${older.name}</td>
        <td>${older.gender.charAt(0).toUpperCase() + older.gender.slice(1).toLowerCase()}</td>
        <td>${older.lastSeen}</td>
        <td>${older.roomName}</td>
        <td>${older.paysMonthly}</td>
        <td>${older.ownContact || '<i>unset</i>'}</td>
        <td>${formatNumber(older.owingAmount)}</td>
      `;
      row.querySelector('td:nth-of-type(1)').onclick = () => openForm(`tenant-${older.tenantId}-${older.tenantName}`);

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

  tableDiv.appendChild(table);
  dashboardContainer.appendChild(tableDiv)
  dashboardContainer.appendChild(backButton);
}

export { showCards, miscExpenses, doTotals }


