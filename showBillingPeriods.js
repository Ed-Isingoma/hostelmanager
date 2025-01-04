import showDashboard from "./showDashboard.js";
import showToast from "./showToast.js";

export async function showBillingPeriods() {
  try {
    const periodNames = await window.electron.call('getBillingPeriodNames');
    if (!periodNames.success) return showToast(periodNames.error);
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
      table.appendChild(noDataRow);
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
      showDashboard();
    };

    const addButton = document.createElement("button");
    addButton.className = "menu-item";
    addButton.textContent = 'Add Billing Period';
    addButton.onclick = () => addBillingPeriodRow(table);

    dashboardContainer.appendChild(table);
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

export async function saveNewRow(row) {
  const inputs = row.querySelectorAll('input');
  console.log('the inputs:', inputs);
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

export function toggleEdit(periodId, editIcon) {
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

export async function saveRow(periodId, row) {
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

export async function deleteRow(periodId, item) {
  try {
    const saving = await window.electron.call('updateBillingPeriodName', [periodId, { deleted: 1 }]);
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

