function generateCards(levelContainerId, startLabel, endLabel, insertions = {}) {
  const container = document.getElementById(levelContainerId);
  let currentLabel = startLabel;

  while (currentLabel !== incrementLabel(endLabel)) {
    
    if (insertions[currentLabel]) {
      const card = createCard(levelContainerId, insertions[currentLabel]);
      container.appendChild(card);
    }

    // Create a card for the current label
    const card = createCard(levelContainerId, currentLabel);
    container.appendChild(card);

    // Move to the next label
    currentLabel = incrementLabel(currentLabel);
  }
}

//  function to create a card element
function createCard(levelId, label) {
  const card = document.createElement("div");
  card.className = "room-card";
  card.id = `${levelId}-${label}`;
  card.textContent = label;
  card.onclick = () => handleCardClick(card.id);
  return card;
}

// Increment function for labels
function incrementLabel(label) {
  const match = label.match(/^([A-Z]*)(\d+)$/);
  if (!match) return label;

  const [_, prefix, num] = match;
  const newNum = parseInt(num) + 1;
  return `${prefix}${newNum}`;
}

// Define labels and custom insertions for each level
generateCards("level1Container", "S1", "S36", { "S4": "KS74", "S17": "KS72" });
generateCards("level2Container", "S36", "S74");
generateCards("level3Container", "KE1", "KE42");
generateCards("level4Container", "KF43", "KF87");
generateCards("level5Container", "KH85", "KH128");

// Function to handle card click (marks a room as taken)
function handleCardClick(cardId) {
  const card = document.getElementById(cardId);
  card.classList.toggle("taken");
}
