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
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "Close";
  closeButton.onclick = closeForm;
  formContent.appendChild(closeButton);

  form.appendChild(formContent);
  document.body.appendChild(overlay);
  document.body.appendChild(form);
}

async function showUserAccounts(formContent) {
  try {
    const accounts = await window.electron.call('getAccountsDeadAndLiving');
    console.log('these are the accounts:', accounts);

    const accountsListContainer = document.createElement('div');
    accountsListContainer.className = 'accounts-list';
    accounts.data.forEach(account => {
      const accountItem = document.createElement('div');
      accountItem.className = 'account-item';

      const accountName = document.createElement('span');
      accountName.className = 'account-name';
      accountName.textContent = `Username: ${account.username}`;

      const approvalStatus = document.createElement('span');
      approvalStatus.className = 'approval-status';
      approvalStatus.textContent = `Approved: ${account.approved ? 'Yes' : 'No'}`;

      const editButton = document.createElement('button');
      editButton.className = 'edit-button';
      editButton.textContent = 'Edit';
      editButton.onclick = () => editAccount(account.accountId);

      const approveButton = document.createElement('button');
      approveButton.className = 'approve-button';
      approveButton.textContent = 'Approve';
      approveButton.disabled = account.approved; 
      approveButton.onclick = () => approveAccount(account.accountId);

      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-button';
      deleteButton.textContent = 'Delete';
      deleteButton.onclick = () => deleteAccount(account.accountId);

      accountItem.appendChild(accountName);
      accountItem.appendChild(approvalStatus);
      accountItem.appendChild(editButton);
      accountItem.appendChild(approveButton);
      accountItem.appendChild(deleteButton);

      accountsListContainer.appendChild(accountItem);
    });

    // Append the accounts list container to formContent
    formContent.appendChild(accountsListContainer);
  } catch (e) {
    console.log('Error fetching accounts:', e);
  }
}

function editAccount(accountId) {
  console.log(`Editing account with ID: ${accountId}`);
}

function approveAccount(accountId) {
  console.log(`Approving account with ID: ${accountId}`);
}

function deleteAccount(accountId) {
  console.log(`Deleting account with ID: ${accountId}`);
}

function addTenantFormFields(formContent) {
  const fields = [
    { label: "Tenant Name", type: "text", name: "tenantName", placeholder: "Enter tenant name" },
    { label: "Gender", type: "select", name: "gender", options: ["Male", "Female"] },
    { label: "Age", type: "number", name: "age", placeholder: "Enter age" },
    { label: "Course", type: "text", name: "course", placeholder: "Enter course" },
    { label: "Contact", type: "tel", name: "contact", placeholder: "Enter contact" },
    { label: "Next of Kin", type: "text", name: "nextOfKin", placeholder: "Enter next of kin" },
    { label: "Kin's Contact", type: "tel", name: "kinContact", placeholder: "Enter kin's contact" }
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