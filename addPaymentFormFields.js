import { formatDateRange } from "./getIcon.js";
import showToast from "./showToast.js";

export async function addPaymentFormFields(formContent) {
  const fields = [
    { label: "Add Transaction Date", type: "date", name: "date" },
    { label: "Received Amount", type: "number", name: "amount", placeholder: "Enter amount" }
  ];
  const contentArea = document.createElement('div')
  fields.forEach(field => {
    const label = document.createElement("label");
    label.textContent = field.label;
    contentArea.appendChild(label);

    const input = document.createElement("input");
    input.type = field.type;
    input.name = field.name;
    input.required = true
    input.placeholder = field.placeholder || "";
    contentArea.appendChild(input);
  });

  try {
    const label1 = document.createElement("label");
    label1.textContent = "Select Tenant";
    contentArea.appendChild(label1);

    const tenantInput = document.createElement("input");
    tenantInput.type = "text";
    tenantInput.name = "tenants";
    tenantInput.required = true
    tenantInput.setAttribute("list", "tenants-datalist");
    contentArea.appendChild(tenantInput);

    const tenantDatalist = document.createElement("datalist");
    tenantDatalist.id = "tenants-datalist";
    contentArea.appendChild(tenantDatalist);

    tenantInput.addEventListener("input", async () => {
      const tenants = await window.electron.call("searchTenantNameAndId", [tenantInput.value.split(' (')[0]]);
      //that split is because the option value is intertwined
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

    const labell = document.createElement("label");
    labell.textContent = "Being Payment For:";
    contentArea.appendChild(labell);

    const semesterDropdown = document.createElement("select");
    semesterDropdown.className = "semester-dropdown";
    semesterDropdown.required = true

    //first one
    const disabledOpt = document.createElement("option");
    disabledOpt.value = "";
    disabledOpt.textContent = "Select a billing period";
    disabledOpt.disabled = true;
    semesterDropdown.appendChild(disabledOpt);

    semesters.forEach(semester => {
      const option = document.createElement("option");
      option.value = semester.periodNameId;
      option.textContent = semester.name;
      semesterDropdown.appendChild(option);
    });

    semesterDropdown.value = ""

    contentArea.appendChild(semesterDropdown);

    const subheadingPayForm = document.createElement("h5");
    contentArea.appendChild(subheadingPayForm);

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

    contentArea.appendChild(startDateLabel);
    contentArea.appendChild(startDateInput);
    contentArea.appendChild(endDateLabel);
    contentArea.appendChild(endDateInput);

    tenantInput.addEventListener("change", async () => {
      Array.from(semesterDropdown.options).forEach((option) => {
        if (option.getAttribute("isPeriodId") === "true") {
          option.remove();
        }
      });

      const monthlies = await window.electron.call('getMonthliesFor', [tenantInput.value]);
      if (!monthlies.success) showToast('Error getting some billing periods');

      monthlies.data.forEach((rec) => {
        const option = document.createElement("option");
        option.value = rec.periodId;
        option.textContent = formatDateRange(rec);
        option.setAttribute('isPeriodId', rec);
        semesterDropdown.appendChild(option);
      });
    });

    const setDefaultAgreedPrice = async () => {
      const periodTypeDropdown = formContent.querySelector("select[name='periodType']");
      const agreedPriceInput = formContent.querySelector('input[name="agreedPrice"]');
      const periodType = periodTypeDropdown.value;
      const periodNameRecord = semesters.find(semester => semester.periodNameId === semesterDropdown.value);
      agreedPriceInput.value = periodType === "single" ? periodNameRecord.costSingle : periodNameRecord.costDouble;
    };

    let selectedPeriodId;
    let chosenBillingPeriod = {}

    semesterDropdown.addEventListener("change", async () => {
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

      if (!tenantInput.value) return;
      if (semesterDropdown.value != 'custom') {
        if (semesterDropdown.options[semesterDropdown.selectedIndex].dataset.isPeriodId) {
          chosenBillingPeriod = {
            ...JSON.parse(semesterDropdown.options[semesterDropdown.selectedIndex].dataset.isPeriodId)
          }
          selectedPeriodId = chosenBillingPeriod.periodId
          subheadingPayForm.textContent = 'Tenant data for selected billing period'
        } else {
          try {
             console.log('the options of datalist', tenantDatalist)
             console.log('the tenantinput value:', tenantInput.value)
             console.log('tenantInput', tenantInput)
            const selectedTenantOption = Array.from(tenantDatalist.options).find((option) => option.value === tenantInput.value)

            const periodTherein = await window.electron.call('getBillingPeriodBeingPaidFor', [selectedTenantOption.dataset.id, semesterDropdown.value])

            if (!periodTherein.success) {
              return showToast(periodNames.error);
            } else if (periodTherein.data.length > 0) {
              selectedPeriodId = periodTherein.data[0].periodId;
              chosenBillingPeriod = {...periodTherein.data[0]}
              subheadingPayForm.textContent = 'Tenant data for selected billing period'
            } else {
              subheadingPayForm.textContent = "Tenant data not found for selected billing period. Add room details below";
            }
          } catch (e) {
            showToast(e.message);
            console.log(e);
          }
        }
      }

      const roomLabel = document.createElement("label");
      roomLabel.textContent = "Room Number";
      contentArea.appendChild(roomLabel);

      const roomInput = document.createElement("input");
      roomInput.type = 'text';
      roomInput.name = "room";
      roomInput.setAttribute('list', 'room-datalist');
      contentArea.appendChild(roomInput);
      roomInput.required = true

      const roomDatalist = document.createElement('datalist');
      roomDatalist.id = 'room-datalist';
      contentArea.appendChild(roomDatalist);
      roomInput.disabled = Object.keys(chosenBillingPeriod).length ? true : false
      roomInput.value = chosenBillingPeriod['roomName'] || ''

      roomInput.addEventListener('input', async () => {
        const rooms = await window.electron.call('searchRoomByNamePart', [roomInput.value]);
        if (rooms.success) {
          console.log('going to empty datalist roominput')
          roomDatalist.innerHTML = '';
          for (let item of rooms.data) {
            const option = document.createElement('option');
            option.value = item.name;
            option.setAttribute('data-id', item.roomId);
            roomDatalist.appendChild(option);
          }
        } else showToast(rooms.error);
      });

      const periodTypeLabel = document.createElement("label");
      periodTypeLabel.textContent = "Single or Double";
      contentArea.appendChild(periodTypeLabel);

      const periodTypeDropdown = document.createElement("select");
      periodTypeDropdown.name = "periodType";
      ["single", "double"].forEach(type => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        periodTypeDropdown.appendChild(option);
      });
      contentArea.appendChild(periodTypeDropdown);
      periodTypeDropdown.disabled = Object.keys(chosenBillingPeriod).length ? true : false
      periodTypeDropdown.required = true
      periodTypeDropdown.value = chosenBillingPeriod['periodType']

      const agreedPriceLabel = document.createElement("label");
      agreedPriceLabel.textContent = "Room Amount Per Month/Semester";
      contentArea.appendChild(agreedPriceLabel);

      const agreedPriceInput = document.createElement("input");
      agreedPriceInput.type = "number";
      agreedPriceInput.name = "agreedPrice";
      contentArea.appendChild(agreedPriceInput);
      agreedPriceInput.disabled = Object.keys(chosenBillingPeriod).length ? true : false
      agreedPriceInput.required = true
      agreedPriceInput.value = chosenBillingPeriod['agreedPrice'] || ''

      periodTypeDropdown.addEventListener("change", setDefaultAgreedPrice);

    });

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = "add-tenant-submit";
    submitButton.textContent = "Submit";

    submitButton.onclick = async (event) => {
      event.preventDefault();

      try {
        const dateInput = formContent.querySelector("input[name='date']").value || null;
        const amountInput = formContent.querySelector("input[name='amount']").value || null;

        let transactionData = {
          date: dateInput,
          amount: parseInt(amountInput),
        };

        if (!selectedPeriodId) {
          const selectedRoomOption = Array.from(roomDatalist.options).find(
            (option) => option.value === roomInput.value
          );
          const roomInput = selectedRoomOption.dataset.id
          const tenantInput = selectedTenantOption.dataset.id
          const periodTypeInput = formContent.querySelector("select[name='periodType']").value
          const agreedPriceInput = formContent.querySelector("input[name='agreedPrice']").value
          const periodNameIdInput = formContent.querySelector(".semester-dropdown").value
          const startDateInput = formContent.querySelector("input[name='startDate']").value || null;
          const endDateInput = formContent.querySelector("input[name='endDate']").value || null;

          const billingPeriodData = {
            ownStartingDate: startDateInput,
            ownEndDate: endDateInput,
            roomId: roomInput,
            periodType: periodTypeInput,
            agreedPrice: parseInt(agreedPriceInput),
            tenantId: tenantInput,
            periodNameId: periodNameIdInput === 'custom' ? window.currentPeriodNameId : periodNameIdInput,
          };

          const createBillingPeriodResponse = await window.electron.call('createBillingPeriod', [billingPeriodData]);

          if (!createBillingPeriodResponse.success) {
            showToast(createBillingPeriodResponse.error);
            return;
          }
          selectedPeriodId = createBillingPeriodResponse.data;
        }

        transactionData.periodId = selectedPeriodId;

        const createTransactionResponse = await window.electron.call('createTransaction', [transactionData]);

        if (createTransactionResponse.success) {
          showToast('Transaction added successfully');
          closeForm();
        } else {
          if (!Object.keys(chosenBillingPeriod).length) {
            await window.electron.call('updateBillingPeriod', [selectedPeriodId, {deleted: 1}])
          }
          showToast(createTransactionResponse.error);
        }
      } catch (error) {
        console.error(error);
        showToast(error);
      }
    };

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "add-tenant-submit";
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = closeForm;

    formContent.appendChild(contentArea)
    formContent.appendChild(cancelBtn);
    formContent.appendChild(submitButton);
  } catch (e) {
    return showToast(e);
  }
}
