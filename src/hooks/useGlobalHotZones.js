import { useState, useEffect, useRef } from 'react';

const CACHE_KEY = 'hawkins_hotzones_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache
const RATE_LIMIT_KEY = 'hawkins_hotzones_rate_limit';

/**
 * Fetches real-time global seismic AND atmospheric data to identify
 * interdimensional hot zones based on combined risk factors.
 */
export const useGlobalHotZones = () => {
  // Load cached data on init
  const getCachedData = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (e) {
      // Ignore cache errors
    }
    return null;
  };

  const getRateLimitedUntil = () => {
    try {
      const until = localStorage.getItem(RATE_LIMIT_KEY);
      return until ? parseInt(until, 10) : 0;
    } catch {
      return 0;
    }
  };

  const cachedHotZones = getCachedData();
  const [hotZones, setHotZones] = useState(cachedHotZones || []);
  const [isLoading, setIsLoading] = useState(!cachedHotZones);
  const [lastUpdate, setLastUpdate] = useState(cachedHotZones ? new Date() : null);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  // Fetch weather data for a location (with rate limit check)
  const fetchWeather = async (lat, lon) => {
    // Check rate limit before each weather call
    if (Date.now() < getRateLimitedUntil()) {
      return null;
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,precipitation,weather_code,cloud_cover&daily=sunrise,sunset&timezone=auto`;
      const response = await fetch(url);

      if (response.status === 429) {
        console.warn('Open-Meteo rate limited in hot zones, backing off 30 min');
        localStorage.setItem(RATE_LIMIT_KEY, String(Date.now() + 30 * 60 * 1000));
        return null;
      }

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

    score += 10;
    factors.push({ name: 'BASELINE', value: 10 });

    // === SEISMIC FACTORS ===
    const eventScore = Math.min(25, seismicData.quakeCount * 2);
    if (eventScore > 0) {
      score += eventScore;
      factors.push({ name: 'SEISMIC ACTIVITY', value: eventScore, desc: `${seismicData.quakeCount} events` });
    }

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

    if (seismicData.recentCount > 0) {
      const recentScore = Math.min(15, seismicData.recentCount * 5);
      score += recentScore;
      factors.push({ name: 'RECENT ACTIVITY', value: recentScore, desc: `${seismicData.recentCount} in 24h` });
    }

    // === ATMOSPHERIC FACTORS ===
    if (weather && weather.current) {
      const current = weather.current;

      if (current.weather_code >= 95) {
        score += 18;
        factors.push({ name: 'ELECTROMAGNETIC STORM', value: 18, desc: 'Severe atmospheric disturbance' });
      } else if (current.weather_code >= 80) {
        score += 8;
        factors.push({ name: 'PRECIPITATION ANOMALY', value: 8, desc: 'Weather disruption' });
      }

      if (current.temperature_2m < -10 || current.temperature_2m > 40) {
        score += 12;
        factors.push({ name: 'THERMAL ANOMALY', value: 12, desc: `${current.temperature_2m.toFixed(0)}°C extreme` });
      } else if (current.temperature_2m < 0) {
        score += 6;
        factors.push({ name: 'COLD FRONT', value: 6, desc: 'Sub-zero conditions' });
      }

      if (current.surface_pressure < 990 || current.surface_pressure > 1030) {
        score += 8;
        factors.push({ name: 'PRESSURE DISTORTION', value: 8, desc: `${current.surface_pressure.toFixed(0)} hPa` });
      }

      if (current.wind_speed_10m > 50) {
        score += 10;
        factors.push({ name: 'VORTEX ACTIVITY', value: 10, desc: `${current.wind_speed_10m.toFixed(0)} km/h winds` });
      } else if (current.wind_speed_10m > 30) {
        score += 5;
        factors.push({ name: 'WIND ANOMALY', value: 5, desc: `${current.wind_speed_10m.toFixed(0)} km/h winds` });
      }

      if (current.cloud_cover > 80) {
        score += 4;
        factors.push({ name: 'SKY OBSCURED', value: 4, desc: `${current.cloud_cover}% cloud cover` });
      }

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

  const normalizeRegion = (region) => {
    const mappings = {
      'ca': 'California', 'california': 'California', 'alaska': 'Alaska',
      'hawaii': 'Hawaii', 'nevada': 'Nevada', 'oklahoma': 'Oklahoma',
      'texas': 'Texas', 'japan': 'Japan', 'indonesia': 'Indonesia',
      'philippines': 'Philippines', 'chile': 'Chile', 'peru': 'Peru',
      'mexico': 'Mexico', 'new zealand': 'New Zealand', 'turkey': 'Turkey',
      'türkiye': 'Turkey', 'greece': 'Greece', 'italy': 'Italy',
      'iran': 'Iran', 'afghanistan': 'Afghanistan', 'pakistan': 'Pakistan',
      'china': 'China', 'taiwan': 'Taiwan', 'papua new guinea': 'Papua New Guinea',
      'fiji': 'Fiji', 'tonga': 'Tonga', 'vanuatu': 'Vanuatu',
      'solomon islands': 'Solomon Islands', 'russia': 'Russia',
      'iceland': 'Iceland', 'puerto rico': 'Puerto Rico',
      'northern california': 'California', 'southern california': 'California',
      'central california': 'California',
    };

    const lower = region.toLowerCase().trim();
    for (const [key, value] of Object.entries(mappings)) {
      if (lower.includes(key)) return value;
    }
    return region;
  };

  // Main fetch function
  useEffect(() => {
    // Skip if we have cached data or already fetched
    if (hasFetched.current) return;
    if (cachedHotZones) {
      hasFetched.current = true;
      return;
    }

    // Check rate limit
    if (Date.now() < getRateLimitedUntil()) {
      console.log('Hot zones: Rate limited, skipping fetch');
      hasFetched.current = true;
      setIsLoading(false);
      return;
    }

    const fetchGlobalHotZones = async () => {
      hasFetched.current = true;
      setIsLoading(true);

      try {
        // Step 1: Get earthquakes from last 7 days
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

          let region = place;
          const ofIndex = place.toLowerCase().lastIndexOf(' of ');
          if (ofIndex !== -1) {
            region = place.substring(ofIndex + 4).trim();
          }
          region = normalizeRegion(region);

          if (!regionMap.has(region)) {
            regionMap.set(region, {
              region, quakes: [], lat: coords[1], lon: coords[0],
              maxMag: 0, recentCount: 0,
            });
          }

          const entry = regionMap.get(region);
          entry.quakes.push({ mag, time, place: quake.properties.place });
          if (time > dayAgo) entry.recentCount++;
          if (mag > entry.maxMag) {
            entry.maxMag = mag;
            entry.lat = coords[1];
            entry.lon = coords[0];
          }
        });

        // Step 3: Get top 8 regions (reduced from 15 to save API calls)
        const sortedRegions = Array.from(regionMap.values())
          .sort((a, b) => {
            const scoreA = a.maxMag * 10 + a.quakes.length;
            const scoreB = b.maxMag * 10 + b.quakes.length;
            return scoreB - scoreA;
          })
          .slice(0, 8);

        // Step 4: Fetch weather sequentially to avoid rate limits
        const results = [];
        for (const region of sortedRegions) {
          // Check rate limit before each call
          if (Date.now() >= getRateLimitedUntil()) {
            const weather = await fetchWeather(region.lat, region.lon);
            results.push({ region, weather });
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 200));
          } else {
            results.push({ region, weather: null });
          }
        }

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

        const topZones = zones.sort((a, b) => b.score - a.score);

        setHotZones(topZones);
        setLastUpdate(new Date());
        setError(null);

        // Cache the results
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: topZones,
            timestamp: Date.now(),
          }));
        } catch (e) {
          // Ignore cache errors
        }

      } catch (err) {
        console.error('Failed to fetch global hot zones:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGlobalHotZones();
  }, []);

  // Set up interval for periodic refresh (every 15 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() < getRateLimitedUntil()) {
        console.log('Hot zones: Rate limited, skipping periodic fetch');
        return;
      }

      // Clear hasFetched to allow refresh
      hasFetched.current = false;
      // Trigger re-render to fetch
      setLastUpdate(prev => prev);
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    hotZones,
    isLoading,
    lastUpdate,
    error,
  };
};

export default useGlobalHotZones;
