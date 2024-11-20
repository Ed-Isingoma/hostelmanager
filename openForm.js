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
    if (!levels.success) {
      showToast(levels.error)
      return
    }
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

    addPaymentFormFields(formContent)

    const updateRoomOptions = async () => {
      const selectedGender = formContent.querySelector("select[name='gender']").value;
      const selectedLevel = levelDropdown.value;

      if (selectedGender && selectedLevel) {
        const rooms = await window.electron.call('getPotentialTenantRoomsByGender', [selectedGender, selectedLevel, window.selectedBillingPeriodNameId]);
        if (!rooms.success) return showToast(rooms.error)
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
      } else if (!periodNameRecord.success) return showToast(periodNameRecord.error)
    };

    periodTypeDropdown.addEventListener("change", setDefaultAgreedPrice);
    setDefaultAgreedPrice();

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = "add-tenant-submit";
    submitButton.textContent = "Submit";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "add-tenant-submit";
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = closeForm

    formContent.appendChild(cancelBtn);
    formContent.appendChild(submitButton);
  } catch (e) {
    showToast(e)
    console.log(e)
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
    { label: "Received Amount", type: "number", name: "amount", placeholder: "Enter amount" },
    { label: "Receipt number", type: "text", name: "receipt", placeholder: "Enter number" }
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
    tenantInput.setAttribute("list", "tenants-datalist"); // Link to datalist
    formContent.appendChild(tenantInput);
    
    const tenantDatalist = document.createElement("datalist");
    tenantDatalist.id = "tenants-datalist";
    formContent.appendChild(tenantDatalist);
    
    tenantInput.addEventListener("input", async () => {
      const tenants = await window.electron.call("searchTenantNameAndId", [tenantInput.value]);
      if (tenants.success) {
        tenantDatalist.innerHTML = ""; // Clear previous options
        for (let item of tenants.data) {
          const option = document.createElement("option");
          option.value = item.name; // Show tenant name as selectable option
          option.setAttribute("data-id", item.tenantId); // Attach tenant ID as custom data attribute
          tenantDatalist.appendChild(option);
        }
      }
    });    

    const labell = document.createElement("label");
    labell.textContent = "Billing Period"
    formContent.appendChild(labell);
    const periodNames = await window.electron.call('getBillingPeriodNames');
    const semesterDropdown = document.createElement("select");
    semesterDropdown.className = "semester-dropdown";

    periodNames.data.forEach(semester => {
      const option = document.createElement("option");
      option.value = semester.periodNameId;
      option.textContent = semester.name;
      semesterDropdown.appendChild(option);
    });
    formContent.appendChild(semesterDropdown)

  } catch (e) {
    return showToast(e)
  }
}

function createFilterableSelect(containerId, options) {
  const container = document.getElementById(containerId);

  // Create filter input
  const filterInput = document.createElement("input");
  filterInput.type = "text";
  filterInput.placeholder = "Type to filter...";
  filterInput.className = "filter-container";

  // Create select element
  const select = document.createElement("select");

  // Populate select element with initial options
  options.forEach(option => {
    const optElement = document.createElement("option");
    optElement.value = option;
    optElement.textContent = option;
    select.appendChild(optElement);
  });

  // Add filter functionality
  filterInput.addEventListener("input", () => {
    const filterValue = filterInput.value.toLowerCase();
    select.innerHTML = ""; // Clear existing options

    const filteredOptions = options.filter(option =>
      option.toLowerCase().startsWith(filterValue)
    );

    filteredOptions.forEach(option => {
      const optElement = document.createElement("option");
      optElement.value = option;
      optElement.textContent = option;
      select.appendChild(optElement);
    });

    if (filteredOptions.length === 0) {
      const emptyOption = document.createElement("option");
      emptyOption.textContent = "No matches";
      emptyOption.disabled = true;
      select.appendChild(emptyOption);
    }
  });

  // Append filter input and select to container
  container.appendChild(filterInput);
  container.appendChild(select);
}

// Example usage
// createFilterableSelect("select-container", ["Apple", "Banana", "Cherry", "Date"]);