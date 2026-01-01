// Get DOM elements
const amountInput = document.getElementById('amount');
const outputElement = document.getElementById('output');
const statusElement = document.getElementById('status');
const lastUpdatedElement = document.getElementById('lastUpdated');
const amountLabel = document.getElementById('amountLabel');

// Default fromCurrency (set to VND for now, will be updated via geolocation)
let fromCurrency = 'VND';

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
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=3&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Here2Home Currency Converter App' // Required by Nominatim
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding API error');
    }
    
    const data = await response.json();
    if (data && data.address) {
      // Try different address fields for country name
      return data.address.country || data.address.country_code?.toUpperCase() || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting country from location:', error);
    return null;
  }
}

// Get user's location and update currency
async function updateCurrencyFromLocation() {
  if (!navigator.geolocation) {
    console.log('Geolocation is not supported by this browser');
    // Keep default VND
    updateAmountLabel();
    return;
  }
  
  // Request location with timeout
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        const countryName = await getCountryFromLocation(lat, lon);
        
        if (countryName) {
          const detectedCurrency = getCurrencyFromCountry(countryName);
          fromCurrency = detectedCurrency;
          updateAmountLabel();
          console.log(`Location detected: ${countryName}, Currency: ${detectedCurrency}`);
        } else {
          // If country detection fails, keep VND
          updateAmountLabel();
        }
      } catch (error) {
        console.error('Error processing location:', error);
        // Keep default VND on error
        updateAmountLabel();
      }
    },
    (error) => {
      console.log('Geolocation error:', error.message);
      // Keep default VND if user denies or error occurs
      updateAmountLabel();
    },
    {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds timeout
      maximumAge: 300000 // Cache for 5 minutes
    }
  );
}

// Update amount label with current currency
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

// Home currency - Load from localStorage (default AUD)
let HOME_CURRENCY = localStorage.getItem('homeCurrency') || 'AUD';
let HOME_COUNTRY = currencyToCountry[HOME_CURRENCY] || 'Australia';

// Update home country display
function updateHomeCountryDisplay() {
  const homeCountryDisplay = document.getElementById('homeCountryDisplay');
  if (homeCountryDisplay) {
    homeCountryDisplay.textContent = `Your home country is currently ${HOME_COUNTRY}.`;
  }
}

// Initialize home country display
updateHomeCountryDisplay();

// Initialize amount label with default currency (VND)
updateAmountLabel();

// Get location and update currency when app loads
// This will request permission from the user
updateCurrencyFromLocation();

// Update result box based on amount input
function updateResult() {
  const amount = amountInput.value.trim();
  
  if (!amount || amount === '') {
    outputElement.innerHTML = `<strong>Amount in ${HOME_CURRENCY}:</strong>`;
    outputElement.classList.remove('has-result');
  } else {
    outputElement.textContent = 'Conversion coming next step';
    outputElement.classList.add('has-result');
  }
}

// Go button element
const goBtn = document.getElementById('goBtn');

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

// Go button click handler
if (goBtn) {
  goBtn.addEventListener('click', () => {
    updateResult();
  });
}

// Initialize result box with home currency
updateResult();

// Update status pill with online/offline and cache status
function updateStatusPill() {
  if (navigator.onLine) {
    statusElement.textContent = 'Online — cached for offline use';
    statusElement.classList.remove('offline');
    statusElement.classList.add('online');
  } else {
    statusElement.textContent = 'Offline — cached version';
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
