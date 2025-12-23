import { useState, useCallback } from 'react';

const RATE_LIMIT_KEY = 'hawkins_location_rate_limit';

/**
 * Analyzes interdimensional risk for a given location based on
 * real seismic and atmospheric data. Because science.
 */
export const useLocationRisk = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  const getRateLimitedUntil = () => {
    try {
      const until = localStorage.getItem(RATE_LIMIT_KEY);
      return until ? parseInt(until, 10) : 0;
    } catch {
      return 0;
    }
  };

  // Geocode a location string to coordinates
  const geocodeLocation = async (query) => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    const response = await fetch(url);
    if (response.status === 429) {
      localStorage.setItem(RATE_LIMIT_KEY, String(Date.now() + 30 * 60 * 1000));
      throw new Error('API rate limited - try again later');
    }
    if (!response.ok) throw new Error('Geocoding failed');
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      throw new Error('Location not found');
    }
    return data.results[0];
  };

  // Fetch weather data for coordinates
  const fetchWeather = async (lat, lon) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,precipitation,weather_code,cloud_cover,apparent_temperature&daily=sunrise,sunset&timezone=auto`;
    const response = await fetch(url);
    if (response.status === 429) {
      localStorage.setItem(RATE_LIMIT_KEY, String(Date.now() + 30 * 60 * 1000));
      throw new Error('API rate limited - try again later');
    }
    if (!response.ok) throw new Error('Weather fetch failed');
    return response.json();
  };

  // Fetch nearby earthquakes
  const fetchNearbyQuakes = async (lat, lon) => {
    const endTime = new Date().toISOString();
    const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Last 7 days

    // Search within ~500km radius (roughly 5 degrees)
    const minLat = lat - 5;
    const maxLat = lat + 5;
    const minLon = lon - 5;
    const maxLon = lon + 5;

    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTime}&endtime=${endTime}&minlatitude=${minLat}&maxlatitude=${maxLat}&minlongitude=${minLon}&maxlongitude=${maxLon}&minmagnitude=2.0&orderby=magnitude&limit=10`;

    const response = await fetch(url);
    if (!response.ok) return { features: [] };
    return response.json();
  };

  // Calculate distance between two points (km)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate interdimensional risk score (0-100)
  const calculateRiskScore = (weather, quakes, location) => {
    let score = 0;
    const factors = [];

    // Base instability (everyone has some risk)
    score += 15;
    factors.push({ name: 'BASELINE INSTABILITY', value: 15, desc: 'Ambient dimensional flux' });

    // Seismic factors
    if (quakes.features && quakes.features.length > 0) {
      const quakeScore = Math.min(30, quakes.features.length * 5);
      score += quakeScore;
      factors.push({
        name: 'SEISMIC ACTIVITY',
        value: quakeScore,
        desc: `${quakes.features.length} tectonic events detected nearby`
      });

      // Strongest quake bonus
      const maxMag = Math.max(...quakes.features.map(q => q.properties.mag || 0));
      if (maxMag >= 4) {
        const magBonus = Math.min(20, (maxMag - 3) * 10);
        score += magBonus;
        factors.push({
          name: 'MAJOR BREACH EVENT',
          value: magBonus,
          desc: `M${maxMag.toFixed(1)} dimensional rupture detected`
        });
      }
    }

    // Atmospheric factors
    const current = weather.current;

    // Storm activity
    if (current.weather_code >= 95) {
      score += 20;
      factors.push({ name: 'ELECTROMAGNETIC STORM', value: 20, desc: 'Severe atmospheric disturbance' });
    } else if (current.weather_code >= 80) {
      score += 10;
      factors.push({ name: 'PRECIPITATION ANOMALY', value: 10, desc: 'Weather pattern disruption' });
    }

    // Temperature extremes
    if (current.temperature_2m < -10 || current.temperature_2m > 40) {
      score += 15;
      factors.push({ name: 'THERMAL ANOMALY', value: 15, desc: 'Extreme temperature detected' });
    } else if (current.temperature_2m < 0) {
      score += 8;
      factors.push({ name: 'COLD FRONT', value: 8, desc: 'Sub-zero conditions (Upside Down resonance)' });
    }

    // Pressure anomalies
    if (current.surface_pressure < 990 || current.surface_pressure > 1030) {
      score += 10;
      factors.push({ name: 'PRESSURE DISTORTION', value: 10, desc: 'Barometric instability' });
    }

    // High winds
    if (current.wind_speed_10m > 50) {
      score += 12;
      factors.push({ name: 'VORTEX ACTIVITY', value: 12, desc: 'High-velocity atmospheric movement' });
    }

    // Time of day (darkness increases risk)
    const now = new Date();
    const sunrise = new Date(weather.daily.sunrise[0]);
    const sunset = new Date(weather.daily.sunset[0]);
    const isDark = now < sunrise || now > sunset;
    if (isDark) {
      score += 10;
      factors.push({ name: 'DARKNESS FACTOR', value: 10, desc: 'Reduced visibility increases vulnerability' });
    }

    // Cloud cover (obscured sky)
    if (current.cloud_cover > 80) {
      score += 5;
      factors.push({ name: 'SKY OBSCURED', value: 5, desc: 'Visual monitoring compromised' });
    }

    // Random dimensional fluctuation
    const fluctuation = Math.floor(Math.random() * 8);
    score += fluctuation;
    if (fluctuation > 3) {
      factors.push({ name: 'DIMENSIONAL FLUX', value: fluctuation, desc: 'Unexplained readings detected' });
    }

    return {
      score: Math.min(100, score),
      factors,
      level: score >= 80 ? 'CRITICAL' :
             score >= 60 ? 'HIGH' :
             score >= 40 ? 'ELEVATED' :
             score >= 25 ? 'MODERATE' : 'LOW'
    };
  };

  // Main scan function
  const scanLocation = useCallback(async (locationQuery) => {
    // Check rate limit before starting
    if (Date.now() < getRateLimitedUntil()) {
      setError('API rate limited - try again later');
      return null;
    }

    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {
      // Step 1: Geocode the location
      const location = await geocodeLocation(locationQuery);

      // Step 2: Fetch weather and quakes in parallel
      const [weather, quakes] = await Promise.all([
        fetchWeather(location.latitude, location.longitude),
        fetchNearbyQuakes(location.latitude, location.longitude),
      ]);

      // Step 3: Process nearby quakes with distances
      const nearbyAnomalies = (quakes.features || []).map(q => ({
        magnitude: q.properties.mag,
        place: q.properties.place,
        time: new Date(q.properties.time),
        distance: calculateDistance(
          location.latitude, location.longitude,
          q.geometry.coordinates[1], q.geometry.coordinates[0]
        ),
        type: q.properties.mag >= 5 ? 'MAJOR BREACH' :
              q.properties.mag >= 4 ? 'DIMENSIONAL RUPTURE' :
              q.properties.mag >= 3 ? 'INSTABILITY EVENT' : 'MICRO-FRACTURE',
      })).sort((a, b) => a.distance - b.distance).slice(0, 5);

      // Step 4: Calculate risk
      const risk = calculateRiskScore(weather, quakes, location);

      // Step 5: Compile result
      const result = {
        location: {
          name: location.name,
          admin: location.admin1 || location.country,
          country: location.country,
          lat: location.latitude,
          lon: location.longitude,
        },
        weather: {
          temperature: weather.current.temperature_2m,
          humidity: weather.current.relative_humidity_2m,
          pressure: weather.current.surface_pressure,
          windSpeed: weather.current.wind_speed_10m,
          weatherCode: weather.current.weather_code,
          cloudCover: weather.current.cloud_cover,
          isDark: (() => {
            const now = new Date();
            const sunrise = new Date(weather.daily.sunrise[0]);
            const sunset = new Date(weather.daily.sunset[0]);
            return now < sunrise || now > sunset;
          })(),
        },
        seismic: {
          quakeCount: quakes.features?.length || 0,
          maxMagnitude: quakes.features?.length > 0
            ? Math.max(...quakes.features.map(q => q.properties.mag || 0))
            : 0,
        },
        nearbyAnomalies,
        risk,
        timestamp: new Date(),
      };

      setScanResult(result);
      return result;

    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsScanning(false);
    }
  }, []);

  const clearScan = useCallback(() => {
    setScanResult(null);
    setError(null);
  }, []);

  return {
    scanLocation,
    clearScan,
    isScanning,
    scanResult,
    error,
  };
};

export default useLocationRisk;
