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

  // Generate simulated scan result when API is unavailable
  const generateSimulatedResult = (locationQuery) => {
    // Generate pseudo-random but consistent values based on location string
    const hash = locationQuery.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seed = (hash % 100) / 100;

    const baseScore = 20 + Math.floor(seed * 40);
    const factors = [
      { name: 'BASELINE INSTABILITY', value: 15, desc: 'Ambient dimensional flux' },
    ];

    // Add random factors based on seed
    if (seed > 0.3) {
      factors.push({ name: 'ATMOSPHERIC VARIANCE', value: 8 + Math.floor(seed * 10), desc: 'Weather pattern anomaly detected' });
    }
    if (seed > 0.5) {
      factors.push({ name: 'GEOLOGICAL RESONANCE', value: 5 + Math.floor(seed * 8), desc: 'Subsurface activity detected' });
    }
    if (seed > 0.7) {
      factors.push({ name: 'EM FIELD DISTORTION', value: 7, desc: 'Electromagnetic irregularity' });
    }

    const now = new Date();
    const isDark = now.getHours() < 6 || now.getHours() > 18;
    if (isDark) {
      factors.push({ name: 'DARKNESS FACTOR', value: 10, desc: 'Reduced visibility increases vulnerability' });
    }

    const finalScore = Math.min(100, factors.reduce((sum, f) => sum + f.value, 0));

    return {
      location: {
        name: locationQuery.toUpperCase(),
        admin: 'REGION CLASSIFIED',
        country: 'SCANNING...',
        lat: 39.0 + (seed * 10),
        lon: -95.0 + (seed * 30),
      },
      weather: {
        temperature: 10 + Math.floor(seed * 20),
        humidity: 40 + Math.floor(seed * 40),
        pressure: 1000 + Math.floor(seed * 25),
        windSpeed: 5 + Math.floor(seed * 25),
        weatherCode: seed > 0.7 ? 80 : seed > 0.4 ? 3 : 0,
        cloudCover: Math.floor(seed * 100),
        isDark,
      },
      seismic: {
        quakeCount: Math.floor(seed * 5),
        maxMagnitude: seed > 0.5 ? 2.5 + seed * 2 : 0,
      },
      nearbyAnomalies: seed > 0.4 ? [
        {
          magnitude: 2.5 + seed,
          place: `${Math.floor(50 + seed * 100)}km from scan location`,
          time: new Date(Date.now() - Math.floor(seed * 48 * 60 * 60 * 1000)),
          distance: 50 + Math.floor(seed * 150),
          type: 'MICRO-FRACTURE',
        }
      ] : [],
      risk: {
        score: finalScore,
        factors,
        level: finalScore >= 80 ? 'CRITICAL' :
               finalScore >= 60 ? 'HIGH' :
               finalScore >= 40 ? 'ELEVATED' :
               finalScore >= 25 ? 'MODERATE' : 'LOW'
      },
      timestamp: new Date(),
      isSimulated: true,
    };
  };

  // Geocode a location string to coordinates
  const geocodeLocation = async (query) => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    const response = await fetch(url);
    if (response.status === 429) {
      localStorage.setItem(RATE_LIMIT_KEY, String(Date.now() + 30 * 60 * 1000));
      throw new Error('RATE_LIMITED');
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
      throw new Error('RATE_LIMITED');
    }
    if (!response.ok) throw new Error('Weather fetch failed');
    return response.json();
  };

  // Fetch nearby earthquakes
  const fetchNearbyQuakes = async (lat, lon) => {
    const endTime = new Date().toISOString();
    const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

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
  const calculateRiskScore = (weather, quakes) => {
    let score = 0;
    const factors = [];

    score += 15;
    factors.push({ name: 'BASELINE INSTABILITY', value: 15, desc: 'Ambient dimensional flux' });

    if (quakes.features && quakes.features.length > 0) {
      const quakeScore = Math.min(30, quakes.features.length * 5);
      score += quakeScore;
      factors.push({
        name: 'SEISMIC ACTIVITY',
        value: quakeScore,
        desc: `${quakes.features.length} tectonic events detected nearby`
      });

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

    const current = weather.current;

    if (current.weather_code >= 95) {
      score += 20;
      factors.push({ name: 'ELECTROMAGNETIC STORM', value: 20, desc: 'Severe atmospheric disturbance' });
    } else if (current.weather_code >= 80) {
      score += 10;
      factors.push({ name: 'PRECIPITATION ANOMALY', value: 10, desc: 'Weather pattern disruption' });
    }

    if (current.temperature_2m < -10 || current.temperature_2m > 40) {
      score += 15;
      factors.push({ name: 'THERMAL ANOMALY', value: 15, desc: 'Extreme temperature detected' });
    } else if (current.temperature_2m < 0) {
      score += 8;
      factors.push({ name: 'COLD FRONT', value: 8, desc: 'Sub-zero conditions (Upside Down resonance)' });
    }

    if (current.surface_pressure < 990 || current.surface_pressure > 1030) {
      score += 10;
      factors.push({ name: 'PRESSURE DISTORTION', value: 10, desc: 'Barometric instability' });
    }

    if (current.wind_speed_10m > 50) {
      score += 12;
      factors.push({ name: 'VORTEX ACTIVITY', value: 12, desc: 'High-velocity atmospheric movement' });
    }

    const now = new Date();
    const sunrise = new Date(weather.daily.sunrise[0]);
    const sunset = new Date(weather.daily.sunset[0]);
    const isDark = now < sunrise || now > sunset;
    if (isDark) {
      score += 10;
      factors.push({ name: 'DARKNESS FACTOR', value: 10, desc: 'Reduced visibility increases vulnerability' });
    }

    if (current.cloud_cover > 80) {
      score += 5;
      factors.push({ name: 'SKY OBSCURED', value: 5, desc: 'Visual monitoring compromised' });
    }

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
    setIsScanning(true);
    setError(null);
    setScanResult(null);

    // Check rate limit - use simulation as fallback
    const isRateLimited = Date.now() < getRateLimitedUntil();

    try {
      // If rate limited, go straight to simulation
      if (isRateLimited) {
        // Simulate scanning delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        const simResult = generateSimulatedResult(locationQuery);
        setScanResult(simResult);
        return simResult;
      }

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
      const risk = calculateRiskScore(weather, quakes);

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
        isSimulated: false,
      };

      setScanResult(result);
      return result;

    } catch (err) {
      // If API fails (including rate limit), fall back to simulation
      if (err.message === 'RATE_LIMITED' || err.message.includes('rate')) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const simResult = generateSimulatedResult(locationQuery);
        setScanResult(simResult);
        return simResult;
      }

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
