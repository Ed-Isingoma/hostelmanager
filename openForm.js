import { addPaymentFormFields } from './addPaymentFormFields.js';
import { displayTenantProfile } from './displayTenantProfile.js';
import { approveAccount, assignPeriodNameId, createLoader, deleteAccount, doTotals } from './getIcon.js';
import { showLoginPrompt } from './logins.js';
import { showBillingPeriods } from './showBillingPeriods.js';
import { miscExpenses } from './showCards.js';
import showDashboard, { updateCardNumbers } from './showDashboard.js';
import showToast from './showToast.js'
import { caller } from "./caller.js";

export default function openForm(title) {
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.onclick = closeForm;

  const form = document.createElement("div");
  form.className = "modal-form";

  const formTitle = document.createElement("h2");
  const splicedTitle = title.split("-")
  formTitle.textContent = splicedTitle[0] == 'tenant' ? splicedTitle[2] : title
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
  } else if (splicedTitle[0] === 'tenant') {
    showTenant(formContent, splicedTitle)
  } else if (title === 'Search Tenant') {
    addTenantSearch(formContent)
  }
}

async function showUserAccounts(formContent) {
  try {
    const formLoader = createLoader()
    formContent.appendChild(formLoader)
    const accounts = await caller('getAccountsDeadAndLiving');

    if (!accounts.success) {
      showToast(accounts.error);
      return;
    }
    formContent.innerHTML = ''

    const accountsListContainer = document.createElement('div');
    accountsListContainer.className = 'accounts-list';
    formContent.appendChild(accountsListContainer);

    if (accounts.data.length <= 1) {
      console.log('No accounts found.');
      const emptyMessage = document.createElement('div');
      emptyMessage.textContent = 'No accounts found.';
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.padding = '1rem';
      emptyMessage.style.color = '#888';
      accountsListContainer.appendChild(emptyMessage);
      return;
    }

    // Loop through accounts and populate the list
    accounts.data.forEach(account => {
      if (account.role === 'admin') return; // Skip admin accounts

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
      const itemLoader = createLoader()
      approveButton.onclick = async (event) => {
        accountItem.appendChild(itemLoader)
        await approveAccount(account.accountId, event, approveButton, approvalStatus);
        accountItem.removeChild(itemLoader)
      }

      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-button';
      deleteButton.textContent = 'Delete';
      deleteButton.onclick = async (event) => {
        accountItem.appendChild(itemLoader)
        await deleteAccount(account.accountId, event, accountItem);
        accountItem.removeChild(itemLoader)
      }

      // Append elements to the account item
      accountItem.appendChild(accountName);
      accountItem.appendChild(approvalStatus);
      accountItem.appendChild(approveButton);
      accountItem.appendChild(deleteButton);

      // Append account item to the list
      accountsListContainer.appendChild(accountItem);
    });
  } catch (e) {
    console.log('Error fetching accounts:', e);
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

    const subheadingTenant = document.createElement("h4");
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

    const subheadingRoom = document.createElement("h4");
    subheadingRoom.textContent = "Room Details";
    formContent.appendChild(subheadingRoom);

    const semLabel = document.createElement("label");
    semLabel.textContent = "Semester/Month";
    formContent.appendChild(semLabel);

    const semesterDropdown = document.createElement("select");
    semesterDropdown.className = "semester-dropdown";
    formContent.appendChild(semesterDropdown);
    //from global semesters
    semesters.forEach(semester => {
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
    roomInput.setAttribute('list', 'room-datalist')
    formContent.appendChild(roomInput);

    const roomDatalist = document.createElement('datalist')
    roomDatalist.id = 'room-datalist'
    formContent.appendChild(roomDatalist)
    const roomerLoader = createLoader()

    roomInput.addEventListener('input', async () => {
      const trimmedRoom = roomInput.value.trim()
      if (formContent.contains(roomerLoader)) formContent.removeChild(roomerLoader)
      if (trimmedRoom.length === 4 || trimmedRoom.length === 0) return;  //add this when you know the length of
      //  a room string, to prevent that extra last search on datalist select of the wanted room
      formContent.insertBefore(roomerLoader, roomDatalist.nextSibling)
      const rooms = await caller('searchRoomByNamePart', [trimmedRoom])
      formContent.removeChild(roomerLoader)
      if (rooms.success) {
        roomDatalist.innerHTML = ''
        for (let item of rooms.data) {
          const option = document.createElement('option')
          option.value = item.roomName
          option.setAttribute('data-id', item.roomId)
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

    periodTypeDropdown.value = "double"

    formContent.appendChild(periodTypeDropdown);

    const agreedPriceLabel = document.createElement("label");
    agreedPriceLabel.textContent = "Total Rent for this period/Semester";
    formContent.appendChild(agreedPriceLabel);

    const agreedPriceInput = document.createElement("input");
    agreedPriceInput.type = "number";
    agreedPriceInput.name = "agreedPrice";
    formContent.appendChild(agreedPriceInput);

    const setDefaultAgreedPrice = async () => {
      const periodType = periodTypeDropdown.value;
      const periodNameRecord = semesters.find(semester => semester.periodNameId == semesterDropdown.value)
      agreedPriceInput.value = periodType === "single" ? periodNameRecord?.costSingle : periodNameRecord?.costDouble;
    };

    periodTypeDropdown.addEventListener("change", setDefaultAgreedPrice);

    setDefaultAgreedPrice();

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = "add-tenant-submit";
    submitButton.textContent = "Submit";

    submitButton.onclick = async (event) => {
      event.preventDefault();
      const submLoader = createLoader()
      formContent.appendChild(submLoader)
      const tenantData = {};
      fields.forEach(field => {
        const input = formContent.querySelector(`[name="${field.name}"]`);
        tenantData[field.name] = field.name === "age" ? parseInt(input.value || 0, 10) : input.value.trim() || null;
      });

      if (!tenantData.name) {
        formContent.removeChild(submLoader)
        return showToast("Tenant name is required.");
      }

      if (semesterDropdown.value == "custom" && (!startDateInput.value || !endDateInput.value)) {
        formContent.removeChild(submLoader)
        return showToast("Custom dates both required for selected billing period")
      }

      const tenantResult = await caller('createTenant', [tenantData]);
      if (!tenantResult.success) {
        formContent.removeChild(submLoader)
        return showToast(tenantResult.error);
      }

      const tenantId = tenantResult.data[0].tenantId;

      const selectedRoomOption = Array.from(roomDatalist.options).find(
        (option) => option.value === roomInput.value
      );

      const thePeriodNameId = semesterDropdown.value == 'custom' ? assignPeriodNameId(endDateInput.value) || currentPeriodNameId : semesterDropdown.value

      const billingPeriodData = {
        ownStartingDate: semesterDropdown.value === "custom" ? startDateInput.value : null,
        ownEndDate: semesterDropdown.value === "custom" ? endDateInput.value : null,
        periodType: periodTypeDropdown.value,
        agreedPrice: parseInt(agreedPriceInput.value || 0, 10),
      };
      
      const billingResult = await caller('createBillingPeriod', [billingPeriodData, thePeriodNameId, selectedRoomOption.dataset.id, tenantId]);

      if (!billingResult.success) {
        await caller('updateTenant', [tenantId, { deleted: true }])
        fields.forEach(field => {
          const input = formContent.querySelector(`[name="${field.name}"]`);
          input.value = tenantData[field.name]
        });
        formContent.removeChild(submLoader)
        return showToast(billingResult.error);
      } else {
        showToast('New tenant added')
        closeForm()
        await doTotals()
        updateCardNumbers()
      }
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

async function addTenantSearch(formContent) {
  try {
    const searchLabel = document.createElement("label");
    searchLabel.textContent = "Type name to find tenant";
    formContent.appendChild(searchLabel);

    const tenantInput = document.createElement("input");
    tenantInput.type = "text";
    tenantInput.name = "tenants";
    tenantInput.required = true
    tenantInput.setAttribute("list", "tenants-datalist");
    formContent.appendChild(tenantInput);

    const tenantDatalist = document.createElement("datalist");
    tenantDatalist.id = "tenants-datalist";
    formContent.appendChild(tenantDatalist);
    const searchLoader = createLoader()
    tenantInput.addEventListener("input", async () => {
      if (tenantInput.value.trim().split(' (')[1] || !tenantInput.value.trim()) return
      formContent.insertBefore(searchLoader, tenantDatalist.nextSibling)
      const tenants = await caller("searchTenantNameAndId", [tenantInput.value.trim()]);
      //that split is because the option value is intertwined
      if (formContent.contains(searchLoader)) formContent.removeChild(searchLoader)
      if (tenants.success) {
        tenantDatalist.innerHTML = "";
        for (let item of tenants.data) {
          const option = document.createElement("option");
          option.value = `${item.name} (ID ${item.tenantId})`
          option.setAttribute("data-id", item.tenantId);
          tenantDatalist.appendChild(option);
        }
      } else showToast(tenants.error);
    });

    tenantInput.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        const selectedTenantOption = Array.from(tenantDatalist.options).find((option) => option.value === tenantInput.value.trim())
        if (selectedTenantOption) {
          closeForm()
          openForm(`tenant-${selectedTenantOption.dataset.id}-${selectedTenantOption.value.split(' (')[0]}`)
        }
      }
    });

    const backButton = document.createElement('button');
    backButton.className = 'modal-show-back';
    backButton.type = 'button';
    backButton.innerText = 'Back';
    backButton.onclick = (event) => {
      event.preventDefault()
      dashboardContainer.innerHTML = '';
      showDashboard()
    };

    formContent.appendChild(backButton);
  } catch (e) {
    console.log('Error fetching tenant:', e);
    showToast(e)
  }
}

async function showTenant(formContent, splicedTitle) {
  const tenLoader = createLoader()
  try {
    formContent.appendChild(tenLoader)
    const profile = await caller('getFullTenantProfile', [splicedTitle[1]])
    if (!profile.success) {
      showToast(profile.error)
      formContent.removeChild(tenLoader)
      return showDashboard()
    }
    displayTenantProfile(profile.data, formContent)
  } catch (e) {
    console.log('Error displaying tenant:', e);
    showToast(e)
  } finally {
    formContent.removeChild(tenLoader)
  }
}

function addMiscsFormFields(formContent) {
  const fields = [
    { label: "Description", type: "text", name: "description", placeholder: "Describe the expense" },
    { label: "Quantity", type: "number", name: "quantity", placeholder: "Enter quantity" },
    { label: "Amount", type: "number", name: "amount", placeholder: "Enter amount" },
    { label: "Date of payment", type: "date", name: "date" }
  ];

  fields.forEach(field => {
    const label = document.createElement("label");
    label.textContent = field.label;
    formContent.appendChild(label);
    const input = document.createElement("input");
    input.type = field.type;
    input.name = field.name;
    input.placeholder = field.placeholder || "";
    if (field.name === "date") { //suboptimal
      input.value = new Date().toISOString().split("T")[0];
    }
    formContent.appendChild(input);
  });

  const billingPeriodLabel = document.createElement("label");
  billingPeriodLabel.textContent = "Billing Period Associated";
  formContent.appendChild(billingPeriodLabel);

  const sems = document.createElement("select");
  sems.name = "billingPeriod";

  semesters.forEach(semester => {
    const option = document.createElement("option");
    option.value = semester.periodNameId;
    option.textContent = semester.name;
    sems.appendChild(option);
  });

  sems.value = selectedPeriodNameId
  formContent.appendChild(sems);

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "add-tenant-submit";
  submitButton.textContent = "Submit";

  submitButton.onclick = async (event) => {
    const miscsLoader = createLoader()
    formContent.appendChild(miscsLoader)
    event.preventDefault()
    const formData = {}
    fields.forEach(field => {
      formData[field.name] = formContent.querySelector(`input[name=${field.name}]`).value.trim();
    });
    const sem = formContent.querySelector(`select[name=billingPeriod]`).value

    try {
      const response = await caller('createMiscExpense', [formData, user.accountId, sem]);
      if (response.success) {
        showToast('Added Miscellaneous Expense');
        closeForm()
        miscExpenses()
      } else {
        formContent.removeChild(miscsLoader)
        showToast(response.error)
      }
    } catch (error) {
      console.error(error);
      formContent.removeChild(miscsLoader)
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

