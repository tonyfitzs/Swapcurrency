// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
        
        // Update status when service worker is ready
        updateCacheStatus(true);
        updateLastUpdated();
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              updateLastUpdated();
            }
          });
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
        updateCacheStatus(false);
      });
  });
}

// Online/Offline Status
function updateConnectionStatus() {
  const statusElement = document.getElementById('connectionStatus');
  const statusContainer = document.getElementById('status');
  
  if (navigator.onLine) {
    statusElement.textContent = 'Online';
    statusContainer.classList.remove('offline');
    statusContainer.classList.add('online');
  } else {
    statusElement.textContent = 'Offline';
    statusContainer.classList.remove('online');
    statusContainer.classList.add('offline');
  }
}

// Cache Status
function updateCacheStatus(isCached) {
  const cacheStatusElement = document.getElementById('cacheStatus');
  if (isCached) {
    cacheStatusElement.textContent = 'App cached for offline use';
  } else {
    cacheStatusElement.textContent = '';
  }
}

// Last Updated Status
function updateLastUpdated() {
  const lastUpdatedElement = document.getElementById('lastUpdated');
  const now = new Date();
  const dateTimeString = now.toLocaleString();
  lastUpdatedElement.textContent = `Last updated: ${dateTimeString}`;
}

// Initialize connection status
updateConnectionStatus();

// Listen for online/offline events
window.addEventListener('online', () => {
  updateConnectionStatus();
});

window.addEventListener('offline', () => {
  updateConnectionStatus();
});

// Currency Selection - Load from localStorage
// Hard coded to VND (Vietnamese Dong) as destination currency
const HOME_CURRENCY = 'VND';
const sourceCurrencySelect = document.getElementById('sourceCurrency');
const amountInput = document.getElementById('amount');
const outputElement = document.getElementById('output');

const savedSourceCurrency = localStorage.getItem('sourceCurrency');

if (savedSourceCurrency) {
  sourceCurrencySelect.value = savedSourceCurrency;
}

// Save to localStorage when changed
sourceCurrencySelect.addEventListener('change', (e) => {
  localStorage.setItem('sourceCurrency', e.target.value);
  performConversion();
});

// Exchange Rates Cache
let exchangeRates = null;
const RATES_CACHE_KEY = 'exchangeRates';
const RATES_CACHE_TIME = 24 * 60 * 60 * 1000; // 24 hours

// Fetch exchange rates
async function fetchExchangeRates() {
  // Check cache first
  const cached = localStorage.getItem(RATES_CACHE_KEY);
  if (cached) {
    const { rates, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    if (age < RATES_CACHE_TIME) {
      console.log('Using cached exchange rates');
      return rates;
    }
  }

  // Fetch from API if online
  if (!navigator.onLine) {
    // Use cached rates even if expired when offline
    if (cached) {
      const { rates } = JSON.parse(cached);
      console.log('Offline: Using expired cached rates');
      return rates;
    }
    return null;
  }

  try {
    // Using exchangerate-api.com (free, no API key required)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!response.ok) throw new Error('Failed to fetch rates');
    
    const data = await response.json();
    const rates = data.rates;
    
    // Cache the rates
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({
      rates: rates,
      timestamp: Date.now()
    }));
    
    console.log('Exchange rates fetched and cached');
    return rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Try to use cached rates even if expired
    if (cached) {
      const { rates } = JSON.parse(cached);
      console.log('Using expired cached rates due to fetch error');
      return rates;
    }
    return null;
  }
}

// Perform currency conversion
async function performConversion() {
  const amount = parseFloat(amountInput.value);
  const sourceCurrency = sourceCurrencySelect.value;
  const homeCurrency = HOME_CURRENCY; // Hard coded to VND

  if (!amount || amount <= 0) {
    outputElement.innerHTML = 'Enter an amount to convert to VND';
    outputElement.classList.remove('has-result');
    return;
  }

  if (sourceCurrency === homeCurrency) {
    outputElement.innerHTML = `
      <div>Same currency selected</div>
      <div class="converted-amount">${formatCurrency(amount, homeCurrency)}</div>
    `;
    outputElement.classList.add('has-result');
    return;
  }

  // Show loading state
  outputElement.innerHTML = 'Loading exchange rates...';
  outputElement.classList.remove('has-result');

  // Fetch exchange rates
  const rates = await fetchExchangeRates();

  if (!rates) {
    outputElement.innerHTML = 'Unable to fetch exchange rates. Please check your connection.';
    outputElement.classList.remove('has-result');
    return;
  }

  // Convert: USD -> Source Currency -> VND
  // First convert source amount to USD (if not USD)
  let amountInUSD = amount;
  if (sourceCurrency !== 'USD') {
    const sourceToUSD = 1 / rates[sourceCurrency];
    amountInUSD = amount * sourceToUSD;
  }

  // Then convert USD to VND
  let convertedAmount = amountInUSD;
  if (homeCurrency !== 'USD') {
    convertedAmount = amountInUSD * rates[homeCurrency];
  }

  // Display result
  outputElement.innerHTML = `
    <div class="conversion-info">${formatCurrency(amount, sourceCurrency)} =</div>
    <div class="converted-amount">${formatCurrency(convertedAmount, homeCurrency)}</div>
    <div class="conversion-info">Rate: 1 ${sourceCurrency} = ${formatRate(amountInUSD * rates[homeCurrency] / amount, homeCurrency)}</div>
  `;
  outputElement.classList.add('has-result');
}

// Format currency amount
function formatCurrency(amount, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Format exchange rate
function formatRate(rate, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  }).format(rate);
}

// Listen to input changes
amountInput.addEventListener('input', performConversion);
amountInput.addEventListener('change', performConversion);

// Initialize: fetch rates on load
window.addEventListener('load', async () => {
  await fetchExchangeRates();
  // Perform conversion if amount is already entered
  if (amountInput.value) {
    performConversion();
  }
});
