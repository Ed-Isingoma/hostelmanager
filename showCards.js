import openForm from "./openForm.js";
import showDashboard from "./showDashboard.js";
import showToast from "./showToast.js";

async function showCards() {
  await doTotals()
  const cardData = [
    { title: "Number of Tenants", icon: "people", number: window.totals.totalTenants, func: numOfTenants },
    { title: "Free Space", icon: "spaceship", number: window.totals.totalFreeSpaces, func: showRooms },
    { title: "Payments for this semester", icon: "payment", number: window.totals.totalPayments, func: collectedMoneys },
    { title: "Uncollected Amount this semester", icon: "balance", number: window.totals.totalOutstanding, func: uncollectedMoneys },
    { title: "Misc. Expenses for this semester", icon: "expenses", number: window.totals.totalMisc, func: miscExpenses },
    { title: "Past Tenants", icon: "past-tenants", number: window.totals.totalPastTenants, func: olderTenants },
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

async function doTotals() {
  try {
    const tot = await window.electron.call('dashboardTotals', [selectedPeriodNameId])
    if (tot.success) {
      window.totals = tot.data
    } else {
      showToast(tot.error)
    }
  } catch (e) {
    console.log(e)
    showToast(e)
  }
}

async function numOfTenants() {
  try {
    const tenants = await window.electron.call('getTenantsPlusOutstandingBalanceAll', [selectedPeriodNameId]);
    if (tenants.success) {
      displayTenants(tenants.data);
    } else {
      showToast(tenants.error)
    }
  } catch (e) {
    console.log(e);
    showToast(e);
  }
}

async function showRooms() {
  try {
    const levels = await window.electron.call('getLevels');
    if (levels.success) {
      const levelsData = []
      for (let level of levels.data) {
        const cardData = await window.electron.call('getRoomsAndOccupancyByLevel', [level.levelNumber, selectedPeriodNameId])
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
  }
}

async function miscExpenses() {
  try {
    const expenses = await window.electron.call('getMiscExpensesForBillingPeriodName', [window.selectedPeriodNameId]);
    if (expenses.success) {
      displayExpenses(expenses.data);
    } else {
      showToast(expenses.error)
    }
  } catch (e) {
    console.log(e);
    showToast(e);
  }
}

async function uncollectedMoneys() {
  try {
    const moneys = await window.electron.call('getOnlyTenantsWithOwingAmt', [window.selectedPeriodNameId]);
    if (moneys.success) {
      displayMoneys(moneys.data);
    } else {
      showToast(moneys.error)
    }
  } catch (e) {
    console.log(e);
    showToast(e);
  }
}

async function collectedMoneys() {
  try {
    const moneys = await window.electron.call('getTransactionsByPeriodNameIdWithMetaData', [selectedPeriodNameId]);
    if (moneys.success) {
      displayPayments(moneys.data);
    } else {
      showToast(moneys.error)
    }
  } catch (e) {
    console.log(e);
    showToast(e);
  }
}

async function olderTenants() {
  try {
    const olders = await window.electron.call('getOlderTenantsThan', [selectedPeriodNameId]);
    if (olders.success) {
      displayOlders(olders.data);
    } else {
      showToast(olders.error)
    }
  } catch (e) {
    console.log(e);
    showToast(e);
  }
}

function displayRooms(levelsData) {
  window.dashboardContainer.innerHTML = '';

  const container = document.createElement('div');
  container.classList.add('rooms-levels-container');

  levelsData.forEach(levelData => {
    const levelBox = document.createElement('div');
    levelBox.classList.add('rooms-level-box');

    const levelTitle = document.createElement('div');
    levelTitle.classList.add('rooms-level-title');
    levelTitle.innerHTML = `Level ${levelData[0].levelNumber}`;
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
      occupancyContainer.addEventListener("mouseenter", async () => {
        try {
          const tenants = await window.electron.call('getTenantsAndOwingAmtByRoom', [room.roomId, selectedPeriodNameId]);
          console.log(tenants.data)
          if (tenants.success) {
            showTenantsPopUp(tenants.data);
          } else {
            showToast(tenants.error);
          }
        } catch (e) {
          console.log(e);
          showToast(e);
        }
      });

      occupancyContainer.addEventListener("mouseleave", () => {
        hideTenantsPopUp();
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

  dashboardContainer.appendChild(backButton);
  dashboardContainer.appendChild(container);
}

function displayTenants(tenantsData) {
  window.dashboardContainer.innerHTML = '';

  const subHeading = document.createElement("h3");
  subHeading.textContent = "Tenants for billing period: " + selectedPeriodNameName;
  dashboardContainer.appendChild(subHeading);

  const table = document.createElement('table');
  table.className = 'modal-show-table';

  const headerRow = document.createElement('tr');
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
      <td>${tenant.ownContact}</td>
      <td>${tenant.ownEndDate ? 'Yes' : 'No'}</td>
      <td>${tenant.owingAmount}</td>
    `;

      if (tenant.ownEndDate) {
        const ownEndDate = new Date(tenant.ownEndDate);
        const timeDifference = Math.floor((ownEndDate - window.globalNow) / (1000 * 60 * 60 * 24));

        if (timeDifference >= 0 && timeDifference <= 7) {
          row.classList.add('almostdone');
        }
      }

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

function displayPayments(moneysData) {
  dashboardContainer.innerHTML = '';

  const subHeading = document.createElement("h3");
  subHeading.textContent = "Payments made for " + selectedPeriodNameName;
  dashboardContainer.appendChild(subHeading);

  const table = document.createElement('table');
  table.className = 'modal-show-table';

  const headerRow = document.createElement('tr');
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
        <td>${money.date}</td>
        <td>${money.amount}</td>
        <td>${money.tenantName}</td>
        <td>${money.roomName}</td>
        <td>${money.owingAmount}</td>
        <td>K${money.transactionId}</td>
      `;
      table.appendChild(row);
    });
  }

  const addButton = document.createElement("button");
  addButton.className = "menu-item";
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

  dashboardContainer.appendChild(table);
  dashboardContainer.appendChild(addButton)
  dashboardContainer.appendChild(backButton);
}

function displayMoneys(moneysData) {
  dashboardContainer.innerHTML = '';

  const subHeading = document.createElement("h3");
  subHeading.textContent = "Uncollected Amounts In " + selectedPeriodNameName;
  dashboardContainer.appendChild(subHeading);

  const table = document.createElement('table');
  table.className = 'modal-show-table';

  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th>Name</th> 
    <th>Room</th>
    <th>Amount Paid</th>    
    <th>Amount Due</th>
    <th>Demand Notice date</th>
    <th>Pays Monthly</th>
    <th>Latest Payment date</th>   
    <th>Total Amount Payable</th>
    <th>Contact</th> 
  `;
  table.appendChild(headerRow);

  if (moneysData.length === 0) {
    const noDataRow = document.createElement('tr');
    noDataRow.innerHTML = `<td colspan="9">No expenses for current semester/period</td>`;
    table.appendChild(noDataRow);
  } else {
  
    moneysData.sort((a, b) => {
      const dateA = a.demandNoticeDate ? new Date(a.demandNoticeDate).setHours(0, 0, 0, 0) : null;
      const dateB = b.demandNoticeDate ? new Date(b.demandNoticeDate).setHours(0, 0, 0, 0) : null;
  
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
        <td>${money.agreedPrice - money.owingAmount}</td>
        <td>${money.owingAmount}</td>
        <td class=${money.demandNoticeDate && new Date(money.demandNoticeDate).setHours(0, 0, 0, 0) == globalNow ? 'orangebg': ''}>${money.demandNoticeDate || '<i>unset</i>'}</td>
        <td>${money.paysMonthly || '<i>unset</i>'}</td>
        <td>${money.date}</td>
        <td>${money.agreedPrice}</td>
        <td>${money.ownContact}</td>
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

  dashboardContainer.appendChild(table);
  dashboardContainer.appendChild(backButton);
}

function displayExpenses(expensesData) {
  dashboardContainer.innerHTML = '';

  const subHeading = document.createElement("h3");
  subHeading.textContent = "Misc. Expenses for period: " + selectedPeriodNameName;
  dashboardContainer.appendChild(subHeading);

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
    noDataRow.innerHTML = `<td colspan="5">No expenses for current semester/ period</td>`;
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

function displayOlders(oldersData) {
  dashboardContainer.innerHTML = '';

  const subHeading = document.createElement("h3");
  subHeading.textContent = "Tenants who left during or before " + selectedPeriodNameName;
  dashboardContainer.appendChild(subHeading);

  const table = document.createElement('table');
  table.className = 'modal-show-table';

  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th>Name</th>
    <th>Gender</th>
    <th>Room</th>
    <th>Pays Monthly</th>
    <th>Contact</th>
    <th>Unpaid Amount</th>    
  `;
  table.appendChild(headerRow);
  if (oldersData.length === 0) {
    const noDataRow = document.createElement('tr');
    noDataRow.innerHTML = `<td colspan="5">No data older than current semester/ period</td>`;
    table.appendChild(noDataRow);
  } else {
    oldersData.forEach(older => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${older.name}</td>
        <td>${older.gender}</td>
        <td>${older.roomName}</td>
        <td>${older.paysMonthly}</td>
        <td>${older.ownContact}</td>
        <td>${older.owingAmount}</td>
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

  dashboardContainer.appendChild(table);
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

function showTenantsPopUp(tenants) {
  const popUpContainer = document.createElement('div');
  popUpContainer.classList.add('tenants-popup-container');

  tenants.forEach(tenant => {
    const tenantBox = document.createElement('div');
    tenantBox.classList.add('tenant-box');

    const tenantName = document.createElement('div');
    tenantName.classList.add('tenant-name');
    tenantName.innerHTML = `Name: ${tenant.name}`;

    const owingAmount = document.createElement('div');
    owingAmount.classList.add('tenant-owing-amount');
    owingAmount.innerHTML = `Owing: $${tenant.owingAmount.toFixed(2)}`;

    const gender = document.createElement('div');
    gender.classList.add('tenant-gender');
    gender.innerHTML = `Gender: ${tenant.gender}`;

    tenantBox.appendChild(tenantName);
    tenantBox.appendChild(owingAmount);
    tenantBox.appendChild(gender);

    popUpContainer.appendChild(tenantBox);
  });

  dashboardContainer.appendChild(popUpContainer);
}

function hideTenantsPopUp() {
  const popUpContainer = document.querySelector('.tenants-popup-container');
  if (popUpContainer) {
    popUpContainer.remove();
  }
}


export { showCards, miscExpenses, doTotals }