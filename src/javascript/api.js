let patientListDemo = require("./patientDemoData.json");
let observationDemo = require("./observationDemoData.json");

// const SERVER_URL = "https://henryz.cc:5001/api/";
const SERVER_URL = "https://up.smilecdr.com:8000/";
const username = process.env.USERNAME || "crtupas";
const password = process.env.PASSWORD || "Christian_08";
const increment = 10;

const moment = require("moment");

const getPatientDemo = () => {
  return combinePatientsBundle(patientListDemo);
};

const getObservationDemo = () => {
  return combinePatientsBundle(observationDemo);
};

function combinePatientsBundle(json) {
  let result = [];
  result = result.concat(json.entry);
  console.log(result);
  return result;
}

function requestObservation(id) {
  return new Promise((resolve, reject) => {
    let headers = new Headers();
    headers.append('Content-Type', 'text/json');
    headers.append('Authorization', 'Basic ' + Buffer.from(username + ":" + password).toString("base64"));
    fetch(SERVER_URL + "Observation/" + id, {
      method: "GET",
      headers: headers
    })
      .then(async res => {
        let json = await res.json();
        console.log(json);
        json = combinePatientsBundle(json);
        resolve(json);
      })
      .catch(e => {
        reject(e);
        console.log(e);
      });
  });
}

function requestPatientList() {
  return new Promise((resolve, reject) => {
    // let localCache = localStorage.getItem("patients");
    // if (localCache) {
    //   setTimeout(() => {
    //     resolve(JSON.parse(localCache));
    //   }, 1000);
    // } else {
    let headers = new Headers();
    headers.append('Content-Type', 'text/json');
    headers.append('Authorization', 'Basic ' + Buffer.from(username + ":" + password).toString("base64"));
    fetch(SERVER_URL + "Patient/?_total=accurate&_count=" + 9999, {
      method: "GET",
      headers: headers
    })
      .then(async res => {
        let rawJson = await res.json();
        console.log(rawJson);
        let json = combinePatientsBundle(rawJson);
        // let total = rawJson.total;
        // let count = rawJson.entry.length;

        // if (count < total) {
        //   let result = await getPages(headers, rawJson, total, count);
        //   json = json.concat(result);
        // }

        localStorage.setItem("patients", JSON.stringify(json));
        resolve(json);
      })
      .catch(e => {
        reject(e);
        console.log(e);
      });
    // }
  });
}

function getPages(headers, json, total, count) {
  return new Promise((resolve, reject) => {
    if (json.link || json.link?.length == 1) {
      return resolve([]);
    }
    fetch(json.link[1].url, {
      method: "GET",
      headers: headers
    }).then(async res => {
      let json = res.json();
      let newCount = count + increment;
      if (newCount < total) {
        let result = await getPages(headers, json, total, newCount);
        return resolve(json.entry.concat(result));
      } else {
        return resolve(json.entry);
      }
    });
  });
}

function getPatientList(message) {
  return new Promise(async resolve => {
    let json = null;
    if (window.$globalPatients) {
      json = window.$globalPatients;
    } else {

      try {
        json = await requestPatientList();
        message.success({ content: "Patient data loaded!", duration: 2 });
      } catch (e) {
        json = getPatientDemo();
        message.warn({
          content: "Network Error, the server might be down. Local demo data is loaded.",
          duration: 5
        });
      }
      window.$globalPatients = json;
    }
    resolve(json);
  });
}

function parseAllPatientData(patients) {
  const tableData = [];
  patients.forEach(elementRaw => {
    if (!elementRaw) {
      return null;
    }
    let element = elementRaw.resource;
    let patient = new Object();
    patient.name = element.name?.[0]?.family + " " + element.name?.[0]?.given?.[0];
    patient.id = element.id;
    patient.phone = element.telecom?.[0]?.value;
    patient.language = element.communication?.[0]?.language?.text;
    patient.maritalStatus = element.maritalStatus?.text;
    // patient.address = element.address?.[0]?.line[0];
    patient.city = element.address?.[0]?.city;
    patient.state = element.address?.[0]?.state;
    patient.country = element.address?.[0]?.country;
    patient.gender = element.gender;
    patient.birthDate = element.birthDate;
    patient.birthMonth = moment(element.birthDate).format("MMMM");
    patient.age = moment().diff(element.birthDate, "years");
    patient.organization = element.managingOrganization?.reference.split("/")[1];
    patient.raw = elementRaw;
    tableData.push(patient);
  });

  return tableData;
}

function requestConditions(patientID) {
  return new Promise((resolve, reject) => {
    let headers = new Headers();
    headers.append('Content-Type', 'text/json');
    headers.append('Authorization', 'Basic ' + Buffer.from(username + ":" + password).toString("base64"));
    fetch(SERVER_URL + "Condition/?subject=Patient/" + patientID, {
      method: "GET",
      headers: headers
    })
      .then(async res => {
        let json = await res.json();
        console.log(json);
        json = combinePatientsBundle(json);
        // localStorage.setItem("conditions", JSON.stringify(json));
        resolve(json);
      })
      .catch(e => {
        reject(e);
        console.log(e);
      });
  });
}

function getConditions(message) {
  return new Promise((resolve, reject) => {
    let json = [];
    if (window.$globalConditions) {
      json = window.$globalConditions;
    } else {
      const hideLoading = message.loading("Please wait, fetching condition data...", 0);
      try {
        let patientJSON = localStorage.getItem("patients");
        patientJSON.forEact(async x => {
          let result = await requestConditions(x.id);
          json.concat(result);
        });
        message.success({ content: "Condition data loaded!", duration: 2 });
      } catch (e) {
        json = getPatientDemo();
        message.warn({
          content: "Network Error, the server might be down. Local demo data is loaded.",
          duration: 5
        });
        return reject(e);
      }
      hideLoading();
    }
    return resolve(json);
  });
};

function getHepaCPositive() {
  return new Promise((resolve, reject) => {
    let headers = new Headers();
    headers.append('Content-Type', 'text/json');
    headers.append('Authorization', 'Basic ' + Buffer.from(username + ":" + password).toString("base64"));
    fetch("https://up.smilecdr.com:8000/Condition/?_format=json&code=314706002&_count=1000&_total=accurate", {
      method: "GET",
      headers: headers
    }).then(r => r.json()).then(data => {
      return resolve(data.entry);
    }).catch(e => {
      reject(e);
    });
  });
}

function getHepaBPositive() {
  return new Promise((resolve, reject) => {
    let headers = new Headers();
    headers.append('Content-Type', 'text/json');
    headers.append('Authorization', 'Basic ' + Buffer.from(username + ":" + password).toString("base64"));
    fetch("https://up.smilecdr.com:8000/Condition/?_format=json&code=165806002&_count=1000&_total=accurate", {
      method: "GET",
      headers: headers
    }).then(r => r.json()).then(data => {
      return resolve(data.entry);
    }).catch(e => {
      reject(e);
    });
  });
}

function getPHTopology() {
  return new Promise((resolve, reject) => {
    const a = fetch("https://raw.githubusercontent.com/deldersveld/topojson/master/continents/europe.json").then((r) => r.json());
    const b = fetch("https://raw.githubusercontent.com/deldersveld/topojson/master/countries/germany/dach-states.json").then((r) => r.json());

    Promise.all([b, a]).then(data => {
      return resolve({
        ob1: data[0],
        ob2: data[1]
      });
    })

    // fetch("https://raw.githubusercontent.com/markmarkoh/datamaps/master/src/js/data/phl.topo.json")
    //   .then(r => r.json()).then(ph => {
    //     return resolve(ph)
    // }).catch(e => reject(e));
  });
}

export {
  requestPatientList,
  requestObservation,
  getPatientDemo,
  getObservationDemo,
  getConditions,
  parseAllPatientData,
  getPatientList,
  getPHTopology,
  getHepaBPositive,
  getHepaCPositive
};
