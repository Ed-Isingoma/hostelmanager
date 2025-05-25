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
  if (num == null) return '##'
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
    owingAmount.innerHTML = `Owing: UGX ${tenant.owingAmount}`;

    const gender = document.createElement('div');
    gender.classList.add('tenant-gender');
    gender.innerHTML = `Gender: ${tenant.gender}`;

    const paysMonthly = document.createElement('div')
    paysMonthly.classList.add('tenant-pays-monthly')
    paysMonthly.innerHTML = `Pays Monthly: ${tenant.paysMonthly}`

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
  document.querySelectorAll('.dash-card-number').forEach(el => {
    el.style.color = "grey"
  })
  document.querySelectorAll(".dash-card-icon svg path").forEach(el => {
    el.setAttribute("fill", "grey");
  })
  try {
    const tot = await caller('dashboardTotals', [selectedPeriodNameId]);
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

export async function approveAccount(accountId, e, approveButton, approvalStatus) {
  e.preventDefault();
  try {
    const saving = await caller('updateAccount', [accountId, { approved: true }]);
    if (!saving.success) {
      showToast(saving.error);
      return;
    }
    approvalStatus.textContent = 'Approved: Yes'
    approveButton.disabled = true;
  } catch (e) {
    console.log(e);
    showToast(e);
  }
}

export async function deleteAccount(accountId, e, accountItem) {
  e.preventDefault();
  try {
    const saving = await caller('updateAccount', [accountId, { deleted: true }]);
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
  const startingDate = formatDate(rec.ownStartingDate);
  const endDate = formatDate(rec.ownEndDate);

  return `${startingDate} - ${endDate}`;
}

export const formatDate = (dateString) => {
  if (!dateString) return
  const date = new Date(dateString);
  date.setHours(date.getHours() + 3);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

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

export function createLoader() {
  if (!document.getElementById('loader-styles')) {
    const css = `
      .loader {
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        filter: drop-shadow(0 0 2px red);
      }
      .loader span {
        display: block;
        width: 12px;
        height: 12px;
        margin: 0 4px;
        border-radius: 50%;
        background: currentColor;
        opacity: 0.3;
        animation: pulse 1s infinite ease-in-out;
      }
      .loader span:nth-child(2) { animation-delay: 0.2s; }
      .loader span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes pulse {
        0%,100% { opacity: 0.3 }
        50%     { opacity: 1   }
      }
    `;
    const style = document.createElement('style');
    style.id = 'loader-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  const loader = document.createElement('div');
  loader.className = 'loader';
  for (let i = 0; i < 3; i++) {
    loader.appendChild(document.createElement('span'));
  }
  return loader;
}
export const loadWholeScreen = () => {

  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(255, 255, 255, 0.3)';
  overlay.style.zIndex = '98';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.className = "whiteover"

  const loader = createLoader();
  overlay.appendChild(loader);
  dashboardContainer.appendChild(overlay);
};

export function formatDateForInput(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  date.setHours(date.getHours() + 3); // Adjust for timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
