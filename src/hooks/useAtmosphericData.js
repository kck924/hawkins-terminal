import { useState, useEffect, useCallback, useRef } from 'react';

const CACHE_KEY = 'hawkins_atmospheric_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

/**
 * Fetches real atmospheric data from Open-Meteo API and transforms it into
 * ominous readings for the Hawkins Terminal.
 *
 * Real weather = real dimensional instability indicators.
 */
export const useAtmosphericData = (easterEggState = null) => {
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
  const rateLimitedUntil = useRef(0);

  // Try to get user's location
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
          // Geolocation denied, use default (Hawkins area)
          console.log('Geolocation denied, using Hawkins, IN coordinates');
        }
      );
    }
  }, []);

  // Fetch atmospheric data from Open-Meteo
  const fetchAtmospheric = useCallback(async () => {
    // Skip if rate limited
    if (Date.now() < rateLimitedUntil.current) {
      console.log('Atmospheric API: Rate limited, using cached data');
      return atmosphericData;
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,precipitation,weather_code,cloud_cover&temperature_unit=celsius&wind_speed_unit=kmh`;

      const response = await fetch(url);

      // Handle rate limiting
      if (response.status === 429) {
        console.warn('Open-Meteo API rate limited, backing off for 15 minutes');
        rateLimitedUntil.current = Date.now() + 15 * 60 * 1000;
        // Keep existing data as "live" if we have it
        if (atmosphericData) {
          setIsLive(true);
        }
        return atmosphericData;
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

      return data.current;
    } catch (err) {
      console.warn('Open-Meteo API error:', err.message);
      setError(err.message);
      // Keep live status if we have cached data
      if (!atmosphericData) {
        setIsLive(false);
      }
      return null;
    }
  }, [location, atmosphericData, locationName]);

  // Fetch on mount and every 10 minutes (reduced to avoid rate limits)
  useEffect(() => {
    fetchAtmospheric();
    const interval = setInterval(fetchAtmospheric, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAtmospheric]);

  // Transform real data into Hawkins Terminal readings
  const getProcessedReadings = useCallback(() => {
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
    const isStormy = weatherCode >= 95; // Thunderstorm codes
    const isExtreme = temp < -10 || temp > 40 || windSpeed > 50;
    const isPrecipitating = precipitation > 0;

    // Easter egg modifications
    const easterEggActive = easterEggState === 'DEMOGORGON' || easterEggState === 'MINDFLAYER';

    // Temperature (modified by easter eggs)
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

    // EM Field - based on storm activity and cloud cover
    let emFieldValue = '12.4 μT';
    let emFieldStatus = 'NORMAL';
    if (isStormy || easterEggActive) {
      emFieldValue = '████████';
      emFieldStatus = '██████';
    } else if (cloudCover > 80) {
      emFieldValue = '18.7 μT';
      emFieldStatus = 'ELEVATED';
    }

    // Radiation - mostly stable, spikes during storms/easter eggs
    let radiationValue = (0.08 + Math.random() * 0.08).toFixed(2);
    let radiationStatus = 'NORMAL';
    if (easterEggActive) {
      radiationValue = (3.5 + Math.random() * 2).toFixed(2);
      radiationStatus = 'DANGER';
    } else if (isStormy) {
      radiationValue = (0.25 + Math.random() * 0.15).toFixed(2);
      radiationStatus = 'ELEVATED';
    }

    // Particle flux - based on precipitation and wind
    const baseFlux = 15000 + (windSpeed * 200) + (precipitation * 5000);
    let fluxValue = (baseFlux + Math.random() * 5000).toExponential(1).toUpperCase();
    let fluxStatus = baseFlux > 25000 ? 'ELEVATED' : baseFlux > 40000 ? 'HIGH' : 'NORMAL';
    if (easterEggActive) {
      fluxValue = (baseFlux * 3).toExponential(1).toUpperCase();
      fluxStatus = 'CRITICAL';
    }

    return {
      pressure: {
        value: `${pressure.toFixed(1)} hPa`,
        status: pressureStatus,
        raw: pressure,
      },
      temperature: {
        value: `${tempValue.toFixed(1)}°C`,
        status: tempStatus,
        raw: tempValue,
      },
      humidity: {
        value: `${humidity}%`,
        status: humidityStatus,
        raw: humidity,
      },
      emField: {
        value: emFieldValue,
        status: emFieldStatus,
        raw: cloudCover,
      },
      radiation: {
        value: `${radiationValue} μSv/h`,
        status: radiationStatus,
        raw: parseFloat(radiationValue),
      },
      particleFlux: {
        value: fluxValue,
        status: fluxStatus,
        raw: baseFlux,
      },
      windSpeed: {
        value: `${windSpeed.toFixed(1)} km/h`,
        raw: windSpeed,
      },
      weatherCode,
      isLive: true,
      isStormy,
      locationName,
    };
  }, [atmosphericData, isLive, easterEggState, locationName]);

  return {
    readings: getProcessedReadings(),
    rawData: atmosphericData,
    isLive,
    error,
    lastFetch,
    location,
    locationName,
    refetch: fetchAtmospheric,
  };
};

export default useAtmosphericData;
