/* exported formList,psDropdownID,psFormID */
/* eslint-disable no-unused-vars */
//210811 8:57
const proposalS = "Proposal to be used:"

const psFormID = '1ZVxqRKokgqTTfloI_zFBi59Sv7Q2NLDOB6fmoAcLAcE'; // 1. Proposal Start
const poFormID = '1LcRF_WPTZ3bNudX6h_rdTzRARMRl7Rajf4gUR6JKPzA'; // 2. Proposal Overview
const oeFormID = '1eQEOsPOHrrQuHMRKrTghjDggS7wrTWDr4L-YIQntBsk'; // 3. Operating Expenses
const tiFormID = '1sfdyrkMJ1b8oXjetqSjvsZSdcogEfDDKR3J0h8KWh9M'; // 4. Tenant Improvements
const cdFormID = '1JpMiIXViWzTAlXH2xUixtcf2_fPILysw_DAstC0HSn4'; // 5. Create Document Form
const cuFormID = '12QplC1ilFhBUAWeNxi9b9BJoaKg343Z0VhJjKApHhwU'; // 7. Set Current Proposal

const poDropdownID = '357079143';  // used in create document
const poBrokerDropdownID = '1181615854';
const psDropdownID = '1120136627'; // spaces: used in fillSpacesDropdown below 
const cdDropdownID = '1941214219';
const cuDropdownID = '1437097299'; // proposals

const formList = [
  { idx: 1, name: "Proposal Start", short: "Start", id: psFormID },
  { idx: 2, name: "Proposal Overview", short: "Overview", id: poFormID },
  { idx: 3, name: "Operating Expenses", short: "OperatingExpenses", id: oeFormID },
  { idx: 4, name: "Tenant Improvements", short: "TenantImprovements", id: tiFormID },
  { idx: 5, name: "Create Document", short: "CD", id: cdFormID },
  { idx: 7, name: "Set Current Proposal", short: "Current", id: cuFormID }
]