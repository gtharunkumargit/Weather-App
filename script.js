/* weather-app.js - v3.0.0 */
/* Complete refactor with Fahrenheit & sunrise/sunset support */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const elements = {
        cityInput: document.getElementById('cityInput'),
        searchBtn: document.getElementById('searchBtn'),
        locationBtn: document.getElementById('locationBtn'),
        currentTemp: document.getElementById('currentTemp'),
        cityName: document.getElementById('cityName'),
        weatherDesc: document.getElementById('weatherDesc'),
        windSpeed: document.getElementById('windSpeed'),
        humidity: document.getElementById('humidity'),
        pressure: document.getElementById('pressure'),
        rainChance: document.getElementById('rainChance'),
        weatherIcon: document.getElementById('weatherIcon'),
        forecastDays: document.getElementById('forecastDays'),
        weatherAdvice: document.getElementById('weather-advice'),
        uvAdviceEl: document.getElementById('uvAdvice'),
        airQualityAdvice: document.getElementById('airQualityAdvice'),
        suggestedActivity: document.getElementById('suggestedActivity'),
        currentDateEl: document.getElementById('currentDate'),
        currentTimeEl: document.getElementById('currentTime'),
        toggleUnit: document.getElementById('toggleUnit'),
        sunriseTime: document.getElementById('sunriseTime'),
        sunsetTime: document.getElementById('sunsetTime'),
        themeButtons: document.querySelectorAll('.theme-btn')
    };

    // App Configuration
    const config = {
        API_KEY: '9ca0b1230abd6528bad9efa3075e75f5',
        useFahrenheit: false,
        currentTheme: 'light',
        cityTimeInterval: null
    };

    // Weather Icons Mapping
    const weatherIcons = {
        '01d': 'fas fa-sun', '01n': 'fas fa-moon',
        '02d': 'fas fa-cloud-sun', '02n': 'fas fa-cloud-moon',
        '03d': 'fas fa-cloud', '03n': 'fas fa-cloud',
        '04d': 'fas fa-cloud', '04n': 'fas fa-cloud',
        '09d': 'fas fa-cloud-rain', '09n': 'fas fa-cloud-rain',
        '10d': 'fas fa-cloud-sun-rain', '10n': 'fas fa-cloud-moon-rain',
        '11d': 'fas fa-bolt', '11n': 'fas fa-bolt',
        '13d': 'fas fa-snowflake', '13n': 'fas fa-snowflake',
        '50d': 'fas fa-smog', '50n': 'fas fa-smog'
    };

    // Initialize App
    function init() {
        setupEventListeners();
        fetchWeather('Hyderabad'); // Default city
        console.log('WeatherSphere initialized');
    }

    // Event Listeners Setup
    function setupEventListeners() {
        elements.searchBtn.addEventListener('click', () => {
            const city = elements.cityInput.value.trim();
            city && fetchWeather(city);
        });

        elements.locationBtn.addEventListener('click', fetchWeatherByLocation);

        elements.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const city = elements.cityInput.value.trim();
                city && fetchWeather(city);
            }
        });

        elements.toggleUnit.addEventListener('click', toggleTemperatureUnit);

        elements.themeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const theme = button.dataset.theme;
                document.documentElement.setAttribute('data-theme', theme);
                config.currentTheme = theme;
                elements.themeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }

    // Temperature Conversion
    function convertTemperature(temp, toFahrenheit) {
        return toFahrenheit ? (temp * 9/5) + 32 : (temp - 32) * 5/9;
    }

    // Toggle Temperature Unit
    function toggleTemperatureUnit() {
        config.useFahrenheit = !config.useFahrenheit;
        elements.toggleUnit.textContent = config.useFahrenheit ? '°C' : '°F';
        
        // Convert current temp
        const currentTemp = parseFloat(elements.currentTemp.textContent);
        elements.currentTemp.textContent = Math.round(
            config.useFahrenheit 
                ? convertTemperature(currentTemp, true)
                : convertTemperature(currentTemp, false)
        );
        
        // Convert forecast temps
        document.querySelectorAll('.forecast-day .temp-high, .forecast-day .temp-low').forEach(el => {
            const temp = parseInt(el.textContent);
            el.textContent = Math.round(
                config.useFahrenheit 
                    ? convertTemperature(temp, true)
                    : convertTemperature(temp, false)
            ) + '°';
        });
    }

    // Format Time from Timestamp
    function formatTime(timestamp, timezone, withSeconds = false) {
        const date = new Date((timestamp + timezone) * 1000);
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            second: withSeconds ? '2-digit' : undefined,
            timeZone: 'UTC'
        });
    }

    // Update Local Date & Time
    function updateLocalDateTime(timezoneOffset) {
        if (config.cityTimeInterval) clearInterval(config.cityTimeInterval);
        
        const updateTime = () => {
            const now = new Date();
            const utc = now.getTime() + now.getTimezoneOffset() * 60000;
            const cityTime = new Date(utc + (timezoneOffset * 1000));
            
            elements.currentDateEl.textContent = cityTime.toLocaleDateString(undefined, { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            });
            
            elements.currentTimeEl.textContent = cityTime.toLocaleTimeString();
        };
        
        updateTime();
        config.cityTimeInterval = setInterval(updateTime, 1000);
    }

    // Fetch Weather Data
    async function fetchWeather(city) {
        try {
            showLoadingStates();
            
            const [currentData, forecastData, aqiData, uvData] = await Promise.all([
                fetchData(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${config.API_KEY}`),
                fetchData(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${config.API_KEY}`),
                fetchAirQuality(city),
                fetchUVIndex(city)
            ]);

            displayWeather(currentData, forecastData, aqiData, uvData);
        } catch (error) {
            handleError(error);
        }
    }

    // Fetch Weather by Location
    async function fetchWeatherByLocation() {
        if (!navigator.geolocation) {
            alert('Geolocation not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    showLoadingStates();
                    const { latitude, longitude } = position.coords;
                    
                    const [currentData, forecastData, aqiData, uvData] = await Promise.all([
                        fetchData(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${config.API_KEY}`),
                        fetchData(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${config.API_KEY}`),
                        fetchData(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${config.API_KEY}`),
                        fetchData(`https://api.openweathermap.org/data/2.5/uvi?lat=${latitude}&lon=${longitude}&appid=${config.API_KEY}`)
                    ]);

                    displayWeather(currentData, forecastData, aqiData, uvData);
                } catch (error) {
                    handleError(error);
                }
            },
            (error) => alert(`Geolocation error: ${error.message}`)
        );
    }

    // Helper Functions
    async function fetchData(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(response.statusText);
        return await response.json();
    }

    async function fetchAirQuality(city) {
        try {
            const current = await fetchData(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${config.API_KEY}`);
            return await fetchData(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${current.coord.lat}&lon=${current.coord.lon}&appid=${config.API_KEY}`);
        } catch {
            return null;
        }
    }

    async function fetchUVIndex(city) {
        try {
            const current = await fetchData(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${config.API_KEY}`);
            return await fetchData(`https://api.openweathermap.org/data/2.5/uvi?lat=${current.coord.lat}&lon=${current.coord.lon}&appid=${config.API_KEY}`);
        } catch {
            return null;
        }
    }

    function showLoadingStates() {
        elements.uvAdviceEl.textContent = 'Loading UV data...';
        elements.airQualityAdvice.textContent = 'Loading air quality...';
        elements.suggestedActivity.textContent = 'Loading suggestions...';
        elements.weatherAdvice.textContent = 'Loading weather tips...';
    }

    function handleError(error) {
        console.error('Error:', error);
        alert(`Error: ${error.message}`);
        elements.uvAdviceEl.textContent = 'Failed to load UV data';
        elements.airQualityAdvice.textContent = 'Failed to load air quality';
        elements.suggestedActivity.textContent = 'Failed to load suggestions';
        elements.weatherAdvice.textContent = 'Failed to load weather tips';
    }

    // Display Weather Data
    function displayWeather(currentData, forecastData, aqiData, uvData) {
        // Current Weather
        const tempCelsius = Math.round(currentData.main.temp);
        elements.currentTemp.textContent = tempCelsius;
        elements.cityName.textContent = `${currentData.name}, ${currentData.sys.country}`;
        elements.weatherDesc.textContent = currentData.weather[0].description;
        elements.windSpeed.textContent = `${Math.round(currentData.wind.speed * 3.6)} km/h`;
        elements.humidity.textContent = `${currentData.main.humidity}%`;
        elements.pressure.textContent = `${currentData.main.pressure} hPa`;
        
        // Sunrise/Sunset
        elements.sunriseTime.textContent = formatTime(currentData.sys.sunrise, currentData.timezone);
        elements.sunsetTime.textContent = formatTime(currentData.sys.sunset, currentData.timezone);
        
        // Weather Icon
        const iconCode = currentData.weather[0].icon;
        elements.weatherIcon.innerHTML = `<i class="${weatherIcons[iconCode] || 'fas fa-question'}"></i>`;
        
        // Rain Chance
        const todayRainChance = calculateRainChance(forecastData);
        elements.rainChance.textContent = `${todayRainChance}%`;
        elements.rainChance.classList.toggle('high-rain-chance', todayRainChance > 50);
        
        // Health Advisories
        displayHealthAdvisories(currentData, aqiData, uvData, tempCelsius, todayRainChance);
        
        // Forecast
        displayForecast(forecastData);
        
        // Update Time
        updateLocalDateTime(currentData.timezone);
        
        // Animate Elements
        animateElements();
    }

    // Calculate Rain Chance
    function calculateRainChance(forecastData) {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
        const todayForecasts = forecastData.list.filter(item => {
            const date = new Date(item.dt * 1000);
            return date.toLocaleDateString('en-US', { weekday: 'short' }) === today;
        });
        
        if (todayForecasts.length === 0) return 0;
        
        const totalPop = todayForecasts.reduce((sum, item) => sum + (item.pop || 0), 0);
        return Math.round((totalPop / todayForecasts.length) * 100);
    }

    // Display Health Advisories
    function displayHealthAdvisories(currentData, aqiData, uvData, tempCelsius, rainChance) {
        // UV Advice
        if (uvData?.value !== undefined) {
            const uvIndex = Math.round(uvData.value);
            const uvAdvice = getUVAdvice(uvIndex);
            elements.uvAdviceEl.textContent = uvAdvice.advice;
            document.getElementById('uvAdvisory').classList.add(uvAdvice.colorClass);
        } else {
            elements.uvAdviceEl.textContent = 'UV data unavailable';
        }
        
        // Air Quality
        if (aqiData?.list?.[0]?.main?.aqi !== undefined) {
            const aqi = aqiData.list[0].main.aqi;
            const aqiCategory = getAQICategory(aqi);
            elements.airQualityAdvice.textContent = `${aqiCategory.level} air quality`;
            document.getElementById('airQualityCard').classList.add(aqiCategory.color);
        } else {
            elements.airQualityAdvice.textContent = 'Air quality data unavailable';
        }
        
        // Activity Suggestion
        const isDay = !currentData.weather[0].icon.includes('n');
        elements.suggestedActivity.textContent = getActivitySuggestion(
            tempCelsius,
            currentData.weather[0].main,
            isDay
        );
        
        // Weather Advice
        elements.weatherAdvice.textContent = getWeatherAdvice(
            currentData.weather[0].main,
            tempCelsius,
            rainChance
        );
    }

    // Display Forecast
    function displayForecast(forecastData) {
        elements.forecastDays.innerHTML = '';
        
        const dailyForecast = {};
        forecastData.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            if (!dailyForecast[day]) {
                dailyForecast[day] = {
                    temps: [],
                    icons: [],
                    pop: []
                };
            }
            
            dailyForecast[day].temps.push(item.main.temp);
            dailyForecast[day].icons.push(item.weather[0].icon);
            dailyForecast[day].pop.push(item.pop || 0);
        });
        
        Object.keys(dailyForecast).slice(0, 5).forEach(day => {
            const dayData = dailyForecast[day];
            const maxTemp = Math.round(Math.max(...dayData.temps));
            const minTemp = Math.round(Math.min(...dayData.temps));
            const avgPop = Math.round((dayData.pop.reduce((a, b) => a + b, 0) / dayData.pop.length) * 100);
            
            // Most frequent icon
            const iconCounts = {};
            dayData.icons.forEach(icon => {
                iconCounts[icon] = (iconCounts[icon] || 0) + 1;
            });
            const mostFrequentIcon = Object.keys(iconCounts).reduce((a, b) => 
                iconCounts[a] > iconCounts[b] ? a : b
            );
            
            const forecastDayElement = document.createElement('div');
            forecastDayElement.className = 'forecast-day';
            forecastDayElement.innerHTML = `
                <h3>${day}</h3>
                <div class="forecast-icon"><i class="${weatherIcons[mostFrequentIcon] || 'fas fa-question'}"></i></div>
                <div class="forecast-temp">
                    <span class="temp-high">${maxTemp}°</span>
                    <span class="temp-low">${minTemp}°</span>
                </div>
                ${avgPop > 20 ? `<div class="rain-chance"><i class="fas fa-umbrella"></i> ${avgPop}%</div>` : ''}
            `;
            
            elements.forecastDays.appendChild(forecastDayElement);
        });
    }

    // Animate Elements
    function animateElements() {
        document.querySelector('.current-weather').style.animation = 'fadeIn 1s ease';
        document.querySelector('.forecast-container').style.animation = 'fadeIn 1.2s ease';
        document.querySelector('.weather-tips').style.animation = 'fadeIn 1.4s ease';
        document.querySelector('.health-advisory').style.animation = 'fadeIn 1.6s ease';
    }

    // Advisory Functions
    function getAQICategory(aqi) {
        if (aqi <= 50) return { level: 'Good', color: 'aqi-good' };
        if (aqi <= 100) return { level: 'Moderate', color: 'aqi-moderate' };
        if (aqi <= 150) return { level: 'Unhealthy for Sensitive Groups', color: 'aqi-unhealthy-sensitive' };
        if (aqi <= 200) return { level: 'Unhealthy', color: 'aqi-unhealthy' };
        if (aqi <= 300) return { level: 'Very Unhealthy', color: 'aqi-very-unhealthy' };
        return { level: 'Hazardous', color: 'aqi-hazardous' };
    }

    function getUVAdvice(uvIndex) {
        let colorClass, advice;
        
        if (uvIndex <= 2) {
            colorClass = 'uv-low';
            advice = 'Low risk. Enjoy outdoor activities!';
        } else if (uvIndex <= 5) {
            colorClass = 'uv-moderate';
            advice = 'Moderate risk. Wear SPF 30+ sunscreen.';
        } else if (uvIndex <= 7) {
            colorClass = 'uv-high';
            advice = 'High risk. Seek shade during midday hours.';
        } else if (uvIndex <= 10) {
            colorClass = 'uv-very-high';
            advice = 'Very high risk. SPF 50+, hat and sunglasses required.';
        } else {
            colorClass = 'uv-extreme';
            advice = 'Extreme risk. Avoid sun exposure between 10am-4pm.';
        }
        
        return { advice, colorClass };
    }

    function getActivitySuggestion(temp, conditions, isDay) {
        const weather = conditions.toLowerCase();
        const isClear = weather.includes('clear');
        const isRainy = weather.includes('rain') || weather.includes('drizzle');
        const isSnowy = weather.includes('snow');
        const isCold = temp < 10;
        const isWarm = temp >= 20 && temp < 30;
        const isHot = temp >= 30;
        
        if (!isDay) return isClear ? "Perfect night for stargazing 🌌" : "Great evening for a movie night indoors 🍿";
        if (isSnowy) return temp < -5 ? "Too cold! Stay warm with hot chocolate ❄️" : "Great day for skiing or building a snowman ⛷️";
        if (isRainy) return isCold ? "Cozy day for reading by the window ☔" : "Perfect for museum visits or indoor activities 🌧️";
        if (isHot) return isClear ? "Beach day! Don't forget sunscreen and water 🏖️" : "Great day for swimming or water activities 🏊";
        if (isWarm) return isClear ? "Perfect for cycling or outdoor sports 🚴" : "Nice for hiking or a picnic in the park 🌳";
        if (isCold) return "Chilly weather - great for coffee shop visits 🧥";
        return "Good day for a walk or outdoor cafe visit 🌤️";
    }

    function getWeatherAdvice(weather, temp, rainChance) {
        const weatherMain = weather.toLowerCase();
        
        if (rainChance > 70) return `🌧️ High chance of rain (${rainChance}%)! Definitely bring an umbrella and waterproof gear.`;
        if (rainChance > 40) return `☔ Possible rain (${rainChance}%) - consider carrying an umbrella just in case.`;
        if (weatherMain.includes('thunderstorm')) return "⚡ Thunderstorm alert! Stay indoors, unplug electronics, and avoid using wired devices.";
        if (weatherMain.includes('snow') && temp < -10) return "❄️ Extreme cold warning! Limit outdoor exposure and dress in layers.";
        if (temp > 35) return "🔥 Heat warning! Stay hydrated, avoid direct sun, and check on vulnerable individuals.";
        if (temp < 0) return "🧊 Freezing temperatures! Watch for ice and protect pipes from freezing.";
        
        return "🌤️ Weather looks moderate! Enjoy your day with appropriate clothing for the temperature.";
    }

    // Initialize the app
    init();
});