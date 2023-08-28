import addressAPI from './addressAPI.js';
import { address, myError } from './model.js';

const addressForm = document.getElementById('address-form');
const clearBtn = document.getElementById('clear');
const outputBpost = document.getElementById('output-bpost');
const thRegSource = document.getElementById('thead-regional-source');
const tbRegSource = document.getElementById('tbody-regional-source');
const alertRegionalSource = document.getElementById('alert-regional-source');
const thBpostSource = document.getElementById('thead-bpost');
const tbBpostSource = document.getElementById('tbody-bpost');
const thBpostError = document.getElementById('thead-bpost-error');
const tbBpostError = document.getElementById('tbody-bpost-error');
const alertBpostSource = document.getElementById('alert-bpost');

let regSource = [];
let bpost = [];


function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function addHeaderElementToTR(tr, headerTxt) {
  const headerElement = document.createElement('th');
  headerElement.textContent = headerTxt;
  tr.appendChild(headerElement);
}

function addCellToRow(row, cellText) {
  const cellElement = document.createElement('td');
  cellElement.textContent = cellText;
  row.appendChild(cellElement);
}

function addRowElementToTable(tr, rowTxts) {
  const rowElement = document.createElement('tr');
  rowTxts.forEach((rowTxt) =>
    addCellToRow(rowElement, rowTxt)
  )
  tr.appendChild(rowElement);
}

function addParagraphToNode(node, paragraphText) {
  const paragraph = document.createElement('p');
  paragraph.textContent = paragraphText;
  node.appendChild(paragraph);
}

function displayAddressesBpost(addressList, errorList) {
  console.log(addressList);
  console.log(errorList);
  if (addressList.length > 0) {
    const rowHeadElement = document.createElement('tr');
    addHeaderElementToTR(rowHeadElement, 'Complete Address');
    thBpostSource.appendChild(rowHeadElement);
    addressList.forEach((address) => {
      const rowTxts = [address.completeAddress];
      addRowElementToTable(tbBpostSource, rowTxts);
    })
  }
  if (errorList.length > 0) {
    const rowHeadElementError = document.createElement('tr');
    addHeaderElementToTR(rowHeadElementError, 'Error/Warning');
    thBpostError.appendChild(rowHeadElementError);
    errorList.forEach((error) => {
      const rowTxts = [`${error.severity} : ${error.message}`]
      addRowElementToTable(tbBpostError, rowTxts);
    })
  }
}

function displayAddressesRegSource(addressList, errorList) {
  if (errorList.length !== 0) {
    errorList.forEach((error) => {
      addParagraphToNode(alertRegionalSource, `${error.severity} : ${error.message}`);
    })
  } else {
    const rowHeadElement = document.createElement('tr');
    addHeaderElementToTR(rowHeadElement, 'ID');
    addHeaderElementToTR(rowHeadElement, 'Status');
    addHeaderElementToTR(rowHeadElement, 'Complete Address');
    thRegSource.appendChild(rowHeadElement);
    console.log(thRegSource);
    // const rowBodyElement = document.createElement('tr');
    addressList.forEach((address) => {
      const rowTxts = [address.id, address.status, address.completeAddress];
      addRowElementToTable(tbRegSource, rowTxts);
    })
    //tbRegSource.appendChild(rowBodyElement);
    //console.log(tbRegSource);
  }
}

function clearAllOutput() {
  removeAllChildNodes(thRegSource);
  removeAllChildNodes(tbRegSource);
  removeAllChildNodes(alertRegionalSource);
  removeAllChildNodes(thBpostSource);
  removeAllChildNodes(tbBpostSource);
  removeAllChildNodes(thBpostError);
  removeAllChildNodes(tbBpostError);
  removeAllChildNodes(alertBpostSource);

}

async function onAddressValidateSubmit(e) {
  e.preventDefault();
  clearAllOutput();
  const addressToValidate = new address();
  addressToValidate.municpalityName = document.getElementById('mun-input').value;
  addressToValidate.postalCd = document.getElementById('pc-input').value;
  addressToValidate.streetNm = document.getElementById('str-input').value;
  addressToValidate.houseNr = document.getElementById('hnr-input').value;
  const region = document.querySelector('input[name="region"]:checked').value
  console.log(region);
  switch (region) {
    case 'Flanders':
      regSource = await addressAPI.validateAddress(addressToValidate, 'Flanders');
      break;
    case 'Brussels':
      regSource = await addressAPI.validateAddress(addressToValidate, 'Brussels');
      break;
    case 'Wallonia':
      regSource = await addressAPI.validateAddress(addressToValidate, 'Wallonia');
      break;
    default:
      console.log('A region must be selected');
  }

  bpost = await addressAPI.validateAddress(addressToValidate, 'Bpost');
  //console.log(bpost);
  console.log(regSource);
  displayAddressesRegSource(regSource.addresses, regSource.errors);
  displayAddressesBpost(bpost.addresses, bpost.errors);
}


function onClearAll(e) {
  e.preventDefault();
  clearAllOutput();
  addressForm.reset();
}

function init() {
  // Event Listeners
  addressForm.addEventListener('submit', onAddressValidateSubmit);
  clearBtn.addEventListener('click', onClearAll);
}

init();
/*
const searchAddress = new address();
searchAddress.municpalityName = 'Verviers';
searchAddress.postalCd = ''
searchAddress.streetNm = 'Rue des Chapeliers';
searchAddress.houseNr = '88';
console.log(searchAddress);
//searchAddress.postalCd = '';

const myAddresses = await addressAPI.validateAddress(searchAddress, 'Flanders');
console.log(myAddresses);
const addressDetails = await addressAPI.getAddressDetails(myAddresses.addresses[0].objectId);
console.log(addressDetails);

//const bpostDetails = await addressAPI.validateAddress(searchAddress, 'Bpost');
//console.log(bpostDetails);
const wallonia = await addressAPI.validateAddress(searchAddress, 'Wallonia');
console.log(wallonia);
*/


