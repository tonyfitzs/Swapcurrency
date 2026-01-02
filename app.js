// Get DOM elements
const amountInput = document.getElementById('amount');
const outputElement = document.getElementById('output');
const statusElement = document.getElementById('status');
const lastUpdatedElement = document.getElementById('lastUpdated');
const amountLabel = document.getElementById('amountLabel');

// Location permission and currency storage keys
const LOCATION_PERMISSION_KEY = 'locationPermissionGranted';
const DETECTED_CURRENCY_KEY = 'detectedCurrency';
const DETECTED_COUNTRY_KEY = 'detectedCountry';

// Default fromCurrency - try to load from cache, otherwise VND
let fromCurrency = localStorage.getItem(DETECTED_CURRENCY_KEY) || 'VND';

// Country name to currency code mapping
const countryToCurrencyCode = {
  'Australia': 'AUD', 'United States': 'USD', 'United Kingdom': 'GBP', 'Canada': 'CAD',
  'Japan': 'JPY', 'China': 'CNY', 'India': 'INR', 'Germany': 'EUR', 'France': 'EUR',
  'Italy': 'EUR', 'Spain': 'EUR', 'Netherlands': 'EUR', 'Belgium': 'EUR', 'Austria': 'EUR',
  'Switzerland': 'CHF', 'Sweden': 'SEK', 'Norway': 'NOK', 'Denmark': 'DKK', 'Poland': 'PLN',
  'Russia': 'RUB', 'Turkey': 'TRY', 'South Korea': 'KRW', 'Singapore': 'SGD',
  'Hong Kong': 'HKD', 'Thailand': 'THB', 'Malaysia': 'MYR', 'Indonesia': 'IDR',
  'Philippines': 'PHP', 'Vietnam': 'VND', 'New Zealand': 'NZD', 'Brazil': 'BRL',
  'Mexico': 'MXN', 'Argentina': 'ARS', 'South Africa': 'ZAR', 'Israel': 'ILS',
  'United Arab Emirates': 'AED', 'Saudi Arabia': 'SAR', 'Egypt': 'EGP', 'Nigeria': 'NGN',
  'Kenya': 'KES', 'Pakistan': 'PKR', 'Bangladesh': 'BDT', 'Sri Lanka': 'LKR',
  'Nepal': 'NPR', 'Czech Republic': 'CZK', 'Hungary': 'HUF'
};

// Get currency from country name
function getCurrencyFromCountry(countryName) {
  // Try exact match
  if (countryToCurrencyCode[countryName]) {
    return countryToCurrencyCode[countryName];
  }
  
  // Try case-insensitive match
  const countryLower = countryName.toLowerCase();
  for (const [country, currency] of Object.entries(countryToCurrencyCode)) {
    if (country.toLowerCase() === countryLower) {
      return currency;
    }
  }
  
  // Try partial match (e.g., "United States of America" -> "United States")
  for (const [country, currency] of Object.entries(countryToCurrencyCode)) {
    if (countryLower.includes(country.toLowerCase()) || country.toLowerCase().includes(countryLower)) {
      return currency;
    }
  }
  
  // Fallback to VND
  return 'VND';
}

// Get country from coordinates using reverse geocoding
async function getCountryFromLocation(lat, lon) {
  try {
    // Use OpenStreetMap Nominatim API (free, no API key required)
    // Note: Be respectful with rate limiting (max 1 request per second)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=3&addressdetails=1`;
    
    console.log('Fetching country from:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Here2Home Currency Converter App', // Required by Nominatim
        'Accept-Language': 'en'
      }
    });
    
    if (!response.ok) {
      console.error('Geocoding API error:', response.status, response.statusText);
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Geocoding response:', data);
    
    if (data && data.address) {
      // Try different address fields for country name
      const country = data.address.country || 
                     (data.address.country_code ? data.address.country_code.toUpperCase() : null);
      
      if (country) {
        console.log('Detected country:', country);
        return country;
      }
    }
    
    console.log('No country found in geocoding response');
    return null;
  } catch (error) {
    console.error('Error getting country from location:', error);
    return null;
  }
}

// Get user's location and update local currency
async function updateCurrencyFromLocation() {
  if (!navigator.geolocation) {
    console.log('Geolocation is not supported by this browser');
    // Use cached currency if available
    const cachedCurrency = localStorage.getItem(DETECTED_CURRENCY_KEY);
    if (cachedCurrency) {
      fromCurrency = cachedCurrency;
    }
    updateAmountLabel();
    updateResult();
    return;
  }

  // Check if permission was already granted
  const permissionGranted = localStorage.getItem(LOCATION_PERMISSION_KEY) === 'true';
  
  // If permission was granted before, use watchPosition for better accuracy
  // Otherwise, request permission with getCurrentPosition
  const geoOptions = {
    enableHighAccuracy: true,
    timeout: 15000, // 15 seconds timeout
    maximumAge: 3600000 // Cache for 1 hour
  };

  const onSuccess = async (position) => {
    try {
      // Store that permission was granted
      localStorage.setItem(LOCATION_PERMISSION_KEY, 'true');
      
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      
      console.log(`Getting country for coordinates: ${lat}, ${lon}`);
      const countryName = await getCountryFromLocation(lat, lon);
      
      if (countryName) {
        const detectedCurrency = getCurrencyFromCountry(countryName);
        fromCurrency = detectedCurrency;
        
        // Store detected currency and country
        localStorage.setItem(DETECTED_CURRENCY_KEY, detectedCurrency);
        localStorage.setItem(DETECTED_COUNTRY_KEY, countryName);
        
        updateAmountLabel();
        console.log(`Location detected: ${countryName}, Local Currency: ${detectedCurrency}`);
        
        // Update output
        updateResult();
      } else {
        console.log('Country detection failed, using cached currency');
        // Use cached currency if available
        const cachedCurrency = localStorage.getItem(DETECTED_CURRENCY_KEY);
        if (cachedCurrency) {
          fromCurrency = cachedCurrency;
        }
        updateAmountLabel();
        updateResult();
      }
    } catch (error) {
      console.error('Error processing location:', error);
      // Use cached currency if available
      const cachedCurrency = localStorage.getItem(DETECTED_CURRENCY_KEY);
      if (cachedCurrency) {
        fromCurrency = cachedCurrency;
      }
      updateAmountLabel();
      updateResult();
    }
  };

  const onError = (error) => {
    console.log('Geolocation error:', error.message, error.code);
    
    // If user denied permission, remember that
    if (error.code === error.PERMISSION_DENIED) {
      localStorage.setItem(LOCATION_PERMISSION_KEY, 'denied');
      console.log('Location permission denied by user');
    }
    
    // Use cached currency if available
    const cachedCurrency = localStorage.getItem(DETECTED_CURRENCY_KEY);
    if (cachedCurrency) {
      fromCurrency = cachedCurrency;
      console.log(`Using cached currency: ${cachedCurrency}`);
    }
    
    updateAmountLabel();
    updateResult();
  };

  // Only request location if permission wasn't explicitly denied
  if (localStorage.getItem(LOCATION_PERMISSION_KEY) !== 'denied') {
    navigator.geolocation.getCurrentPosition(onSuccess, onError, geoOptions);
  } else {
    // Permission was denied before, use cached currency
    console.log('Location permission was previously denied, using cached currency');
    const cachedCurrency = localStorage.getItem(DETECTED_CURRENCY_KEY);
    if (cachedCurrency) {
      fromCurrency = cachedCurrency;
    }
    updateAmountLabel();
    updateResult();
  }
}

// Update amount label to show local currency (user enters local currency, converts to home)
function updateAmountLabel() {
  if (amountLabel) {
    amountLabel.textContent = `Amount in ${fromCurrency}`;
  }
}

// Currency to Country mapping
const currencyToCountry = {
  'AUD': 'Australia',
  'USD': 'United States',
  'EUR': 'Europe',
  'GBP': 'United Kingdom',
  'JPY': 'Japan',
  'CAD': 'Canada',
  'CHF': 'Switzerland',
  'CNY': 'China',
  'INR': 'India',
  'NZD': 'New Zealand',
  'VND': 'Vietnam',
  'SGD': 'Singapore',
  'HKD': 'Hong Kong',
  'KRW': 'South Korea',
  'THB': 'Thailand',
  'MYR': 'Malaysia',
  'IDR': 'Indonesia',
  'PHP': 'Philippines',
  'BRL': 'Brazil',
  'MXN': 'Mexico',
  'ARS': 'Argentina',
  'ZAR': 'South Africa',
  'RUB': 'Russia',
  'TRY': 'Turkey',
  'SEK': 'Sweden',
  'NOK': 'Norway',
  'DKK': 'Denmark',
  'PLN': 'Poland',
  'CZK': 'Czech Republic',
  'HUF': 'Hungary',
  'ILS': 'Israel',
  'AED': 'United Arab Emirates',
  'SAR': 'Saudi Arabia',
  'EGP': 'Egypt',
  'NGN': 'Nigeria',
  'KES': 'Kenya',
  'PKR': 'Pakistan',
  'BDT': 'Bangladesh',
  'LKR': 'Sri Lanka',
  'NPR': 'Nepal'
};

// Country to Currency mapping (comprehensive list)
const countryCurrencyMap = [
  { country: 'Australia', currency: 'AUD', code: 'AUD' },
  { country: 'United States', currency: 'US Dollar', code: 'USD' },
  { country: 'United Kingdom', currency: 'British Pound', code: 'GBP' },
  { country: 'Canada', currency: 'Canadian Dollar', code: 'CAD' },
  { country: 'Japan', currency: 'Japanese Yen', code: 'JPY' },
  { country: 'China', currency: 'Chinese Yuan', code: 'CNY' },
  { country: 'India', currency: 'Indian Rupee', code: 'INR' },
  { country: 'Germany', currency: 'Euro', code: 'EUR' },
  { country: 'France', currency: 'Euro', code: 'EUR' },
  { country: 'Italy', currency: 'Euro', code: 'EUR' },
  { country: 'Spain', currency: 'Euro', code: 'EUR' },
  { country: 'Netherlands', currency: 'Euro', code: 'EUR' },
  { country: 'Belgium', currency: 'Euro', code: 'EUR' },
  { country: 'Austria', currency: 'Euro', code: 'EUR' },
  { country: 'Switzerland', currency: 'Swiss Franc', code: 'CHF' },
  { country: 'Sweden', currency: 'Swedish Krona', code: 'SEK' },
  { country: 'Norway', currency: 'Norwegian Krone', code: 'NOK' },
  { country: 'Denmark', currency: 'Danish Krone', code: 'DKK' },
  { country: 'Poland', currency: 'Polish Zloty', code: 'PLN' },
  { country: 'Russia', currency: 'Russian Ruble', code: 'RUB' },
  { country: 'Turkey', currency: 'Turkish Lira', code: 'TRY' },
  { country: 'South Korea', currency: 'South Korean Won', code: 'KRW' },
  { country: 'Singapore', currency: 'Singapore Dollar', code: 'SGD' },
  { country: 'Hong Kong', currency: 'Hong Kong Dollar', code: 'HKD' },
  { country: 'Thailand', currency: 'Thai Baht', code: 'THB' },
  { country: 'Malaysia', currency: 'Malaysian Ringgit', code: 'MYR' },
  { country: 'Indonesia', currency: 'Indonesian Rupiah', code: 'IDR' },
  { country: 'Philippines', currency: 'Philippine Peso', code: 'PHP' },
  { country: 'Vietnam', currency: 'Vietnamese Dong', code: 'VND' },
  { country: 'New Zealand', currency: 'New Zealand Dollar', code: 'NZD' },
  { country: 'Brazil', currency: 'Brazilian Real', code: 'BRL' },
  { country: 'Mexico', currency: 'Mexican Peso', code: 'MXN' },
  { country: 'Argentina', currency: 'Argentine Peso', code: 'ARS' },
  { country: 'South Africa', currency: 'South African Rand', code: 'ZAR' },
  { country: 'Israel', currency: 'Israeli Shekel', code: 'ILS' },
  { country: 'United Arab Emirates', currency: 'UAE Dirham', code: 'AED' },
  { country: 'Saudi Arabia', currency: 'Saudi Riyal', code: 'SAR' },
  { country: 'Egypt', currency: 'Egyptian Pound', code: 'EGP' },
  { country: 'Nigeria', currency: 'Nigerian Naira', code: 'NGN' },
  { country: 'Kenya', currency: 'Kenyan Shilling', code: 'KES' },
  { country: 'Pakistan', currency: 'Pakistani Rupee', code: 'PKR' },
  { country: 'Bangladesh', currency: 'Bangladeshi Taka', code: 'BDT' },
  { country: 'Sri Lanka', currency: 'Sri Lankan Rupee', code: 'LKR' },
  { country: 'Nepal', currency: 'Nepalese Rupee', code: 'NPR' },
  { country: 'Czech Republic', currency: 'Czech Koruna', code: 'CZK' },
  { country: 'Hungary', currency: 'Hungarian Forint', code: 'HUF' }
];

// Home currency - Load from localStorage (default VND to match image)
let HOME_CURRENCY = localStorage.getItem('homeCurrency') || 'VND';
let HOME_COUNTRY = currencyToCountry[HOME_CURRENCY] || 'Vietnam';

// Update home country display
function updateHomeCountryDisplay() {
  const homeCountryDisplay = document.getElementById('homeCountryDisplay');
  if (homeCountryDisplay) {
    homeCountryDisplay.textContent = `Your home country is currently ${HOME_COUNTRY}.`;
  }
}

// Initialize home country display
updateHomeCountryDisplay();

// Initialize amount label with cached or default currency
updateAmountLabel();

// Initialize output display
updateResult();

// Pre-fetch exchange rates on load and set up automatic updates
window.addEventListener('load', async () => {
  // Set up automatic 12-hour updates
  setupAutomaticUpdates();
  
  // Initial fetch
  await fetchExchangeRates();
  
  // Update result if amount is already entered
  if (amountInput && amountInput.value.trim()) {
    updateResult();
  }
});

// Get location and update currency when app loads
// This will request permission from the user
updateCurrencyFromLocation();

// Exchange Rates Cache
let exchangeRates = null;
const RATES_CACHE_KEY = 'exchangeRates';
const RATES_UPDATE_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours

// Get cached rates
function getCachedRates() {
  const cached = localStorage.getItem(RATES_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
}

// Update exchange rates message display
function updateExchangeRateMessage(usingCached, timestamp) {
  const messageElement = document.getElementById('exchangeRateMessage');
  if (!messageElement) return;

  if (usingCached && timestamp) {
    const lastUpdate = new Date(timestamp);
    const dateTimeString = lastUpdate.toLocaleString();
    const offlineText = !navigator.onLine 
      ? 'Your device is currently not online.' 
      : 'Unable to update exchange rates.';
    messageElement.textContent = `Currency rate is based on last update at ${dateTimeString}. ${offlineText}`;
    messageElement.style.display = 'block';
  } else {
    messageElement.style.display = 'none';
  }
}

// Fetch exchange rates - always tries to update, falls back to cache if offline
async function fetchExchangeRates(forceUpdate = false) {
  const cached = getCachedRates();
  let usingCached = false;
  let cacheTimestamp = null;

  // Always try to fetch fresh rates if online
  if (navigator.onLine) {
    try {
      // Using exchangerate-api.com (free, no API key required)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (!response.ok) throw new Error('Failed to fetch rates');
      
      const data = await response.json();
      const rates = data.rates;
      const timestamp = Date.now();
      
      // Cache the rates
      localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({
        rates: rates,
        timestamp: timestamp
      }));
      
      console.log('Exchange rates fetched and cached');
      
      // Hide message since we got fresh rates
      updateExchangeRateMessage(false, null);
      
      return rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Fall through to use cached rates
    }
  }

  // Use cached rates if available (offline or fetch failed)
  if (cached) {
    usingCached = true;
    cacheTimestamp = cached.timestamp;
    console.log('Using cached exchange rates');
    
    // Show message if offline
    if (!navigator.onLine) {
      updateExchangeRateMessage(true, cacheTimestamp);
    } else {
      // Online but fetch failed - still show message
      updateExchangeRateMessage(true, cacheTimestamp);
    }
    
    return cached.rates;
  }

  // No cache available
  updateExchangeRateMessage(false, null);
  return null;
}

// Automatic 12-hour update check
function checkAndUpdateRates() {
  const cached = getCachedRates();
  
  if (!cached) {
    // No cache, fetch immediately
    fetchExchangeRates();
    return;
  }

  const age = Date.now() - cached.timestamp;
  
  // If cache is older than 12 hours and online, update
  if (age >= RATES_UPDATE_INTERVAL && navigator.onLine) {
    console.log('12-hour update interval reached, updating rates...');
    fetchExchangeRates();
  }
}

// Set up automatic 12-hour updates
function setupAutomaticUpdates() {
  // Check immediately on load
  checkAndUpdateRates();
  
  // Check every hour (to catch when 12 hours has passed)
  setInterval(() => {
    checkAndUpdateRates();
  }, 60 * 60 * 1000); // Check every hour
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

// Update result box based on amount input
// User enters local currency (fromCurrency), converts to HOME_CURRENCY
async function updateResult() {
  const amount = parseFloat(amountInput.value.trim());
  
  if (!amount || amount <= 0 || isNaN(amount)) {
    // Show home currency in output when empty
    const homeCurrencyName = currencyToCountry[HOME_CURRENCY] ? `${currencyToCountry[HOME_CURRENCY]} (${HOME_CURRENCY})` : HOME_CURRENCY;
    outputElement.innerHTML = `<strong>Amount in ${homeCurrencyName}:</strong>`;
    outputElement.classList.remove('has-result');
    return;
  }

  // Show loading state
  outputElement.innerHTML = 'Loading exchange rates...';
  outputElement.classList.remove('has-result');

  // Always try to update rates when conversion is requested
  const rates = await fetchExchangeRates(true);

  if (!rates) {
    outputElement.innerHTML = 'Unable to fetch exchange rates. Please check your connection.';
    outputElement.classList.remove('has-result');
    return;
  }

  // Convert: fromCurrency (local) -> USD -> HOME_CURRENCY
  // First convert local currency amount to USD (if not USD)
  let amountInUSD = amount;
  if (fromCurrency !== 'USD') {
    if (!rates[fromCurrency]) {
      outputElement.innerHTML = `Exchange rate not available for ${fromCurrency}`;
      outputElement.classList.remove('has-result');
      return;
    }
    const localCurrencyToUSD = 1 / rates[fromCurrency];
    amountInUSD = amount * localCurrencyToUSD;
  }

  // Then convert USD to HOME_CURRENCY
  let convertedAmount = amountInUSD;
  if (HOME_CURRENCY !== 'USD') {
    if (!rates[HOME_CURRENCY]) {
      outputElement.innerHTML = `Exchange rate not available for ${HOME_CURRENCY}`;
      outputElement.classList.remove('has-result');
      return;
    }
    convertedAmount = amountInUSD * rates[HOME_CURRENCY];
  }

  // Display result in home currency
  const homeCurrencyName = currencyToCountry[HOME_CURRENCY] ? `${currencyToCountry[HOME_CURRENCY]} (${HOME_CURRENCY})` : HOME_CURRENCY;
  outputElement.innerHTML = `
    <strong>Amount in ${homeCurrencyName}:</strong>
    <div style="font-size: 1.5em; font-weight: bold; color: var(--primary); margin-top: 10px;">
      ${formatCurrency(convertedAmount, HOME_CURRENCY)}
    </div>
  `;
  outputElement.classList.add('has-result');
}

// Listen to amount input changes
if (amountInput) {
  amountInput.addEventListener('input', updateResult);
  amountInput.addEventListener('change', updateResult);
  
  // Also trigger on Enter key
  amountInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      updateResult();
    }
  });
}

// Initialize result box with home currency
updateResult();

// Format date as M/D/YYYY HH:MM (24-hour format)
function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  // Format minutes with leading zero if needed
  const minutesStr = minutes.toString().padStart(2, '0');
  
  return `${month}/${day}/${year} ${hours}:${minutesStr}`;
}

// Update status pill with online/offline and cache status
function updateStatusPill() {
  if (navigator.onLine) {
    statusElement.textContent = 'Online — cached for offline use';
    statusElement.classList.remove('offline');
    statusElement.classList.add('online');
  } else {
    // Get cached rates to find last update timestamp
    const cached = getCachedRates();
    if (cached && cached.timestamp) {
      const formattedDateTime = formatDateTime(cached.timestamp);
      statusElement.textContent = `OFFLINE last exchange rate update was ${formattedDateTime}`;
    } else {
      statusElement.textContent = 'OFFLINE';
    }
    statusElement.classList.remove('online');
    statusElement.classList.add('offline');
  }
}

// Display last updated timestamp
function displayLastUpdated() {
  const lastUpdated = localStorage.getItem('lastUpdated');
  if (lastUpdated && lastUpdatedElement) {
    const date = new Date(parseInt(lastUpdated));
    lastUpdatedElement.textContent = `Last updated: ${date.toLocaleString()}`;
  }
}

// Update banner element
const updateBanner = document.getElementById('updateBanner');

// Show update banner and handle refresh
function showUpdateBanner() {
  if (updateBanner) {
    updateBanner.classList.add('active');
    updateBanner.addEventListener('click', () => {
      window.location.reload();
    });
  }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
        
        // Update status when service worker is ready
        if (registration.active) {
          updateStatusPill();
        }
        
        // Check for waiting service worker (update available)
        if (registration.waiting) {
          showUpdateBanner();
        }
        
        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New service worker installed and waiting
                  showUpdateBanner();
                  const timestamp = Date.now();
                  localStorage.setItem('lastUpdated', timestamp.toString());
                  displayLastUpdated();
                } else {
                  // First install
                  const timestamp = Date.now();
                  localStorage.setItem('lastUpdated', timestamp.toString());
                  displayLastUpdated();
                  updateStatusPill();
                }
              } else if (newWorker.state === 'activated') {
                // Service worker activated
                const timestamp = Date.now();
                localStorage.setItem('lastUpdated', timestamp.toString());
                displayLastUpdated();
                updateStatusPill();
              }
            });
          }
        });
        
        // Check if this is the first install
        if (registration.active) {
          const lastUpdated = localStorage.getItem('lastUpdated');
          if (!lastUpdated) {
            // First time - set initial timestamp
            const timestamp = Date.now();
            localStorage.setItem('lastUpdated', timestamp.toString());
            displayLastUpdated();
          } else {
            displayLastUpdated();
          }
          updateStatusPill();
        }
        
        // Periodically check for updates
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
        updateStatusPill();
      });
  });
}

// Settings modal functionality
const settingsIcon = document.getElementById('settingsIcon');
const settingsModal = document.getElementById('settingsModal');
const closeModalBtn = document.getElementById('closeModal');
const settingsLink = document.getElementById('settingsLink');
const homeCurrencySelect = document.getElementById('homeCurrencySelect');
const changeCurrencyBtn = document.getElementById('changeCurrencyBtn');

// Show settings menu
function showSettingsMenu() {
  const settingsMenu = document.getElementById('settingsMenu');
  const updateExchangeSection = document.getElementById('updateExchangeSection');
  const colorSchemeSection = document.getElementById('colorSchemeSection');
  const updateHomeCountrySection = document.getElementById('updateHomeCountrySection');
  
  if (settingsMenu) settingsMenu.style.display = 'flex';
  if (updateExchangeSection) updateExchangeSection.style.display = 'none';
  if (colorSchemeSection) colorSchemeSection.style.display = 'none';
  if (updateHomeCountrySection) updateHomeCountrySection.style.display = 'none';
}

// Open settings modal
function openSettings() {
  if (settingsModal) {
    settingsModal.classList.add('active');
    showSettingsMenu();
  }
}

// Close settings modal
function closeSettings() {
  if (settingsModal) {
    settingsModal.classList.remove('active');
    showSettingsMenu(); // Reset to menu when closing
  }
}

// Save home currency
function saveHomeCurrency() {
  if (homeCurrencySelect) {
    const selectedCurrency = homeCurrencySelect.value;
    const selectedCountry = countryCurrencyMap.find(c => c.code === selectedCurrency);
    
    HOME_CURRENCY = selectedCurrency;
    HOME_COUNTRY = selectedCountry ? selectedCountry.country : currencyToCountry[selectedCurrency] || 'Unknown';
    
    localStorage.setItem('homeCurrency', HOME_CURRENCY);
    updateHomeCountryDisplay();
    updateResult();
    showSettingsMenu(); // Return to menu after saving
  }
}

// Settings icon click
if (settingsIcon) {
  settingsIcon.addEventListener('click', openSettings);
}

// Settings link click
if (settingsLink) {
  settingsLink.addEventListener('click', (e) => {
    e.preventDefault();
    openSettings();
  });
}

// Cancel button in settings menu
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
if (cancelSettingsBtn) {
  cancelSettingsBtn.addEventListener('click', () => {
    closeSettings();
  });
}

// Close button click
if (closeModalBtn) {
  closeModalBtn.addEventListener('click', closeSettings);
}

// Close modal when clicking outside
if (settingsModal) {
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeSettings();
    }
  });
}

// Set up Update button
if (changeCurrencyBtn) {
  changeCurrencyBtn.onclick = (e) => {
    e.preventDefault();
    saveHomeCurrency();
  };
}

// Settings menu navigation
const updateExchangeBtn = document.getElementById('updateExchangeBtn');
const colorSchemeBtn = document.getElementById('colorSchemeBtn');
const updateHomeCountryBtn = document.getElementById('updateHomeCountryBtn');
const updateExchangeSection = document.getElementById('updateExchangeSection');
const colorSchemeSection = document.getElementById('colorSchemeSection');
const updateHomeCountrySection = document.getElementById('updateHomeCountrySection');
const settingsMenu = document.getElementById('settingsMenu');

// Update Exchange Database button
if (updateExchangeBtn) {
  updateExchangeBtn.addEventListener('click', () => {
    if (settingsMenu) settingsMenu.style.display = 'none';
    if (updateExchangeSection) updateExchangeSection.style.display = 'block';
  });
}

// Color Scheme button
if (colorSchemeBtn) {
  colorSchemeBtn.addEventListener('click', () => {
    if (settingsMenu) settingsMenu.style.display = 'none';
    if (colorSchemeSection) colorSchemeSection.style.display = 'block';
  });
}

// Update Home Country button
if (updateHomeCountryBtn) {
  updateHomeCountryBtn.addEventListener('click', () => {
    if (settingsMenu) settingsMenu.style.display = 'none';
    if (updateHomeCountrySection) {
      updateHomeCountrySection.style.display = 'block';
      // Set current selection
      if (homeCurrencySelect) {
        homeCurrencySelect.value = HOME_CURRENCY;
      }
    }
  });
}

// Update Exchange Database action
const updateExchangeActionBtn = document.getElementById('updateExchangeActionBtn');
if (updateExchangeActionBtn) {
  updateExchangeActionBtn.addEventListener('click', () => {
    // Placeholder for exchange database update
    alert('Exchange database update feature coming soon!');
    showSettingsMenu();
  });
}

// Color Scheme save
const saveColorSchemeBtn = document.getElementById('saveColorSchemeBtn');
const colorSchemeSelect = document.getElementById('colorSchemeSelect');
if (saveColorSchemeBtn) {
  saveColorSchemeBtn.addEventListener('click', () => {
    // Placeholder for color scheme save
    if (colorSchemeSelect) {
      const selectedScheme = colorSchemeSelect.value;
      localStorage.setItem('colorScheme', selectedScheme);
      alert(`Color scheme "${selectedScheme}" saved! (Feature coming soon)`);
    }
    showSettingsMenu();
  });
}

// Set initial status on load
updateStatusPill();
displayLastUpdated();

// Listen for online/offline events
window.addEventListener('online', () => {
  updateStatusPill();
});

window.addEventListener('offline', () => {
  updateStatusPill();
});

// Poll online/offline status every 100ms for real-time updates
setInterval(() => {
  updateStatusPill();
}, 100);
