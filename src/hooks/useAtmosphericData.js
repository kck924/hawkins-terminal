import { useState, useEffect, useRef } from 'react';

const CACHE_KEY = 'hawkins_atmospheric_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache
const RATE_LIMIT_KEY = 'hawkins_atmospheric_rate_limit';

/**
 * Fetches real atmospheric data from Open-Meteo API and transforms it into
 * ominous readings for the Hawkins Terminal.
 */
export const useAtmosphericData = (easterEggState = null) => {
  // Check rate limit from localStorage (persists across page loads)
  const getRateLimitedUntil = () => {
    try {
      const until = localStorage.getItem(RATE_LIMIT_KEY);
      return until ? parseInt(until, 10) : 0;
    } catch {
      return 0;
    }
  };

  // Try to load cached data on init
  const getCachedData = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp, loc } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return { data, loc };
        }
      }
    } catch (e) {
      // Ignore cache errors
    }
    return null;
  };

  const cachedResult = getCachedData();
  const [atmosphericData, setAtmosphericData] = useState(cachedResult?.data || null);
  const [location, setLocation] = useState({ lat: 39.1653, lon: -86.5264 }); // Bloomington, IN (near Hawkins)
  const [locationName, setLocationName] = useState(cachedResult?.loc || 'HAWKINS, IN');
  const [isLive, setIsLive] = useState(!!cachedResult);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(cachedResult ? new Date() : null);
  const hasFetched = useRef(false);

  // Try to get user's location (only once)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setLocationName('LOCAL SENSOR ARRAY');
        },
        () => {
          console.log('Geolocation denied, using Hawkins, IN coordinates');
        }
      );
    }
  }, []);

  // Fetch atmospheric data - runs once on mount
  useEffect(() => {
    // Don't fetch if we already have cached data or already fetched
    if (hasFetched.current) return;
    if (cachedResult?.data) {
      hasFetched.current = true;
      return;
    }

    // Check rate limit
    if (Date.now() < getRateLimitedUntil()) {
      console.log('Atmospheric API: Rate limited, skipping fetch');
      hasFetched.current = true;
      return;
    }

    const fetchData = async () => {
      hasFetched.current = true;

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,precipitation,weather_code,cloud_cover&temperature_unit=celsius&wind_speed_unit=kmh`;

        const response = await fetch(url);

        if (response.status === 429) {
          console.warn('Open-Meteo API rate limited, backing off for 30 minutes');
          localStorage.setItem(RATE_LIMIT_KEY, String(Date.now() + 30 * 60 * 1000));
          return;
        }

        if (!response.ok) throw new Error('Open-Meteo API unavailable');

        const data = await response.json();
        setAtmosphericData(data.current);
        setLastFetch(new Date());
        setIsLive(true);
        setError(null);

        // Cache the successful response
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: data.current,
            timestamp: Date.now(),
            loc: locationName,
          }));
        } catch (e) {
          // Ignore cache write errors
        }
      } catch (err) {
        console.warn('Open-Meteo API error:', err.message);
        setError(err.message);
      }
    };

    fetchData();
  }, [location.lat, location.lon, locationName]);

  // Set up interval for periodic refresh (every 10 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      // Check rate limit before fetching
      if (Date.now() < getRateLimitedUntil()) {
        console.log('Atmospheric API: Rate limited, skipping periodic fetch');
        return;
      }

      const fetchData = async () => {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,precipitation,weather_code,cloud_cover&temperature_unit=celsius&wind_speed_unit=kmh`;

          const response = await fetch(url);

          if (response.status === 429) {
            console.warn('Open-Meteo API rate limited, backing off for 30 minutes');
            localStorage.setItem(RATE_LIMIT_KEY, String(Date.now() + 30 * 60 * 1000));
            return;
          }

          if (!response.ok) return;

          const data = await response.json();
          setAtmosphericData(data.current);
          setLastFetch(new Date());
          setIsLive(true);

          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: data.current,
            timestamp: Date.now(),
            loc: locationName,
          }));
        } catch (err) {
          console.warn('Open-Meteo periodic fetch error:', err.message);
        }
      };

      fetchData();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [location.lat, location.lon, locationName]);

  // Transform real data into Hawkins Terminal readings
  const getProcessedReadings = () => {
    if (!atmosphericData || !isLive) {
      // Fallback simulated data
      return {
        pressure: { value: '1013.2 hPa', status: 'STABLE', raw: 1013.2 },
        temperature: { value: '18.3°C', status: 'STABLE', raw: 18.3 },
        humidity: { value: '67%', status: 'STABLE', raw: 67 },
        emField: { value: '████████', status: '██████', raw: null },
        radiation: { value: '0.12 μSv/h', status: 'NORMAL', raw: 0.12 },
        particleFlux: { value: '2.3E+04', status: 'ELEVATED', raw: 23000 },
        isLive: false,
      };
    }

    const temp = atmosphericData.temperature_2m;
    const humidity = atmosphericData.relative_humidity_2m;
    const pressure = atmosphericData.surface_pressure;
    const windSpeed = atmosphericData.wind_speed_10m;
    const precipitation = atmosphericData.precipitation;
    const cloudCover = atmosphericData.cloud_cover;
    const weatherCode = atmosphericData.weather_code;

    // Determine anomaly levels based on weather conditions
    const isStormy = weatherCode >= 95;
    const isExtreme = temp < -10 || temp > 40 || windSpeed > 50;
    const isPrecipitating = precipitation > 0;

    // Easter egg modifications
    const easterEggActive = easterEggState === 'DEMOGORGON' || easterEggState === 'MINDFLAYER';

    // Temperature
    let tempValue = temp;
    let tempStatus = 'STABLE';
    if (easterEggActive) {
      tempValue = -12.4 - Math.random() * 5;
      tempStatus = 'ANOMALY';
    } else if (temp < 0) {
      tempStatus = 'LOW';
    } else if (temp > 35) {
      tempStatus = 'HIGH';
    }

    // Pressure anomalies
    let pressureStatus = 'STABLE';
    if (pressure < 1000) pressureStatus = 'LOW';
    else if (pressure > 1025) pressureStatus = 'HIGH';
    if (isStormy) pressureStatus = 'UNSTABLE';

    // Humidity
    let humidityStatus = 'STABLE';
    if (humidity > 85) humidityStatus = 'HIGH';
    else if (humidity < 30) humidityStatus = 'LOW';

    // EM Field
    let emFieldValue = '12.4 μT';
    let emFieldStatus = 'NORMAL';
    if (isStormy || easterEggActive) {
      emFieldValue = '████████';
      emFieldStatus = '██████';
    } else if (cloudCover > 80) {
      emFieldValue = '18.7 μT';
      emFieldStatus = 'ELEVATED';
    }

    // Radiation
    let radiationValue = (0.08 + Math.random() * 0.08).toFixed(2);
    let radiationStatus = 'NORMAL';
    if (easterEggActive) {
      radiationValue = (3.5 + Math.random() * 2).toFixed(2);
      radiationStatus = 'DANGER';
    } else if (isStormy) {
      radiationValue = (0.25 + Math.random() * 0.15).toFixed(2);
      radiationStatus = 'ELEVATED';
    }

    // Particle flux
    const baseFlux = 15000 + (windSpeed * 200) + (precipitation * 5000);
    let fluxValue = (baseFlux + Math.random() * 5000).toExponential(1).toUpperCase();
    let fluxStatus = baseFlux > 25000 ? 'ELEVATED' : baseFlux > 40000 ? 'HIGH' : 'NORMAL';
    if (easterEggActive) {
      fluxValue = (baseFlux * 3).toExponential(1).toUpperCase();
      fluxStatus = 'CRITICAL';
    }

    return {
      pressure: { value: `${pressure.toFixed(1)} hPa`, status: pressureStatus, raw: pressure },
      temperature: { value: `${tempValue.toFixed(1)}°C`, status: tempStatus, raw: tempValue },
      humidity: { value: `${humidity}%`, status: humidityStatus, raw: humidity },
      emField: { value: emFieldValue, status: emFieldStatus, raw: cloudCover },
      radiation: { value: `${radiationValue} μSv/h`, status: radiationStatus, raw: parseFloat(radiationValue) },
      particleFlux: { value: fluxValue, status: fluxStatus, raw: baseFlux },
      windSpeed: { value: `${windSpeed.toFixed(1)} km/h`, raw: windSpeed },
      weatherCode,
      isLive: true,
      isStormy,
      locationName,
    };
  };

  return {
    readings: getProcessedReadings(),
    rawData: atmosphericData,
    isLive,
    error,
    lastFetch,
    location,
    locationName,
  };
};

export default useAtmosphericData;
