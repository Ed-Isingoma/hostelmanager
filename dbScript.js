const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./hostelMgr.db', (err) => {
  if (err) {
    return { msg: 'error', error: err.message }
  }
  console.log('Connected to the SQLite database.');

  db.serialize(() => {

    db.run(`CREATE TABLE IF NOT EXISTS Account (
      accountId INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL CHECK(username NOT LIKE '% %'),
      password TEXT NOT NULL CHECK(length(password) >= 4),
      approved BOOLEAN NOT NULL DEFAULT 0,
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
      roomName TEXT NOT NULL,
      deleted BOOLEAN NOT NULL DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS BillingPeriodName (
      periodNameId INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      startingDate TEXT NOT NULL, -- Use TEXT to store dates in SQLite
      endDate TEXT NOT NULL,
      costSingle INTEGER,
      costDouble INTEGER,
      deleted BOOLEAN NOT NULL DEFAULT 0
      )`)

    db.run(`CREATE TABLE IF NOT EXISTS BillingPeriod (
      periodId INTEGER PRIMARY KEY AUTOINCREMENT,
      periodNameId INTEGER NOT NULL,
      tenantId INTEGER NOT NULL,
      roomId INTEGER NOT NULL,
      demandNoticeDate TEXT,
      agreedPrice INTEGER NOT NULL,
      deleted BOOLEAN NOT NULL DEFAULT 0,
      periodType TEXT NOT NULL CHECK(periodType IN ('single', 'double')),
      FOREIGN KEY (tenantId) REFERENCES Tenant(tenantId),
      FOREIGN KEY (roomId) REFERENCES Room(roomId),
      FOREIGN KEY (periodNameId) REFERENCES BillingPeriodName(periodNameId)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Transaction (
      transactionId INTEGER PRIMARY KEY AUTOINCREMENT,
      periodId INTEGER NOT NULL,
      date TEXT NOT NULL, -- Store date as TEXT in SQLite
      amount INTEGER NOT NULL,
      deleted BOOLEAN NOT NULL DEFAULT 0,
      FOREIGN KEY (periodId) REFERENCES BillingPeriod(periodId)
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
  const query = `SELECT * FROM Account WHERE username = ? AND password = ? AND approved = 1 AND deleted = 0`;
  const params = [username, password];
  return executeSelect(query, params);
}

function createAccount(username, password, role = 'custodian') {
  const query = `INSERT INTO Account (username, password, role) VALUES (?, ?, ?)`;
  const params = [username, password, role];
  return executeQuery(query, params);
}

async function createAdmin() {
  const getAdmin = 'SELECT * from Account WHERE role = "admin" AND deleted = 0'
  const getAdminResult = await executeSelect(getAdmin)
  if (getAdminResult.length) {
    return getAdminResult[0].accountId
  } else {
    const makeAdmin = `INSERT INTO Account (username, password, role, approved) VALUES (?, ?, ?, ?)`
    const params = ['admin', '2024admin', 'admin', 1]
    return executeQuery(makeAdmin, params)
  }
}

function createRoom(room) {
  const query = `INSERT INTO Room (levelNumber, semCostSingle, monthlyCostSingle, recessCostSingle, semCostDouble, monthlyCostDouble, recessCostDouble, roomName, maxUsers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    room.levelNumber,
    room.semCostSingle,
    room.monthlyCostSingle,
    room.recessCostSingle,
    room.semCostDouble,
    room.monthlyCostDouble,
    room.recessCostDouble,
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

function getUnapprovedAccounts() {
  const query = `SELECT * FROM Account WHERE approved = 0`;
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

async function getRoomsByLevelAndOccupancy(levelNumber) {
  const query = `SELECT * FROM Room WHERE deleted = 0 AND levelNumber = ?`;
  const rooms = await executeSelect(query, [levelNumber]);

  const currentDate = new Date().toISOString().split('T')[0];

  for (let room of rooms) {
    const leaseQuery = `
      SELECT leaseType FROM Lease
      WHERE roomId = ? 
        AND (
          (periodType = 'monthly' AND DATE(startingDate, '+' || numOfPeriods || ' months') >= ?)
          OR (periodType = 'semester' AND DATE(startingDate, '+' || (numOfPeriods * 18) || ' weeks') >= ?)
          OR (periodType = 'recess' AND DATE(startingDate, '+' || (numOfPeriods * 9) || ' weeks') >= ?)
        )
    `;

    const leases = await executeSelect(leaseQuery, [room.roomId, currentDate, currentDate, currentDate]);

    if (leases.length === 0) {
      room.occupancyStatus = '0%';
    } else if (leases.length === 1 && leases[0].leaseType === 'single') {
      room.occupancyStatus = '100%';
    } else if (leases.length === 1 && leases[0].leaseType === 'double') {
      room.occupancyStatus = '50%';
    } else if (leases.length === 2) {
      room.occupancyStatus = '100%';
    } else {
      room.occupancyStatus = '0%';
    }
  }

  return rooms;
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
                   OR
                   (l.periodType = 'recess' AND DATE(L.startingDate, '+' || (l.numOfPeriods * 9) || ' weeks') >= ?)
                 )`;
  return executeSelect(query, [levelNumber, currentDate, currentDate, currentDate]);
}

async function getCurrentTenantsByRoomAndOwingAmt(roomId) {
  const currentDate = new Date().toISOString().split('T')[0];
  const query = `
    SELECT t.*, l.leaseId, l.leaseType, l.periodType, l.numOfPeriods 
    FROM Tenant t
    JOIN Lease l ON t.tenantId = l.tenantId
    WHERE l.roomId = ? AND t.deleted = 0 AND (
      (l.periodType = 'monthly' AND DATE(l.startingDate, '+' || l.numOfPeriods || ' months') >= ?)
      OR (l.periodType = 'semester' AND DATE(l.startingDate, '+' || (l.numOfPeriods * 18) || ' weeks') >= ?)
      OR (l.periodType = 'recess' AND DATE(l.startingDate, '+' || (l.numOfPeriods * 9) || ' weeks') >= ?)
    )
  `;
  const tenants = await executeSelect(query, [roomId, currentDate, currentDate, currentDate]);

  const costs = {
    single: { semester: 1300000, monthly: 400000, recess: 700000 },
    double: { semester: 650000, monthly: 200000, recess: 350000 }
  };

  for (let tenant of tenants) {
    const leaseType = tenant.leaseType;
    const periodType = tenant.periodType;
    const numOfPeriods = tenant.numOfPeriods;
    const costPerPeriod = costs[leaseType][periodType];
    const totalAmountDue = costPerPeriod * numOfPeriods;

    const transactionQuery = `
      SELECT SUM(amount) AS totalPaid FROM Transaction 
      WHERE leaseId = ? AND deleted = 0
    `;
    const transactions = await executeSelect(transactionQuery, [tenant.leaseId]);
    const totalPaid = transactions[0].totalPaid || 0;

    tenant.amountOwed = totalAmountDue - totalPaid;
  }

  return tenants;
}

function getPreviousTenantsByRoom(roomId) {
  const currentDate = new Date().toISOString().split('T')[0];
  const query = `SELECT t.* FROM Tenant t
                 JOIN Lease l ON t.tenantId = l.tenantId
                 WHERE l.roomId = ? AND t.deleted = 0 AND (
                   (l.periodType = 'monthly' AND DATE(l.startingDate, '+' || l.numOfPeriods || ' months') < ?)
                   OR
                   (l.periodType = 'semester' AND DATE(l.startingDate, '+' || (l.numOfPeriods * 18) || ' weeks') < ?)
                   OR
                   (l.periodType = 'recess' AND DATE(L.startingDate, '+' || (l.numOfPeriods * 9) || ' weeks') < ?)
                 )`;
  return executeSelect(query, [roomId, currentDate, currentDate, currentDate]);
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
                   OR
                   (l.periodType = 'recess' AND DATE(L.startingDate, '+' || (l.numOfPeriods * 9) || ' weeks') >= ?)
                 )`;
  return executeSelect(query, [currentDate, currentDate, currentDate]);
}

function getAllPreviousTenants() {
  const currentDate = new Date().toISOString().split('T')[0];
  const query = `SELECT t.*, l.* FROM Tenant t
                 JOIN Lease l ON t.tenantId = l.tenantId
                 WHERE t.deleted = 0 AND (
                   (l.periodType = 'monthly' AND DATE(l.startingDate, '+' || l.numOfPeriods || ' months') < ?)
                   OR
                   (l.periodType = 'semester' AND DATE(l.startingDate, '+' || (l.numOfPeriods * 18) || ' weeks') < ?)
                    OR
                   (l.periodType = 'recess' AND DATE(L.startingDate, '+' || (l.numOfPeriods * 9) || ' weeks') < ?)
                 )`;
  return executeSelect(query, [currentDate, currentDate, currentDate]);
}

function getTenantCurrentLease(tenantId) {
  const currentDate = new Date().toISOString().split('T')[0];
  const query = `SELECT l.* FROM Lease l WHERE l.tenantId = ? AND l.deleted = 0 AND (
                   (l.periodType = 'monthly' AND DATE(l.startingDate, '+' || l.numOfPeriods || ' months') >= ?)
                   OR
                   (l.periodType = 'semester' AND DATE(l.startingDate, '+' || (l.numOfPeriods * 18) || ' weeks') >= ?)
                   OR
                   (l.periodType = 'recess' AND DATE(L.startingDate, '+' || (l.numOfPeriods * 9) || ' weeks') >= ?)
                 ) LIMIT 1`;
  return executeSelect(query, [tenantId, currentDate, currentDate, currentDate]);
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

function getTransactionsByLease(leaseId) {
  const query = `SELECT * FROM Transaction WHERE leaseId = ? AND deleted = 0`;
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

function getLeasesByTenant(tenantId) {
  const query = `SELECT * FROM Lease WHERE tenantId = ? AND deleted = 0`;
  return executeSelect(query, [leaseId]);
}

function getRoomFeeField(periodType, leaseType) {
  let feeField = ''
  if (periodType == 'monthly') {
    feeField += 'monthly'
  } else if (periodType == 'recess') {
    feeField += 'recess'
  } else {
    feeField += 'sem'
  }
  if (leaseType == 'single') {
    feeField += 'CostSingle'
  } else {
    feeField += 'CostDouble'
  }
  return feeField
}

async function getTenantsAndOutstandingBalanceByRoom(roomId) {
  const fullRoom = await getRoomById(roomId)
  const tenantsInRoom = await getCurrentTenantsByRoom(roomId)
  tenantsInRoom.forEach(async tenant => {
    const lease = await getTenantCurrentLease(tenant.tenantId)
    const transactions = await getTransactionsByLease(lease[0].leaseId)
    let totalPaid = 0
    transactions.forEach(tran => {
      totalPaid += tran.amount
    })
    const totalPayable = fullRoom[0][getRoomFeeField(lease[0].periodType, lease[0].leaseType)]
    tenant = { ...tenant, totalPaid: totalPaid, totalPayable: totalPayable }
  })
  return tenantsInRoom
}

async function getTenantsAndOutstandingBalanceAll() {
  const tenantsAll = await getAllCurrentTenants()
  tenantsAll.forEach(async tenant => {
    const lease = await getTenantCurrentLease(tenant.tenantId)
    const transactions = await getTransactionsByLease(lease[0].leaseId)
    const room = await getRoomById(lease[0].roomId)
    let totalPaid = 0
    transactions.forEach(tran => {
      totalPaid += tran.amount
    })
    const totalPayable = room[0][getRoomFeeField(lease[0].periodType, lease[0].leaseType)]
    tenant = { ...tenant, totalPaid: totalPaid, totalPayable: totalPayable }
  })
  return tenantsAll
}

async function getTenantsAndOutstandingBalanceOnly() {
  const tenantsAll = await getAllCurrentTenants()
  tenantsAll.forEach(async tenant => {
    const lease = await getTenantCurrentLease(tenant.tenantId)
    const transactions = await getTransactionsByLease(lease[0].leaseId)
    const room = await getRoomById(lease[0].roomId)
    let totalPaid = 0
    transactions.forEach(tran => {
      totalPaid += tran.amount
    })
    const totalPayable = room[0][getRoomFeeField(lease[0].periodType, lease[0].leaseType)]
    tenant = { ...tenant, totalPaid: totalPaid, totalPayable: totalPayable }
  })
  for (let i = tenantsAll.length - 1; i >= 0; i--) {
    if (tenantsAll[i].totalPaid == tenantsAll[i].totalPayable) {
      tenantsAll.splice(i, 1)
    }
  }
  return tenantsAll
}

async function getFullTenantProfile(tenantId) {
  const fullTenant = await getTenantById(tenantId)
  const leases = await getLeasesByTenant(tenantId)
  leases.forEach(async lease => {
    const transactions = await getTransactionsByLease(lease.leaseId)
    const room = await getRoomById(lease.roomId)
    lease = { ...lease, ...room[0], transactions: transactions }
  })
  fullTenant[0] = { ...fullTenant[0], leases: leases }
  return fullTenant
}

function searchTenantByName(name) {
  const currentDate = new Date().toISOString().split('T')[0];
  const query = `
    SELECT t.*, r.roomName, r.levelNumber
    FROM Tenant t
    JOIN Lease l ON t.tenantId = l.tenantId
    JOIN Room r ON l.roomId = r.roomId
    WHERE t.deleted = 0 
      AND LOWER(t.name) LIKE ?
      AND (
        (l.periodType = 'monthly' AND DATE(l.startingDate, '+' || l.numOfPeriods || ' months') >= ?)
        OR (l.periodType = 'semester' AND DATE(l.startingDate, '+' || (l.numOfPeriods * 18) || ' weeks') >= ?)
        OR (l.periodType = 'recess' AND DATE(l.startingDate, '+' || (l.numOfPeriods * 9) || ' weeks') >= ?)
      )
  `;
  const params = [`%${name.toLowerCase()}%`, currentDate, currentDate, currentDate];
  return executeSelect(query, params);
}

async function getTransactionsByDatewithMetaData(startDate, endDate = null) {
  const transactions = await getTransactionsByDate(startDate, endDate)
  transactions.forEach(async tran => {
    const lease = await getLeaseById(tran.leaseId)
    const room = await getRoomById(lease[0].roomId)
    const tenant = await getTenantById(lease[0].tenantId)
    tran = { ...tran, ...lease[0], ...room[0], ...tenant[0] }
  })
}

async function getTenantsWhoseLeaseEndedRecently() {
  const currentDate = new Date().toISOString().split('T')[0];
  const date = new Date();
  date.setMonth(date.getMonth() - 3);
  const oldDate = date.toISOString().split('T')[0];

  const query = `
    SELECT Tenant.*, Room.*, Lease.*, Transaction.* 
    FROM Lease
    JOIN Tenant ON Tenant.tenantId = Lease.tenantId
    JOIN Room ON Room.roomId = Lease.roomId
    LEFT JOIN Transaction ON Transaction.leaseId = Lease.leaseId
    WHERE Lease.deleted = 0 
      AND Tenant.deleted = 0
      AND Room.deleted = 0
      AND (
        (Lease.periodType = 'monthly' AND DATE(Lease.startingDate, '+' || Lease.numOfPeriods || ' months') <= ?)
        OR
        (Lease.periodType = 'semester' AND DATE(Lease.startingDate, '+' || (Lease.numOfPeriods * 18) || ' weeks') <= ?)
        OR
        (Lease.periodType = 'recess' AND DATE(Lease.startingDate, '+' || (Lease.numOfPeriods * 9) || ' weeks') <= ?)
      )
      AND (
        (Lease.periodType = 'monthly' AND DATE(Lease.startingDate, '+' || Lease.numOfPeriods || ' months') >= ?)
        OR
        (Lease.periodType = 'semester' AND DATE(Lease.startingDate, '+' || (Lease.numOfPeriods * 18) || ' weeks') >= ?)
        OR
        (Lease.periodType = 'recess' AND DATE(Lease.startingDate, '+' || (Lease.numOfPeriods * 9) || ' weeks') >= ?)
      )
    ORDER BY Lease.leaseId, Transaction.transactionId
  `;

  return executeSelect(query, [currentDate, currentDate, currentDate, oldDate, oldDate, oldDate]);
}

function generateRandomRoomName() {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const number = Math.floor(100 + Math.random() * 900);
  return `${letter}${number}`;
}

async function createDefaultRooms() {
  const maxUsers = 2;
  const semCostSingle = 1300000;
  const monthlyCostSingle = 400000;
  const recessCostSingle = 700000;
  const semCostDouble = 650000;
  const recessCostDouble = 350000;
  const monthlyCostDouble = 200000;

  for (let level = 1; level <= 5; level++) {
    for (let i = 0; i < 40; i++) {
      const roomName = generateRandomRoomName();
      const query = `
        INSERT INTO Room (levelNumber, semCostSingle, monthlyCostSingle, recessCostSingle, 
                          semCostDouble, recessCostDouble, monthlyCostDouble, roomName, maxUsers) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        level,
        semCostSingle,
        monthlyCostSingle,
        recessCostSingle,
        semCostDouble,
        recessCostDouble,
        monthlyCostDouble,
        roomName,
        maxUsers
      ];

      try {
        await executeQuery(query, params);
        console.log(`Room ${roomName} on level ${level} created successfully.`);
      } catch (error) {
        console.error(`Error creating room ${roomName} on level ${level}: ${error}`);
      }
    }
  }
}



module.exports = {
  executeQuery,
  executeSelect,
  login,
  createAdmin,
  createAccount,
  createRoom,
  createLease,
  createTenant,
  createMiscExpense,
  createTransaction,
  updateRoom,
  updateTransaction,
  updateLease,
  updateAccount,
  updateTenant,
  updateMiscExpense,
  getMiscExpensesByDate,
  getMostRecentTransaction,
  getTransactions,
  getTransactionsByDate,
  getAccountsDeadAndLiving,
  getLevels,
  getAllRooms,
  getRoomsByLevelAndOccupancy,
  getUnapprovedAccounts,
  createDefaultRooms,
  getCurrentTenantsByLevel,
  getCurrentTenantsByRoomAndOwingAmt,
  getPreviousTenantsByRoom,
  getAllTenants,
  searchTenantByName,
  getAllCurrentTenants,
  getAllPreviousTenants,
  getTenantCurrentLease,
  getTenantAllLeases,
  getRoomById,
  getMiscExpenseById,
  getTransactionById,
  getTransactionsByLease,
  getAccountById,
  getTenantById,
  getLeaseById,
  getLeasesByTenant,
  getRoomFeeField,
  getTenantsAndOutstandingBalanceByRoom,
  getTenantsAndOutstandingBalanceAll,
  getTenantsAndOutstandingBalanceOnly,
  getFullTenantProfile,
  getTransactionsByDatewithMetaData,
  getTenantsWhoseLeaseEndedRecently
};
