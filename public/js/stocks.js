document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch data from the API
        const response = await fetch('/api/stocks');
        const data = await response.json();

        // Get the table body element
        const tableBody = document.querySelector('#esg-table tbody');

        // Loop through the data and create table rows
        data.forEach(stock => {
            const row = document.createElement('tr');

            // Create table data for stock symbol
            const symbolCell = document.createElement('td');
            symbolCell.textContent = stock.symbol;
            row.appendChild(symbolCell);

            // Create table data for ESG score
            const esgCell = document.createElement('td');
            esgCell.textContent = stock.total_esg;
            row.appendChild(esgCell);

            // Append the row to the table body
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching stock data:', error);
    }
});
