/* weather-app.js - v2.1.3 - Last updated: 2024-06-15 */
/* Main weather app functionality - needs some refactoring */
/* TODO: Break this into modules */

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - weather app initializing...');
    
    // Grab DOM elements - some might not be used yet
    const weatherContainer = document.getElementById('weatherContainer');
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    const locationBtn = document.getElementById('locationBtn');
    const currentTemp = document.getElementById('currentTemp');
    const cityName = document.getElementById('cityName');
    const weatherDesc = document.getElementById('weatherDesc');
    const windSpeed = document.getElementById('windSpeed');
    const humidity = document.getElementById('humidity');
    const pressure = document.getElementById('pressure');
    const rainChance = document.getElementById('rainChance');
    const weatherIcon = document.getElementById('weatherIcon');
    const forecastDays = document.getElementById('forecastDays');
    const weatherAdvice = document.getElementById('weather-advice');
    const uvAdviceEl = document.getElementById('uvAdvice');
    const airQualityAdvice = document.getElementById('airQualityAdvice');
    const suggestedActivity = document.getElementById('suggestedActivity');
    const currentDateEl = document.getElementById('currentDate');
    const currentTimeEl = document.getElementById('currentTime');
    const themeButtons = document.querySelectorAll('.theme-btn');
    
    // Initialize with some default values
    uvAdviceEl.textContent = 'UV data will appear here';
    airQualityAdvice.textContent = 'Air quality data will appear here';
    suggestedActivity.textContent = 'Activity suggestions will appear here';
    weatherAdvice.textContent = 'Weather tips will appear here';

    // API Key - TODO: Move to config file
    const API_KEY = '9ca0b1230abd6528bad9efa3075e75f5'; 
    let currentTheme = 'light';
    let cityTimeInterval = null;

    // Timezone stuff - could be its own module
    function updateLocalDateTime(timezoneOffset) {
        // Clear existing interval if any
        if (cityTimeInterval) {
            clearInterval(cityTimeInterval);
        }
        
        // This could be more elegant
        const updateTime = () => {
            const now = new Date();
            const utc = now.getTime() + now.getTimezoneOffset() * 60000;
            const cityTime = new Date(utc + (timezoneOffset * 1000));
            
            // Format date - locale might need adjustment
            const dateOptions = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            currentDateEl.textContent = cityTime.toLocaleDateString(undefined, dateOptions);
            
            // Format time
            currentTimeEl.textContent = cityTime.toLocaleTimeString();
        };
        
        updateTime(); // Initial call
        cityTimeInterval = setInterval(updateTime, 1000); // Update every second
    }

    // Theme switcher - simple but works
    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const theme = button.getAttribute('data-theme');
            document.documentElement.setAttribute('data-theme', theme);
            currentTheme = theme;
            
            // Update active state
            themeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            console.log('Theme changed to:', theme);
        });
    });

    // Weather icon mapping - could be in a config file
    const weatherIcons = {
        '01d': 'fas fa-sun',         // Clear sky day
        '01n': 'fas fa-moon',        // Clear sky night
        '02d': 'fas fa-cloud-sun',    // Few clouds day
        '02n': 'fas fa-cloud-moon',   // Few clouds night
        '03d': 'fas fa-cloud',        // Scattered clouds
        '03n': 'fas fa-cloud',
        '04d': 'fas fa-cloud',        // Broken clouds
        '04n': 'fas fa-cloud',
        '09d': 'fas fa-cloud-rain',   // Shower rain
        '09n': 'fas fa-cloud-rain',
        '10d': 'fas fa-cloud-sun-rain', // Rain day
        '10n': 'fas fa-cloud-moon-rain',// Rain night
        '11d': 'fas fa-bolt',         // Thunderstorm
        '11n': 'fas fa-bolt',
        '13d': 'fas fa-snowflake',    // Snow
        '13n': 'fas fa-snowflake',
        '50d': 'fas fa-smog',         // Mist
        '50n': 'fas fa-smog'
    };
    
    // Air Quality Index categories - might need updating
    function getAQICategory(aqi) {
        // These ranges are from EPA standards
        if (aqi <= 50) return { level: 'Good', color: 'aqi-good' };
        if (aqi <= 100) return { level: 'Moderate', color: 'aqi-moderate' };
        if (aqi <= 150) return { level: 'Unhealthy for Sensitive Groups', color: 'aqi-unhealthy-sensitive' };
        if (aqi <= 200) return { level: 'Unhealthy', color: 'aqi-unhealthy' };
        if (aqi <= 300) return { level: 'Very Unhealthy', color: 'aqi-very-unhealthy' };
        return { level: 'Hazardous', color: 'aqi-hazardous' };
    }
    
    // UV Index advice - based on WHO guidelines
    function getUVAdvice(uvIndex) {
        let colorClass = 'uv-low';
        let advice = '';
        
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
    
    // Activity suggestions - could be more sophisticated
    function getActivitySuggestion(temp, conditions, isDay) {
        const weather = conditions.toLowerCase();
        const isClear = weather.includes('clear');
        const isRainy = weather.includes('rain') || weather.includes('drizzle');
        const isSnowy = weather.includes('snow');
        const isCold = temp < 10; // Celsius
        const isWarm = temp >= 20 && temp < 30;
        const isHot = temp >= 30;
        
        if (!isDay) {
            if (isClear) return "Perfect night for stargazing 🌌";
            return "Great evening for a movie night indoors 🍿";
        }
        
        if (isSnowy) {
            if (temp < -5) return "Too cold! Stay warm with hot chocolate ❄️";
            return "Great day for skiing or building a snowman ⛷️";
        }
        
        if (isRainy) {
            if (isCold) return "Cozy day for reading by the window ☔";
            return "Perfect for museum visits or indoor activities 🌧️";
        }
        
        if (isHot) {
            if (isClear) return "Beach day! Don't forget sunscreen and water 🏖️";
            return "Great day for swimming or water activities 🏊";
        }
        
        if (isWarm) {
            if (isClear) return "Perfect for cycling or outdoor sports 🚴";
            return "Nice for hiking or a picnic in the park 🌳";
        }
        
        if (isCold) {
            return "Chilly weather - great for coffee shop visits 🧥";
        }
        
        // Default suggestion
        return "Good day for a walk or outdoor cafe visit 🌤️";
    }
    
    // Weather advice - could use more conditions
    function getWeatherAdvice(weather, temp, rainChance) {
        const weatherMain = weather.toLowerCase();
        const isDaytime = !weatherIcon.querySelector('.fa-moon, .fa-cloud-moon, .fa-cloud-moon-rain');
        
        if (rainChance > 70) {
            return `🌧️ High chance of rain (${rainChance}%)! Definitely bring an umbrella and waterproof gear.`;
        } else if (rainChance > 40) {
            return `☔ Possible rain (${rainChance}%) - consider carrying an umbrella just in case.`;
        } else if (weatherMain.includes('thunderstorm')) {
            return "⚡ Thunderstorm alert! Stay indoors, unplug electronics, and avoid using wired devices.";
        }
        // ... rest of weather advice logic remains the same ...
        
        return "🌤️ Weather looks moderate! Enjoy your day with appropriate clothing for the temperature.";
    }
    
    // Main weather fetch function - kinda long
    async function fetchWeather(city) {
        try {
            // Show loading states
            uvAdviceEl.textContent = 'Loading UV data...';
            airQualityAdvice.textContent = 'Loading air quality...';
            suggestedActivity.textContent = 'Loading suggestions...';
            weatherAdvice.textContent = 'Loading weather tips...';
            
            // Current weather
            const currentResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
            );
            const currentData = await currentResponse.json();
            
            if (currentData.cod !== 200) {
                throw new Error(currentData.message);
            }
            
            // Forecast - could parallelize these requests
            const forecastResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
            );
            const forecastData = await forecastResponse.json();
            
            // Air Quality - might fail
            let aqiData;
            try {
                const aqiResponse = await fetch(
                    `https://api.openweathermap.org/data/2.5/air_pollution?lat=${currentData.coord.lat}&lon=${currentData.coord.lon}&appid=${API_KEY}`
                );
                aqiData = await aqiResponse.json();
            } catch (error) {
                console.error('Error fetching air quality:', error);
                aqiData = null;
            }
            
            // UV Index - might fail
            let uvData;
            try {
                const uvResponse = await fetch(
                    `https://api.openweathermap.org/data/2.5/uvi?lat=${currentData.coord.lat}&lon=${currentData.coord.lon}&appid=${API_KEY}`
                );
                uvData = await uvResponse.json();
            } catch (error) {
                console.error('Error fetching UV index:', error);
                uvData = null;
            }
            
            // Display everything
            displayWeather(currentData, forecastData, aqiData, uvData);
        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error('Error fetching weather data:', error);
            
            // Set error states
            uvAdviceEl.textContent = 'Failed to load UV data';
            airQualityAdvice.textContent = 'Failed to load air quality';
            suggestedActivity.textContent = 'Failed to load suggestions';
            weatherAdvice.textContent = 'Failed to load weather tips';
        }
    }
    
    // Location-based weather fetch
    function fetchWeatherByLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        // Show loading states
                        uvAdviceEl.textContent = 'Loading UV data...';
                        airQualityAdvice.textContent = 'Loading air quality...';
                        suggestedActivity.textContent = 'Loading suggestions...';
                        weatherAdvice.textContent = 'Loading weather tips...';
                        
                        // Current weather
                        const currentResponse = await fetch(
                            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
                        );
                        const currentData = await currentResponse.json();
                        
                        // Forecast
                        const forecastResponse = await fetch(
                            `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
                        );
                        const forecastData = await forecastResponse.json();
                        
                        // Air Quality
                        let aqiData;
                        try {
                            const aqiResponse = await fetch(
                                `https://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`
                            );
                            aqiData = await aqiResponse.json();
                        } catch (error) {
                            console.error('Error fetching air quality:', error);
                            aqiData = null;
                        }
                        
                        // UV Index
                        let uvData;
                        try {
                            const uvResponse = await fetch(
                                `https://api.openweathermap.org/data/2.5/uvi?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`
                            );
                            uvData = await uvResponse.json();
                        } catch (error) {
                            console.error('Error fetching UV index:', error);
                            uvData = null;
                        }
                        
                        displayWeather(currentData, forecastData, aqiData, uvData);
                    } catch (error) {
                        alert(`Error: ${error.message}`);
                        console.error('Error fetching weather data:', error);
                    }
                },
                (error) => {
                    alert(`Geolocation error: ${error.message}`);
                    console.error('Geolocation error:', error);
                }
            );
        } else {
            alert('Geolocation is not supported by your browser');
        }
    }
    
    // Display weather data - this function is too big
    async function displayWeather(currentData, forecastData, aqiData, uvData) {
        // Current weather
        const currentTempValue = Math.round(currentData.main.temp);
        cityName.textContent = `${currentData.name}, ${currentData.sys.country}`;
        currentTemp.textContent = currentTempValue;
        weatherDesc.textContent = currentData.weather[0].description;
        windSpeed.textContent = `${Math.round(currentData.wind.speed * 3.6)} km/h`;
        humidity.textContent = `${currentData.main.humidity}%`;
        pressure.textContent = `${currentData.main.pressure} hPa`;
        
        // Update local time
        updateLocalDateTime(currentData.timezone);
        
        // Calculate rain chance for today
        let todayRainChance = 0;
        const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
        const todayForecasts = forecastData.list.filter(item => {
            const date = new Date(item.dt * 1000);
            return date.toLocaleDateString('en-US', { weekday: 'short' }) === today;
        });
        
        if (todayForecasts.length > 0) {
            const totalPop = todayForecasts.reduce((sum, item) => sum + item.pop, 0);
            todayRainChance = Math.round((totalPop / todayForecasts.length) * 100);
        }
        
        // Display rain chance
        rainChance.textContent = `${todayRainChance}%`;
        if (todayRainChance > 50) {
            rainChance.classList.add('high-rain-chance');
        } else {
            rainChance.classList.remove('high-rain-chance');
        }
        
        // Weather icon
        const iconCode = currentData.weather[0].icon;
        weatherIcon.innerHTML = `<i class="${weatherIcons[iconCode] || 'fas fa-question'}"></i>`;
        
        // Weather advice
        weatherAdvice.textContent = getWeatherAdvice(
            currentData.weather[0].main, 
            currentTempValue, 
            todayRainChance
        );
        
        // Air Quality
        if (aqiData && aqiData.list) {
            const aqi = aqiData.list[0].main.aqi;
            const aqiCategory = getAQICategory(aqi);
            airQualityAdvice.textContent = `${aqiCategory.level} air quality`;
            document.getElementById('airQualityCard').classList.add(aqiCategory.color);
        } else {
            airQualityAdvice.textContent = 'Air quality data unavailable';
        }
        
        // UV Index
        if (uvData && uvData.value !== undefined) {
            const uvIndex = Math.round(uvData.value);
            const uvAdvice = getUVAdvice(uvIndex);
            uvAdviceEl.textContent = uvAdvice.advice;
            document.getElementById('uvAdvisory').classList.add(uvAdvice.colorClass);
        } else {
            uvAdviceEl.textContent = 'UV data unavailable';
        }
        
        // Activity Suggestion
        const isDay = !currentData.weather[0].icon.includes('n');
        suggestedActivity.textContent = getActivitySuggestion(
            currentData.main.temp,
            currentData.weather[0].main,
            isDay
        );
        
        // Change background based on weather
        changeBackgroundColor(currentData.weather[0].main);
        
        // Forecast
        forecastDays.innerHTML = '';
        
        // Group forecast by day
        const dailyForecast = {};
        forecastData.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            if (!dailyForecast[day]) {
                dailyForecast[day] = {
                    temps: [],
                    icons: [],
                    descriptions: [],
                    pop: []
                };
            }
            
            dailyForecast[day].temps.push(item.main.temp);
            dailyForecast[day].icons.push(item.weather[0].icon);
            dailyForecast[day].descriptions.push(item.weather[0].description);
            dailyForecast[day].pop.push(item.pop);
        });
        
        // Display 5-day forecast
        Object.keys(dailyForecast).slice(0, 5).forEach(day => {
            const dayData = dailyForecast[day];
            const maxTemp = Math.round(Math.max(...dayData.temps));
            const minTemp = Math.round(Math.min(...dayData.temps));
            const avgPop = Math.round((dayData.pop.reduce((a, b) => a + b, 0) / dayData.pop.length) * 100);
            const willRain = avgPop > 20;
            
            // Get most frequent icon
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
                ${willRain ? `<div class="rain-chance"><i class="fas fa-umbrella"></i> ${avgPop}%</div>` : ''}
            `;
            
            forecastDays.appendChild(forecastDayElement);
        });
        
        // Animate appearance
        document.querySelector('.current-weather').style.animation = 'fadeIn 1s ease';
        document.querySelector('.forecast-container').style.animation = 'fadeIn 1.2s ease';
        document.querySelector('.weather-tips').style.animation = 'fadeIn 1.4s ease';
        document.querySelector('.health-advisory').style.animation = 'fadeIn 1.6s ease';
    }
    
    // Change background color - simple implementation
    function changeBackgroundColor(weatherCondition) {
        const body = document.body;
        
        const backgrounds = {
            'Clear': '#87CEFA',       // Light sky blue
            'Clouds': '#D3D3D3',     // Light gray
            'Rain': '#1E90FF',       // Dodger blue
            'Thunderstorm': '#A9A9A9', // Dark gray
            'Snow': '#F0F8FF',       // Alice blue
            'Mist': '#C0C0C0',       // Silver
            'Drizzle': '#00BFFF',     // Deep sky blue
            'Haze': '#F4A300'         // Orange
        };
        
        body.style.backgroundColor = backgrounds[weatherCondition] || '#f0f0f0';
    }
    
    // Event listeners
    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeather(city);
        } else {
            alert('Please enter a city name');
        }
    });
    
    locationBtn.addEventListener('click', fetchWeatherByLocation);
    
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            if (city) {
                fetchWeather(city);
            }
        }
    });
    
    // Initialize with default city
    fetchWeather('hyderabad');
    
    // Debug stuff
    console.log('Weather app initialized successfully');
    window.weatherApp = {
        fetchWeather,
        fetchWeatherByLocation,
        getAQICategory,
        getUVAdvice,
        getActivitySuggestion
    };
});