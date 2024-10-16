const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./hostelMgr.db', (err) => {
  if (err) {
    return { msg: 'error', error: err.message }
  }
  console.log('Connected to the SQLite database.');

  db.serialize(() => {

    db.run(`CREATE TABLE IF NOT EXISTS Account (
      accountId INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE CHECK(username NOT LIKE '% %'),
      password TEXT NOT NULL CHECK(length(password) >= 6),
      role TEXT NOT NULL CHECK(role IN ('admin', 'custodian')),
      deleted BOOLEAN NOT NULL DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Tenant (
      tenantId INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      gender TEXT CHECK(gender IN ('male', 'female')),
      age INTEGER,
      course TEXT,
      ownContact TEXT,
      nextOfKin TEXT,
      kinContact TEXT,
      deleted BOOLEAN NOT NULL DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Room (
      roomId INTEGER PRIMARY KEY AUTOINCREMENT,
      levelNumber INTEGER NOT NULL,
      semCostSingle INTEGER,
      monthlyCostSingle INTEGER,
      semCostDouble INTEGER,
      monthlyCostDouble INTEGER,
      roomName TEXT NOT NULL,
      deleted BOOLEAN NOT NULL DEFAULT 0,
      maxUsers INTEGER NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Lease (
      leaseId INTEGER PRIMARY KEY AUTOINCREMENT,
      tenantId INTEGER NOT NULL,
      roomId INTEGER NOT NULL,
      demandNoticeDate TEXT,
      leaseType TEXT NOT NULL CHECK(leaseType IN ('single', 'double')),
      periodType TEXT NOT NULL CHECK(periodType IN ('semester', 'monthly')),
      startingDate TEXT NOT NULL, -- Use TEXT to store dates in SQLite
      numOfPeriods INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (tenantId) REFERENCES Tenant(tenantId),
      FOREIGN KEY (roomId) REFERENCES Room(roomId)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Transaction (
      transactionId INTEGER PRIMARY KEY AUTOINCREMENT,
      leaseId INTEGER NOT NULL,
      date TEXT NOT NULL, -- Store date as TEXT in SQLite
      amount INTEGER NOT NULL,
      deleted BOOLEAN NOT NULL DEFAULT 0,
      FOREIGN KEY (leaseId) REFERENCES Lease(leaseId),
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS MiscExpense (
      expenseId INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      amount INTEGER NOT NULL,
      operator INTEGER NOT NULL, -- Account ID (foreign key)
      deleted BOOLEAN NOT NULL DEFAULT 0,
      date TEXT NOT NULL, -- Store date as TEXT in SQLite
      FOREIGN KEY (operator) REFERENCES Account(accountId)
    )`);

  });
});

function executeQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) {
        return reject(err.message);
      }
      return resolve(this.lastID);
    });
  });
}

function executeSelect(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        return reject(err.message);
      }
      return resolve(rows);
    });
  });
}

function login(username, password) {
  const query = `SELECT * FROM Account WHERE username = ? AND password = ? AND deleted = 0`;
  const params = [username, password];
  return executeSelect(query, params);
}

function createAccount(username, password, role) {
  const query = `INSERT INTO Account (username, password, role) VALUES (?, ?, ?)`;
  const params = [username, password, role];
  return executeQuery(query, params);
}

function createRoom(room) {
  const query = `INSERT INTO Room (levelNumber, semCostSingle, monthlyCostSingle, semCostDouble, monthlyCostDouble, roomName, maxUsers) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    room.levelNumber,
    room.semCostSingle,
    room.monthlyCostSingle,
    room.semCostDouble,
    room.monthlyCostDouble,
    room.roomName,
    room.maxUsers
  ];
  return executeQuery(query, params);
}

function createLease(lease, roomId, tenantId) {
  const query = `INSERT INTO Lease (tenantId, roomId, demandNoticeDate, leaseType, periodType, startingDate, numOfPeriods) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    tenantId,
    roomId,
    lease.demandNoticeDate,
    lease.leaseType,
    lease.periodType,
    lease.startingDate,
    lease.numOfPeriods
  ];
  return executeQuery(query, params);
}

function createTenant(tenant) {
  const query = `INSERT INTO Tenant (name, gender, age, course, ownContact, nextOfKin, kinContact) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    tenant.name,
    tenant.gender,
    tenant.age,
    tenant.course,
    tenant.ownContact,
    tenant.nextOfKin,
    tenant.kinContact
  ];
  return executeQuery(query, params);
}

function createMiscExpense(expense, operator) {
  const query = `INSERT INTO MiscExpense (description, quantity, amount, operator, date) VALUES (?, ?, ?, ?, ?)`;
  const params = [
    expense.description,
    expense.quantity,
    expense.amount,
    operator,
    expense.date
  ];
  return executeQuery(query, params);
}

function createTransaction(transaction, leaseId) {
  const query = `INSERT INTO Transaction (leaseId, date, amount) VALUES (?, ?, ?)`;
  const params = [leaseId, transaction.date, transaction.amount];
  return executeQuery(query, params);
}

function updateRoom(roomId, updatedFields) {
  let query = 'UPDATE Room SET ';
  const values = [];

  Object.keys(updatedFields).forEach((field, index) => {
    query += `${field} = ?${index < Object.keys(updatedFields).length - 1 ? ',' : ''} `;
    values.push(updatedFields[field]);
  });

  query += 'WHERE roomId = ?';
  values.push(roomId);

  return executeQuery(query, values);
}

function updateTransaction(transactionId, updatedFields) {
  let query = 'UPDATE Transaction SET ';
  const values = [];

  Object.keys(updatedFields).forEach((field, index) => {
    query += `${field} = ?${index < Object.keys(updatedFields).length - 1 ? ',' : ''} `;
    values.push(updatedFields[field]);
  });

  query += 'WHERE transactionId = ?';
  values.push(transactionId);

  return executeQuery(query, values);
}

function updateLease(leaseId, updatedFields) {
  let query = 'UPDATE Lease SET ';
  const values = [];

  Object.keys(updatedFields).forEach((field, index) => {
    query += `${field} = ?${index < Object.keys(updatedFields).length - 1 ? ',' : ''} `;
    values.push(updatedFields[field]);
  });

  query += 'WHERE leaseId = ?';
  values.push(leaseId);

  return executeQuery(query, values);
}

function updateAccount(accountId, updatedFields) {
  let query = 'UPDATE Account SET ';
  const values = [];

  Object.keys(updatedFields).forEach((field, index) => {
    query += `${field} = ?${index < Object.keys(updatedFields).length - 1 ? ',' : ''} `;
    values.push(updatedFields[field]);
  });

  query += 'WHERE accountId = ?';
  values.push(accountId);

  return executeQuery(query, values);
}

function updateTenant(tenantId, updatedFields) {
  let query = 'UPDATE Tenant SET ';
  const values = [];

  Object.keys(updatedFields).forEach((field, index) => {
    query += `${field} = ?${index < Object.keys(updatedFields).length - 1 ? ',' : ''} `;
    values.push(updatedFields[field]);
  });

  query += 'WHERE tenantId = ?';
  values.push(tenantId);

  return executeQuery(query, values);
}

function updateMiscExpense(expenseId, updatedFields) {
  let query = 'UPDATE MiscExpense SET ';
  const values = [];

  Object.keys(updatedFields).forEach((field, index) => {
    query += `${field} = ?${index < Object.keys(updatedFields).length - 1 ? ',' : ''} `;
    values.push(updatedFields[field]);
  });

  query += 'WHERE expenseId = ?';
  values.push(expenseId);

  return executeQuery(query, values);
}

//getters

function getMiscExpensesByDate(startDate, endDate = null) {
  let query = 'SELECT * FROM MiscExpense WHERE date >= ? AND deleted = 0';
  const params = [startDate];

  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }
  return executeSelect(query, params);
}

function getMostRecentTransaction(leaseId) {
  const query = `SELECT * FROM Transaction WHERE leaseId = ? AND deleted = 0 ORDER BY date DESC LIMIT 1`;
  return executeSelect(query, [leaseId]);
}

function getTransactions(leaseId) {
  const query = `SELECT * FROM Transaction WHERE leaseId = ? AND deleted = 0 ORDER BY date DESC`;
  return executeSelect(query, [leaseId]);
}

function getTransactionsByDate(startDate, endDate = null) {
  let query = 'SELECT * FROM Transaction WHERE date >= ? AND deleted = 0';
  const params = [startDate];

  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }
  return executeSelect(query, params);
}

function getAccountsDeadAndLiving() {
  const query = `SELECT * FROM Account`;
  return executeSelect(query);
}

function getLevels() {
  const query = `SELECT DISTINCT levelNumber FROM Room WHERE deleted = 0`;
  return executeSelect(query);
}

function getAllRooms() {
  const query = `SELECT * FROM Room WHERE deleted = 0`;
  return executeSelect(query);
}

function getRoomsByLevel(levelNumber) {
  const query = `SELECT * FROM Room WHERE deleted = 0 AND levelNumber = ?`;
  return executeSelect(query, [levelNumber]);
}

function getCurrentTenantsByLevel(levelNumber) {
  const currentDate = new Date().toISOString().split('T')[0];
  const query = `SELECT t.* FROM Tenant t
                 JOIN Lease l ON t.tenantId = l.tenantId
                 JOIN Room r ON l.roomId = r.roomId
                 WHERE r.levelNumber = ? AND t.deleted = 0 AND (
                   (l.periodType = 'monthly' AND DATE(l.startingDate, '+' || l.numOfPeriods || ' months') >= ?)
                   OR
                   (l.periodType = 'semester' AND DATE(l.startingDate, '+' || (l.numOfPeriods * 18) || ' weeks') >= ?)
                 )`;
  return executeSelect(query, [levelNumber, currentDate, currentDate]);
}

function getCurrentTenantsByRoom(roomId) {
  const currentDate = new Date().toISOString().split('T')[0];
  const query = `SELECT t.* FROM Tenant t
                 JOIN Lease l ON t.tenantId = l.tenantId
                 WHERE l.roomId = ? AND t.deleted = 0 AND (
                   (l.periodType = 'monthly' AND DATE(l.startingDate, '+' || l.numOfPeriods || ' months') >= ?)
                   OR
                   (l.periodType = 'semester' AND DATE(l.startingDate, '+' || (l.numOfPeriods * 18) || ' weeks') >= ?)
                 )`;
  return executeSelect(query, [roomId, currentDate, currentDate]);
}

function getPreviousTenantsByRoom(roomId) {
  const currentDate = new Date().toISOString().split('T')[0];
  const query = `SELECT t.* FROM Tenant t
                 JOIN Lease l ON t.tenantId = l.tenantId
                 WHERE l.roomId = ? AND t.deleted = 0 AND (
                   (l.periodType = 'monthly' AND DATE(l.startingDate, '+' || l.numOfPeriods || ' months') < ?)
                   OR
                   (l.periodType = 'semester' AND DATE(l.startingDate, '+' || (l.numOfPeriods * 18) || ' weeks') < ?)
                 )`;
  return executeSelect(query, [roomId, currentDate, currentDate]);
}

function getAllTenants() {
  const query = `SELECT * FROM Tenant WHERE deleted = 0`;
  return executeSelect(query);
}

function getAllCurrentTenants() {
  const currentDate = new Date().toISOString().split('T')[0];
  const query = `SELECT t.* FROM Tenant t
                 JOIN Lease l ON t.tenantId = l.tenantId
                 WHERE t.deleted = 0 AND (
                   (l.periodType = 'monthly' AND DATE(l.startingDate, '+' || l.numOfPeriods || ' months') >= ?)
                   OR
                   (l.periodType = 'semester' AND DATE(l.startingDate, '+' || (l.numOfPeriods * 18) || ' weeks') >= ?)
                 )`;
  return executeSelect(query, [currentDate, currentDate]);
}

function getAllPreviousTenants() {
  const currentDate = new Date().toISOString().split('T')[0];
  const query = `SELECT t.*, l.* FROM Tenant t
                 JOIN Lease l ON t.tenantId = l.tenantId
                 WHERE t.deleted = 0 AND (
                   (l.periodType = 'monthly' AND DATE(l.startingDate, '+' || l.numOfPeriods || ' months') < ?)
                   OR
                   (l.periodType = 'semester' AND DATE(l.startingDate, '+' || (l.numOfPeriods * 18) || ' weeks') < ?)
                 )`;
  return executeSelect(query, [currentDate, currentDate]);
}

function getTenantCurrentLease(tenantId) {
  const currentDate = new Date().toISOString().split('T')[0];
  const query = `SELECT l.* FROM Lease l WHERE l.tenantId = ? AND l.deleted = 0 AND (
                   (l.periodType = 'monthly' AND DATE(l.startingDate, '+' || l.numOfPeriods || ' months') >= ?)
                   OR
                   (l.periodType = 'semester' AND DATE(l.startingDate, '+' || (l.numOfPeriods * 18) || ' weeks') >= ?)
                 ) LIMIT 1`;
  return executeSelect(query, [tenantId, currentDate, currentDate]);
}

function getTenantAllLeases(tenantId) {
  const query = `SELECT l.* FROM Lease l WHERE l.tenantId = ?`;
  return executeSelect(query, [tenantId]);
}

function getRoomById(roomId) {
  const query = `SELECT * FROM Room WHERE roomId = ? AND deleted = 0`;
  return executeSelect(query, [roomId]);
}

function getMiscExpenseById(miscExpenseId) {
  const query = `SELECT * FROM MiscExpense WHERE miscExpenseId = ? AND deleted = 0`;
  return executeSelect(query, [miscExpenseId]);
}

function getTransactionById(transactionId) {
  const query = `SELECT * FROM Transaction WHERE transactionId = ? AND deleted = 0`;
  return executeSelect(query, [transactionId]);
}

function getAccountById(accountId) {
  const query = `SELECT * FROM Account WHERE accountId = ? AND deleted = 0`;
  return executeSelect(query, [accountId]);
}

function getTenantById(tenantId) {
  const query = `SELECT * FROM Tenant WHERE tenantId = ? AND deleted = 0`;
  return executeSelect(query, [tenantId]);
}

function getLeaseById(leaseId) {
  const query = `SELECT * FROM Lease WHERE leaseId = ? AND deleted = 0`;
  return executeSelect(query, [leaseId]);
}


function changeTenantsRoomdef(tenantId, newRoomId) {
  //if attached leaseid has 1 as value of numofperiods, just update that lease
  //or, reduce that numofperiods by 1 and create a new lease with the newroomid, and check if the transactions belonging to the old lease sum up to a value greater than the appropriate room fee multiplied by the numofperiods value. if so, then get the amount by which it is being exceeded and compare it with the most recent transaction for that lease. If it is greater than the most recent transaction amount, change the leaseId field of that transaction amount to the new leaseId and then lessen the excess money by the amount of the changed transaction and compare again as before. iteratively. if it is less than the next most recent transaction amount but is not zero, create a new transaction record of that amount and allocate it to the new leaseid and date being the same as that of the "next most recent transaction" and then reduce the amount in the "next most recent transaction" by that of the newly created transaction record.
}

async function changeTenantsRoom(tenantId, newRoomId) {

  const lease = await getTenantCurrentLease(tenantId);
  
  if (lease.length) {
    const leaseId = lease.leaseId;
    const numOfPeriods = lease.numOfPeriods;
    const roomId = lease.roomId;

    const oldRoom = await getRoomById(roomId);
    if (!oldRoom.length) {
      throw new Error('Old room not found');
    }
    let feeField = ''
    if (lease.periodType == 'monthly') {
      feeField += 'monthly'
    } else {
      feeField += 'sem'
    }
    if (lease.leaseType == 'single') {
      feeField += 'CostSingle'
    } else {
      feeField += 'CostDouble'
    }

    const oldRoomFee = oldRoom[feeField]

    const transactions = await getTenantAllLeases(tenantId);
    const totalTransactionAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

    if (numOfPeriods === 1) {
      // Update the lease with new room ID if numOfPeriods is 1
      const updateQuery = `UPDATE Lease SET roomId = ? WHERE leaseId = ?`;
      await executeQuery(updateQuery, [newRoomId, leaseId]);
    } else {
      // Decrease numOfPeriods by 1 and create a new lease
      const updatedNumOfPeriods = numOfPeriods - 1;
      const newLeaseId = await createLease({numOfPeriods: updatedNumOfPeriods}, newRoomId, tenantId);

      // Handle excess transaction amounts
      let excessAmount = totalTransactionAmount - (oldRoomFee * updatedNumOfPeriods);
      let mostRecentTransaction = await getMostRecentTransaction(leaseId);

      while (excessAmount > 0 && mostRecentTransaction.msg === 'success') {
        const recentTransactionAmount = mostRecentTransaction.data.amount;

        if (excessAmount > recentTransactionAmount) {
          // Move the recent transaction to the new lease
          const updateTransactionQuery = `UPDATE Transaction SET leaseId = ? WHERE transactionId = ?`;
          await executeQuery(updateTransactionQuery, [newLeaseId, mostRecentTransaction.data.transactionId]);
          excessAmount -= recentTransactionAmount;
        } else {
          // Create a new transaction for the excess amount
          const newTransactionQuery = `INSERT INTO Transaction (leaseId, amount, date) VALUES (?, ?, ?)`;
          await executeQuery(newTransactionQuery, [newLeaseId, excessAmount, mostRecentTransaction.data.date]);
          const updateRecentTransactionQuery = `UPDATE Transaction SET amount = ? WHERE transactionId = ?`;
          await executeQuery(updateRecentTransactionQuery, [recentTransactionAmount - excessAmount, mostRecentTransaction.data.transactionId]);
          excessAmount = 0; // Exit the loop
        }

        // Get the next most recent transaction if there are still excess amounts
        mostRecentTransaction = await getMostRecentTransaction(leaseId);
      }
    }

    return { status: 'success' };
  } else {
    return { status: 'error', message: 'Tenant lease not found' };
  }
}

// Assuming this is how you create a new lease
// async function createNewLease(tenantId, roomId, numOfPeriods) {
//   const query = `INSERT INTO Lease (tenantId, roomId, numOfPeriods) VALUES (?, ?, ?)`;
//   const params = [tenantId, roomId, numOfPeriods];
//   return await executeQuery(query, params);
// }


// function changeTenantsRoom(tenantId, newRoomId) {
//   try {
//     const currentLease = await getTenantCurrentLease(tenantId);
    

//     const roomRecord = getRoomById(currentLease.data.roomId)

//     const currentRoomFee = roomRecord.data[feeField]

//     // If numOfPeriods is 1, update the current lease with the new roomId
//     if (currentLease.numOfPeriods === 1) {
//       await updateLeaseRoom(currentLease.leaseId, newRoomId);
//       return { msg: 'Lease updated with new room' };
//     }

//     // Otherwise, reduce the numOfPeriods by 1 and update the current lease
//     await updateLeaseNumOfPeriods(currentLease.leaseId, currentLease.numOfPeriods - 1);

//     // Create a new lease for the new room
//     const newLeaseId = await createNewLease(tenantId, newRoomId, currentLease.leaseType, currentLease.periodType);

//     // Get the sum of transactions for the old lease
//     const totalPaid = await getTransactionSum(currentLease.leaseId);

//     // Check if the transactions sum up to more than the current room fee * numOfPeriods
//     const expectedAmount = currentRoomFee * currentLease.numOfPeriods;
//     if (totalPaid <= expectedAmount) {
//       return { msg: 'Tenant moved to new room, no excess payment to transfer' };
//     }

//     // Calculate excess amount paid
//     let excessAmount = totalPaid - expectedAmount;

//     // Get transactions in descending order of date (most recent first)
//     const transactions = await getTransactions(currentLease.leaseId);

//     // Iteratively move excess amount to the new lease
//     for (const transaction of transactions) {
//       if (excessAmount <= 0) break; // If no more excess to move, stop

//       if (excessAmount >= transaction.amount) {
//         // Move entire transaction to the new lease
//         await updateTransactionLeaseId(transaction.transactionId, newLeaseId);
//         excessAmount -= transaction.amount; // Subtract transaction amount from excess
//       } else {
//         // Create a new transaction for the new lease with the remaining excess
//         await createTransaction(newLeaseId, excessAmount, transaction.date);
//         // Reduce the amount in the original transaction
//         await updateTransactionAmount(transaction.transactionId, transaction.amount - excessAmount);
//         excessAmount = 0; // No more excess to move
//       }
//     }
//     return { msg: 'Tenant moved to new room, excess payment transferred if applicable' };

//   } catch (error) {
//     return { msg: 'error', error: error.message };
//   }
// }

// Function to get current tenants with room and transaction data
// Parameters: callback (function)
function getTenantsCurrentWithRoomAndTransactions(callback) {
  const query = `
    SELECT Tenant.name, Room.roomName, Lease.leaseType, Transactions.amount, Transactions.date
    FROM Tenant
    JOIN Lease ON Tenant.tenantId = Lease.tenantId
    JOIN Room ON Lease.roomId = Room.roomId
    LEFT JOIN Transactions ON Lease.leaseId = Transactions.leaseId
    WHERE Tenant.deleted = 0 AND date(Lease.startingDate, '+' || Lease.numOfPeriods || ' ' || Lease.periodType) >= date('now')`;

  db.all(query, [], (err, rows) => {
    if (err) {
      return { msg: 'error', error: err.message }
    }
    callback(rows);
  });
}

// Function to get tenant history with room and transaction data
// Parameters: callback (function)
function getTenantsHistoryWithRoomAndTransactions(callback) {
  const query = `
    SELECT Tenant.name, Room.roomName, Lease.leaseType, Transactions.amount, Transactions.date
    FROM Tenant
    JOIN Lease ON Tenant.tenantId = Lease.tenantId
    JOIN Room ON Lease.roomId = Room.roomId
    LEFT JOIN Transactions ON Lease.leaseId = Transactions.leaseId
    WHERE Tenant.deleted = 0`;

  db.all(query, [], (err, rows) => {
    if (err) {
      return { msg: 'error', error: err.message }
    }
    callback(rows);
  });
}

db.close((err) => {
  if (err) {
    return { msg: 'error', error: err.message }
  }
  console.log('Closed the database connection.');
});

// Function to get transactions and the responsible tenant's payment percentage of their lease
// Parameters: callback (function)
function getTransactionRecordsWithPaymentPercentage(callback) {
  const query = `
    SELECT Tenant.name, Transactions.amount, Transactions.date, Room.roomName, Room.semCostSingle, Room.semCostDouble, Room.monthlyCostSingle, Room.monthlyCostDouble,
           Lease.leaseType, Lease.periodType, 
           CASE 
             WHEN Lease.leaseType = 'single' AND Lease.periodType = 'semester' THEN Room.semCostSingle
             WHEN Lease.leaseType = 'single' AND Lease.periodType = 'monthly' THEN Room.monthlyCostSingle
             WHEN Lease.leaseType = 'double' AND Lease.periodType = 'semester' THEN Room.semCostDouble
             WHEN Lease.leaseType = 'double' AND Lease.periodType = 'monthly' THEN Room.monthlyCostDouble
           END AS totalLeaseCost,
           (SUM(Transactions.amount) * 100.0 / 
           CASE 
             WHEN Lease.leaseType = 'single' AND Lease.periodType = 'semester' THEN Room.semCostSingle
             WHEN Lease.leaseType = 'single' AND Lease.periodType = 'monthly' THEN Room.monthlyCostSingle
             WHEN Lease.leaseType = 'double' AND Lease.periodType = 'semester' THEN Room.semCostDouble
             WHEN Lease.leaseType = 'double' AND Lease.periodType = 'monthly' THEN Room.monthlyCostDouble
           END) AS paymentPercentage
    FROM Tenant
    JOIN Lease ON Tenant.tenantId = Lease.tenantId
    JOIN Room ON Lease.roomId = Room.roomId
    LEFT JOIN Transactions ON Lease.leaseId = Transactions.leaseId
    WHERE Tenant.deleted = 0 AND Transactions.deleted = 0
    GROUP BY Tenant.tenantId, Lease.leaseId`;

  db.all(query, [], (err, rows) => {
    if (err) {
      return { msg: 'error', error: err.message }
    }
    callback(rows);
  });
}

// Function to get tenants and their room, transaction history, and lease data
// Parameters: callback (function)
function getTenantsRoomTransactionAndLeaseHistory(callback) {
  const query = `
    SELECT Tenant.name, Room.roomName, Lease.leaseType, Lease.periodType, Lease.startingDate, Lease.numOfPeriods, 
           Transactions.amount, Transactions.date, Transactions.leaseId
    FROM Tenant
    JOIN Lease ON Tenant.tenantId = Lease.tenantId
    JOIN Room ON Lease.roomId = Room.roomId
    LEFT JOIN Transactions ON Lease.leaseId = Transactions.leaseId
    WHERE Tenant.deleted = 0
    ORDER BY Tenant.name, Transactions.date ASC`;

  db.all(query, [], (err, rows) => {
    if (err) {
      return { msg: 'error', error: err.message }
    }
    callback(rows);
  });
}

// Function to get tenants with monthly leases about to expire in 1 month or less
// Parameters: callback (function)
function getTenantsWithExpiringMonthlyLeases(callback) {
  const query = `
    SELECT Tenant.name, Lease.startingDate, Lease.numOfPeriods, Lease.periodType, Room.roomName,
           date(Lease.startingDate, '+' || Lease.numOfPeriods || ' months') AS leaseEndDate
    FROM Tenant
    JOIN Lease ON Tenant.tenantId = Lease.tenantId
    JOIN Room ON Lease.roomId = Room.roomId
    WHERE Lease.periodType = 'monthly' 
      AND date(Lease.startingDate, '+' || Lease.numOfPeriods || ' months') <= date('now', '+1 month')
      AND Tenant.deleted = 0`;

  db.all(query, [], (err, rows) => {
    if (err) {
      return { msg: 'error', error: err.message }
    }
    callback(rows);
  });
}

// Function to get rooms and who is currently occupying them with their payment percentage
// Parameters: callback (function)
function getRoomsWithCurrentOccupantsAndPaymentPercentage(callback) {
  const query = `
    SELECT Room.roomName, Tenant.name, Lease.leaseType, Lease.periodType,
           CASE 
             WHEN Lease.leaseType = 'single' AND Lease.periodType = 'semester' THEN Room.semCostSingle
             WHEN Lease.leaseType = 'single' AND Lease.periodType = 'monthly' THEN Room.monthlyCostSingle
             WHEN Lease.leaseType = 'double' AND Lease.periodType = 'semester' THEN Room.semCostDouble
             WHEN Lease.leaseType = 'double' AND Lease.periodType = 'monthly' THEN Room.monthlyCostDouble
           END AS totalLeaseCost,
           (SUM(Transactions.amount) * 100.0 / 
           CASE 
             WHEN Lease.leaseType = 'single' AND Lease.periodType = 'semester' THEN Room.semCostSingle
             WHEN Lease.leaseType = 'single' AND Lease.periodType = 'monthly' THEN Room.monthlyCostSingle
             WHEN Lease.leaseType = 'double' AND Lease.periodType = 'semester' THEN Room.semCostDouble
             WHEN Lease.leaseType = 'double' AND Lease.periodType = 'monthly' THEN Room.monthlyCostDouble
           END) AS paymentPercentage
    FROM Room
    JOIN Lease ON Room.roomId = Lease.roomId
    JOIN Tenant ON Lease.tenantId = Tenant.tenantId
    LEFT JOIN Transactions ON Lease.leaseId = Transactions.leaseId
    WHERE Tenant.deleted = 0 AND Transactions.deleted = 0
    GROUP BY Room.roomId, Tenant.tenantId`;

  db.all(query, [], (err, rows) => {
    if (err) {
      return { msg: 'error', error: err.message }
    }
    callback(rows);
  });
}


// Function to get current tenants with their transactions for a specific level
// Parameters: levelNumber (integer), callback (function)
function getRoomsCurrentWithTenantsAndTransactions(levelNumber, callback) {
  const query = `
    SELECT Tenant.name, Room.roomName, Lease.leaseType, Transactions.amount, Transactions.date
    FROM Tenant
    JOIN Lease ON Tenant.tenantId = Lease.tenantId
    JOIN Room ON Lease.roomId = Room.roomId
    LEFT JOIN Transactions ON Lease.leaseId = Transactions.leaseId
    WHERE Room.levelNumber = ? AND Lease.deleted = 0 AND 
    date(Lease.startingDate, '+' || Lease.numOfPeriods || ' ' || Lease.periodType) >= date('now')`;

  db.all(query, [levelNumber], (err, rows) => {
    if (err) {
      return { msg: 'error', error: err.message }
    }
    callback(rows);
  });
}

// Function to get room history with tenants and transactions (including past tenants)
// Parameters: levelNumber (integer), callback (function)
function getRoomsHistoryWithTenantsAndTransactions(levelNumber, callback) {
  const query = `
    SELECT Tenant.name, Room.roomName, Lease.leaseType, Transactions.amount, Transactions.date
    FROM Tenant
    JOIN Lease ON Tenant.tenantId = Lease.tenantId
    JOIN Room ON Lease.roomId = Room.roomId
    LEFT JOIN Transactions ON Lease.leaseId = Transactions.leaseId
    WHERE Room.levelNumber = ? AND Lease.deleted = 0`;

  db.all(query, [levelNumber], (err, rows) => {
    if (err) {
      return { msg: 'error', error: err.message }
    }
    callback(rows);
  });
}
