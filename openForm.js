import { showLoginPrompt } from './logins.js';
import { miscExpenses } from './showCards.js';
import showDashboard from './showDashboard.js';
import showToast from './showToast.js'

export default function openForm(title) {
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.onclick = closeForm;

  const form = document.createElement("div");
  form.className = "modal-form";

  const formTitle = document.createElement("h2");
  formTitle.textContent = title;
  form.appendChild(formTitle);

  const formContent = document.createElement("form");
  form.appendChild(formContent);

  if (title === 'Log Out') {
    document.body.innerHTML = ''
    showLoginPrompt()
  } else if (title != 'Billing Periods') {
    document.body.appendChild(overlay);
    document.body.appendChild(form);
  }

  if (title === "Add New Tenant") {
    addTenantFormFields(formContent)
  } else if (title === "Record Money Received") {
    addPaymentFormFields(formContent)
  } else if (title === 'Users') {
    showUserAccounts(formContent)
  } else if (title === 'Add Misc. Expense') {
    addMiscsFormFields(formContent)
  } else if (title === 'Billing Periods') {
    showBillingPeriods()
  }
}

async function showUserAccounts(formContent) {
  try {
    const accounts = await window.electron.call('getAccountsDeadAndLiving');
    if (!accounts.success) {
      showToast(accounts.error)
      return
    }
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

async function showBillingPeriods() {
  try {
    const periodNames = await window.electron.call('getBillingPeriodNames')
    if (!periodNames.success) return showToast(periodNames.error)
    window.dashboardContainer.innerHTML = '';

    const table = document.createElement('table');
    table.className = 'modal-show-table';

    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
    <th>Name</th>
    <th>Starting Date</th>
    <th>End Date</th>
    <th>Cost- Single</th>
    <th>Cost- Double</th>
    <th></th>
    <th></th>
  `;
    table.appendChild(headerRow);

    if (periodNames.data.length === 0) {
      const noDataRow = document.createElement('tr');
      noDataRow.innerHTML = `<td colspan="5">No billing periods available</td>`;
      table.appendChild(noDataRow)
    } else {
      periodNames.data.forEach(period => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" value="${period.name}" disabled /></td>
            <td><input type="date" value="${period.startingDate}" disabled /></td>
            <td><input type="date" value="${period.endDate}" disabled /></td>
            <td><input type="number" value="${period.costSingle}" disabled /></td>
            <td><input type="number" value="${period.costDouble}" disabled /></td>
            <td>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" 
                    style="cursor: pointer;" class="edit-icon">
                    <path d="M3 17.25V21h3.75l11.03-11.03-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                </svg>
            </td>
            <td>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" 
                    style="cursor: pointer;" class="delete-icon">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z" fill="currentColor"/>
                </svg>
            </td>
        `;
        table.appendChild(row);

        const editIcon = row.querySelector('.edit-icon');
        editIcon.onclick = () => toggleEdit(period.periodNameId, editIcon);

        const deleteIcon = row.querySelector('.delete-icon');
        deleteIcon.addEventListener('click', () => deleteRow(period.periodNameId, row));
      });
    }

    const backButton = document.createElement('button');
    backButton.className = 'modal-show-back';
    backButton.innerText = 'Back';
    backButton.onclick = () => {
      dashboardContainer.innerHTML = '';
      showDashboard()
    }

    const addButton = document.createElement("button");
    addButton.className = "menu-item";
    addButton.textContent = 'Add Billing Period';
    addButton.onclick = () => addBillingPeriodRow(table)

    dashboardContainer.appendChild(table);
    dashboardContainer.appendChild(addButton);
    dashboardContainer.appendChild(backButton);
  } catch (e) {
    console.log('Error fetching accounts:', e);
    showToast(e)
  }
}

async function approveAccount(accountId, e, approveButton) {
  e.preventDefault()
  try {
    const saving = await window.electron.call('updateAccount', [accountId, { approved: 1 }])
    if (!saving.success) {
      showToast(saving.error)
      return
    }
    approveButton.disabled = true
  } catch (e) {
    console.log(e)
    showToast(e)
  }
}

async function deleteAccount(accountId, e, accountItem) {
  e.preventDefault()
  try {
    const saving = await window.electron.call('updateAccount', [accountId, { deleted: 1 }])
    if (saving.success) {
      showToast('Account deleted')
    } else {
      showToast(saving.error)
    }
    accountItem.remove()

  } catch (e) {
    console.log(e)
    showToast(e)
  }
}

async function addBillingPeriodRow(table) {

  const row = document.createElement('tr')
  row.innerHTML = `
    <td><input type="text" placeholder="Enter period name" /></td>
    <td><input type="date" placeholder="Enter starting date" /></td>
    <td><input type="date" placeholder="Enter end name" /></td>
    <td><input type="number" placeholder="Enter amount" /></td>
    <td><input type="number" placeholder="Enter amount" /></td>
    <td>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" 
            style="cursor: pointer;" class="edit-icon">
            <path d="M21 7H3v12h18V7zm-1 10H4v-8h16v8zm-8-3v3h2v-3h3l-4-4-4 4h3z" fill="currentColor"/>
        </svg>
    </td>
    <td>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" 
            style="cursor: pointer;" class="delete-icon">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z" fill="currentColor"/>
        </svg>
    </td>
  `;
  table.appendChild(row);

  const editIcon = row.querySelector('.edit-icon');
  editIcon.onclick = () => saveNewRow(row);

  const deleteIcon = row.querySelector('.delete-icon');
  deleteIcon.addEventListener('click', () => row.remove());
}

async function deleteRow(periodId, item) {
  try {
    const saving = await window.electron.call('updateBillingPeriodName', [periodId, { deleted: 1 }])
    if (saving.success) {
      showToast('Billing period deleted')
      item.remove()
    } else {
      showToast(saving.error)
    }
  } catch (e) {
    console.log(e)
    showToast(e)
  }
}

async function saveNewRow(row) {
  const inputs = row.querySelectorAll('input');
  console.log('the inputs:', inputs)
  const newData = {
    name: inputs[0].value,
    startingDate: inputs[1].value,
    endDate: inputs[2].value,
    costSingle: parseFloat(inputs[3].value),
    costDouble: parseFloat(inputs[4].value)
  };

  try {
    const saving = await window.electron.call('createBillingPeriodName', [newData]);
    if (saving.success) {
      showToast('Billing period created');

      inputs.forEach(input => input.disabled = true);

      const editIcon = row.querySelector('.edit-icon');
      if (editIcon) {
        editIcon.innerHTML = `
          <path d="M3 17.25V21h3.75l11.03-11.03-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
        `;

        editIcon.onclick = () => toggleEdit(saving.data, editIcon);
      } else {
        console.error('Edit icon not found in the row');
      }
    } else {
      showToast(saving.error);
    }
  } catch (e) {
    console.error(e);
    showToast(e);
  }

}

function toggleEdit(periodId, editIcon) {
  const row = editIcon.closest('tr');
  const inputs = row.querySelectorAll('input');

  // Toggle inputs between editable and read-only
  inputs.forEach(input => input.disabled = !input.disabled);

  if (!inputs[0].disabled) {
    // Change icon to save mode
    editIcon.innerHTML = `
      <path d="M21 7H3v12h18V7zm-1 10H4v-8h16v8zm-8-3v3h2v-3h3l-4-4-4 4h3z" fill="currentColor"/>
    `;
    // Set the onclick directly to call saveRow
    editIcon.onclick = () => saveRow(periodId, row);
  } else {
    // Revert to edit icon
    editIcon.innerHTML = `
      <path d="M3 17.25V21h3.75l11.03-11.03-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
    `;
    // Reset onclick to call toggleEdit for the next click
    editIcon.onclick = () => toggleEdit(periodId, editIcon);
  }
}

async function saveRow(periodId, row) {
  const inputs = row.querySelectorAll('input');

  const updatedData = {
    name: inputs[0].value,
    startingDate: inputs[1].value,
    endDate: inputs[2].value,
    costSingle: parseFloat(inputs[3].value),
    costDouble: parseFloat(inputs[4].value)
  };

  try {
    const saving = await window.electron.call('updateBillingPeriodName', [periodId, updatedData]);
    if (saving.success) {
      showToast('Billing period updated');

      inputs.forEach(input => input.disabled = true);

      const editIcon = row.querySelector('.edit-icon');
      if (editIcon) {
        editIcon.innerHTML = `
      <path d="M3 17.25V21h3.75l11.03-11.03-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
    `;
        editIcon.onclick = () => toggleEdit(periodId, editIcon);
      } else {
        console.error('Edit icon not found in the row');
      }
    } else {
      showToast(saving.error);
    }
  } catch (e) {
    console.error(e);
    showToast(e);
  }

}

async function addTenantFormFields(formContent) {
  try {
    const fields = [
      { label: "Tenant Name", type: "text", name: "name", placeholder: "Enter tenant name" },
      { label: "Gender", type: "select", name: "gender", options: ["Male", "Female"] },
      { label: "Age", type: "number", name: "age", placeholder: "Enter age" },
      { label: "Course", type: "text", name: "course", placeholder: "Enter course" },
      { label: "Contact", type: "tel", name: "ownContact", placeholder: "Enter contact" },
      { label: "Next of Kin", type: "text", name: "nextOfKin", placeholder: "Enter next of kin" },
      { label: "Kin's Contact", type: "tel", name: "kinContact", placeholder: "Enter kin's contact" },
    ];

    const subheadingTenant = document.createElement("h3");
    subheadingTenant.textContent = "Tenant Details";
    formContent.appendChild(subheadingTenant);

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

    const subheadingRoom = document.createElement("h3");
    subheadingRoom.textContent = "Room Details";
    formContent.appendChild(subheadingRoom);

    const semLabel = document.createElement("label");
    semLabel.textContent = "Semester/Month";
    formContent.appendChild(semLabel);

    const periodNames = await window.electron.call('getBillingPeriodNames');
    if (!periodNames.success) return showToast(periodNames.error);

    const semesterDropdown = document.createElement("select");
    semesterDropdown.className = "semester-dropdown";
    formContent.appendChild(semesterDropdown);

    periodNames.data.forEach(semester => {
      const option = document.createElement("option");
      option.value = semester.periodNameId;
      option.textContent = semester.name;
      option.setAttribute("data-endDate", semester.endDate);
      semesterDropdown.appendChild(option);
    });

    semesterDropdown.value = window.currentPeriodNameId;

    const customOption = document.createElement("option");
    customOption.value = "custom";
    customOption.textContent = "Custom";
    semesterDropdown.appendChild(customOption);

    const startDateLabel = document.createElement("label");
    startDateLabel.textContent = "Starting Date";
    startDateLabel.style.display = "none";
    const startDateInput = document.createElement("input");
    startDateInput.type = "date";
    startDateInput.style.display = "none";

    const endDateLabel = document.createElement("label");
    endDateLabel.textContent = "Ending Date";
    endDateLabel.style.display = "none";
    const endDateInput = document.createElement("input");
    endDateInput.type = "date";
    endDateInput.style.display = "none";

    formContent.appendChild(startDateLabel);
    formContent.appendChild(startDateInput);
    formContent.appendChild(endDateLabel);
    formContent.appendChild(endDateInput);

    semesterDropdown.addEventListener("change", () => {
      setDefaultAgreedPrice()
      if (semesterDropdown.value === "custom") {
        startDateLabel.style.display = "";
        startDateInput.style.display = "";
        endDateLabel.style.display = "";
        endDateInput.style.display = "";
      } else {
        startDateLabel.style.display = "none";
        startDateInput.style.display = "none";
        endDateLabel.style.display = "none";
        endDateInput.style.display = "none";
      }
    });

    const roomLabel = document.createElement("label");
    roomLabel.textContent = "Room Number";
    formContent.appendChild(roomLabel);

    const roomInput = document.createElement("input");
    roomInput.type = 'text'
    roomInput.name = "room";
    roomInput.setAttribute('list', 'rooms-datalist')
    formContent.appendChild(roomInput);

    const roomDatalist = document.createElement('datalist')
    roomDatalist.id = 'room-datalist'
    formContent.appendChild(roomDatalist)

    roomInput.addEventListener('input', async () => {
      const rooms = await window.electron.call('searchRoomByNamePart', [roomInput.value])
      if (rooms.success) {
        roomDatalist.innerHTML = ''
        for (let item of rooms.data) {
          const option = document.createElement('option')
          option.value = item.roomId
          option.textContent = item.name
          roomDatalist.appendChild(option)
        }
      } else showToast(rooms.error)
    })

    const periodTypeLabel = document.createElement("label");
    periodTypeLabel.textContent = "Single or Double";
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
    agreedPriceLabel.textContent = "Room Amount Per Month/Semester";
    formContent.appendChild(agreedPriceLabel);

    const agreedPriceInput = document.createElement("input");
    agreedPriceInput.type = "number";
    agreedPriceInput.name = "agreedPrice";
    formContent.appendChild(agreedPriceInput);

    const setDefaultAgreedPrice = async () => {
      const periodType = periodTypeDropdown.value;
      const periodNameRecord = await window.electron.call('getBillingPeriodNames', [semesterDropdown.value]);

      if (periodNameRecord.success && periodNameRecord.data.length > 0) {
        const billingPeriod = periodNameRecord.data[0];
        agreedPriceInput.value = periodType === "single" ? billingPeriod.costSingle : billingPeriod.costDouble;
      } else if (!periodNameRecord.success) return showToast(periodNameRecord.error);
    };

    periodTypeDropdown.addEventListener("change", setDefaultAgreedPrice);

    setDefaultAgreedPrice();

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = "add-tenant-submit";
    submitButton.textContent = "Submit";

    submitButton.onclick = async (event) => {
      event.preventDefault();

      const tenantData = {};
      fields.forEach(field => {
        const input = formContent.querySelector(`[name="${field.name}"]`);
        tenantData[field.name] = field.name === "age" ? parseInt(input.value || 0, 10) : input.value || null;
      });

      if (!tenantData.name) {
        return showToast("Tenant name is required.");
      }

      const tenantResult = await window.electron.call('createTenant', [tenantData]);
      if (!tenantResult.success) return showToast(tenantResult.error);

      const tenantId = tenantResult.data;
      console.log("created tenantId:", tenantId);

      const billingPeriodData = {
        tenantId,
        periodNameId: semesterDropdown.value == 'custom' ? currentPeriodNameId : semesterDropdown.value,
        startingDate: semesterDropdown.value === "custom" ? startDateInput.value : null,
        endingDate: semesterDropdown.value === "custom" ? endDateInput.value : null,
        roomId: roomInput.value,
        periodType: periodTypeDropdown.value,
        agreedPrice: parseInt(agreedPriceInput.value || 0, 10),
      };

      const billingResult = await window.electron.call('createBillingPeriod', [billingPeriodData]);
      if (!billingResult.success) return showToast(billingResult.error);

      console.log("Billing period created successfully.");
    };

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "add-tenant-cancel";
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = closeForm;

    formContent.appendChild(cancelBtn);
    formContent.appendChild(submitButton);
  } catch (e) {
    showToast(e.message);
    console.log(e);
  }
}


function addMiscsFormFields(formContent) {
  const fields = [
    { label: "Description", type: "text", name: "description", placeholder: "Describe the expense" },
    { label: "Quantity", type: "number", name: "quantity", placeholder: "Enter quantity" },
    { label: "Amount", type: "number", name: "amount", placeholder: "Enter amount" },
    { label: "Add Transaction Date", type: "date", name: "date" }
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

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "add-tenant-submit";
  submitButton.textContent = "Submit";
  submitButton.onclick = async (event) => {
    event.preventDefault()
    const formData = {}
    fields.forEach(field => {
      const inputElement = formContent.querySelector(`input[name=${field.name}]`);
      formData[field.name] = inputElement.value;
    });
    try {
      const response = await window.electron.call('createMiscExpense', [formData, user.accountId, selectedPeriodNameId]);
      if (response.success) {
        showToast('Added Miscellaneous Expense');
        closeForm()
        miscExpenses()
      } else {
        showToast(response.error)
      }
    } catch (error) {
      console.error(error);
      showToast(error)
    }
  }

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "add-tenant-submit";
  cancelBtn.textContent = "Cancel";
  cancelBtn.onclick = closeForm

  formContent.appendChild(cancelBtn);
  formContent.appendChild(submitButton);
}

async function addPaymentFormFields(formContent) {
  const fields = [
    { label: "Add Transaction Date", type: "date", name: "date" },
    { label: "Received Amount", type: "number", name: "amount", placeholder: "Enter amount" }
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

  try {
    const label1 = document.createElement("label");
    label1.textContent = "Select Tenant";
    formContent.appendChild(label1);

    const tenantInput = document.createElement("input");
    tenantInput.type = "text";
    tenantInput.name = "tenants";
    tenantInput.setAttribute("list", "tenants-datalist");
    formContent.appendChild(tenantInput);

    const tenantDatalist = document.createElement("datalist");
    tenantDatalist.id = "tenants-datalist";
    formContent.appendChild(tenantDatalist);

    tenantInput.addEventListener("input", async () => {
      const tenants = await window.electron.call("searchTenantNameAndId", [tenantInput.value]);
      if (tenants.success) {
        tenantDatalist.innerHTML = "";
        for (let item of tenants.data) {
          const option = document.createElement("option");
          option.value = item.tenantId;
          option.textContent = item.name
          tenantDatalist.appendChild(option);
        }
      } else showToast(tenants.error)
    });

    const labell = document.createElement("label");
    labell.textContent = "Being Payment For:"
    formContent.appendChild(labell);
    const periodNames = await window.electron.call('getBillingPeriodNames'); //get even the monthlies here and add them as individual options
    if (!periodNames.success) return showToast(periodNames.error);

    const subheadingPayForm = document.createElement("h5");
    formContent.appendChild(subheadingPayForm);

    const semesterDropdown = document.createElement("select");
    semesterDropdown.className = "semester-dropdown";

    periodNames.data.forEach(semester => {
      const option = document.createElement("option");
      option.value = semester.periodNameId;
      option.textContent = semester.name;
      semesterDropdown.appendChild(option);
    });

    semesterDropdown.value = window.currentPeriodNameId;

    formContent.appendChild(semesterDropdown)

    const customOption = document.createElement("option");
    customOption.value = "custom";
    customOption.textContent = "New Custom Period";
    semesterDropdown.appendChild(customOption);

    const startDateLabel = document.createElement("label");
    startDateLabel.textContent = "Starting Date";
    startDateLabel.style.display = "none";
    const startDateInput = document.createElement("input");
    startDateInput.type = "date";
    startDateInput.style.display = "none";

    const endDateLabel = document.createElement("label");
    endDateLabel.textContent = "Ending Date";
    endDateLabel.style.display = "none";
    const endDateInput = document.createElement("input");
    endDateInput.type = "date";
    endDateInput.style.display = "none";

    formContent.appendChild(startDateLabel);
    formContent.appendChild(startDateInput);
    formContent.appendChild(endDateLabel);
    formContent.appendChild(endDateInput);
    
    let selectedPeriodId;

    tenantInput.addEventListener("change", async () => {
      if (semesterDropdown.value != 'custom') {
        try {
          const periodTherein = await window.electron.call('getBillingPeriodBeingPaidFor', [tenantInput.value, semesterDropdown.value, semesterDropdown.options[semesterDropdown.selectedIndex].dataset.monthly ? true : false])
          if (!periodTherein.success) {
            return showToast(periodNames.error)
          } else if (periodTherein.data.length > 0) {
            selectedPeriodId = periodTherein.data[0].periodId
            return
          }

          subheadingPayForm.textContent = "Billing period data not found for selected tenant and billing period. Please add room details below";

        } catch (e) {
          showToast(e.message);
          console.log(e);
        }
      }

      const roomLabel = document.createElement("label");
      roomLabel.textContent = "Room Number";
      formContent.appendChild(roomLabel);

      const roomInput = document.createElement("input");
      roomInput.type = 'text'
      roomInput.name = "room";
      roomInput.setAttribute('list', 'rooms-datalist')
      formContent.appendChild(roomInput);

      const roomDatalist = document.createElement('datalist')
      roomDatalist.id = 'room-datalist'
      formContent.appendChild(roomDatalist)

      roomInput.addEventListener('input', async () => {
        const rooms = await window.electron.call('searchRoomByNamePart', [roomInput.value])
        if (rooms.success) {
          roomDatalist.innerHTML = ''
          for (let item of rooms.data) {
            const option = document.createElement('option')
            option.value = item.roomId
            option.textContent = item.name
            roomDatalist.appendChild(option)
          }
        } else showToast(rooms.error)
      })

      const periodTypeLabel = document.createElement("label");
      periodTypeLabel.textContent = "Single or Double";
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
      agreedPriceLabel.textContent = "Room Amount Per Month/Semester";
      formContent.appendChild(agreedPriceLabel);
  
      const agreedPriceInput = document.createElement("input");
      agreedPriceInput.type = "number";
      agreedPriceInput.name = "agreedPrice";
      formContent.appendChild(agreedPriceInput);
  
      const setDefaultAgreedPrice = async () => {
        const periodType = periodTypeDropdown.value;
        const periodNameRecord = await window.electron.call('getBillingPeriodNames', [semesterDropdown.value]);
  
        if (periodNameRecord.success && periodNameRecord.data.length > 0) {
          const billingPeriod = periodNameRecord.data[0];
          agreedPriceInput.value = periodType === "single" ? billingPeriod.costSingle : billingPeriod.costDouble;
        } else if (!periodNameRecord.success) return showToast(periodNameRecord.error);
      };
  
      periodTypeDropdown.addEventListener("change", setDefaultAgreedPrice);
  
      setDefaultAgreedPrice();
    });

    semesterDropdown.addEventListener("change", () => {
      setDefaultAgreedPrice()
      if (semesterDropdown.value === "custom") {
        startDateLabel.style.display = "";
        startDateInput.style.display = "";
        endDateLabel.style.display = "";
        endDateInput.style.display = "";
      } else {
        startDateLabel.style.display = "none";
        startDateInput.style.display = "none";
        endDateLabel.style.display = "none";
        endDateInput.style.display = "none";
      }
    })

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = "add-tenant-submit";
    submitButton.textContent = "Submit";

    submitButton.onclick = async (event) => {
      event.preventDefault();
    
      try {
        // Required field validation
        const dateInput = document.querySelector("input[name='date']").value || null;
        const amountInput = document.querySelector("input[name='amount']").value || null;
    
        if (!dateInput || !amountInput) {
          showToast('Date and Amount are required fields.');
          return;
        }
    
        let transactionData = {
          date: dateInput,
          amount: parseFloat(amountInput),
        };
    
        if (!selectedPeriodId) {
          const roomInput = document.querySelector("input[name='room']").value || null;
          const tenantInput = document.querySelector("input[name='tenants']").value || null;
          const periodTypeInput = document.querySelector("select[name='periodType']").value || null;
          const agreedPriceInput = document.querySelector("input[name='agreedPrice']").value || 0;
          const semesterDropdown = document.querySelector(".semester-dropdown");
          const periodNameIdInput = semesterDropdown.value || null;
          const startDateInput = document.querySelector("input[name='startDate']").value || null;
          const endDateInput = document.querySelector("input[name='endDate']").value || null;
    
          if (!roomInput || !tenantInput || !periodTypeInput || !periodNameIdInput) {
            showToast('Room, Tenant, Period Type, and Billing Period are required fields.');
            return;
          }
    
          const billingPeriodData = {
            ownStartingDate: startDateInput,
            ownEndDate: endDateInput,
            roomId: roomInput,
            periodType: periodTypeInput,
            agreedPrice: parseInt(agreedPriceInput) || 0,
            tenantId: tenantInput,
            periodNameId: periodNameIdInput === 'custom' ? window.currentPeriodNameId : periodNameIdInput,
          };
    
          const createBillingPeriodResponse = await window.electron.call('createBillingPeriod', [billingPeriodData]);
    
          if (!createBillingPeriodResponse.success) {
            showToast(createBillingPeriodResponse.error);
            return;
          }
    
          selectedPeriodId = createBillingPeriodResponse.data
        }
    
        transactionData.periodId = selectedPeriodId;
    
        const createTransactionResponse = await window.electron.call('createTransaction', [transactionData]);
    
        if (createTransactionResponse.success) {
          showToast('Transaction added successfully');
          closeForm();
        } else {
          showToast(createTransactionResponse.error );
        }
      } catch (error) {
        console.error(error);
        showToast(error);
      }
    };
    

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "add-tenant-submit";
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = closeForm

    formContent.appendChild(cancelBtn);
    formContent.appendChild(submitButton);
  } catch (e) {
    return showToast(e)
  }
}
