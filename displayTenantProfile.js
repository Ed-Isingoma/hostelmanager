import { createLoader, formatDateForInput, formatDateRange } from "./getIcon.js";
import showToast from "./showToast.js";
import { caller } from "./caller.js";

export function displayTenantProfile(profile, formContent) {
  const tenantSection = document.createElement("div");
  tenantSection.style.border = "2px solid grey";
  tenantSection.style.padding = "10px";
  tenantSection.style.marginBottom = "20px";

  const tenantDetails = document.createElement("div");

  const genderLabel = document.createElement("label");
  genderLabel.textContent = "Gender";
  tenantDetails.appendChild(genderLabel);

  const genderDropdown = document.createElement("select");
  genderDropdown.name = "gender";
  ["male", "female"].forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    genderDropdown.appendChild(option);
  });
  genderDropdown.disabled = true
  genderDropdown.value = profile.gender

  tenantDetails.appendChild(genderDropdown);
  tenantDetails.appendChild(document.createElement("br"));

  const ageLabel = document.createElement("label");
  ageLabel.textContent = "Age";
  const ageInput = document.createElement("input");
  ageInput.type = "number"
  ageInput.value = profile.age
  ageInput.className = "age"
  ageInput.style.display = profile.age ? "" : "none"

  const courseLabel = document.createElement("label");
  courseLabel.textContent = "Course";
  const courseInput = document.createElement("input");
  courseInput.value = profile.course
  courseInput.className = "course"
  courseInput.style.display = profile.course ? "" : "none"

  const ownContactLabel = document.createElement("label");
  ownContactLabel.textContent = "Contact";
  const ownContactInput = document.createElement("input");
  ownContactInput.value = profile.ownContact
  ownContactInput.className = "ownContact"
  ownContactInput.style.display = profile.ownContact ? "" : "none"

  const kinLabel = document.createElement("label");
  kinLabel.textContent = "Next of Kin";
  const kinInput = document.createElement("input");
  kinInput.value = profile.nextOfKin
  kinInput.className = "nextOfKin"
  kinInput.style.display = profile.nextOfKin ? "" : "none"

  const kinContactLabel = document.createElement("label")
  kinContactLabel.textContent = "Next of Kin Contact"
  const kinContactInput = document.createElement("input")
  kinContactInput.className = "kinContact"
  kinContactInput.value = profile.kinContact
  kinContactInput.style.display = profile.kinContact ? "" : "none"

  const themInputs = [ageLabel, ageInput, courseLabel, courseInput, ownContactLabel,
    ownContactInput, kinLabel, kinInput, kinContactLabel, kinContactInput]
  themInputs.forEach(inp => {
    inp.disabled = true
    inp.style.margin = "10px 0";
    tenantDetails.appendChild(inp)
    if (themInputs.indexOf(inp) % 2 == 0) {
      inp.style.display = themInputs[themInputs.indexOf(inp) + 1].style.display
    } else {
      const theBreak = document.createElement("br")
      tenantDetails.appendChild(theBreak);
      theBreak.style.display = inp.style.display
    }
  })

  const editTenantButton = document.createElement("button");
  editTenantButton.textContent = "Edit Tenant Details";
  editTenantButton.onclick = (event) => {
    event.preventDefault()
    Array.from(tenantDetails.children).forEach(child => {
      child.style.display = ""
      if ('disabled' in child) child.disabled = false;
    })
    editTenantButton.style.display = "none";
    saveTenantButton.style.display = "inline";
    deleteButton1.style.display = "inline";
  };

  const saveTenantButton = document.createElement("button");
  saveTenantButton.textContent = "Save";
  saveTenantButton.style.display = "none";
  saveTenantButton.style.marginRight = "8px"
  saveTenantButton.onclick = async (event) => {
    event.preventDefault()
    const inputs = [...tenantDetails.querySelectorAll("input"), genderDropdown];

    const gender = tenantDetails.querySelector('select[name="gender"]').value
    const age = parseInt(tenantDetails.querySelector('.age').value) || 0
    const course = tenantDetails.querySelector('.course').value.trim() || null
    const ownContact = tenantDetails.querySelector('.ownContact').value.trim() || null
    const nextOfKin = tenantDetails.querySelector('.nextOfKin').value.trim() || null
    const kinContact = tenantDetails.querySelector('.kinContact').value.trim() || null

    const payload = {
      gender, age, course, ownContact, nextOfKin, kinContact
    }

    const saveLoader = createLoader()
    tenantSection.appendChild(saveLoader)
    try {
      const response = await caller('updateTenant', [profile.tenantId, payload])
      if (!response.success) showToast(response.error)
      inputs.forEach(input => (input.disabled = true));
      showToast('Tenant Data Updated')
    } catch (e) {
      return showToast(e)
    } finally {
      tenantSection.removeChild(saveLoader)
    }

    editTenantButton.style.display = "inline";
    saveTenantButton.style.display = "none";
    deleteButton1.style.display = "none"
  };

  tenantSection.appendChild(tenantDetails);
  tenantSection.appendChild(editTenantButton);
  tenantSection.appendChild(saveTenantButton);
  formContent.appendChild(tenantSection);

  const deleteButton1 = document.createElement("button");
  deleteButton1.textContent = "Delete";
  deleteButton1.style.display = "none";
  deleteButton1.style.marginLeft = "8px"
  const confirmDeleteCheckbox1 = document.createElement("input");
  confirmDeleteCheckbox1.type = "checkbox";
  confirmDeleteCheckbox1.style.display = "none";
  const confirmDeleteLabel1 = document.createElement("label");
  confirmDeleteLabel1.textContent = "I understand the loss of this data";
  confirmDeleteLabel1.style.display = "none";

  deleteButton1.onclick = async (event) => {
    event.preventDefault()
    const delLoader = createLoader()
    if (deleteButton1.textContent === "Confirm Delete") {
      try {
        tenantSection.appendChild(delLoader)
        const resp = await caller('updateTenant', [profile.tenantId, { deleted: 1 }])
        if (!resp.success) return showToast(resp.error)
        showToast('Tenant Deleted')
        closeForm()
      } catch (e) {
        return showToast(e)
      } finally {
        tenantSection.removeChild(delLoader)
      }
    } else {
      deleteButton1.style.display = "none";
      confirmDeleteCheckbox1.style.display = "inline";
      confirmDeleteLabel1.style.display = "inline";
    }
  };

  confirmDeleteCheckbox1.onclick = (event) => {
    event.preventDefault()
    if (confirmDeleteCheckbox1.checked) {
      deleteButton1.textContent = "Confirm Delete";
      deleteButton1.style.display = "inline";
      confirmDeleteCheckbox1.style.display = "none";
      confirmDeleteLabel1.style.display = "none";
    }
  };

  tenantSection.appendChild(deleteButton1);
  tenantSection.appendChild(confirmDeleteCheckbox1);
  tenantSection.appendChild(confirmDeleteLabel1);

  profile.billingPeriods.forEach((period) => {
    const theContent = handleBillingPeriod(period)
    formContent.appendChild(theContent)
  })

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "add-tenant-submit";
  cancelBtn.textContent = "Back";
  cancelBtn.onclick = (event) => {
    event.preventDefault()
    closeForm()
  }
  formContent.appendChild(cancelBtn)
}

function handleBillingPeriod(period) {
  const periodSection = document.createElement("div");
  periodSection.style.border = "2px solid grey";
  periodSection.style.padding = "10px";
  periodSection.style.marginBottom = "20px";

  const periodLabel = document.createElement("label");
  periodLabel.textContent = "Billing Period Name: ";
  periodLabel.style.marginRight = "10px";

  const periodSelect = document.createElement("select");
  periodSelect.id = `period-${period.periodId}`
  periodSelect.disabled = true;
  periodSelect.style.marginBottom = "10px";

  semesters.forEach(semester => {
    const option = document.createElement("option");
    option.value = semester.periodNameId;
    option.textContent = semester.name;
    periodSelect.appendChild(option);
  });

  if (period.ownStartingDate) {
    const customOption = document.createElement("option");
    customOption.value = "custom"
    customOption.textContent = formatDateRange(period)
    periodSelect.appendChild(customOption);
  }

  periodSelect.value = period.ownStartingDate ? "custom" : period.periodNameId

  periodSection.appendChild(periodLabel);
  periodSection.appendChild(periodSelect);
  periodSection.appendChild(document.createElement("br"))

  const roomLabel = document.createElement("label");
  roomLabel.textContent = `Room Name: `;
  const roomInput = document.createElement("input");
  roomInput.type = "text";
  roomInput.value = period.room.roomName;
  roomInput.id = `room-input-${period.periodId}`
  roomInput.disabled = true;
  roomInput.setAttribute('list', `room-datalist-${period.periodId}`);

  const roomDatalist = document.createElement('datalist');
  roomDatalist.id = `room-datalist-${period.periodId}`;

  periodSection.appendChild(roomLabel);
  periodSection.appendChild(roomInput);
  periodSection.appendChild(roomDatalist);
  periodSection.appendChild(document.createElement("br"))

  const roomLoader = createLoader()
  roomInput.addEventListener('input', async () => {
    const trimmedRoom = roomInput.value.trim()
    if (trimmedRoom.length === 4 || trimmedRoom.length === 0) return;  //add this when you know the length
    // of a room string, to prevent that extra last search on datalist select of the wanted room
    periodSection.insertBefore(roomLoader, roomDatalist.nextSibling)
    const rooms = await caller('searchRoomByNamePart', [trimmedRoom]);
    periodSection.removeChild(roomLoader)
    if (rooms.success) {
      const roomDatalist = document.getElementById(`room-datalist-${period.periodId}`)
      roomDatalist.innerHTML = '';
      for (let item of rooms.data) {
        const option = document.createElement('option');
        option.value = item.roomName;
        option.setAttribute('data-id', item.roomId);
        roomDatalist.appendChild(option);
      }
    } else showToast(rooms.error);
  });

  const periodTypeLabel = document.createElement("label");
  periodTypeLabel.textContent = "Single or Double";
  periodSection.appendChild(periodTypeLabel);

  const periodTypeDropdown = document.createElement("select");
  periodTypeDropdown.name = "periodType";
  periodTypeDropdown.id = `periodtype-${period.periodId}`;
  ["single", "double"].forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    periodTypeDropdown.appendChild(option);
  });
  periodTypeDropdown.disabled = true
  periodTypeDropdown.value = period.periodType

  periodSection.appendChild(periodTypeDropdown);
  periodSection.appendChild(document.createElement("br"))

  const priceLabel = document.createElement("label");
  priceLabel.textContent = "Full Hostel Fee: ";
  priceLabel.style.marginRight = "10px";

  const priceInput = document.createElement("input");
  priceInput.type = "number";
  priceInput.value = period.agreedPrice;
  priceInput.id = `price-input-${period.periodId}`
  priceInput.disabled = true;
  priceInput.style.marginBottom = "10px";

  periodSection.appendChild(priceLabel);
  periodSection.appendChild(priceInput);
  periodSection.appendChild(document.createElement("br"))

  const pendingLabel = document.createElement("label");
  pendingLabel.textContent = "Total Amount Unpaid: ";
  pendingLabel.style.marginRight = "10px";

  const pendingInput = document.createElement("input");
  pendingInput.type = "number";
  pendingInput.value = period.agreedPrice - period.transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  pendingInput.disabled = true;
  pendingInput.style.marginBottom = "10px";

  periodSection.appendChild(pendingLabel);
  periodSection.appendChild(pendingInput);
  periodSection.appendChild(document.createElement("br"))

  const startLabel = document.createElement("label");
  startLabel.textContent = "Starting Date: (In case of monthly tenant)";
  startLabel.style.marginRight = "10px";
  startLabel.style.display = period.ownStartingDate ? "inline" : "none"

  const startInput = document.createElement("input");
  startInput.type = "date";
  startInput.value = formatDateForInput(period.ownStartingDate);
  startInput.id = `start-input-${period.periodId}`
  startInput.disabled = true;
  startInput.style.marginBottom = "10px";
  startInput.style.display = period.ownStartingDate ? "inline" : "none"

  periodSection.appendChild(startLabel);
  periodSection.appendChild(startInput);
  periodSection.appendChild(document.createElement("br"))

  const endLabel = document.createElement("label");
  endLabel.textContent = "End Date: (In case of monthly tenant)";
  endLabel.style.marginRight = "10px";
  endLabel.style.display = period.ownEndDate ? "inline" : "none"

  const endInput = document.createElement("input");
  endInput.type = "date";
  endInput.value = formatDateForInput(period.ownEndDate);
  endInput.id = `end-input-${period.periodId}`
  endInput.disabled = true;
  endInput.style.marginBottom = "10px";
  endInput.style.display = period.ownEndDate ? "inline" : "none"

  periodSection.appendChild(endLabel);
  periodSection.appendChild(endInput);
  periodSection.appendChild(document.createElement("br"))

  const demandLabel = document.createElement("label");
  demandLabel.textContent = "Demand Notice Date: ";
  demandLabel.style.marginRight = "10px";

  const demandInput = document.createElement("input");
  demandInput.type = "date";
  demandInput.id = `demand-input-${period.periodId}`
  demandInput.value = formatDateForInput(period.demandNoticeDate)
  demandInput.disabled = true;
  demandInput.style.marginBottom = "10px";

  periodSection.appendChild(demandLabel);
  periodSection.appendChild(demandInput);
  periodSection.appendChild(document.createElement("br"));

  const editPeriodButton = document.createElement("button");
  editPeriodButton.textContent = "Edit Billing Period";
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.style.display = "none";
  deleteButton.style.marginLeft = "8px"
  const savePeriodButton = document.createElement("button");
  savePeriodButton.textContent = "Save";
  savePeriodButton.style.display = "none";
  savePeriodButton.style.marginRight = "8px"
  const confirmDeleteCheckbox = document.createElement("input");
  confirmDeleteCheckbox.type = "checkbox";
  confirmDeleteCheckbox.style.display = "none";
  const confirmDeleteLabel = document.createElement("label");
  confirmDeleteLabel.textContent = "I understand the loss of this data";
  confirmDeleteLabel.style.display = "none";

  editPeriodButton.onclick = (event) => {
    event.preventDefault()
    const inputs = [periodSelect, roomInput, periodTypeDropdown, priceInput, startInput, endInput, demandInput]
    inputs.forEach(input => (input.disabled = !input.disabled));
    const hiddens = [startLabel, startInput, endLabel, endInput]
    hiddens.forEach((hidden) => hidden.style.display = "inline")
    editPeriodButton.style.display = inputs[0].disabled ? "inline" : "none";
    savePeriodButton.style.display = inputs[0].disabled ? "none" : "inline";
    deleteButton.style.display = inputs[0].disabled ? "none" : "inline";
  };

  deleteButton.onclick = async (event) => {
    event.preventDefault()
    if (deleteButton.textContent === "Confirm Delete") {
      const delLoader = createLoader()
      try {
        periodSection.insertBefore(delLoader, deleteButton.nextSibling)
        const resp = await caller('updateBillingPeriod', [period.periodId, { deleted: true }])
        if (!resp.success) return showToast(resp.error)
        showToast('Billing Period Deleted')
        periodSection.remove()
      } catch (e) {
        periodSection.removeChild(delLoader)
        return showToast(e)
      } //no 'finally' because this periodsection removes itself
    } else {
      deleteButton.style.display = "none";
      confirmDeleteCheckbox.style.display = "inline";
      confirmDeleteLabel.style.display = "inline";
    }
  };

  confirmDeleteCheckbox.onclick = (event) => {
    event.preventDefault()
    if (confirmDeleteCheckbox.checked) {
      deleteButton.textContent = "Confirm Delete";
      deleteButton.style.display = "inline";
      confirmDeleteCheckbox.style.display = "none";
      confirmDeleteLabel.style.display = "none";
    }
  };

  savePeriodButton.onclick = async (event) => {
    event.preventDefault()

    const inputs = [periodSelect, roomInput, periodTypeDropdown, priceInput, startInput, endInput, demandInput]

    const realInputs = [document.querySelector(`#period-${period.periodId}`).value, document.querySelector(`#room-input-${period.periodId}`).value, document.querySelector(`#periodtype-${period.periodId}`).value, document.querySelector(`#price-input-${period.periodId}`).value, document.querySelector(`#start-input-${period.periodId}`).value, document.querySelector(`#end-input-${period.periodId}`).value, document.querySelector(`#demand-input-${period.periodId}`).value]
    //refer the above to the inputs array

    const selectedRoomOption = Array.from(document.querySelector(`#room-datalist-${period.periodId}`).options).find((option) => option.value === realInputs[1])

    const hiddens = [startLabel, startInput, endLabel, endInput]
    if (!realInputs[4] && !realInputs[5]) {
      hiddens.forEach((hidden) => hidden.style.display = "none")
    }
    if ((realInputs[4] && !realInputs[5]) || (realInputs[5] && !realInputs[4])) {
      return showToast("Starting Date and End Date for Monthly must be both null or both set")
    }

    const payload = {
      ...(realInputs[0] != 'custom' && { periodNameId: realInputs[0] }),
      ...(selectedRoomOption && { roomId: selectedRoomOption.getAttribute('data-id') }),
      periodType: realInputs[2],
      agreedPrice: realInputs[3],
      ownStartingDate: realInputs[4] || null,
      ownEndDate: realInputs[5] || null,
      demandNoticeDate: realInputs[6] || null
    }
    const saveLoader = createLoader()
    try {
      periodSection.insertBefore(saveLoader, deleteButton.nextSibling)
      const response = await caller('updateBillingPeriod', [period.periodId, payload])
      if (!response.success) return showToast(response.error)

      inputs.forEach(input => (input.disabled = true));
      showToast('Billing Period Updated')
    } catch (e) {
      return showToast(e)
    } finally {
      periodSection.removeChild(saveLoader)
    }
    editPeriodButton.style.display = "inline";
    savePeriodButton.style.display = "none";
    deleteButton.style.display = "none";
  };

  periodSection.appendChild(editPeriodButton);
  periodSection.appendChild(savePeriodButton);
  periodSection.appendChild(deleteButton);
  periodSection.appendChild(confirmDeleteCheckbox);
  periodSection.appendChild(confirmDeleteLabel);

  // Transactions
  const transactionsHeader = document.createElement("h4");
  transactionsHeader.textContent = "Transactions";
  periodSection.appendChild(transactionsHeader);

  period.transactions.forEach(transaction => {
    const transactionDiv = document.createElement("div");
    transactionDiv.style.borderTop = "1px solid black";
    transactionDiv.style.paddingTop = "5px";

    const label1 = document.createElement("label");
    label1.textContent = "Amount"
    const input1 = document.createElement("input");
    input1.type = "number"
    input1.value = transaction.amount
    input1.disabled = true

    transactionDiv.appendChild(label1);
    transactionDiv.appendChild(input1)
    transactionDiv.appendChild(document.createElement("br"))

    const label2 = document.createElement("label");
    label2.textContent = "Date of payment"
    const input2 = document.createElement("input");
    input2.type = "date"
    input2.value = formatDateForInput(transaction.date)
    input2.disabled = true

    transactionDiv.appendChild(label2)
    transactionDiv.appendChild(input2)
    transactionDiv.appendChild(document.createElement("br"));

    periodSection.appendChild(transactionDiv);
  });

  return periodSection
};