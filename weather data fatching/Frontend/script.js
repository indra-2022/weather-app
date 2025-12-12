// ===== CONFIG: set this after backend is ready =====
const API_BASE_URL = "https://fxev70d0p2.execute-api.eu-north-1.amazonaws.com/weather";
// Example later: "https://abc123.execute-api.ap-south-1.amazonaws.com/weather"

const cityInput = document.getElementById("cityInput");
const cityBtn = document.getElementById("cityBtn");
const locationBtn = document.getElementById("locationBtn");
const resultEl = document.getElementById("result");
const errorEl = document.getElementById("error");

cityBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) {
    showError("Please enter a city name.");
    return;
  }
  fetchWeather({ city });
});

locationBtn.addEventListener("click", () => {
  if (!("geolocation" in navigator)) {
    showError("Geolocation is not supported in this browser.");
    return;
  }

  showError(""); // clear previous error
  showLoading("Detecting your location...");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fetchWeather({ lat: latitude, lon: longitude });
    },
    (err) => {
      console.error(err);
      if (err.code === err.PERMISSION_DENIED) {
        showError("Location permission was denied. Please allow it or enter a city manually.");
      } else {
        showError("Unable to get your location. Please try again or enter city manually.");
      }
      hideLoading();
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }
  );
});

// Core function to call our backend
async function fetchWeather({ city, lat, lon }) {
  try {
    showLoading("Fetching weather data...");

    let url = API_BASE_URL;
    const params = [];

    if (city) params.push(`city=${encodeURIComponent(city)}`);
    if (lat != null && lon != null) {
      params.push(`lat=${encodeURIComponent(lat)}`);
      params.push(`lon=${encodeURIComponent(lon)}`);
    }

    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    hideLoading();

    if (!res.ok || data.error) {
      showError(data.message || "Failed to fetch weather data.");
      return;
    }

    showResult(data);
  } catch (err) {
    console.error(err);
    hideLoading();
    showError("Something went wrong. Please try again.");
  }
}

// ===== UI helpers =====
function showResult(data) {
  errorEl.classList.add("hidden");
  resultEl.classList.remove("hidden");

  // Expecting data from backend like:
  // {
  //  city, country, temperature, feels_like,
  //  description, humidity, wind_speed
  // }

  resultEl.innerHTML = `
    <h2>${data.city}, ${data.country}</h2>
    <div class="result-meta">
      Last updated just now
    </div>
    <div class="result-main">
      <div class="temperature">${Math.round(data.temperature)}°C</div>
      <div class="description">${data.description}</div>
    </div>
    <div class="extra">
      <p><b>Feels like:</b> ${Math.round(data.feels_like)}°C</p>
      <p><b>Humidity:</b> ${data.humidity}%</p>
      <p><b>Wind speed:</b> ${data.wind_speed} m/s</p>
    </div>
  `;
}

function showError(message) {
  if (!message) {
    errorEl.classList.add("hidden");
    return;
  }
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
  resultEl.classList.add("hidden");
}

// Simple loading indicator
function showLoading(message) {
  resultEl.classList.remove("hidden");
  resultEl.innerHTML = `<p>${message}</p>`;
}

function hideLoading() {
  // nothing special needed; result will be updated in showResult / showError
}
