// Wait until the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function () {
    // Get references to the DOM elements we'll interact with
    const baseCurrencySelect = document.getElementById('base-currency');
    const targetCurrencySelect = document.getElementById('target-currency');
    const amountInput = document.getElementById('amount');
    const convertedAmountSpan = document.getElementById('converted-amount');
    const historicalRatesButton = document.getElementById('historical-rates');
    const historicalRatesContainer = document.getElementById('historical-rates-container');
    const saveFavoriteButton = document.getElementById('save-favorite');
    const favoriteCurrencyPairsContainer = document.getElementById('favorite-currency-pairs');
    const clearFavoritesButton = document.getElementById('clear-favorites'); // New button for clearing favorites
    const historicalDateInput = document.getElementById('date'); // Date input for historical rates

    // API key and base URL for currency API
    const apiKey = 'fca_live_pNBeXHRg6EGbIiJO0wQaCRBzzgyNAbcoDPzfRMqw';
    const apiBaseUrl = 'https://api.freecurrencyapi.com/v1';

    // Set the maximum date to today
    const today = new Date().toISOString().split('T')[0];
    historicalDateInput.setAttribute('max', today);

    // Set the minimum date to January 1, 1999
    const minDate = '1999-01-01';
    historicalDateInput.setAttribute('min', minDate);

    // Function to fetch available currencies from the API
    async function fetchCurrencies() {
        try {
            // Fetch the list of available currencies
            const response = await fetch(`${apiBaseUrl}/currencies`, {
                headers: {
                    'apikey': apiKey
                }
            });
            // Parse the JSON response
            const data = await response.json();
            // Extract currency codes from the response
            const currencies = Object.keys(data.data);
            // Populate the currency select elements with the fetched currencies
            populateCurrencySelect(baseCurrencySelect, currencies);
            populateCurrencySelect(targetCurrencySelect, currencies);
        } catch (error) {
            console.error('Error fetching currencies:', error);
        }
    }

    // Populate a <select> element with currency options
    function populateCurrencySelect(selectElement, currencies) {
        currencies.forEach(currency => {
            const option = document.createElement('option');
            option.value = currency;
            option.textContent = currency;
            selectElement.appendChild(option);
        });
    }

    // Function to fetch the exchange rate between two currencies
    async function fetchExchangeRate(baseCurrency, targetCurrency) {
        try {
            // Fetch the latest exchange rate for the base currency
            const response = await fetch(`${apiBaseUrl}/latest?base_currency=${baseCurrency}`, {
                headers: {
                    'apikey': apiKey
                }
            });
            // Parse the JSON response
            const data = await response.json();
            // Return the exchange rate for the target currency
            return data.data[targetCurrency];
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
        }
    }

    // Convert the amount from the base currency to the target currency
    async function convertCurrency() {
        const baseCurrency = baseCurrencySelect.value;
        const targetCurrency = targetCurrencySelect.value;
        const amount = amountInput.value;

        // If both currencies are the same, no conversion is needed
        if (baseCurrency === targetCurrency) {
            convertedAmountSpan.textContent = `${amount} ${targetCurrency}`;
            return;
        }

        try {
            // Fetch the exchange rate
            const rate = await fetchExchangeRate(baseCurrency, targetCurrency);
            // Calculate the converted amount
            const convertedAmount = (amount * rate).toFixed(2);
            // Display the converted amount
            convertedAmountSpan.textContent = `${convertedAmount} ${targetCurrency}`;
        } catch (error) {
            console.error('Error converting currency:', error);
        }
    }

    // Function to fetch historical exchange rates
    async function fetchHistoricalRates(baseCurrency, targetCurrency, date) {
        try {
            // Fetch historical exchange rates for the given date and currency pair
            const response = await fetch(`${apiBaseUrl}/historical?apikey=${apiKey}&date=${date}&base_currency=${baseCurrency}&currencies=${targetCurrency}`);

            if (!response.ok) {
                const errorData = await response.json();
                console.error(`API request failed with status ${response.status}`, errorData);
                throw new Error(`API request failed with status ${response.status}`);
            }

            // Parse the JSON response
            const data = await response.json();
            console.log(data); // Log the full response for debugging

            // Access the rate correctly from the nested structure
            if (!data.data || !data.data[date] || !data.data[date][targetCurrency]) {
                throw new Error(`Historical data for ${baseCurrency} to ${targetCurrency} on ${date} not found.`);
            }

            // Return the historical exchange rate
            return data.data[date][targetCurrency];
        } catch (error) {
            console.error('Error fetching historical rates:', error);
            throw error;
        }
    }

    // Display historical exchange rates
    async function displayHistoricalRates() {
        const baseCurrency = baseCurrencySelect.value;
        const targetCurrency = targetCurrencySelect.value;
        const date = historicalDateInput.value; // Get date from input
        try {
            // Fetch and display the historical exchange rate
            const rate = await fetchHistoricalRates(baseCurrency, targetCurrency, date);
            historicalRatesContainer.textContent = `Historical exchange rate on ${date}: 1 ${baseCurrency} = ${rate} ${targetCurrency}`;
        } catch (error) {
            historicalRatesContainer.textContent = `Error: ${error.message}`;
        }
    }

    // Save the selected currency pair as a favorite
    async function saveFavoriteCurrencyPair() {
        const baseCurrency = baseCurrencySelect.value;
        const targetCurrency = targetCurrencySelect.value;
        try {
            // Send a POST request to save the favorite currency pair
            await fetch('/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ baseCurrency, targetCurrency }) // Send data as JSON
            });
            // Update the displayed list of favorite currency pairs
            displayFavoriteCurrencyPairs();
        } catch (error) {
            console.error('Error saving favorite currency pair:', error);
        }
    }

    // Clear all saved favorite currency pairs
    async function clearAllFavorites() {
        try {
            console.log('Clearing all favorites'); // Log the action
            // Send a DELETE request to clear all favorites
            const response = await fetch('/api/favorites', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Failed to clear favorites');
            }
            // Update the displayed list of favorite currency pairs
            displayFavoriteCurrencyPairs();
        } catch (error) {
            console.error('Error clearing all favorite currency pairs:', error);
        }
    }

    // Display all saved favorite currency pairs
    async function displayFavoriteCurrencyPairs() {
        try {
            // Fetch the list of favorite currency pairs
            const response = await fetch('/api/favorites');
            // Parse the JSON response
            const favoritePairs = await response.json();
            favoriteCurrencyPairsContainer.innerHTML = ''; // Clear the container
            favoritePairs.forEach(pair => {
                const div = document.createElement('div');
                div.classList.add('favorite-pair'); // Add class for styling

                const button = document.createElement('button');
                button.classList.add('btn', 'btn-outline-secondary', 'btn-block', 'mb-2'); // Add Bootstrap classes for styling
                button.textContent = `${pair.baseCurrency}/${pair.targetCurrency}`;
                button.addEventListener('click', () => {
                    baseCurrencySelect.value = pair.baseCurrency;
                    targetCurrencySelect.value = pair.targetCurrency;
                    convertCurrency();
                });

                div.appendChild(button);
                favoriteCurrencyPairsContainer.appendChild(div);
            });
        } catch (error) {
            console.error('Error displaying favorite currency pairs:', error);
        }
    }

    // Add event listeners for user interactions
    baseCurrencySelect.addEventListener('change', convertCurrency);
    targetCurrencySelect.addEventListener('change', convertCurrency);
    amountInput.addEventListener('input', convertCurrency);
    historicalRatesButton.addEventListener('click', displayHistoricalRates);
    saveFavoriteButton.addEventListener('click', saveFavoriteCurrencyPair);
    clearFavoritesButton.addEventListener('click', clearAllFavorites); 

    // Fetch initial data when the page loads
    fetchCurrencies();
    displayFavoriteCurrencyPairs();
});
