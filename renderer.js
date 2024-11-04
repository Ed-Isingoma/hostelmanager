const sqlite3 = require('sqlite3').verbose();
const {
  createAccount,
  createAdmin,
  createBillingPeriod,
  createBillingPeriodName,
  createDefaultRooms,
  createMiscExpense,
  createRoom,
  createTenant,
  createTransaction,
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
  getMostRecentTransaction,
  getOnlyTenantsWithOwingAmt,
  getRoomById,
  getRoomsAndOccupancyByLevel,
  getTenantAllBillingPeriods,
  getTenantById,
  getTenantsByBillingPeriodName,
  getTenantsByLevel,
  getTenantsByRoomAndOwingAmt,
  getTenantsOfBillingPeriodXButNotY,
  getTenantsPlusOutstandingBalanceAll,
  getTransactionById,
  getTransactions,
  getTransactionsByBillingPeriod,
  getTransactionsByDate,
  getTransactionsByDatewithMetaData,
  getUnapprovedAccounts,
  initDb,
  login,
  searchTenantByName,
  updateAccount,
  updateBillingPeriod,
  updateMiscExpense,
  updateRoom,
  updateTenant,
  updateTransaction
} = require('./dbScript')
async function main() {
  await initDb()
  const adminId = await createAdmin()
  console.log('this is the adminId:', adminId)
  const rooms = await createDefaultRooms()
  console.log('done creating default rooms.',rooms)
}
main()





