import showDashboard from "./showDashboard.js";
import showToast from "./showToast.js";
import { caller } from "./caller.js";
import { createLoader, formatDateForInput, loadWholeScreen } from "./getIcon.js";

export async function showBillingPeriods() {
  try {
    loadWholeScreen()
    const overl = document.querySelector(".whiteover")

    const periodNames = await caller('getBillingPeriodNames');
    if (!periodNames.success) {
      dashboardContainer.removeChild(overl)
      console.log("done removing child")
      return showToast(periodNames.error);
    }

    const tableDiv = document.createElement('div')
    tableDiv.style.maxHeight = "calc(100vh - 160px)"
    tableDiv.style.overflowY = "auto"

    const table = document.createElement('table');
    table.className = 'modal-show-table';
    table.style.marginTop = "20px" //specifically for this table

    const headerRow = document.createElement('tr');
    headerRow.style.position = "sticky"
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
      table.appendChild(noDataRow);
    } else {
      periodNames.data.forEach(period => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td><input type="text" value="${period.name}"disabled class="plain-input" /></td>
            <td><input type="date" value="${formatDateForInput(period.startingDate)}"disabled class="plain-input" /></td>
            <td><input type="date" value="${formatDateForInput(period.endDate)}"disabled class="plain-input" /></td>
            <td><input type="number" value="${period.costSingle}"disabled class="plain-input" /></td>
            <td><input type="number" value="${period.costDouble}"disabled class="plain-input" /></td>
            <td><i class="fas fa-edit edit-icon" style="cursor: pointer;"></i></td>
            <td><i class="fas fa-trash delete-icon" style="cursor: pointer;"></i></td>
        `;
        table.appendChild(row);

        const editIcon = row.querySelector('.edit-icon');
        editIcon.onclick = () => toggleEdit(period.periodNameId, editIcon);

        const deleteIcon = row.querySelector('.delete-icon');
        deleteIcon.addEventListener('click',async () => {
          const delLoader = createLoader()
          table.parentNode.insertBefore(delLoader, table.nextSibling)
          await deleteRow(period.periodNameId, row)
          table.parentNode.removeChild(delLoader)
        });
      });
    }

    const backButton = document.createElement('button');
    backButton.className = 'modal-show-back';
    backButton.innerText = 'Back';
    backButton.onclick = () => {
      dashboardContainer.innerHTML = '';
      showDashboard();
    };

    const addButton = document.createElement("button");
    addButton.className = "table-add-button";
    addButton.textContent = 'Add Billing Period';
    addButton.onclick = () => addBillingPeriodRow(table);

    dashboardContainer.innerHTML = ''
    tableDiv.appendChild(table);
    dashboardContainer.appendChild(tableDiv)
    dashboardContainer.appendChild(addButton);
    dashboardContainer.appendChild(backButton);
  } catch (e) {
    console.log('Error fetching accounts:', e);
    showToast(e);
  }
}

export async function addBillingPeriodRow(table) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input type="text" placeholder="Enter period name" /></td>
    <td><input type="date" placeholder="Enter starting date" /></td>
    <td><input type="date" placeholder="Enter end name" /></td>
    <td><input type="number" placeholder="Enter amount" /></td>
    <td><input type="number" placeholder="Enter amount" /></td>
    <td><i class="fas fa-save edit-icon" style="cursor: pointer;" class="edit-icon"></i></td>
    <td><i class="fas fa-trash delete-icon" style="cursor: pointer;"></i></td>
  `;
  table.appendChild(row);

  const editIcon = row.querySelector('.edit-icon');
  editIcon.onclick = async () => {
    const adderLoader = createLoader()
    table.parentNode.insertBefore(adderLoader, table.nextSibling)
    await saveNewRow(row);
    table.parentNode.removeChild(adderLoader)
  }

  const deleteIcon = row.querySelector('.delete-icon');
  deleteIcon.addEventListener('click', () => row.remove());
}

export async function saveNewRow(row) {
  const inputs = row.querySelectorAll('input');
  console.log('the inputs:', inputs);
  const newData = {
    name: inputs[0].value.trim(),
    startingDate: inputs[1].value,
    endDate: inputs[2].value,
    costSingle: parseFloat(inputs[3].value),
    costDouble: parseFloat(inputs[4].value)
  };

  try {
    const saving = await caller('createBillingPeriodName', [newData]);
    if (saving.success) {
      showToast('Billing period created');

      inputs.forEach(input => {
        input.disabled = true
        input.classlist.add('plain-input')
      });

      const editIcon = row.querySelector('.edit-icon');
      if (editIcon) {
        editIcon.className = 'fas fa-edit edit-icon';

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

export function toggleEdit(periodId, editIcon) {
  const row = editIcon.closest('tr');
  const inputs = row.querySelectorAll('input');

  // Toggle inputs between editable and read-only
  inputs.forEach(input => input.disabled = !input.disabled);

  if (!inputs[0].disabled) {
    editIcon.className = 'fas fa-save edit-icon';

    editIcon.onclick = async () => {
      const editLoader = createLoader()
      row.parentNode.parentNode.insertBefore(editLoader, row.parentNode.nextSibling)
      await saveRow(periodId, row);
      row.parentNode.parentNode.removeChild(editLoader)
    }
  } else {
    editIcon.className = 'fas fa-edit edit-icon';

    // Reset onclick to call toggleEdit for the next click
    editIcon.onclick = () => toggleEdit(periodId, editIcon);
  }
}

export async function saveRow(periodId, row) {
  const inputs = row.querySelectorAll('input');

  const updatedData = {
    name: inputs[0].value.trim(),
    startingDate: inputs[1].value,
    endDate: inputs[2].value,
    costSingle: parseFloat(inputs[3].value),
    costDouble: parseFloat(inputs[4].value)
  };

  try {
    const saving = await caller('updateBillingPeriodName', [periodId, updatedData]);
    if (saving.success) {
      showToast('Billing period updated');

      inputs.forEach(input => input.disabled = true);

      const editIcon = row.querySelector('.edit-icon');
      if (editIcon) {
        editIcon.className = 'fas fa-edit edit-icon';

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

export async function deleteRow(periodId, item) {
  try {
    const saving = await caller('updateBillingPeriodName', [periodId, { deleted: true }]);
    if (saving.success) {
      showToast('Billing period deleted');
      item.remove();
    } else {
      showToast(saving.error);
    }
  } catch (e) {
    console.log(e);
    showToast(e);
  }
}

