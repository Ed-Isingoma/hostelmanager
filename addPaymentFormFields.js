import { assignPeriodNameId, createLoader, doTotals, formatDateRange } from "./getIcon.js";
import { updateCardNumbers } from "./showDashboard.js";
import showToast from "./showToast.js";
import { caller } from "./caller.js";

export async function addPaymentFormFields(formContent) {
  const fields = [
    { label: "Add Transaction Date", type: "date", name: "date" },
    { label: "Received Amount", type: "number", name: "amount", placeholder: "Enter amount" }
  ];
  const billingsLoader = createLoader()
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

    const searchLoader = createLoader()
    tenantInput.addEventListener("input", async () => {
      if (!tenantInput.value) return
      if (tenantInput.value.split(' (ID')[1]) {
        if (contentArea.contains(billingsLoader)) contentArea.removeChild(billingsLoader)
        return readyToBill()
      }
      contentArea.insertBefore(searchLoader, tenantDatalist.nextSibling)
      const tenants = await caller("searchTenantNameAndId", [tenantInput.value]);
      //that split is because the option value is intertwined
      if (contentArea.contains(searchLoader)) contentArea.removeChild(searchLoader)
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

    semesters.forEach(semester => {
      const option = document.createElement("option");
      option.value = semester.periodNameId;
      option.textContent = semester.name;
      semesterDropdown.appendChild(option);
    });

    semesterDropdown.value = currentPeriodNameId

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
    startDateInput.name = "startDate"
    startDateInput.style.display = "none";

    const endDateLabel = document.createElement("label");
    endDateLabel.textContent = "Ending Date";
    endDateLabel.style.display = "none";
    const endDateInput = document.createElement("input");
    endDateInput.type = "date";
    endDateInput.name = "endDate"
    endDateInput.style.display = "none";

    contentArea.appendChild(startDateLabel);
    contentArea.appendChild(startDateInput);
    contentArea.appendChild(endDateLabel);
    contentArea.appendChild(endDateInput);
    const contentLowerArea = document.createElement('div')
    contentArea.appendChild(contentLowerArea)

    const setDefaultAgreedPrice = async () => {
      const periodTypeDropdown = formContent.querySelector("select[name='periodType']");
      const agreedPriceInput = formContent.querySelector('input[name="agreedPrice"]');
      const periodType = periodTypeDropdown.value;
      const periodNameRecord = semesters.find(semester => semester.periodNameId == semesterDropdown.value);
      agreedPriceInput.value = periodNameRecord ? (periodType === "single" ? periodNameRecord.costSingle : periodNameRecord.costDouble) : 0;
    };

    let selectedPeriodId;
    let chosenBillingPeriod = {}

    //these above and below go together if youre shifting them
    const billingDataRefresh = async () => {
      contentArea.insertBefore(billingsLoader, subheadingPayForm)
      if (!semesterDropdown.value) return
      contentLowerArea.innerHTML = ''
      selectedPeriodId = null
      chosenBillingPeriod = {}

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
        if (semesterDropdown.options[semesterDropdown.selectedIndex].getAttribute("isperiodid")) {
          chosenBillingPeriod = {
            ...JSON.parse(semesterDropdown.options[semesterDropdown.selectedIndex].getAttribute("isperiodid"))
          }
          selectedPeriodId = chosenBillingPeriod.periodId
          contentArea.removeChild(billingsLoader)
          subheadingPayForm.textContent = 'Tenant data for selected billing period'
        } else {
          try {
            const selectedTenantOption = Array.from(tenantDatalist.options).find((option) => option.value === tenantInput.value)
            if (!selectedTenantOption) return
            const periodTherein = await caller('getBillingPeriodBeingPaidFor', [selectedTenantOption.dataset.id, semesterDropdown.value])

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
          } finally {
            contentArea.removeChild(billingsLoader)
          }
        }
      } else {
        contentArea.removeChild(billingsLoader)
      }

      const roomLabel = document.createElement("label");
      roomLabel.textContent = "Room Number";
      contentLowerArea.appendChild(roomLabel);

      const roomInput = document.createElement("input");
      roomInput.type = 'text';
      roomInput.name = "room";
      roomInput.setAttribute('list', 'room-datalist');
      contentLowerArea.appendChild(roomInput);
      roomInput.required = true

      const roomDatalist = document.createElement('datalist');
      roomDatalist.id = 'room-datalist';
      contentLowerArea.appendChild(roomDatalist);
      roomInput.disabled = Object.keys(chosenBillingPeriod).length ? true : false
      roomInput.value = chosenBillingPeriod['roomName'] || ''

      roomInput.addEventListener('input', async () => {
        if (roomInput.value.length === 4 || roomInput.value.length === 0) return;  //add this when you know the length 
        // of a room string, to prevent that extra last search on datalist select of the wanted room
        const rooms = await caller('searchRoomByNamePart', [roomInput.value]);
        if (rooms.success) {
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
      contentLowerArea.appendChild(periodTypeLabel);

      const periodTypeDropdown = document.createElement("select");
      periodTypeDropdown.name = "periodType";
      ["single", "double"].forEach(type => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        periodTypeDropdown.appendChild(option);
      });
      contentLowerArea.appendChild(periodTypeDropdown);
      periodTypeDropdown.disabled = Object.keys(chosenBillingPeriod).length ? true : false
      periodTypeDropdown.required = true
      periodTypeDropdown.value = chosenBillingPeriod['periodType'] || "double"

      const agreedPriceLabel = document.createElement("label");
      agreedPriceLabel.textContent = "Total Rent for this period";
      contentLowerArea.appendChild(agreedPriceLabel);

      const agreedPriceInput = document.createElement("input");
      agreedPriceInput.type = "number";
      agreedPriceInput.name = "agreedPrice";
      contentLowerArea.appendChild(agreedPriceInput);
      agreedPriceInput.disabled = Object.keys(chosenBillingPeriod).length ? true : false
      agreedPriceInput.required = true
      agreedPriceInput.value = chosenBillingPeriod['agreedPrice'] || ''

      if (!chosenBillingPeriod['periodType']) setDefaultAgreedPrice()
      periodTypeDropdown.addEventListener("change", setDefaultAgreedPrice);

    }

    semesterDropdown.addEventListener("change", billingDataRefresh);

    const readyToBill = async() => {
      Array.from(semesterDropdown.options).forEach((option) => {
        if (option.getAttribute("isperiodid")) option.remove();
      });

      const selectedTenantOption = Array.from(tenantDatalist.options).find((option) => option.value === tenantInput.value)
      if (!selectedTenantOption) return

      const monthliesLoader = createLoader()
      contentArea.insertBefore(monthliesLoader, subheadingPayForm)
      const monthlies = await caller('getMonthliesFor', [selectedTenantOption.dataset.id]);
      contentArea.removeChild(monthliesLoader)
      if (!monthlies.success) showToast('Error getting some billing periods');

      monthlies.data.forEach((rec) => {
        const option = document.createElement("option");
        option.value = rec.periodId;
        option.textContent = formatDateRange(rec);
        option.setAttribute('isperiodid', JSON.stringify(rec));
        semesterDropdown.appendChild(option);
      });

      if(semesterDropdown.value) {
        billingDataRefresh()
      }
    }

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = "add-tenant-submit";
    submitButton.textContent = "Submit";

    submitButton.onclick = async (event) => {
      event.preventDefault();
      const payLoader = createLoader()
      formContent.appendChild(payLoader)
      try {
        const dateInput = formContent.querySelector("input[name='date']").value;
        const amountInput = formContent.querySelector("input[name='amount']").value;

        if (!dateInput || !amountInput) return showToast('Please fill both date and amount fields')

        let transactionData = {
          date: dateInput,
          amount: parseInt(amountInput),
        };

        if (!selectedPeriodId) {
          const selectedRoomOption = Array.from(formContent.querySelector('#room-datalist').options).find(
            (option) => option.value === formContent.querySelector("input[name='room']").value
          );
          const selectedTenantOption = Array.from(tenantDatalist.options).find((option) => option.value === tenantInput.value)

          const periodTypeInput = formContent.querySelector("select[name='periodType']").value
          const agreedPriceInput = formContent.querySelector("input[name='agreedPrice']").value
          const periodNameIdInput = formContent.querySelector(".semester-dropdown").value
          const startDateInput = formContent.querySelector("input[name='startDate']").value || null;
          const endDateInput = formContent.querySelector("input[name='endDate']").value || null;
          const theBillingPeriodName = periodNameIdInput === 'custom' ? assignPeriodNameId(endDateInput) || window.currentPeriodNameId : periodNameIdInput

          const billingPeriodData = {
            ownStartingDate: startDateInput,
            ownEndDate: endDateInput,
            periodType: periodTypeInput,
            agreedPrice: parseInt(agreedPriceInput)
          };

          const createBillingPeriodResponse = await caller('createBillingPeriod', [billingPeriodData, theBillingPeriodName, selectedRoomOption.dataset.id, selectedTenantOption.dataset.id]);

          if (!createBillingPeriodResponse.success) {
            showToast(createBillingPeriodResponse.error);
            return;
          }
          selectedPeriodId = createBillingPeriodResponse.data;
        }

        const transResp = await caller('createTransaction', [transactionData, selectedPeriodId]);

        if (transResp.success) {
          showToast('Transaction added successfully');

          // const receipt = await caller('sendReceipt', [transResp.data])
          // if (!receipt.success) showToast(receipt.error)
          
          await doTotals()
          updateCardNumbers()
          closeForm();
        } else {
          if (!Object.keys(chosenBillingPeriod).length) {
            await caller('updateBillingPeriod', [selectedPeriodId, {deleted: true}])
            billingDataRefresh()
          }
          showToast(transResp.error);
        }

      } catch (error) {
        console.error(error);
        showToast(error);
      } finally {
        formContent.removeChild(payLoader)
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

