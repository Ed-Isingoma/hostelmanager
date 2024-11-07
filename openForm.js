import { showLoginPrompt } from './logins.js';
import showToast from './showToast.js'

export default function openForm(title) {
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.onclick = closeForm;

  const form = document.createElement("div");
  form.className = "modal-form";

  // Form Title
  const formTitle = document.createElement("h2");
  formTitle.textContent = title;
  form.appendChild(formTitle);

  // Form content based on title
  const formContent = document.createElement("form");

  if (title === "Add Tenant") {
    addTenantFormFields(formContent)
  } else if (title === "Add Payment") {
    addPaymentFormFields(formContent)
  }
  if (title === 'Users') {
    showUserAccounts(formContent)
  }

  form.appendChild(formContent);

  if (title === 'Log Out') {
    document.body.innerHTML = ''
    showLoginPrompt()
  } else {
    document.body.appendChild(overlay);
    document.body.appendChild(form);
  }
}

async function showUserAccounts(formContent) {
  try {
    const accounts = await window.electron.call('getAccountsDeadAndLiving');

    const accountsListContainer = document.createElement('div');
    accountsListContainer.className = 'accounts-list';
    accounts.data.forEach(account => {
      if (account.role == 'admin') return
      const accountItem = document.createElement('div');
      accountItem.className = 'account-item';

      const accountName = document.createElement('span');
      accountName.className = 'account-name';
      accountName.textContent = `Username: ${account.username}`;

      const approvalStatus = document.createElement('span');
      approvalStatus.className = 'approval-status';
      approvalStatus.textContent = `Approved: ${account.approved ? 'Yes' : 'No'}`;

      const approveButton = document.createElement('button');
      approveButton.className = 'approve-button';
      approveButton.textContent = 'Approve';
      approveButton.disabled = account.approved;
      approveButton.onclick = async (event) => await approveAccount(account.accountId, event, approveButton);

      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-button';
      deleteButton.textContent = 'Delete';
      deleteButton.onclick = async (event) => await deleteAccount(account.accountId, event, accountItem);

      accountItem.appendChild(accountName);
      accountItem.appendChild(approvalStatus);
      accountItem.appendChild(approveButton);
      accountItem.appendChild(deleteButton);

      accountsListContainer.appendChild(accountItem);
    });

    // Append the accounts list container to formContent
    formContent.appendChild(accountsListContainer);
  } catch (e) {
    console.log('Error fetching accounts:', e);
    showToast(e)
  }
}

async function approveAccount(accountId, e, approveButton) {
  e.preventDefault()
  try {
    await window.electron.call('updateAccount', [accountId, { approved: 1 }])
    showToast('Account approved')
    approveButton.disabled = true
  } catch (e) {
    console.log(e)
    showToast(e)
  }
}

async function deleteAccount(accountId, e, accountItem) {
  e.preventDefault()
  try {
    await window.electron.call('updateAccount', [accountId, { deleted: 1 }])
    showToast('Account deleted')
    accountItem.remove()

  } catch (e) {
    console.log(e)
    showToast(e)
  }
}

async function addTenantFormFields(formContent) {
  try {
    const fields = [
      { label: "Tenant Name", type: "text", name: "tenantName", placeholder: "Enter tenant name" },
      { label: "Gender", type: "select", name: "gender", options: ["Male", "Female"] },
      { label: "Age", type: "number", name: "age", placeholder: "Enter age" },
      { label: "Course", type: "text", name: "course", placeholder: "Enter course" },
      { label: "Contact", type: "tel", name: "contact", placeholder: "Enter contact" },
      { label: "Next of Kin", type: "text", name: "nextOfKin", placeholder: "Enter next of kin" },
      { label: "Kin's Contact", type: "tel", name: "kinContact", placeholder: "Enter kin's contact" },
    ];

    fields.forEach(field => {
      const label = document.createElement("label");
      label.textContent = field.label;
      formContent.appendChild(label);

      if (field.type === "select") {
        const select = document.createElement("select");
        select.name = field.name;
        field.options.forEach(option => {
          const optionElement = document.createElement("option");
          optionElement.value = option.toLowerCase();
          optionElement.textContent = option;
          select.appendChild(optionElement);
        });
        formContent.appendChild(select);
      } else {
        const input = document.createElement("input");
        input.type = field.type;
        input.name = field.name;
        input.placeholder = field.placeholder;
        formContent.appendChild(input);
      }
    });

    const levelLabel = document.createElement("label");
    levelLabel.textContent = "Level";
    formContent.appendChild(levelLabel);

    const levelDropdown = document.createElement("select");
    levelDropdown.name = "level";
    formContent.appendChild(levelDropdown);

    const levels = await window.electron.call('getLevels');
    levels.data.forEach(level => {
      const option = document.createElement("option");
      option.value = level.levelNumber;
      option.textContent = `Level ${level.levelNumber}`;
      levelDropdown.appendChild(option);
    });

    // Room Selection Dropdown
    const roomLabel = document.createElement("label");
    roomLabel.textContent = "Room";
    formContent.appendChild(roomLabel);

    const roomDropdown = document.createElement("select");
    roomDropdown.name = "room";
    formContent.appendChild(roomDropdown);

    const updateRoomOptions = async () => {
      const selectedGender = formContent.querySelector("select[name='gender']").value;
      const selectedLevel = levelDropdown.value;

      if (selectedGender && selectedLevel) {
        const rooms = await window.electron.call('getPotentialTenantRoomsByGender', [selectedGender, selectedLevel, window.selectedBillingPeriodNameId]);
        roomDropdown.innerHTML = ''; // Clear existing room options

        rooms.data.forEach(room => {
          const option = document.createElement("option");
          option.value = room.roomId;
          option.textContent = room.roomName;
          roomDropdown.appendChild(option);
        });
      }
    };
    updateRoomOptions()

    formContent.querySelector("select[name='gender']").addEventListener("change", updateRoomOptions);
    levelDropdown.addEventListener("change", updateRoomOptions);

    const periodTypeLabel = document.createElement("label");
    periodTypeLabel.textContent = "Period Type";
    formContent.appendChild(periodTypeLabel);

    const periodTypeDropdown = document.createElement("select");
    periodTypeDropdown.name = "periodType";

    ["single", "double"].forEach(type => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      periodTypeDropdown.appendChild(option);
    });
    formContent.appendChild(periodTypeDropdown);

    const agreedPriceLabel = document.createElement("label");
    agreedPriceLabel.textContent = "Agreed Total Price";
    formContent.appendChild(agreedPriceLabel);

    const agreedPriceInput = document.createElement("input");
    agreedPriceInput.type = "number";
    agreedPriceInput.name = "agreedPrice";
    formContent.appendChild(agreedPriceInput);

    const setDefaultAgreedPrice = async () => {
      const periodType = periodTypeDropdown.value;
      const periodNameRecord = await window.electron.call('getBillingPeriodNames', [window.selectedBillingPeriodNameId]);

      if (periodNameRecord.success && periodNameRecord.data.length > 0) {
        const billingPeriod = periodNameRecord.data[0];
        agreedPriceInput.value = periodType === "single" ? billingPeriod.costSingle : billingPeriod.costDouble;
      }
    };

    periodTypeDropdown.addEventListener("change", setDefaultAgreedPrice);
    setDefaultAgreedPrice();

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = "add-tenant-submit";
    submitButton.textContent = "Submit";

    formContent.appendChild(submitButton);
  } catch (e) {
    showToast(e)
    console.log(e)
  }
}

function addPaymentFormFields(formContent) {
  const fields = [
    { label: "Date", type: "date", name: "date" },
    { label: "Amount", type: "number", name: "amount", placeholder: "Enter amount" }
  ];

  fields.forEach(field => {
    const label = document.createElement("label");
    label.textContent = field.label;
    formContent.appendChild(label);

    const input = document.createElement("input");
    input.type = field.type;
    input.name = field.name;
    input.placeholder = field.placeholder || "";
    formContent.appendChild(input);
  });

  // Billing Period Dropdown
  const billingPeriodLabel = document.createElement("label");
  billingPeriodLabel.textContent = "Billing Period";
  formContent.appendChild(billingPeriodLabel);

  const billingPeriodSelect = document.createElement("select");
  billingPeriodSelect.name = "billingPeriod";
  const billingOptions = ["Monthly", "Quarterly", "Annually"];
  billingOptions.forEach(option => {
    const optionElement = document.createElement("option");
    optionElement.value = option.toLowerCase();
    optionElement.textContent = option;
    billingPeriodSelect.appendChild(optionElement);
  });
  formContent.appendChild(billingPeriodSelect);
}