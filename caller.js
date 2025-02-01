const toCamelCase = (str) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

const keyMappings = {
  roomid: "roomId",
  levelnumber: "levelNumber",
  roomname: "roomName",
  accountid: "accountId",
  tenantid: "tenantId",
  owncontact: "ownContact",
  nextofkin: "nextOfKin",
  kincontact: "kinContact",
  periodnameid: "periodNameId",
  startingdate: "startingDate",
  enddate: "endDate",
  costsingle: "costSingle",
  costdouble: "costDouble",
  periodid: "periodId",
  demandnoticedate: "demandNoticeDate",
  agreedprice: "agreedPrice",
  ownstartingdate: "ownStartingDate",
  ownenddate: "ownEndDate",
  periodtype: "periodType",
  transactionid: "transactionId",
  expenseid: "expenseId",
  lastseen: "lastSeen",
  paysmonthly: "paysMonthly",
  owingamount: "owingAmount",
  operatorname: "operatorName",
  totalpasttenants: "totalPastTenants",
  occupancyrate: "occupancyRate",
  billingperiodname: "billingPeriodName",
  tenantname: "tenantName",
  periodname: "periodName",
  totalamount: "totalAmount",
  totaltenants: "totalTenants",
  groupedrecords: "groupedRecords",
  totalfreespaces: "totalFreeSpaces",
  totalpayments: "totalPayments",
  totalmisc: "totalMisc",
  totaloutstanding: "totalOutstanding"
};

function convertKeysToCamelCase(array) {
  return array.map(obj => {
    let newObj = {};
    for (let key in obj) {
      let newKey = keyMappings[key.toLowerCase()] || toCamelCase(key);
      let value = obj[key];

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        value = convertKeysToCamelCase([value])[0]; // Convert nested object
      } else if (Array.isArray(value)) {
        value = value.map(item => 
          typeof item === 'object' && item !== null ? convertKeysToCamelCase([item])[0] : item
        );
      }

      newObj[newKey] = value;
    }
    return newObj;
  });
}


export async function caller(funcName, params = []) {
  const endpoint = import.meta.env.VITE_API_ENDPOINT;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ funcName, params })
  });

  const result = await response.json();

  if (result.data && Array.isArray(result.data)) {
    result.data = convertKeysToCamelCase(result.data);
  }
  
  return result;
}
