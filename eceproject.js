const weatherApiUrl = 'https://api.openweathermap.org/data/2.5/forecast';
const weatherApiKey = '91ce2860dfcb7f454e7e316cf301341a';
const geocodingApiUrl = 'https://api.openweathermap.org/geo/1.0/direct';
const geocodingApiKey = '91ce2860dfcb7f454e7e316cf301341a';

let map;
let temperatureChart;
let windSpeedChart;

function getWeather() {
    const city = document.getElementById('city-input').value;
    const duration = document.querySelector('input[name="forecast-duration"]:checked').value;

    document.getElementById('loading').style.display = 'block';

    if (city.trim() === "") {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            fetchWeatherData(lat, lon, duration);
        }, error => {
            alert('Failed to get your location. Please enter a city.');
            document.getElementById('loading').style.display = 'none';
        });
    } else {
        fetch(`${geocodingApiUrl}?q=${city},Greece&limit=1&appid=${geocodingApiKey}`)
            .then(response => response.json())
            .then(data => {
                const { lat, lon } = data[0];
                fetchWeatherData(lat, lon, duration);
            })
            .catch(error => {
                console.error('Error:', error.message);
                document.getElementById('loading').style.display = 'none';
                alert('Failed to fetch weather data. Please try again later.');
            });
    }
}

function fetchWeatherData(lat, lon, duration) {
    fetch(`${weatherApiUrl}?lat=${lat}&lon=${lon}&appid=${weatherApiKey}`)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            displayWeatherInfo(data, duration);
        })
        .catch(error => {
            console.error('Error:', error.message);
            alert('Failed to fetch weather data. Please try again later.');
        })
        .finally(() => {
            document.getElementById('loading').style.display = 'none';
        });
}

function displayWeatherInfo(data, duration) {
    if (map) {
        map.remove();
    }

    map = L.map('map').setView([data.city.coord.lat, data.city.coord.lon], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.marker([data.city.coord.lat, data.city.coord.lon]).addTo(map)
        .bindPopup('Your location')
        .openPopup();

    map.on('click', function(e) {
        const { lat, lng } = e.latlng;
        fetchWeatherData(lat, lng, duration);
    });

    const weatherData = data.list.filter(entry => {
        const entryDate = new Date(entry.dt_txt);
        const currentDate = new Date();
        const timeDiff = entryDate.getTime() - currentDate.getTime();
        const hoursDiff = Math.floor(timeDiff / (1000 * 3600)); 
        if (duration === '24') {
            return hoursDiff >= 0 && hoursDiff <= 24;
        } else if (duration === '3') {
            return hoursDiff >= 0 && hoursDiff <= (24 * 3);
        } else {
            return true; 
        }
    });

    const timeLabels = weatherData.map(entry => {
        const date = new Date(entry.dt_txt);
        return `${date.toLocaleDateString('en-US', { weekday: 'short' })}, ${date.toLocaleTimeString('en-US')}`;
    });
    const temperatures = weatherData.map(entry => (entry.main.temp - 273.15).toFixed(1));
    const feelsLikeTemperatures = weatherData.map(entry => (entry.main.feels_like - 273.15).toFixed(1));
    const windSpeeds = weatherData.map(entry => entry.wind.speed.toFixed(1));

    weatherData.forEach(entry => {
        const date = new Date(entry.dt_txt);
        const popupContent = `
            <strong>${date.toLocaleDateString('en-US', { weekday: 'short' })}, ${date.toLocaleTimeString('en-US')}</strong><br>
            Temperature: ${(entry.main.temp - 273.15).toFixed(1)}°C<br>
            Feels Like: ${(entry.main.feels_like - 273.15).toFixed(1)}°C<br>
            Wind Speed: ${entry.wind.speed.toFixed(1)} m/s
        `;
        L.marker([data.city.coord.lat, data.city.coord.lon])
            .addTo(map)
            .bindPopup(popupContent)
            .openPopup();
    });

    if (temperatureChart) {
        temperatureChart.destroy();
    }
    if (windSpeedChart) {
        windSpeedChart.destroy();
    }

    const temperatureCtx = document.getElementById('temperature-chart').getContext('2d');
    temperatureChart = new Chart(temperatureCtx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: temperatures,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Feels Like Temperature (°C)',
                    data: feelsLikeTemperatures,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false
                }
            },
        }
    });

    const windSpeedCtx = document.getElementById('wind-speed-chart').getContext('2d');
    windSpeedChart = new Chart(windSpeedCtx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'Wind Speed (m/s)',
                    data: windSpeeds,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}
