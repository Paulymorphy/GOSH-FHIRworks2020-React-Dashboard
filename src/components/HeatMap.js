import React from "react";
import { useEffect } from "react";
import * as ChartGeo from "chartjs-chart-geo";
import { Chart, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";

Chart.register(ChartGeo.ChoroplethController, ChartGeo.ProjectionScale, ChartGeo.ColorScale, ChartGeo.GeoFeature, CategoryScale, LinearScale, Tooltip, Legend);

export default function Heatmap(props) {
    const { Topology } = props;

    useEffect(() => {

        let canvas = document.getElementById("heatmap-canvas").getContext("2d");
        if (!canvas) return;

        // const regions = ChartGeo.topojson
        //     .feature(Topology, Topology.objects.phl)
        //     .features;

        const regions = ChartGeo.topojson
          .feature(Topology.ob1, Topology.ob1.objects.layer)
          .features.filter((item) => item.properties.NAME_0 === 'Germany');

        // const projection = d3.geoConicConformalFrance();
        const countries = ChartGeo.topojson.feature(Topology.ob2, Topology.ob2.objects.continent_Europe_subunits).features;
        const Germany = countries.find((d) => d.properties.geounit === 'Germany');

        const chart = new Chart(canvas, {
            type: 'choropleth',
            labels: regions.map((d) => d.properties.NAME_0),
            data: {
                datasets: [{
                    label: "Hepa B Positive",
                    outline: Germany,
                    data: regions.map((d) => ({
                        feature: d,
                        value: Math.random(),
                    })),
                }]
            },
            options: {
                showOutline: true,
                showGraticule: true,
                plugins: {
                    legend: {
                        display: false,
                    },
                },
                scales: {
                    projection: {
                        axis: 'x',
                        projection: 'equalEarth',
                        padding: 10,
                    },
                },
            }
        });

    }, []);

    return (
        <>
            <div>
                <canvas id="heatmap-canvas"></canvas>
            </div>
        </>
    );
}