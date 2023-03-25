import React, { Component, useEffect } from "react";
import Header from "../components/Header";
import Overlay from "../components/Overlay";
import { getPatientList, parseAllPatientData, getPHTopology, getHepaBPositive, getHepaCPositive } from "../javascript/api";
import { Result, Button, Row, Col, Card, message, Skeleton } from "antd";

import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js"
import { Doughnut, Bar, Pie } from "react-chartjs-2";
import Heatmap from "../components/HeatMap";

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// const bgColors = [
//     "#FF6384",
//     "#36A2EB",
//     "#FFCE56",
//     "#75daad",
//     "#FF6633",
//     "#FFB399",
//     "#ad62aa",
//     "#ed6663",
//     "#05dfd7",
//     "#ffbd69",
//     "#00a8cc",
//     "#ff677d"
//   ];
const bgColors = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#75daad",
  "#00a8cc",
  "#00a8cc",
  "#00a8cc",
  "#00a8cc",
  "#00a8cc",
  "#00a8cc",
  "#00a8cc",
  "#00a8cc"
];
const bgColorsHover = "#f5e942";

const DisplayCard = ({ children, title }) => {
  return (
    <Card style={{ width: "auto", margin: "10px" }} title={title} hoverable>
      {children}
    </Card>
  );
};

const findOccurence = (data, key) => {
  //ref https://stackoverflow.com/questions/29957390/counting-occurrences-of-object-values
  const occ = data.reduce(function (sums, entry) {
    sums[entry[key]] = (sums[entry[key]] || 0) + 1;
    return sums;
  }, {});
  return occ;
};

const findAgeOccurence = (data, key) => {
  const occ = data.reduce(function (sums, entry) {
    const age = entry[key];
    const ageRange = age - (age % 10);
    sums[ageRange] = (sums[ageRange] || 0) + 1;
    return sums;
  }, {});
  return occ;
};

const findTop = (data, topNum, displayOther, shuffle) => {
  const findSumFuc = (total, num) => {
    return total + num;
  };
  const sum = Object.values(data).reduce(findSumFuc);
  // inspired by https://stackoverflow.com/questions/1069666/sorting-object-property-by-values
  let keysSorted = Object.keys(data).sort((a, b) => {
    return data[b] - data[a];
  });
  keysSorted = keysSorted.slice(0, topNum);
  if (shuffle) {
    console.log(keysSorted);
    keysSorted = keysSorted.sort(function (a, b) {
      return 0.5 - Math.random();
    });
    console.log(keysSorted);
  }
  let topData = {};
  keysSorted.forEach(element => {
    topData[element] = data[element];
  });
  if (displayOther) {
    const rest = sum - Object.values(topData).reduce(findSumFuc);
    topData.other = rest;
  }
  return topData;
};

// const findPatient

class StatisticsPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      patients: null,
      topology: null,
      hapaBPositive: [],
      hapaCPositive: []
    };
  }

  async componentDidMount() {
    // start load api, show loading
    const hideLoading = message.loading("Please wait, fetching patient data...", 0);

    let topology = await getPHTopology();
    let json = await getPatientList(message);
    json = parseAllPatientData(json);

    let hepaBPositive = await getHepaBPositive();
    let hepaCPositive = await getHepaCPositive();

    this.setState({
      patients: json,
      topology: topology,
      hapaBPositive: hepaBPositive,
      hapaCPositive: hepaCPositive
    });

    hideLoading();

  }

  HepaBCPositivePie = () => {
    const hepaB = this.state.hapaBPositive.length;
    const hepaC = this.state.hapaCPositive.length;

    const data = {
      labels: ["Hepa B Positive", "Hepa C Positive"],
      datasets: [{
        data: [hepaB, hepaC],
        backgroundColor: bgColors,
        hoverBackgroundColor: bgColorsHover
      }]
    }

    return <Pie data={data}
      height="350px"
      width="350px"
      options={{ maintainAspectRatio: false }}
    />
  };

  HepaBPositiveByGender = () => {

    let dataRaw = {};

    this.state.hapaBPositive.forEach(condition => {
      let patientID = condition.resource.subject.reference.split("/")[1];
      this.state.patients.forEach(patient => {
        if (patient.id === patientID) {
          if (dataRaw[patient.gender]) {
            dataRaw[patient.gender] = dataRaw[patient.gender] + 1;
          } else {
            dataRaw[patient.gender] = 1;
          }
        }
      });
    });

    // replace undefined by Unspecified for more context
    dataRaw["Unspecified"] = dataRaw[undefined];
    delete dataRaw[undefined];

    const data = {
      labels: Object.keys(dataRaw),
      datasets: [{
        data: Object.values(dataRaw),
        backgroundColor: bgColors,
        hoverBackgroundColor: bgColorsHover
      }]
    }

    return <Pie data={data}
      height="350px"
      width="350px"
      options={{ maintainAspectRatio: false }}
    />
  }

  HepaCPositiveByGender = () => {

    let dataRaw = {};

    this.state.hapaCPositive.forEach(condition => {
      let patientID = condition.resource.subject.reference.split("/")[1];
      this.state.patients.forEach(patient => {
        if (patient.id === patientID) {
          if (dataRaw[patient.gender]) {
            dataRaw[patient.gender] = dataRaw[patient.gender] + 1;
          } else {
            dataRaw[patient.gender] = 1;
          }
        }
      });
    });

    // replace undefined by Unspecified for more context
    dataRaw["Unspecified"] = dataRaw[undefined];
    delete dataRaw[undefined];

    const data = {
      labels: Object.keys(dataRaw),
      datasets: [{
        data: Object.values(dataRaw),
        backgroundColor: bgColors,
        hoverBackgroundColor: bgColorsHover
      }]
    }

    return <Pie data={data}
      height="350px"
      width="350px"
      options={{ maintainAspectRatio: false }}
    />
  }

  HepaPositiveByAgeGroup = () => {

    let bPatient = [];
    this.state.hapaBPositive.forEach(condition => {
      let patientID = condition.resource.subject.reference.split("/")[1];
      this.state.patients.forEach(patient => {
        if (patient.id === patientID) {
          bPatient.push(patient);
        }
      });
    });

    let cPatient = [];
    this.state.hapaCPositive.forEach(condition => {
      let patientID = condition.resource.subject.reference.split("/")[1];
      this.state.patients.forEach(patient => {
        if (patient.id === patientID) {
          cPatient.push(patient);
        }
      });
    });

    let dataset1 = findTop(findAgeOccurence(bPatient, "age"), 10, true);
    let dataset2 = findTop(findAgeOccurence(cPatient, "age"), 10, true);

    let arr1 = Object.keys(dataset1);
    let arr2 = Object.keys(dataset2);
    let labels = arr1.concat(arr2.filter(item => !arr1.includes(item)));
    labels = labels.sort();

    const data = {
      // labels: ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-99"],
      labels: labels,
      datasets: [
        {
          data: Object.values(dataset1),
          backgroundColor: bgColors,
          hoverBackgroundColor: bgColorsHover,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          label: "Hepa B Positive"
        },
        {
          data: Object.values(dataset2),
          backgroundColor: bgColors,
          hoverBackgroundColor: bgColorsHover,
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          label: "Hepa C Positive"
        }
      ]
    }

    return <Bar data={data} />
  }

  HepaB = () => {
    return <Heatmap Topology={this.state.topology} />
  };

  GenderChart = () => {
    const occ = findOccurence(this.state.patients, "gender");
    console.log(occ);
    occ["Unspecified"] = occ[undefined];
    delete occ[undefined];
    const data = {
      labels: Object.keys(occ),
      datasets: [
        {
          data: Object.values(occ),
          backgroundColor: bgColors,
          hoverBackgroundColor: bgColorsHover
        }
      ]
    };
    console.log("GENDER CHART: ", occ);
    return <Doughnut
      data={data}
      height="350px"
      width="350px"
      options={{ maintainAspectRatio: false }}
    />;
  };

  CityChart = () => {
    const occ = findTop(findOccurence(this.state.patients, "city"), 5, false, true);
    console.log(occ);
    occ["Unspecified"] = occ[undefined];
    delete occ[undefined];
    const data = {
      labels: Object.keys(occ),
      datasets: [
        {
          data: Object.values(occ),
          backgroundColor: bgColors,
          hoverBackgroundColor: bgColorsHover,
          label: "City"
        }
      ]
    };
    console.log(occ);
    return <Pie
      data={data}
      height="350px"
      width="350px"
      options={{ maintainAspectRatio: false }}
    />;
  };

  PatientCountPerGroup = () => {
    const occ = findTop(findOccurence(this.state.patients, "organization"), 5, false, true);
    console.log(occ);
    const data = {
      labels: Object.keys(occ),
      datasets: [
        {
          data: Object.values(occ),
          backgroundColor: bgColors,
          hoverBackgroundColor: bgColorsHover
        }
      ]
    };
    console.log(occ);
    return <Pie
      data={data}
      height="350px"
      width="350px"
      options={{ maintainAspectRatio: false }}
    />;
  }

  LanguageChart = () => {
    const occ = findTop(findOccurence(this.state.patients, "language"), 5, true);
    console.log(occ);
    const data = {
      labels: Object.keys(occ),
      datasets: [
        {
          data: Object.values(occ),
          backgroundColor: bgColors,
          hoverBackgroundColor: bgColorsHover
        }
      ]
    };
    console.log(occ);
    return <Pie data={data} />;
  };

  AgeChart = () => {
    const occ = findTop(findAgeOccurence(this.state.patients, "age"), 10, true);
    console.log(occ);
    const data = {
      labels: Object.keys(occ),
      datasets: [
        {
          data: Object.values(occ),
          backgroundColor: bgColors,
          hoverBackgroundColor: bgColorsHover,
          label: "Number of people"
        }
      ]
    };
    console.log(occ);
    return <Bar data={data} />;
  };

  MaritalStatusChart = () => {
    const occ = findOccurence(this.state.patients, "maritalStatus");
    console.log(occ);
    const data = {
      labels: Object.keys(occ),
      datasets: [
        {
          data: Object.values(occ),
          backgroundColor: bgColors,
          hoverBackgroundColor: bgColorsHover,
          label: "Number of people"
        }
      ]
    };
    console.log(occ);
    return <Bar data={data} />;
  };

  BirthMonthChart = () => {
    const occ = findOccurence(this.state.patients, "birthMonth");
    console.log(occ);
    const data = {
      labels: Object.keys(occ),
      datasets: [
        {
          data: Object.values(occ),
          backgroundColor: bgColors,
          hoverBackgroundColor: bgColorsHover,
          label: "Number of people"
        }
      ]
    };
    console.log(occ);
    return <Bar data={data} />;
  };

  render() {
    return (
      <div>
        <Overlay show={!this.state.patients}></Overlay>
        <Header title="Statistics"></Header>
        {this.state.patients ? (
          <div>
            <Row className="statPadding">
              {/* <Col xs={24} sm={24} md={24} lg={12} xl={12}>
                <DisplayCard children={this.HepaB()} title="Viral Hepatitis B & C Positive Heatmap"></DisplayCard>
              </Col> */}
              <Col xs={24} sm={24} md={24} lg={12} xl={12}>
                <DisplayCard children={this.HepaBCPositivePie()} title="Viral Hepatitis B & C Positve"></DisplayCard>
              </Col>
              <Col xs={24} sm={24} md={24} lg={12} xl={12}>
                <DisplayCard children={this.PatientCountPerGroup()} title="Patient per EMR"></DisplayCard>
              </Col>
              <Col xs={24} sm={24} md={24} lg={12} xl={12}>
                <DisplayCard children={this.HepaPositiveByAgeGroup()} title="Hepa Positive By Age Groups"></DisplayCard>
              </Col>
              <Col xs={24} sm={24} md={24} lg={12} xl={12}>
                <DisplayCard children={this.AgeChart()} title="Age Groups"></DisplayCard>
              </Col>
              <Col xs={24} sm={24} md={24} lg={12} xl={12}>
                <DisplayCard children={this.HepaBPositiveByGender()} title="Hepa B Positive By Gender"></DisplayCard>
              </Col>
              <Col xs={24} sm={24} md={24} lg={12} xl={12}>
                <DisplayCard children={this.HepaBPositiveByGender()} title="Hepa C Positive By Gender"></DisplayCard>
              </Col>
              <Col xs={24} sm={24} md={24} lg={12} xl={12}>
                <DisplayCard children={this.GenderChart()} title="Gender"></DisplayCard>
              </Col>
              {/* <Col xs={24} sm={24} md={24} lg={12} xl={12}>
                <DisplayCard children={this.LanguageChart()} title="Top 5 Languages"></DisplayCard>
              </Col> */}
              {/* <Col xs={24} sm={24} md={24} lg={12} xl={12}>
                <DisplayCard
                  children={this.MaritalStatusChart()}
                  title="Marital Status"
                ></DisplayCard>
              </Col> */}
              <Col xs={24} sm={24} md={24} lg={12} xl={12}>
                <DisplayCard children={this.BirthMonthChart()} title="Birth Month"></DisplayCard>
              </Col>
              <Col xs={24} sm={24} md={24} lg={12} xl={12}>
                <DisplayCard children={this.CityChart()} title="Top 5 Cities"></DisplayCard>
              </Col>
            </Row>
          </div>
        ) : (
          <div className="statPadding">
            <Skeleton active />
            <Skeleton active />
            <Skeleton active />
            <Skeleton active />
            <Skeleton active />
          </div>
        )}
      </div>
    );
  }
}

export default StatisticsPage;
