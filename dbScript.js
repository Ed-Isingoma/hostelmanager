const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./hostelMgr.db', (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    return;
  }
  console.log('Connected to the SQLite database.');
});

function initDb() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS Account (
        accountId INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL CHECK(username NOT LIKE '% %'),
        password TEXT NOT NULL CHECK(length(password) >= 4),
        approved BOOLEAN NOT NULL DEFAULT 0,
        role TEXT NOT NULL CHECK(role IN ('admin', 'custodian')),
        deleted BOOLEAN NOT NULL DEFAULT 0
      )`, errorHandler);

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
      )`, errorHandler);

      db.run(`CREATE TABLE IF NOT EXISTS Room (
        roomId INTEGER PRIMARY KEY AUTOINCREMENT,
        levelNumber INTEGER NOT NULL,
        roomName TEXT NOT NULL,
        deleted BOOLEAN NOT NULL DEFAULT 0
      )`, errorHandler);

      db.run(`CREATE TABLE IF NOT EXISTS BillingPeriodName (
        periodNameId INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        startingDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        costSingle INTEGER,
        costDouble INTEGER,
        deleted BOOLEAN NOT NULL DEFAULT 0
      )`, errorHandler);

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
      )`, errorHandler);

      db.run(`CREATE TABLE IF NOT EXISTS Transactionn (
        transactionId INTEGER PRIMARY KEY AUTOINCREMENT,
        periodId INTEGER NOT NULL,
        date TEXT NOT NULL,
        amount INTEGER NOT NULL,
        receiptNumber TEXT NOT NULL,
        deleted BOOLEAN NOT NULL DEFAULT 0,
        FOREIGN KEY (periodId) REFERENCES BillingPeriod(periodId)
      )`, errorHandler);

      db.run(`CREATE TABLE IF NOT EXISTS MiscExpense (
        expenseId INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        amount INTEGER NOT NULL,
        periodNameId INTEGER NOT NULL,
        operator INTEGER NOT NULL,
        deleted BOOLEAN NOT NULL DEFAULT 0,
        date TEXT NOT NULL,
        FOREIGN KEY (periodNameId) REFERENCES BillingPeriodName(periodNameId),
        FOREIGN KEY (operator) REFERENCES Account(accountId)
      )`, errorHandler);

      db.run('SELECT 1', (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

function errorHandler(err) {
  if (err) {
    console.error('Table creation error:', err.message);
  }
}

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

async function initializeTrigger() {
  await initDb()
  const checkQuery = `SELECT COUNT(*) AS count FROM Account`;
  try {
    const rows = await executeSelect(checkQuery);
    const isEmpty = rows[0].count === 0;
    if (isEmpty) {
      const makeAdmin = `INSERT INTO Account (username, password, role, approved) VALUES (?, ?, ?, ?)`
      const params = ['admin', '2024admin', 'admin', 1]
      const adminId = await executeQuery(makeAdmin, params);
      console.log(`Admin account added with ID ${adminId}`);
      await insertDefaultBillingPeriodNames();
      await createDefaultRooms()
    } else {
      console.log("InitTrigger already has records. No insertion needed.");
    }
  } catch (error) {
    console.error("Error initializing InitTrigger:", error);
  }
}

initializeTrigger()

function login(username, password) {
  const query = `SELECT * FROM Account WHERE username = ? AND password = ? AND approved = 1 AND deleted = 0`;
  const params = [username, password];
  return executeSelect(query, params);
}

async function createAccount(username, password, role = 'custodian') {
  const query = `INSERT INTO Account (username, password, role) VALUES (?, ?, ?)`;
  const params = [username, password, role];
  return await executeQuery(query, params);
}

async function insertDefaultBillingPeriodNames() {
  const billingPeriodNames = [
    {
      name: "Semester 1 2024/2025",
      startingDate: "2024-08-03",
      endDate: "2024-12-08",
      costSingle: 1300000,
      costDouble: 650000
    },
    {
      name: "Semester 2 2024/2025",
      startingDate: "2025-01-18",
      endDate: "2025-06-15",
      costSingle: 1300000,
      costDouble: 650000
    },
    {
      name: "Recess 2024/2025",
      startingDate: "2025-06-22",
      endDate: "2025-08-24",
      costSingle: 1300000,
      costDouble: 650000
    }
  ];
  try {
    for (const period of billingPeriodNames) {
      const periodId = await createBillingPeriodName(period);
      console.log(`Billing period '${period.name}' inserted with ID: ${periodId}`);
    }
  } catch (error) {
    console.error("Error inserting billing periods:", error);
  }
}

async function createRoom(room) {
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
  return await executeQuery(query, params);
}

async function createBillingPeriodName(periodName) {
  const query = `INSERT INTO BillingPeriodName (name, startingDate, endDate, costSingle, costDouble) VALUES (?, ?, ?, ?, ?)`;
  const params = [
    periodName.name,
    periodName.startingDate,
    periodName.endDate,
    periodName.costSingle,
    periodName.costDouble
  ];
  return await executeQuery(query, params);
}

async function createBillingPeriod(billingPeriod, periodNameId, roomId, tenantId) {
  const query = `INSERT INTO BillingPeriod (periodNameId, tenantId, roomId, demandNoticeDate, agreedPrice, periodType) VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [
    periodNameId,
    tenantId,
    roomId,
    billingPeriod.demandNoticeDate,
    billingPeriod.agreedPrice,
    billingPeriod.periodType
  ];
  return await executeQuery(query, params);
}

async function createTenant(tenant) {
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
  return await executeQuery(query, params);
}

async function createMiscExpense(expense, operator, periodNameId) {
  const query = `INSERT INTO MiscExpense (description, quantity, amount, operator, date, periodNameId) VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [
    expense.description,
    expense.quantity,
    expense.amount,
    operator,
    expense.date,
    periodNameId
  ];
  return await executeQuery(query, params);
}

async function createTransaction(transaction, periodId) {
  const query = `INSERT INTO Transactionn (periodId, date, amount, receiptNumber) VALUES (?, ?, ?, ?)`;
  const params = [periodId, transaction.date, transaction.amount, transaction.receiptNumber];
  return await executeQuery(query, params);
}

async function updateRoom(roomId, updatedFields) {
  let query = 'UPDATE Room SET ';
  const values = [];

  Object.keys(updatedFields).forEach((field, index) => {
    query += `${field} = ?${index < Object.keys(updatedFields).length - 1 ? ',' : ''} `;
    values.push(updatedFields[field]);
  });

  query += 'WHERE roomId = ?';
  values.push(roomId);

  return await executeQuery(query, values);
}

async function updateTransaction(transactionId, updatedFields) {
  let query = 'UPDATE Transactionn SET ';
  const values = [];

  Object.keys(updatedFields).forEach((field, index) => {
    query += `${field} = ?${index < Object.keys(updatedFields).length - 1 ? ',' : ''} `;
    values.push(updatedFields[field]);
  });

  query += 'WHERE transactionId = ?';
  values.push(transactionId);

  return await executeQuery(query, values);
}

async function updateBillingPeriod(periodId, updatedFields) {
  let query = 'UPDATE BillingPeriod SET ';
  const values = [];

  Object.keys(updatedFields).forEach((field, index) => {
    query += `${field} = ?${index < Object.keys(updatedFields).length - 1 ? ',' : ''} `;
    values.push(updatedFields[field]);
  });

  query += 'WHERE periodId = ?';
  values.push(periodId);

  return await executeQuery(query, values);
}

async function updateBillingPeriodName(periodNameId, updatedFields) {
  let query = 'UPDATE BillingPeriodName SET ';
  const values = [];

  Object.keys(updatedFields).forEach((field, index) => {
    query += `${field} = ?${index < Object.keys(updatedFields).length - 1 ? ',' : ''} `;
    values.push(updatedFields[field]);
  });

  query += 'WHERE periodNameId = ?';
  values.push(periodNameId);

  return await executeQuery(query, values);
}

async function updateAccount(accountId, updatedFields) {
  let query = 'UPDATE Account SET ';
  const values = [];

  Object.keys(updatedFields).forEach((field, index) => {
    query += `${field} = ?${index < Object.keys(updatedFields).length - 1 ? ',' : ''} `;
    values.push(updatedFields[field]);
  });

  query += 'WHERE accountId = ?';
  values.push(accountId);

  return await executeQuery(query, values);
}

async function updateTenant(tenantId, updatedFields) {
  let query = 'UPDATE Tenant SET ';
  const values = [];

  Object.keys(updatedFields).forEach((field, index) => {
    query += `${field} = ?${index < Object.keys(updatedFields).length - 1 ? ',' : ''} `;
    values.push(updatedFields[field]);
  });

  query += 'WHERE tenantId = ?';
  values.push(tenantId);

  return await executeQuery(query, values);
}

async function updateMiscExpense(expenseId, updatedFields) {
  let query = 'UPDATE MiscExpense SET ';
  const values = [];

  Object.keys(updatedFields).forEach((field, index) => {
    query += `${field} = ?${index < Object.keys(updatedFields).length - 1 ? ',' : ''} `;
    values.push(updatedFields[field]);
  });

  query += 'WHERE expenseId = ?';
  values.push(expenseId);

  return await executeQuery(query, values);
}

//getters

async function getPotentialTenantRoomsByGender(gender, levelNumber, periodNameId) {
  const query = `
  SELECT r.roomId, r.roomName
  FROM Room r
  LEFT JOIN BillingPeriod bp ON r.roomId = bp.roomId AND bp.periodNameId = ?
  LEFT JOIN Tenant t ON bp.tenantId = t.tenantId
  WHERE r.levelNumber = ?
    AND r.deleted = 0
    AND (
      bp.periodId IS NULL  -- Room is not occupied for the specified period
      OR (
        bp.periodId IS NOT NULL 
        AND bp.periodType = 'double'
        AND t.gender = ? -- Occupant is of the matching gender
      )
    )
  GROUP BY r.roomId
  HAVING COUNT(t.tenantId) <= 1;  -- Room has zero or one occupants
`;

  const params = [periodNameId, levelNumber, gender];
  return await executeSelect(query, params)

}

function getMiscExpensesByDate(startDate, endDate = null) {
  let query = `
  SELECT MiscExpense.*, Account.username AS operatorName
  FROM MiscExpense
  JOIN Account ON MiscExpense.operator = Account.accountId
  WHERE MiscExpense.date >= ? 
    AND MiscExpense.deleted = 0
    AND Account.deleted = 0
`;
  const params = [startDate];

  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }
  return executeSelect(query, params);
}

function getMiscExpensesForBillingPeriodName(periodNameId) {
  let query = `
  SELECT MiscExpense.*, Account.username AS operatorName
  FROM MiscExpense
  JOIN Account ON MiscExpense.operator = Account.accountId
  WHERE MiscExpense.periodNameId = ?
    AND MiscExpense.deleted = 0
    AND Account.deleted = 0
  `;
  const params = [periodNameId];

  return executeSelect(query, params);
}

function getMostRecentTransaction(periodId) {
  const query = `SELECT * FROM Transactionn WHERE periodId = ? AND deleted = 0 ORDER BY date DESC LIMIT 1`;
  return executeSelect(query, [periodId]);
}

function getTransactions(periodId) {
  const query = `SELECT * FROM Transactionn WHERE periodId = ? AND deleted = 0 ORDER BY date DESC`;
  return executeSelect(query, [periodId]);
}

function getTransactionsByBillingPeriodName(periodNameId) {
  let query = 'SELECT Transactionn.* FROM Transactionn JOIN BillingPeriod ON Transactionn.periodId = BillingPeriod.periodId WHERE BillingPeriod.periodNameId = ? AND Transactionn.deleted = 0 AND BillingPeriod.deleted = 0';

  const params = [periodNameId];
  return executeSelect(query, params);
}

function getAccountsDeadAndLiving() {
  const query = `SELECT * FROM Account WHERE deleted = 0`;
  return executeSelect(query);
}

function getUnapprovedAccounts() {// seems to be useless
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

function getBillingPeriodNames() {
  const query = `SELECT * FROM BillingPeriodName WHERE deleted = 0`
  return executeSelect(query);
}

function getCurrentBillingPeriodName() {
  const today = new Date().toISOString().split('T')[0];
  const query = `SELECT * FROM BillingPeriodName 
             WHERE startingDate <= ? AND endDate >= ? AND deleted = 0 
             ORDER BY startingDate DESC LIMIT 1`
  const params = [today, today]
  return executeSelect(query, params)
}

async function getRoomsAndOccupancyByLevel(levelNumber, periodNameId) {
  const query = `
    SELECT Room.roomId, Room.roomName, Room.levelNumber,
      CASE 
        WHEN COUNT(BillingPeriod.periodId) = 2 THEN 100
        WHEN COUNT(BillingPeriod.periodId) = 1 THEN 50
        WHEN COUNT(BillingPeriod.periodId) = 0 THEN 0
        ELSE 101
      END AS occupancyRate
    FROM Room
    LEFT JOIN BillingPeriod ON Room.roomId = BillingPeriod.roomId 
      AND BillingPeriod.periodNameId = ? AND BillingPeriod.deleted = 0
    WHERE Room.levelNumber = ? AND Room.deleted = 0
    GROUP BY Room.roomId
  `;
  const params = [periodNameId, levelNumber];
  return executeSelect(query, params)
}

function getTenantsByLevel(levelNumber, periodNameId) {
  const query = `
    SELECT Tenant.* 
    FROM Tenant
    JOIN BillingPeriod ON Tenant.tenantId = BillingPeriod.tenantId
    JOIN Room ON BillingPeriod.roomId = Room.roomId
    WHERE BillingPeriod.periodNameId = ? 
      AND Room.levelNumber = ?
      AND Tenant.deleted = 0 
      AND BillingPeriod.deleted = 0
      AND Room.deleted = 0
  `;
  return executeSelect(query, [periodNameId, levelNumber]);
}

async function getTenantsAndOwingAmtByRoom(roomId, periodNameId) {
  const query = `
    SELECT Tenant.name, Tenant.gender,
      BillingPeriod.agreedPrice - IFNULL(SUM(Transactionn.amount), 0) AS owingAmount
    FROM Tenant
    JOIN BillingPeriod ON Tenant.tenantId = BillingPeriod.tenantId
    LEFT JOIN Transactionn ON BillingPeriod.periodId = Transactionn.periodId AND Transactionn.deleted = 0
    WHERE BillingPeriod.roomId = ? 
      AND BillingPeriod.periodNameId = ?
      AND Tenant.deleted = 0 
      AND BillingPeriod.deleted = 0
    GROUP BY Tenant.tenantId
  `;
  const params = [roomId, periodNameId];
  return await executeSelect(query, params);
}

function getAllTenants(periodNameId) {
  const query = `
    SELECT Tenant.* 
    FROM Tenant
    JOIN BillingPeriod ON Tenant.tenantId = BillingPeriod.tenantId
    WHERE BillingPeriod.periodNameId = ? AND Tenant.deleted = 0 AND BillingPeriod.deleted = 0
  `;
  return executeSelect(query, [periodNameId]);
}

function getAllTenantsNameAndId(periodNameId) {
  const query = `
    SELECT Tenant.tenantId, Tenant.name 
    FROM Tenant
    JOIN BillingPeriod ON Tenant.tenantId = BillingPeriod.tenantId
    WHERE BillingPeriod.periodNameId = ? AND Tenant.deleted = 0 AND BillingPeriod.deleted = 0
  `;
  return executeSelect(query, [periodNameId]);
}

function getTenantsByBillingPeriodName(periodNameId) {
  const query = `
    SELECT Tenant.* 
    FROM Tenant
    JOIN BillingPeriod ON Tenant.tenantId = BillingPeriod.tenantId
    WHERE BillingPeriod.periodNameId = ? 
      AND Tenant.deleted = 0 
      AND BillingPeriod.deleted = 0
  `;
  return executeSelect(query, [periodNameId]);
}

function getTenantAllBillingPeriods(tenantId) {
  const query = `SELECT b.* FROM BillingPeriod b WHERE b.tenantId = ?`;
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
  const query = `SELECT * FROM Transactionn WHERE transactionId = ? AND deleted = 0`;
  return executeSelect(query, [transactionId]);
}

function getTransactionsByBillingPeriod(periodId) {
  const query = `SELECT * FROM Transactionn WHERE periodId = ? AND deleted = 0`;
  return executeSelect(query, [periodId]);
}

function getAccountById(accountId) {
  const query = `SELECT * FROM Account WHERE accountId = ? AND deleted = 0`;
  return executeSelect(query, [accountId]);
}

function getTenantById(tenantId) {
  const query = `SELECT * FROM Tenant WHERE tenantId = ? AND deleted = 0`;
  return executeSelect(query, [tenantId]);
}

function getBillingPeriodById(periodId) {
  const query = `SELECT * FROM BillingPeriod WHERE periodId = ? AND deleted = 0`;
  return executeSelect(query, [periodId]);
}

function getOnlyTenantsWithOwingAmt(periodNameId) {
  const query = `
    SELECT Tenant.*, Room.roomName, BillingPeriod.agreedPrice, Transactionn.date, BillingPeriod.demandNoticeDate,
      BillingPeriod.agreedPrice - IFNULL(SUM(Transactionn.amount), 0) AS owingAmount
    FROM Tenant
    JOIN BillingPeriod ON Tenant.tenantId = BillingPeriod.tenantId
    JOIN Room on BillingPeriod.roomId = Room.roomId
    LEFT JOIN Transactionn ON BillingPeriod.periodId = Transactionn.periodId 
    WHERE BillingPeriod.periodNameId = ? 
      AND Tenant.deleted = 0 
      AND Transactionn.deleted = 0
      AND BillingPeriod.deleted = 0
    GROUP BY Tenant.tenantId
    HAVING owingAmount > 0
  `;
  const params = [periodNameId];
  return executeSelect(query, params);
}

function getTenantsPlusOutstandingBalanceAll(periodNameId) {
  const query = `
    SELECT Tenant.*, Room.roomName,
      BillingPeriod.agreedPrice - IFNULL(SUM(Transactionn.amount), 0) AS owingAmount
    FROM Tenant
    JOIN BillingPeriod ON Tenant.tenantId = BillingPeriod.tenantId
    JOIN Room on BillingPeriod.roomId = Room.roomId
    LEFT JOIN Transactionn ON BillingPeriod.periodId = Transactionn.periodId AND Transactionn.deleted = 0
    WHERE BillingPeriod.periodNameId = ? 
      AND Tenant.deleted = 0 
      AND BillingPeriod.deleted = 0
      AND Room.deleted = 0
    GROUP BY Tenant.tenantId
  `;

  const params = [periodNameId];
  return executeSelect(query, params);
}

async function getFullTenantProfile(tenantId) {
  const fullTenant = await getTenantById(tenantId)
  const periods = await getTenantAllBillingPeriods(tenantId)
  periods.forEach(async period => {
    const transactions = await getTransactionsByBillingPeriod(period.periodId)
    const room = await getRoomById(period.roomId)
    period = { ...period, ...room[0], transactions: transactions }
  })
  fullTenant[0] = { ...fullTenant[0], billingPeriods: periods }
  return fullTenant
}

function searchTenantByName(name) {
  const query = `
    SELECT 
      t.*, 
      r.roomName, 
      r.levelNumber, 
      bpn.name AS billingPeriodName
    FROM Tenant t
    JOIN BillingPeriod bp ON t.tenantId = bp.tenantId
    JOIN Room r ON bp.roomId = r.roomId
    JOIN BillingPeriodName bpn ON bp.periodNameId = bpn.periodNameId
    WHERE t.name LIKE ? AND t.deleted = 0 AND bp.deleted = 0 AND r.deleted = 0
  `;
  return executeSelect(query, [`%${name}%`]);
}

function searchTenantNameAndId(name) {
  const query = `
    SELECT 
      t.tenantId, 
      t.name
    FROM Tenant t
    WHERE t.name LIKE ? AND t.deleted = 0
  `;
  return executeSelect(query, [`%${name}%`]);
}

function getTenantsOfBillingPeriodXButNotY(periodNameId1, periodNameId2) {
  const query = `
    SELECT Tenant.*
    FROM Tenant
    JOIN BillingPeriod bp1 ON Tenant.tenantId = bp1.tenantId
    WHERE bp1.periodNameId = ?
      AND Tenant.deleted = 0
      AND bp1.deleted = 0
      AND Tenant.tenantId NOT IN (
        SELECT bp2.tenantId
        FROM BillingPeriod bp2
        WHERE bp2.periodNameId = ? AND bp2.deleted = 0
      )
  `;
  const params = [periodNameId1, periodNameId2];
  return executeSelect(query, params);
}

function getOlderTenantsThan(periodNameId) {
  let query = `
    SELECT Tenant.*, Room.roomName, 
       BillingPeriod.agreedPrice - IFNULL(SUM(Transactionn.amount), 0) AS owingAmount
    FROM Tenant
    JOIN BillingPeriod ON Tenant.tenantId = BillingPeriod.tenantId
    JOIN Room ON BillingPeriod.roomId = Room.roomId
    JOIN BillingPeriodName ON BillingPeriod.periodNameId = BillingPeriodName.periodNameId
    LEFT JOIN Transactionn ON BillingPeriod.periodId = Transactionn.periodId AND Transactionn.deleted = 0
    WHERE BillingPeriodName.startingDate < (
        SELECT startingDate FROM BillingPeriodName WHERE periodNameId = ?
    )
    AND Tenant.deleted = 0
    AND BillingPeriod.deleted = 0
    AND BillingPeriodName.deleted = 0
    AND Room.deleted = 0
    AND Tenant.tenantId NOT IN (
        SELECT tenantId
        FROM BillingPeriod
        WHERE periodNameId = ?
        AND deleted = 0
    )
    GROUP BY Tenant.tenantId, Room.roomName, BillingPeriod.agreedPrice
    ORDER BY owingAmount DESC, Tenant.name;
  `

  const params = [periodNameId, periodNameId];
  return executeSelect(query, params);
}

async function getTransactionsByPeriodNameIdWithMetaData(periodNameId) {
  const query = `
    SELECT 
      Transactionn.date AS date,
      Transactionn.amount AS amount,
      Tenant.name AS tenantName,
      Tenant.ownContact AS contact,
      Room.roomName AS roomName,
      BillingPeriodName.name AS billingPeriodName,
      BillingPeriod.agreedPrice - IFNULL(SUM(Transactionn.amount), 0) AS owingAmount,
      Transactionn.receiptNumber AS receiptNumber
    FROM Transactionn
    JOIN BillingPeriod ON Transactionn.periodId = BillingPeriod.periodId
    JOIN Tenant ON BillingPeriod.tenantId = Tenant.tenantId
    JOIN Room ON BillingPeriod.roomId = Room.roomId
    JOIN BillingPeriodName ON BillingPeriod.periodNameId = BillingPeriodName.periodNameId
    WHERE BillingPeriod.periodNameId = ?
      AND Transactionn.deleted = 0
      AND BillingPeriod.deleted = 0
      AND Tenant.deleted = 0
      AND Room.deleted = 0
      AND BillingPeriodName.deleted = 0
    GROUP BY Transactionn.transactionId
  `;

  const params = [periodNameId];
  return await executeSelect(query, params);
}

async function dashboardTotals(periodNameId) {

  const totals = {
    totalTenants: 0,
    totalFreeSpaces: 0,
    totalPayments: 0,
    totalOutstanding: 0,
    totalMisc: 0,
    totalPastTenants: 0,
  };

  const queries = {
    totalTenants: `
      SELECT COUNT(*) AS totalTenants
      FROM (
        SELECT Tenant.tenantId
        FROM Tenant
        JOIN BillingPeriod ON Tenant.tenantId = BillingPeriod.tenantId
        JOIN Room ON BillingPeriod.roomId = Room.roomId
        LEFT JOIN Transactionn ON BillingPeriod.periodId = Transactionn.periodId AND Transactionn.deleted = 0
        WHERE BillingPeriod.periodNameId = ? 
          AND Tenant.deleted = 0 
          AND BillingPeriod.deleted = 0
          AND Room.deleted = 0
        GROUP BY Tenant.tenantId
      ) AS groupedRecords;
    `,
    totalFreeSpaces: `
      WITH TotalRoomSpaces AS (
          SELECT COUNT(*) * 2 AS totalSpaces
          FROM Room WHERE Room.deleted = 0
      ),
      OccupiedSpaces AS (
          SELECT SUM(CASE WHEN BillingPeriod.periodType = 'single' THEN 2
                  ELSE 1 END) AS occupiedSpaces
          FROM BillingPeriod WHERE periodNameId = ? AND deleted = 0
      )
      SELECT 
          TotalRoomSpaces.totalSpaces - IFNULL(OccupiedSpaces.occupiedSpaces, 0) AS totalFreeSpaces
      FROM TotalRoomSpaces, OccupiedSpaces;
    `,
    totalPayments: `
      SELECT 
        SUM(Transactionn.amount) AS totalPayments
      FROM Transactionn
      JOIN BillingPeriod ON Transactionn.periodId = BillingPeriod.periodId
      WHERE BillingPeriod.periodNameId = ?
        AND Transactionn.deleted = 0
        AND BillingPeriod.deleted = 0;
    `,
    totalOutstanding: `
        SELECT COALESCE(SUM(BillingPeriod.agreedPrice) - (
            SELECT 
                SUM(Transactionn.amount) 
            FROM 
                Transactionn 
            JOIN 
                BillingPeriod ON Transactionn.periodId = BillingPeriod.periodId 
            WHERE 
                transactionn.deleted = 0 
                AND BillingPeriod.deleted = 0 
                AND BillingPeriod.periodNameId = ?
            ), 0) AS totalOutstanding
        FROM BillingPeriod
        WHERE 
            BillingPeriod.periodNameId = ? 
            AND BillingPeriod.deleted = 0;
    `,
    totalMisc: `
        SELECT 
            COALESCE(SUM(COALESCE(MiscExpense.amount, 0)), 0) AS totalMisc
        FROM 
            MiscExpense
        WHERE 
            MiscExpense.periodNameId = ?
            AND MiscExpense.deleted = 0;
    `,
    totalPastTenants: `
      SELECT COUNT(DISTINCT Tenant.tenantId) as totalPastTenants
      FROM Tenant
      JOIN BillingPeriod ON Tenant.tenantId = BillingPeriod.tenantId
      JOIN Room ON BillingPeriod.roomId = Room.roomId
      JOIN BillingPeriodName ON BillingPeriod.periodNameId = BillingPeriodName.periodNameId
      LEFT JOIN Transactionn ON BillingPeriod.periodId = Transactionn.periodId AND Transactionn.deleted = 0
      WHERE BillingPeriodName.startingDate < (
          SELECT startingDate 
          FROM BillingPeriodName 
          WHERE periodNameId = ?
      )
      AND Tenant.deleted = 0
      AND BillingPeriod.deleted = 0
      AND BillingPeriodName.deleted = 0
      AND Room.deleted = 0
      AND Tenant.tenantId NOT IN (
          SELECT tenantId
          FROM BillingPeriod
          WHERE periodNameId = ?
          AND deleted = 0
      );
    `,
  };
  
  totals.totalTenants = await executeSelect(queries.totalTenants, [periodNameId]);
  totals.totalPayments = await executeSelect(queries.totalPayments, [periodNameId]);
  totals.totalFreeSpaces = await executeSelect(queries.totalFreeSpaces, [periodNameId])
  totals.totalOutstanding = await executeSelect(queries.totalOutstanding, [periodNameId]);
  totals.totalMisc = await executeSelect(queries.totalMisc, [periodNameId]);
  totals.totalPastTenants = await executeSelect(queries.totalPastTenants, [periodNameId, periodNameId]);
  
  totals.totalTenants = totals.totalTenants[0].totalTenants
  totals.totalPayments = totals.totalPayments[0].totalPayments
  totals.totalFreeSpaces = totals.totalFreeSpaces[0].totalFreeSpaces
  totals.totalOutstanding = totals.totalOutstanding[0].totalOutstanding
  totals.totalMisc = totals.totalMisc[0].totalMisc
  totals.totalPastTenants = totals.totalPastTenants[0].totalPastTenants

  return totals;
}

function generateRandomRoomName() {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const number = Math.floor(100 + Math.random() * 900);
  return `${letter}${number}`;
}

async function createDefaultRooms() {
  for (let level = 1; level <= 5; level++) {
    for (let i = 0; i < 40; i++) {
      const roomName = generateRandomRoomName();
      const query = `
        INSERT INTO Room (levelNumber, roomName)
        VALUES (?, ?)
      `;
      const params = [level, roomName];
      try {
        await executeQuery(query, params);
      } catch (error) {
        console.error(`Error creating room ${roomName} on level ${level}:`, error);
      }
    }
  }
}

// createDefaultRooms()

const query1 = `INSERT INTO Tenant (tenantId, name, gender, age, course, ownContact, nextOfKin, kinContact, deleted) VALUES
(1, 'Alice Johnson', 'female', 22, 'Engineering', '1234567001', 'John Johnson', '1234567101', 0),
(2, 'Bob Smith', 'male', 24, 'Physics', '1234567002', 'Emma Smith', '1234567102', 0),
(3, 'Carol Brown', 'female', 23, 'Mathematics', '1234567003', 'James Brown', '1234567103', 0),
(4, 'David Wilson', 'male', 21, 'Chemistry', '1234567004', 'Lily Wilson', '1234567104', 0),
(5, 'Eva Davis', 'female', 22, 'Biology', '1234567005', 'Michael Davis', '1234567105', 0),
(6, 'Frank Miller', 'male', 25, 'Architecture', '1234567006', 'Sophia Miller', '1234567106', 0),
(7, 'Grace Moore', 'female', 20, 'Computer Science', '1234567007', 'Olivia Moore', '1234567107', 0),
(8, 'Henry Taylor', 'male', 23, 'Business', '1234567008', 'Daniel Taylor', '1234567108', 0),
(9, 'Ivy Anderson', 'female', 21, 'Art', '1234567009', 'Ella Anderson', '1234567109', 0),
(10, 'Jack Thomas', 'male', 22, 'History', '1234567010', 'Liam Thomas', '1234567110', 0);`;

const query2 = `INSERT INTO BillingPeriod (periodId, periodNameId, tenantId, roomId, agreedPrice, periodType, deleted) VALUES
(1, 1, 1, 1, 800, 'single', 0),
(2, 1, 2, 2, 1200, 'double', 0),
(3, 1, 3, 3, 1000, 'single', 0),
(4, 2, 4, 4, 1500, 'double', 0),
(5, 2, 5, 5, 700, 'single', 0),
(6, 2, 6, 6, 1100, 'double', 0),
(7, 3, 7, 7, 900, 'single', 0),
(8, 3, 8, 8, 1300, 'double', 0),
(9, 3, 9, 9, 600, 'single', 0),
(10, 3, 10, 10, 1400, 'double', 0);`;

const query3 = `INSERT INTO Transactionn (receiptNumber, periodId, date, amount, deleted) VALUES
(1, 1, '2024-11-01', 400, 0),
(2, 1, '2024-11-02', 400, 0),
(3, 2, '2024-11-02', 600, 0),
(4, 3, '2024-11-03', 500, 0),
(5, 3, '2024-11-04', 500, 0),
(6, 4, '2024-11-05', 1000, 0),
(7, 5, '2024-11-06', 700, 0),
(8, 6, '2024-11-08', 1100, 0),
(9, 7, '2024-11-09', 900, 0),
(10, 8, '2024-11-10', 1300, 0);`;

// setTimeout(async ()=> {await executeQuery(query1)}, 1000)

// setTimeout(async ()=> {await executeQuery(query2)}, 2000)

// setTimeout(async()=>{await executeQuery(query3)}, 4000)
// for (let i = 1; i <= 10; i++) {
//   const ids = [151, 142, 143, 155, 189, 199, 140, 182, 172, 185]
//   updateBillingPeriod(i, { roomId: ids[i - 1] })
// }

module.exports = {
  createAccount,
  createBillingPeriod,
  createBillingPeriodName,
  createDefaultRooms,
  createMiscExpense,
  createRoom,
  createTenant,
  createTransaction,
  dashboardTotals,
  executeQuery,
  executeSelect,
  getAccountById,
  getAccountsDeadAndLiving,
  getAllRooms,
  getAllTenants,
  getAllTenantsNameAndId,
  getBillingPeriodById,
  getBillingPeriodNames,
  getCurrentBillingPeriodName,
  getFullTenantProfile,
  getLevels,
  getMiscExpenseById,
  getMiscExpensesByDate,
  getMiscExpensesForBillingPeriodName,
  getMostRecentTransaction,
  getOlderTenantsThan,
  getOnlyTenantsWithOwingAmt,
  getPotentialTenantRoomsByGender,
  getRoomById,
  getRoomsAndOccupancyByLevel,
  getTenantAllBillingPeriods,
  getTenantById,
  getTenantsByBillingPeriodName,
  getTenantsByLevel,
  getTenantsAndOwingAmtByRoom,
  getTenantsOfBillingPeriodXButNotY,
  getTenantsPlusOutstandingBalanceAll,
  getTransactionById,
  getTransactions,
  getTransactionsByBillingPeriod,
  getTransactionsByBillingPeriodName,
  getTransactionsByPeriodNameIdWithMetaData,
  getUnapprovedAccounts,
  initDb,
  login,
  searchTenantByName,
  searchTenantNameAndId,
  updateAccount,
  updateBillingPeriod,
  updateBillingPeriodName,
  updateMiscExpense,
  updateRoom,
  updateTenant,
  updateTransaction
};

