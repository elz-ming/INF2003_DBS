// Select the canvas element
const ctx = document.getElementById("portfolio-chart").getContext("2d");

// Create a Pie chart
const portfolioChart = new Chart(ctx, {
  type: "pie", // Change to 'pie' for a pie chart
  data: {
    labels: ["Stock A", "Stock B", "Stock C", "Stock D"], // Labels for each slice of the pie
    datasets: [
      {
        label: "Portfolio Distribution",
        data: [12, 19, 3, 5], // Example data representing values for each stock
        backgroundColor: [
          "rgba(75, 192, 192, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(153, 102, 255, 0.7)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  },
  options: {
    responsive: true, // Makes the chart responsive to the screen size
    plugins: {
      legend: {
        position: "top", // Position the legend at the top
        labels: {
          color: "#fff", // Set legend text color to white
          font: {
            size: 14, // You can also set the font size for the legend
          },
        },
      },
      tooltip: {
        enabled: true, // Enable tooltips to show data on hover
      },
      datalabels: {
        color: "#fff", // Label text color
        font: {
          size: 16, // Label font size
        },
        formatter: (value, context) => {
          // Return the value (or customize it with percentage, etc.)
          return value;
        },
      },
    },
  },
  plugins: [ChartDataLabels], // Register the datalabels plugin
});
