const API_KEY = "1SMxQumaAcC996SUXGsnlBPW44t2RR82";
const API_BASE = "https://api.currencybeacon.com/v1";

// Elements
const fromCurrencySelect = document.getElementById("fromCurrency");
const toCurrencySelect = document.getElementById("toCurrency");
const fromAmount = document.getElementById("fromAmount");
const toAmount = document.getElementById("toAmount");
const filterInput = document.getElementById("filterInput");
const ratesTableBody = document.querySelector("#ratesTable tbody");
const rateInfo = document.querySelector(".rate");

// ========== Load Currency Codes ==========
async function loadCurrencies() {
  try {
    const res = await fetch(`${API_BASE}/currencies?api_key=${API_KEY}`);
    if (!res.ok) throw new Error("Failed to fetch currencies");

    const data = await res.json();
    const currencies = Array.isArray(data.response)
      ? data.response.map(c => ({ code: c.short_code || c.code, name: c.name }))
      : Object.entries(data.response).map(([code, val]) => ({
          code,
          name: val.name || val,
        }));

    currencies.sort((a, b) => a.code.localeCompare(b.code));

    [fromCurrencySelect, toCurrencySelect].forEach(select => {
      select.innerHTML = currencies
        .map(c => `<option value="${c.code}">${c.code} - ${c.name}</option>`)
        .join("");
    });

    fromCurrencySelect.value = "USD";
    toCurrencySelect.value = "INR";

    convertCurrency();
  } catch (err) {
    console.error("Error loading currencies:", err.message);
    rateInfo.textContent = "⚠️ Could not load currencies. Try again later.";
    fallbackCurrencies();
  }
}

// Fallback if API fails
function fallbackCurrencies() {
  const fallback = ["USD", "EUR", "INR", "GBP"];
  [fromCurrencySelect, toCurrencySelect].forEach(select => {
    select.innerHTML = fallback.map(c => `<option value="${c}">${c}</option>`).join("");
  });
  fromCurrencySelect.value = "USD";
  toCurrencySelect.value = "INR";
}

// ========== Currency Conversion ==========
async function convertCurrency() {
  const from = fromCurrencySelect.value;
  const to = toCurrencySelect.value;
  const amount = parseFloat(fromAmount.value);

  if (!amount || amount <= 0) {
    toAmount.value = "";
    rateInfo.textContent = "Enter a valid amount";
    return;
  }

  toAmount.value = "Loading...";
  rateInfo.textContent = "Fetching rate...";

  try {
    const res = await fetch(
      `${API_BASE}/convert?api_key=${API_KEY}&from=${from}&to=${to}&amount=${amount}`
    );
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    const result = data?.response?.value;
    if (!result) throw new Error("Invalid conversion data");

    const rate = result / amount;
    toAmount.value = result.toFixed(2);
    rateInfo.textContent = `💱 1 ${from} = ${rate.toFixed(4)} ${to}`;

    loadRatesTable(from);
  } catch (err) {
    console.error("Error converting:", err.message);
    toAmount.value = "";
    rateInfo.textContent = `⚠️ ${err.message}`;
  }
}

// ========== Load Rates ==========
async function loadRatesTable(base) {
  ratesTableBody.innerHTML = `<tr><td colspan="2" style="text-align:center;">Loading...</td></tr>`;
  try {
    const res = await fetch(`${API_BASE}/latest?api_key=${API_KEY}&base=${base}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    const rates = data?.response?.rates;
    if (!rates) throw new Error("Invalid rates data");

    populateRatesTable(rates);
  } catch (err) {
    console.error("Error fetching rates:", err.message);
    ratesTableBody.innerHTML = `<tr><td colspan="2" style="text-align:center;color:red;">⚠️ ${err.message}</td></tr>`;
  }
}

function populateRatesTable(rates) {
  ratesTableBody.innerHTML = Object.entries(rates)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([cur, val]) => `<tr><td><strong>${cur}</strong></td><td>${val.toFixed(4)}</td></tr>`)
    .join("");
}

// ========== Events ==========
function swapCurrencies() {
  [fromCurrencySelect.value, toCurrencySelect.value] = [
    toCurrencySelect.value,
    fromCurrencySelect.value,
  ];
  convertCurrency();
}

filterInput.addEventListener("input", () => {
  const filter = filterInput.value.toLowerCase();
  [...ratesTableBody.querySelectorAll("tr")].forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(filter) ? "" : "none";
  });
});

fromAmount.addEventListener("input", convertCurrency);
fromCurrencySelect.addEventListener("change", convertCurrency);
toCurrencySelect.addEventListener("change", convertCurrency);

// Init
loadCurrencies();
