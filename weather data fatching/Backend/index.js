// index.js

exports.handler = async (event) => {
  try {
    // Query params from API Gateway (city OR lat/lon)
    const qs = event.queryStringParameters || {};
    const city = qs.city;
    const lat = qs.lat;
    const lon = qs.lon;

    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      return makeResponse(500, {
        error: true,
        message: "Server error: WEATHER_API_KEY is not set",
      });
    }

    // Build OpenWeatherMap URL
    let url;
    if (lat && lon) {
      // If lat/lon present, use them
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(
        lon
      )}&appid=${apiKey}&units=metric`;
    } else if (city) {
      // Else use city
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city
      )}&appid=${apiKey}&units=metric`;
    } else {
      return makeResponse(400, {
        error: true,
        message: "Please provide either city name or lat/lon.",
      });
    }

    // Call OpenWeatherMap
    const owRes = await fetch(url);
    const data = await owRes.json();

    if (!owRes.ok) {
      return makeResponse(owRes.status, {
        error: true,
        message: data.message || "Failed to fetch weather data",
      });
    }

    // Format output for frontend
    const result = {
      city: data.name,
      country: data.sys?.country,
      temperature: data.main?.temp,
      feels_like: data.main?.feels_like,
      description: data.weather?.[0]?.description,
      humidity: data.main?.humidity,
      wind_speed: data.wind?.speed,
    };

    return makeResponse(200, result);
  } catch (err) {
    console.error(err);
    return makeResponse(500, {
      error: true,
      message: "Internal server error",
    });
  }
};

// Helper for consistent JSON + CORS headers
function makeResponse(statusCode, bodyObj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      // CORS so Netlify site can call it
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify(bodyObj),
  };
}