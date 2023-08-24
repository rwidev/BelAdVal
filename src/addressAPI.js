import { address, myError } from './model.js';

class addressAPI {

  static async #validateBrusselsAddress(address) {
    let aList = [];
    let errors = [];
    let addresses = [];
    const urlBrussels = new URL("https://geoservices-urbis.irisnet.be/geoserver/ows")
    const params = new URLSearchParams();
    params.append("service", "wfs");
    params.append("request", "GetFeature");
    params.append("typeNames", "UrbisAdm:Adpt");
    params.append("outputFormat", "application/json");
    if (address.postalCd) {
      params.append("filter",
        `<Filter xmlns="http://www.opengis.net/ogc"> <And> <PropertyIsEqualTo><PropertyName>PN_NAME_DUT</PropertyName><Literal>${address.streetNm.charAt(0).toUpperCase() + address.streetNm.slice(1)}</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>MU_NAME_DUT</PropertyName><Literal>${address.municpalityName.charAt(0).toUpperCase() + address.municpalityName.slice(1)}</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>PZ_NATIONAL_CODE</PropertyName><Literal>${address.postalCd}</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>ADPT_ADRN</PropertyName><Literal>${address.houseNr}</Literal></PropertyIsEqualTo></And></Filter>`);
    } else {
      params.append("filter",
        `<Filter xmlns="http://www.opengis.net/ogc"> <And> <PropertyIsEqualTo><PropertyName>PN_NAME_DUT</PropertyName><Literal>${address.streetNm.charAt(0).toUpperCase() + address.streetNm.slice(1)}</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>MU_NAME_DUT</PropertyName><Literal>${address.municpalityName.charAt(0).toUpperCase() + address.municpalityName.slice(1)}</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>ADPT_ADRN</PropertyName><Literal>${address.houseNr}</Literal></PropertyIsEqualTo></And></Filter>`);
    }
    try {
      const res = await fetch(urlBrussels + '?' + params);
      const data = await res.json();
      if (!res.ok) {
        const anError = new myError();
        anError.id = res.status
        anError.message = 'API returned an error';
        anError.severity = 'Error';
        errors.push(anError);
        return { addresses, errors };
      }
      aList = data.features;
      console.log(aList);
      if (aList.length === 0) {
        const anError = new myError();
        anError.message = 'Not a valid Address.'
        anError.severity = 'Error';
        errors.push(anError);
        return { addresses, errors };
      } else {
        aList.forEach((a) => {
          const caNL = `${a.properties.PN_NAME_DUT} ${a.properties.ADPT_ADRN} ${a.properties.MZ_NATIONAL_CODE}  ${a.properties.MU_NAME_DUT}`
          const validAddressNL = {
            id: a.properties.ADPT_INSPIRE_ID,
            objectId: a.properties.ADPT_ID,
            municipalityId: a.properties.MU_INSPIRE_ID,
            municpalityName: a.properties.MU_NAME_DUT,
            streetId: a.properties.PN_INSPIRE_ID,
            streetNm: a.properties.PN_NAME_DUT,
            postalCd: a.properties.MZ_NATIONAL_CODE,
            houseNr: a.properties.ADPT_ADRN,
            boxNr: null,
            status: null,
            versionId: null,
            languageCd: 'NL',
            completeAddress: caNL,
            xPos: null,
            yPos: null,
          }
          addresses.push(validAddressNL);
          const caFR = `${a.properties.PN_NAME_FRE} ${a.properties.ADPT_ADRN} ${a.properties.MZ_NATIONAL_CODE}  ${a.properties.MU_NAME_FRE}`
          const validAddressFR = {
            id: a.properties.ADPT_INSPIRE_ID,
            objectId: a.properties.ADPT_ID,
            municipalityId: a.properties.MU_INSPIRE_ID,
            municpalityName: a.properties.MU_NAME_FRE,
            streetId: a.properties.PN_INSPIRE_ID,
            streetNm: a.properties.PN_NAME_FRE,
            postalCd: a.properties.MZ_NATIONAL_CODE,
            houseNr: a.properties.ADPT_ADRN,
            boxNr: null,
            status: null,
            versionId: null,
            languageCd: 'NL',
            completeAddress: caFR,
            xPos: null,
            yPos: null,
          }
          addresses.push(validAddressFR);
        })
      }
      return { addresses, errors };
    } catch (error) {
      const anError = new myError();
      console.log(error);
      anError.id = null;
      anError.message = error;
      anError.severity = 'Error';
      errors.push(anError);
      return { addresses, errors };
    }
  }

  static async #validateWalloniaAddress(address) {
    const urlWallonia = new URL("https://geoservices.wallonie.be/geocodeWS/geocode");
    let errors = [];
    let addresses = [];
    const params = new URLSearchParams();
    params.append("id", 1);
    params.append("city", address.municpalityName);
    params.append("street", address.streetNm);
    params.append("house", address.houseNr);
    params.append("nap", "closest");
    params.append("bbox", "false");
    params.append("geom", "true");
    params.append("crs", "EPSG:31370");
    try {
      const res = await fetch(urlWallonia + '?' + params);
      const data = await res.json();
      if (!res.ok) {
        console.log('res not ok');
        const anError = new myError();
        anError.id = res.status
        anError.message = 'API returned an error';
        anError.severity = 'Error';
        errors.push(anError);
        return { addresses, errors };
      }
      const candidates = data.candidates;
      const exactMatches = candidates.filter((exactMatch) => {
        return exactMatch.score === 111;
      })
      if (exactMatches.length === 0) {
        const anError = new myError();
        anError.message = 'Not a valid Address.'
        anError.severity = 'Error';
        errors.push(anError);
        return { addresses, errors };
      } else {
        addresses = exactMatches.map((a) => {
          let b = null;
          let ca = null;
          if ("box" in a) {
            b = a.box.name;
            ca = `${a.street.name} ${a.house.name} box ${a.box.name} ${a.zone.ident} ${a.city.name}`
          } else ca = `${a.street.name} ${a.house.name} ${a.zone.ident} ${a.city.name}`
          return {
            id: a.house.ident,
            objectId: a.house.ident,
            municipalityId: null,
            municpalityName: a.city.name,
            streetId: null,
            streetNm: a.street.name,
            postalCd: null,
            houseNr: a.house.name,
            boxNr: b,
            status: null,
            versionId: null,
            languageCd: null,
            completeAddress: ca,
            xPos: null,
            yPos: null,
          }
        })
      }
      return { addresses, errors };
    } catch (error) {
      const anError = new myError();
      console.log(error);
      anError.id = null;
      anError.message = error;
      anError.severity = 'Error';
      errors.push(anError);
      return { addresses, errors };
    }
  }

  static async #validateBpostAddress(address) {
    const urlBpost = new URL("https://webservices-pub.bpost.be/ws/ExternalMailingAddressProofingCSREST_v1/address/validateAddresses");
    let errors = [];
    let addresses = [];
    const requestBody = {
      "ValidateAddressesRequest": {
        "AddressToValidateList": {
          "AddressToValidate": [
            {
              "@id": "1",
              "PostalAddress": {
                "DeliveryPointLocation": {
                  "StructuredDeliveryPointLocation": {
                    "StreetName": address.streetNm,
                    "StreetNumber": address.houseNr
                  }
                },
                "PostalCodeMunicipality": {
                  "StructuredPostalCodeMunicipality": {
                    "PostalCode": address.postalCd,
                    "MunicipalityName": address.municpalityName
                  }
                },
                "CountryName": "Belgique"
              },
              "DispatchingCountryISOCode": "BE",
              "DeliveringCountryISOCode": "BE"
            }
          ]
        },
        "ValidateAddressOptions": {
          "IncludeFormatting": true,
          "IncludeSuggestions": true,
          "IncludeSubmittedAddress": true,
          "IncludeDefaultGeoLocation": true,
          "IncludeListOfBoxes": true,
          "IncludeNumberOfBoxes": true
        },
        "CallerIdentification": {
          "CallerName": "wise"
        }
      }
    };
    try {
      console.log(requestBody);
      const res = await fetch(urlBpost, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) {
        const anError = new myError();
        anError.id = res.status
        anError.message = 'API returned an error';
        anError.severity = 'Error';
        errors.push(anError);
        return { addresses, errors };

      }
      //console.log(data);
      const bpostList = data.ValidateAddressesResponse.ValidatedAddressResultList;
      console.log(bpostList);

      bpostList.ValidatedAddressResult.forEach((result) => {
        if ("Error" in result) {
          result.Error.forEach((error) => {
            const anError = new myError();
            anError.id = '';
            anError.message = `${error.ErrorCode} in ${error.ComponentRef} `;
            anError.severity = error.ErrorSeverity;
            errors.push(anError);
          })
        }
        result.ValidatedAddressList.ValidatedAddress.forEach((validatedAddress) => {
          let munNm = null;
          let strNm = null;
          let pc = null;
          let hnr = null;
          let lang = null;
          let lbl = null;
          if ("StructuredPostalCodeMunicipality" in validatedAddress.PostalAddress) {
            if ("MunicipalityName" in validatedAddress.PostalAddress.StructuredPostalCodeMunicipality)
              munNm = validatedAddress.PostalAddress.StructuredPostalCodeMunicipality.MunicipalityName;

            if ("PostalCode" in validatedAddress.PostalAddress.StructuredPostalCodeMunicipality)
              pc = validatedAddress.PostalAddress.StructuredPostalCodeMunicipality.PostalCode;
          }
          if ("StructuredDeliveryPointLocation" in validatedAddress.PostalAddress) {
            if ("StreetName" in validatedAddress.PostalAddress.StructuredDeliveryPointLocation)
              strNm = validatedAddress.PostalAddress.StructuredDeliveryPointLocation.StreetName;
            if ("StreetNumber" in validatedAddress.PostalAddress.StructuredDeliveryPointLocation)
              hnr = validatedAddress.PostalAddress.StructuredDeliveryPointLocation.StreetNumber;
          }
          if ("AddressLanguage" in validatedAddress) {
            lang = validatedAddress.AddressLanguage;
          }
          if ("Label" in validatedAddress) {
            lbl = validatedAddress.Label.Line.join(' ');
          }
          if (lbl === null) {
            if (strNm !== null)
              lbl = strNm;
            if (hnr !== null)
              lbl = lbl + " " + hnr;
            if (pc !== null)
              lbl = lbl + " " + pc;
            if (munNm !== null)
              lbl = lbl + " " + munNm;
          }
          const validAddress = {
            id: null,
            objectId: null,
            municipalityId: null,
            MunicipalityName: munNm,
            streetId: null,
            streetNm: strNm,
            postalCd: pc,
            houseNr: hnr,
            boxNr: null,
            status: null,
            versionId: null,
            languageCd: lang,
            completeAddress: lbl,
            xPos: null,
            yPos: null,
          };
          addresses.push(validAddress);
          if ("ServicePointBoxList" in validatedAddress) {  // ValidatedAddressResult[0].ValidatedAddressList.ValidatedAddress[0].ServicePointBoxList
            validatedAddress.ServicePointBoxList.ServicePointBoxResult.forEach((boxNr) => {
              const validAddress = {
                id: null,
                objectId: null,
                municipalityId: null,
                MunicipalityName: munNm,
                streetId: null,
                streetNm: strNm,
                postalCd: pc,
                houseNr: hnr,
                boxNr: boxNr.BoxNumber,
                status: null,
                versionId: null,
                languageCd: lang,
                completeAddress: strNm + ' ' + hnr + ' box ' + boxNr.BoxNumber + ' ' + pc + ' ' + munNm,
                xPos: null,
                yPos: null,
              };
              addresses.push(validAddress);
            })
          }

        })

      })
      return { addresses, errors };
    }
    catch (error) {
      const anError = new myError();
      console.log('error catched');
      // console.log(error);
      anError.id = null;
      anError.message = error;
      anError.severity = 'Error';
      errors.push(anError);
      return { addresses, errors };
    }

  }
  static async #validateFlandersAddress(address) {
    let aList = [];
    let errors = [];
    let addresses = [];
    const urlFlanders = new URL("https://api.basisregisters.vlaanderen.be/v2/adressen")
    const params = new URLSearchParams();
    params.append("gemeentenaam", address.municpalityName);
    params.append("postcode", address.postalCd);
    params.append("straatnaam", address.streetNm);
    params.append("huisnummer", address.houseNr);
    try {
      const res = await fetch(urlFlanders + '?' + params);
      const data = await res.json();
      if (!res.ok) {
        const anError = new myError();
        anError.id = res.status
        anError.message = 'API returned an error';
        anError.severity = 'Error';
        errors.push(anError);
        return { addresses, errors };
      }
      aList = data.adressen;
      if (aList.length === 0) {
        const anError = new myError();
        anError.message = 'Not a valid Address.'
        anError.severity = 'Error';
        errors.push(anError);
        return { addresses, errors };
      } else {
        addresses = aList.map((a) => {
          return {
            id: a.identificator.id,
            objectId: a.identificator.objectId,
            municipalityId: null,
            municpalityName: null,
            streetId: null,
            streetNm: null,
            postalCd: null,
            houseNr: null,
            boxNr: null,
            status: a.adresStatus,
            versionId: a.identificator.versieId,
            languageCd: a.volledigAdres.geografischeNaam.taal,
            completeAddress: a.volledigAdres.geografischeNaam.spelling,
            xPos: null,
            yPos: null,
          }
        })
      }
      return { addresses, errors };
    } catch (error) {
      const anError = new myError();
      console.log(error);
      anError.id = null;
      anError.message = error;
      anError.severity = 'Error';
      errors.push(anError);
      return { addresses, errors };
    }
  }

  static async #getFlandersAddressDetails(objectId) {
    let errors = [];
    let addresses = [];
    const urlFlanders = new URL("https://api.basisregisters.vlaanderen.be/v2/adressen/")
    try {
      const res = await fetch(urlFlanders + objectId);
      const data = await res.json();
      if (!res.ok) {
        const anError = new myError();
        anError.id = res.status
        anError.message = 'API returned an error';
        anError.severity = 'Error';
        errors.push(anError);
        return { addresses, errors };
      }
      console.log(data);
      const a = new address;
      a.id = data.identificator.id;
      a.objectId = data.identificator.objectId;
      a.municipalityId = data.gemeente.objectId;
      a.municpalityName = data.gemeente.gemeentenaam.geografischeNaam.spelling;
      a.streetId = data.straatnaam.objectId;
      a.streetNm = data.straatnaam.straatnaam.geografischeNaam.spelling;
      a.postalCd = data.postinfo.objectId;
      a.houseNr = data.huisnummer;
      a.boxNr = data.busnummer;
      a.status = data.adresStatus;
      a.versionId = data.identificator.versieId;
      a.languageCd = data.volledigAdres.geografischeNaam.taal;
      a.completeAddress = data.volledigAdres.geografischeNaam.spelling;
      a.xPos = data.test;
      a.yPos = null;
      addresses.push(a);
      return { addresses, errors };
    } catch (error) {
      const anError = new myError();
      console.log(error);
      anError.id = null;
      anError.message = error;
      anError.severity = 'Error';
      errors.push(anError);
      return { addresses, errors };
    }
  }


  static validateAddress(address, source) {
    switch (source) {
      case 'Flanders':
        return this.#validateFlandersAddress(address);
      case 'Wallonia':
        return this.#validateWalloniaAddress(address);
      case 'Bpost':
        return this.#validateBpostAddress(address);
      case 'Brussels':
        return this.#validateBrusselsAddress(address);
      default: console.log('A correct source must be given');
    }
  }

  static getAddressDetails(objectId, source) {
    const addresses = this.#getFlandersAddressDetails(objectId);
    return addresses;
  }


}

export default addressAPI;

/*
<Filter xmlns="http://www.opengis.net/ogc">
    <And>
        <PropertyIsEqualTo><PropertyName>PN_NAME_DUT</PropertyName><Literal>Steenstraat</Literal>
        </PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>MU_NAME_DUT</PropertyName><Literal>Brussel</Literal></PropertyIsEqualTo>
        <PropertyIsEqualTo><PropertyName>PZ_NATIONAL_CODE</PropertyName><Literal>1000</Literal></PropertyIsEqualTo>
        <PropertyIsEqualTo><PropertyName>ADPT_ADRN</PropertyName><Literal>3</Literal></PropertyIsEqualTo>
    </And>
</Filter>

<Filter xmlns="http://www.opengis.net/ogc">
    <And>
        <PropertyIsEqualTo><PropertyName>PN_NAME_DUT</PropertyName><Literal>Steenstraat</Literal>
        </PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>MU_NAME_DUT</PropertyName><Literal>Brussel</Literal></PropertyIsEqualTo>
        <PropertyIsEqualTo><PropertyName>ADPT_ADRN</PropertyName><Literal>3</Literal></PropertyIsEqualTo>
    </And>
</Filter>

*/