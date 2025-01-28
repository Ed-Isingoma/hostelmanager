import openForm from "./openForm.js";
import showToast from "./showToast.js";
import { caller } from "./caller.js";

export function getIcon(iconName) {
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

export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function showTenantsPopUp(tenants, roomName) {
  const overlay = document.createElement('div');
  overlay.classList.add('tenants-popup-overlay');
  overlay.addEventListener('click', hideTenantsPopUp);

  const popUpContainer = document.createElement('div');
  popUpContainer.classList.add('tenants-popup-container');

  const title = document.createElement('div')
  title.classList.add('tenants-popup-title')
  title.innerHTML = `Room ${roomName} Tenants`
  popUpContainer.appendChild(title)

  tenants.forEach((tenant) => {
    const tenantBox = document.createElement('div');
    tenantBox.classList.add('tenant-box');

    const tenantName = document.createElement('div');
    tenantName.classList.add('tenant-name');
    tenantName.innerHTML = `Name: ${tenant.name}`;

    const owingAmount = document.createElement('div');
    owingAmount.classList.add('tenant-owing-amount');
    owingAmount.innerHTML = `Owing: UGX${tenant.owingAmount.toFixed(2)}`;

    const gender = document.createElement('div');
    gender.classList.add('tenant-gender');
    gender.innerHTML = `Gender: ${tenant.gender}`;

    const paysMonthly = document.createElement('div')
    paysMonthly.classList.add('tenant-pays-monthly')
    paysMonthly.innerHTML = `Pays Monthly: ${tenant.paysMonthly ? 'Yes' : 'No'}`

    tenantBox.appendChild(tenantName);
    tenantBox.appendChild(owingAmount);
    tenantBox.appendChild(gender);
    tenantBox.appendChild(paysMonthly)

    popUpContainer.appendChild(tenantBox);
  });

  if (tenants.length ==0) {
    const tenantBox = document.createElement('div')
    tenantBox.classList.add('tenant-box')
    tenantBox.innerHTML = "No tenants here for selected semester"
    popUpContainer.appendChild(tenantBox)
  }

  const addTenantButton = document.createElement('button');
  addTenantButton.classList.add('add-tenant-button');
  addTenantButton.textContent = 'Add Tenant';
  addTenantButton.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    // window.selectedRoomId = event.target.parentElement.parentElement.parentElement.getAttribute('data-roomId');
    openForm('Add New Tenant')
  });
  popUpContainer.appendChild(addTenantButton);
  // Append the popup container to the overlay
  overlay.appendChild(popUpContainer);

  // Append the overlay to the dashboard container
  dashboardContainer.appendChild(overlay);
}

export function hideTenantsPopUp() {
  const overlay = document.querySelector('.tenants-popup-overlay');
  if (overlay) {
    overlay.remove();
  }
}

export async function doTotals() {
  try {
    const tott = await caller('dashboardTotals', [selectedPeriodNameId]);
    const tot = await tott.json()

    if (tot.success) {
      window.totals = tot.data;
    } else {
      showToast(tot.error);
    }
  } catch (e) {
    console.log(e);
    showToast(e);
  }
}

export async function approveAccount(accountId, e, approveButton) {
  e.preventDefault();
  try {
    const savin = await caller('updateAccount', [accountId, { approved: true }]);
    const saving = await savin.json()

    if (!saving.success) {
      showToast(saving.error);
      return;
    }
    approveButton.disabled = true;
  } catch (e) {
    console.log(e);
    showToast(e);
  }
}

export async function deleteAccount(accountId, e, accountItem) {
  e.preventDefault();
  try {
    const savin = await caller('updateAccount', [accountId, { deleted: true }]);
    const saving = await savin.json()
    if (saving.success) {
      showToast('Account deleted');
    } else {
      showToast(saving.error);
    }
    accountItem.remove();

  } catch (e) {
    console.log(e);
    showToast(e);
  }
}

export function formatDateRange(rec) {
  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const startingDate = formatDate(rec.ownStartingDate);
  const endDate = formatDate(rec.ownEndDate);

  return `${startingDate} - ${endDate}`;
}

export function assignPeriodNameId(dateStr) {
  semesters.sort((a, b) => new Date(a.startingDate) - new Date(b.startingDate));
  const theDate = new Date(dateStr).setHours(0, 0, 0);
  let theId = null;
  for (let i = 0; i < semesters.length; i++) {
    const currentSemesterStart = new Date(semesters[i].startingDate);

    if (currentSemesterStart <= theDate) {
      const nextSemester = semesters[i + 1];
      if (!nextSemester || new Date(nextSemester.startingDate) > theDate) {
        theId = semesters[i].periodNameId;
        break;
      }
    } else {
      theId = semesters[0].periodNameId;
    }
  }
  return theId;
}

window.closeForm = function () {
  document.querySelector(".overlay")?.remove();
  document.querySelector(".modal-form")?.remove();
};

