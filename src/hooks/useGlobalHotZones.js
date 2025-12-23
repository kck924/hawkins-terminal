import { useState, useEffect, useCallback } from 'react';

/**
 * Fetches real-time global seismic AND atmospheric data to identify
 * interdimensional hot zones based on combined risk factors.
 *
 * Risk calculation mirrors useLocationRisk - combining:
 * - Seismic activity (earthquakes)
 * - Atmospheric conditions (weather, pressure, storms)
 * - Time of day (darkness factor)
 */
export const useGlobalHotZones = () => {
  const [hotZones, setHotZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  // Fetch weather data for a location
  const fetchWeather = async (lat, lon) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,precipitation,weather_code,cloud_cover&daily=sunrise,sunset&timezone=auto`;
      const response = await fetch(url);
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  };

  // Calculate combined risk score (seismic + atmospheric)
  const calculateCombinedRisk = (seismicData, weather) => {
    let score = 0;
    const factors = [];

    // Base instability
    score += 10;
    factors.push({ name: 'BASELINE', value: 10 });

    // === SEISMIC FACTORS ===

    // Event count contribution
    const eventScore = Math.min(25, seismicData.quakeCount * 2);
    if (eventScore > 0) {
      score += eventScore;
      factors.push({ name: 'SEISMIC ACTIVITY', value: eventScore, desc: `${seismicData.quakeCount} events` });
    }

    // Magnitude contribution
    if (seismicData.maxMagnitude >= 6) {
      score += 25;
      factors.push({ name: 'MAJOR BREACH', value: 25, desc: `M${seismicData.maxMagnitude.toFixed(1)} rupture` });
    } else if (seismicData.maxMagnitude >= 5) {
      score += 18;
      factors.push({ name: 'SIGNIFICANT EVENT', value: 18, desc: `M${seismicData.maxMagnitude.toFixed(1)} detected` });
    } else if (seismicData.maxMagnitude >= 4) {
      score += 10;
      factors.push({ name: 'MODERATE EVENT', value: 10, desc: `M${seismicData.maxMagnitude.toFixed(1)} detected` });
    }

    // Recent activity bonus
    if (seismicData.recentCount > 0) {
      const recentScore = Math.min(15, seismicData.recentCount * 5);
      score += recentScore;
      factors.push({ name: 'RECENT ACTIVITY', value: recentScore, desc: `${seismicData.recentCount} in 24h` });
    }

    // === ATMOSPHERIC FACTORS ===

    if (weather && weather.current) {
      const current = weather.current;

      // Storm activity (weather codes 95+ are thunderstorms)
      if (current.weather_code >= 95) {
        score += 18;
        factors.push({ name: 'ELECTROMAGNETIC STORM', value: 18, desc: 'Severe atmospheric disturbance' });
      } else if (current.weather_code >= 80) {
        score += 8;
        factors.push({ name: 'PRECIPITATION ANOMALY', value: 8, desc: 'Weather disruption' });
      }

      // Temperature extremes
      if (current.temperature_2m < -10 || current.temperature_2m > 40) {
        score += 12;
        factors.push({ name: 'THERMAL ANOMALY', value: 12, desc: `${current.temperature_2m.toFixed(0)}°C extreme` });
      } else if (current.temperature_2m < 0) {
        score += 6;
        factors.push({ name: 'COLD FRONT', value: 6, desc: 'Sub-zero conditions' });
      }

      // Pressure anomalies
      if (current.surface_pressure < 990 || current.surface_pressure > 1030) {
        score += 8;
        factors.push({ name: 'PRESSURE DISTORTION', value: 8, desc: `${current.surface_pressure.toFixed(0)} hPa` });
      }

      // High winds
      if (current.wind_speed_10m > 50) {
        score += 10;
        factors.push({ name: 'VORTEX ACTIVITY', value: 10, desc: `${current.wind_speed_10m.toFixed(0)} km/h winds` });
      } else if (current.wind_speed_10m > 30) {
        score += 5;
        factors.push({ name: 'WIND ANOMALY', value: 5, desc: `${current.wind_speed_10m.toFixed(0)} km/h winds` });
      }

      // Cloud cover (obscured monitoring)
      if (current.cloud_cover > 80) {
        score += 4;
        factors.push({ name: 'SKY OBSCURED', value: 4, desc: `${current.cloud_cover}% cloud cover` });
      }

      // Time of day - darkness increases vulnerability
      if (weather.daily && weather.daily.sunrise && weather.daily.sunset) {
        const now = new Date();
        const sunrise = new Date(weather.daily.sunrise[0]);
        const sunset = new Date(weather.daily.sunset[0]);
        const isDark = now < sunrise || now > sunset;
        if (isDark) {
          score += 8;
          factors.push({ name: 'DARKNESS FACTOR', value: 8, desc: 'Reduced visibility' });
        }
      }
    }

    // Small random fluctuation for "dimensional instability"
    const flux = Math.floor(Math.random() * 5);
    if (flux > 2) {
      score += flux;
      factors.push({ name: 'DIMENSIONAL FLUX', value: flux, desc: 'Unexplained readings' });
    }

    const finalScore = Math.min(100, score);

    return {
      score: finalScore,
      factors,
      level: finalScore >= 80 ? 'CRITICAL' :
             finalScore >= 60 ? 'HIGH' :
             finalScore >= 40 ? 'ELEVATED' :
             finalScore >= 25 ? 'MODERATE' : 'LOW'
    };
  };

  // Normalize region names for better grouping
  const normalizeRegion = (region) => {
    const mappings = {
      'ca': 'California',
      'california': 'California',
      'alaska': 'Alaska',
      'hawaii': 'Hawaii',
      'nevada': 'Nevada',
      'oklahoma': 'Oklahoma',
      'texas': 'Texas',
      'japan': 'Japan',
      'indonesia': 'Indonesia',
      'philippines': 'Philippines',
      'chile': 'Chile',
      'peru': 'Peru',
      'mexico': 'Mexico',
      'new zealand': 'New Zealand',
      'turkey': 'Turkey',
      'türkiye': 'Turkey',
      'greece': 'Greece',
      'italy': 'Italy',
      'iran': 'Iran',
      'afghanistan': 'Afghanistan',
      'pakistan': 'Pakistan',
      'china': 'China',
      'taiwan': 'Taiwan',
      'papua new guinea': 'Papua New Guinea',
      'fiji': 'Fiji',
      'tonga': 'Tonga',
      'vanuatu': 'Vanuatu',
      'solomon islands': 'Solomon Islands',
      'russia': 'Russia',
      'iceland': 'Iceland',
      'puerto rico': 'Puerto Rico',
      'northern california': 'California',
      'southern california': 'California',
      'central california': 'California',
    };

    const lower = region.toLowerCase().trim();
    for (const [key, value] of Object.entries(mappings)) {
      if (lower.includes(key)) {
        return value;
      }
    }
    return region;
  };

  // Main fetch function
  const fetchGlobalHotZones = useCallback(async () => {
    setIsLoading(true);
    try {
      // Step 1: Get earthquakes from last 7 days, M2.5+
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTime}&endtime=${endTime}&minmagnitude=2.5&orderby=time&limit=500`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('USGS API unavailable');

      const data = await response.json();
      const quakes = data.features || [];

      // Step 2: Group earthquakes by region
      const regionMap = new Map();
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;

      quakes.forEach(quake => {
        const place = quake.properties.place || 'Unknown';
        const mag = quake.properties.mag || 0;
        const time = quake.properties.time;
        const coords = quake.geometry.coordinates;

        // Extract region name
        let region = place;
        const ofIndex = place.toLowerCase().lastIndexOf(' of ');
        if (ofIndex !== -1) {
          region = place.substring(ofIndex + 4).trim();
        }
        region = normalizeRegion(region);

        if (!regionMap.has(region)) {
          regionMap.set(region, {
            region,
            quakes: [],
            lat: coords[1],
            lon: coords[0],
            maxMag: 0,
            recentCount: 0,
          });
        }

        const entry = regionMap.get(region);
        entry.quakes.push({ mag, time, place: quake.properties.place });

        if (time > dayAgo) {
          entry.recentCount++;
        }

        // Track strongest quake location
        if (mag > entry.maxMag) {
          entry.maxMag = mag;
          entry.lat = coords[1];
          entry.lon = coords[0];
        }
      });

      // Step 3: Get top 15 regions by seismic activity for weather lookup
      const sortedRegions = Array.from(regionMap.values())
        .sort((a, b) => {
          // Sort by combo of max magnitude and event count
          const scoreA = a.maxMag * 10 + a.quakes.length;
          const scoreB = b.maxMag * 10 + b.quakes.length;
          return scoreB - scoreA;
        })
        .slice(0, 15);

      // Step 4: Fetch weather for each region (in parallel, with rate limiting)
      const weatherPromises = sortedRegions.map((region, index) =>
        new Promise(resolve => {
          // Stagger requests slightly to avoid rate limits
          setTimeout(async () => {
            const weather = await fetchWeather(region.lat, region.lon);
            resolve({ region, weather });
          }, index * 100);
        })
      );

      const results = await Promise.all(weatherPromises);

      // Step 5: Calculate combined risk for each region
      const zones = results.map(({ region, weather }) => {
        const seismicData = {
          quakeCount: region.quakes.length,
          maxMagnitude: region.maxMag,
          recentCount: region.recentCount,
        };

        const risk = calculateCombinedRisk(seismicData, weather);
        const recentQuake = region.quakes.reduce((a, b) => a.time > b.time ? a : b);

        return {
          id: region.region,
          region: region.region,
          lat: region.lat,
          lon: region.lon,
          quakeCount: region.quakes.length,
          maxMagnitude: region.maxMag,
          recentCount: region.recentCount,
          recentTime: new Date(recentQuake.time),
          recentPlace: recentQuake.place,
          weather: weather?.current || null,
          risk,
          score: risk.score,
          level: risk.level,
          factors: risk.factors,
        };
      });

      // Sort by combined risk score
      const topZones = zones.sort((a, b) => b.score - a.score);

      setHotZones(topZones);
      setLastUpdate(new Date());
      setError(null);

    } catch (err) {
      console.error('Failed to fetch global hot zones:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount and every 5 minutes
  useEffect(() => {
    fetchGlobalHotZones();
    const interval = setInterval(fetchGlobalHotZones, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchGlobalHotZones]);

  return {
    hotZones,
    isLoading,
    lastUpdate,
    error,
    refetch: fetchGlobalHotZones,
  };
};

export default useGlobalHotZones;
