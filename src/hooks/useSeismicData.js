import { useState, useEffect, useCallback } from 'react';

/**
 * Fetches real earthquake data from USGS and transforms it into
 * "dimensional instability readings" for the Hawkins Terminal.
 *
 * Real earthquakes = real dimensional breaches. Spooky.
 */
export const useSeismicData = (easterEggState = null) => {
  const [seismicData, setSeismicData] = useState([]);
  const [realQuakes, setRealQuakes] = useState([]);
  const [lastFetch, setLastFetch] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState(null);

  // Fetch real earthquake data from USGS
  const fetchEarthquakes = useCallback(async () => {
    try {
      // Get earthquakes from the last hour, magnitude 1.0+
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago

      const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTime}&endtime=${endTime}&minmagnitude=1.0&orderby=time`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('USGS API unavailable');

      const data = await response.json();
      setRealQuakes(data.features || []);
      setLastFetch(new Date());
      setIsLive(true);
      setError(null);

      return data.features || [];
    } catch (err) {
      console.warn('USGS API error, using simulated data:', err.message);
      setError(err.message);
      setIsLive(false);
      return null;
    }
  }, []);

  // Initial fetch and periodic refresh (every 30 seconds)
  useEffect(() => {
    fetchEarthquakes();
    const interval = setInterval(fetchEarthquakes, 30000);
    return () => clearInterval(interval);
  }, [fetchEarthquakes]);

  // Generate readings based on real data + simulation
  useEffect(() => {
    const generateReading = () => {
      // Base instability (always some background noise)
      let base = 1.8 + Math.random() * 0.8;

      // Add real earthquake influence if we have data
      if (realQuakes.length > 0 && isLive) {
        // Get the strongest recent quake
        const maxMag = Math.max(...realQuakes.map(q => q.properties.mag || 0));
        // Scale it to our readings (mag 3 = +1.5, mag 5 = +3.5, mag 7 = +5.5)
        const quakeInfluence = maxMag > 2 ? (maxMag - 2) * 1.2 : 0;
        base += quakeInfluence;

        // Recent quakes (< 5 min) have stronger effect
        const recentQuakes = realQuakes.filter(q => {
          const quakeTime = new Date(q.properties.time);
          return (Date.now() - quakeTime.getTime()) < 5 * 60 * 1000;
        });
        if (recentQuakes.length > 0) {
          base += 0.5 * recentQuakes.length;
        }
      }

      // Random spikes (dimensional fluctuations)
      const spike = Math.random() > 0.92 ? Math.random() * 2.5 : 0;

      // Easter egg modifiers
      const easterEggSpike =
        easterEggState === 'DEMOGORGON' ? Math.random() * 3 + 1 :
        easterEggState === 'MINDFLAYER' ? Math.random() * 4 + 2 :
        easterEggState === 'VECNA' ? Math.random() * 2 : 0;

      return Math.min(9.9, base + spike + easterEggSpike).toFixed(2);
    };

    const interval = setInterval(() => {
      setSeismicData(prev => {
        const newData = [...prev, {
          time: Date.now(),
          value: generateReading(),
          isLive,
        }];
        return newData.slice(-20);
      });
    }, 800);

    return () => clearInterval(interval);
  }, [realQuakes, easterEggState, isLive]);

  // Get the most significant recent earthquake for display
  const getMostSignificantQuake = useCallback(() => {
    if (realQuakes.length === 0) return null;
    return realQuakes.reduce((max, q) =>
      (q.properties.mag || 0) > (max.properties.mag || 0) ? q : max
    , realQuakes[0]);
  }, [realQuakes]);

  return {
    seismicData,
    realQuakes,
    isLive,
    error,
    lastFetch,
    quakeCount: realQuakes.length,
    mostSignificantQuake: getMostSignificantQuake(),
    refetch: fetchEarthquakes,
  };
};

export default useSeismicData;
