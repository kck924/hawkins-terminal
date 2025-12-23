import React, { useState, useEffect, useCallback, useRef } from 'react';
import useSeismicData from '../hooks/useSeismicData';
import useAtmosphericData from '../hooks/useAtmosphericData';
import useLocationRisk from '../hooks/useLocationRisk';
import useGlobalHotZones from '../hooks/useGlobalHotZones';
import useIsMobile from '../hooks/useIsMobile';

// Google Analytics event tracking helper
const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};

const HawkinsTerminal = () => {
  // Mobile detection
  const isMobile = useIsMobile(900);
  const [time, setTime] = useState(new Date());
  const [alertLevel, setAlertLevel] = useState('NOMINAL');
  const [logEntries, setLogEntries] = useState([]);
  const [flickering, setFlickering] = useState(false);
  const [currentView, setCurrentView] = useState('DASHBOARD');
  const [commandBuffer, setCommandBuffer] = useState('');
  const [showCommand, setShowCommand] = useState(false);
  const [commandError, setCommandError] = useState(false);
  const [showScanInput, setShowScanInput] = useState(false);
  const [scanInputBuffer, setScanInputBuffer] = useState('');
  const [easterEggState, setEasterEggState] = useState(null);
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  const [subjectFileIndex, setSubjectFileIndex] = useState(0);
  const [showSubjectDetail, setShowSubjectDetail] = useState(false);
  const [subjectsTab, setSubjectsTab] = useState('SUBJECTS'); // 'SUBJECTS' or 'DOSSIERS'
  const [selectedDossierIndex, setSelectedDossierIndex] = useState(0);
  const [selectedSectorIndex, setSelectedSectorIndex] = useState(0);
  const [showSectorDetail, setShowSectorDetail] = useState(false);
  const [selectedHotZoneIndex, setSelectedHotZoneIndex] = useState(0);
  const [showHotZoneDetail, setShowHotZoneDetail] = useState(false);
  const [gateStatus, setGateStatus] = useState({ stability: 94.2, size: 2.3 });
  const [konamiProgress, setKonamiProgress] = useState(0);
  const [powerFlicker, setPowerFlicker] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [idleCreepyEvent, setIdleCreepyEvent] = useState(null);
  const [vhsTracking, setVhsTracking] = useState(0);
  const [phosphorTrail, setPhosphorTrail] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [discoveredEasterEggs, setDiscoveredEasterEggs] = useState(new Set());
  const [showAccessGranted, setShowAccessGranted] = useState(false);
  const [pendingEasterEgg, setPendingEasterEgg] = useState(null);
  // Normalized sparkline data (0-1 range) - scaled to actual risk scores when rendered
  const [hotZoneSparkline, setHotZoneSparkline] = useState(Array(40).fill(0).map(() => Math.random()));

  // Ref for scrollable content container
  const contentRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const glitchAudioRef = useRef(null);
  const demogorgonAudioRef = useRef(null);
  const clockAudioRef = useRef(null);
  const commandInputRef = useRef(null);
  const scanInputRef = useRef(null);

  // Sinister characters that trigger glitch sound
  const sinisterCharacters = ['DEMOGORGON', 'MINDFLAYER', 'VECNA', 'HENRY', 'BRENNER'];

  // Scroll to top when view or easter egg state changes
  useEffect(() => {
    // Scroll the internal scrollable container
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    // Also try scrolling the window for mobile view
    window.scrollTo(0, 0);
  }, [currentView, easterEggState]);

  // Auto-focus command input when opened (triggers mobile keyboard)
  useEffect(() => {
    if (showCommand && commandInputRef.current) {
      setTimeout(() => commandInputRef.current?.focus(), 100);
    }
  }, [showCommand]);

  // Auto-focus scan input when opened (triggers mobile keyboard)
  useEffect(() => {
    if (showScanInput && scanInputRef.current) {
      setTimeout(() => scanInputRef.current?.focus(), 100);
    }
  }, [showScanInput]);

  // All available easter eggs - used for tracking completion
  const ALL_EASTER_EGGS = [
    'ELEVEN', 'DEMOGORGON', 'BARB', 'UPSIDE_DOWN', 'BRENNER', 'MKULTRA',
    'HOPPER', 'BYERS', 'JOYCE', 'JONATHAN', 'DUSTIN', 'LUCAS', 'MIKE', 'STEVE', 'NANCY', 'EDDIE', 'HENRY', 'MAX', 'MURRAY', 'BILLY', 'ROBIN', 'ERICA', 'ARGYLE', 'CHRISSY', 'FRED', 'PATRICK', 'KAREN', 'TED', 'JASON', 'ALEXEI', 'MINDFLAYER', 'VECNA', 'KONAMI',
    // New clickable easter eggs
    'RAINBOW_ROOM', 'EXPERIMENT_LOG', 'TERRY_IVES', 'THE_GATE_ORIGIN',
    'RUSSIANS', 'CREEL_HOUSE', 'PIGGYBACK', 'MAX_TAPE'
  ];
  const TOTAL_EASTER_EGGS = ALL_EASTER_EGGS.length;

  // Dossier entries for the collection view - characters that can be unlocked
  const DOSSIER_ENTRIES = [
    // Main Characters
    { id: 'ELEVEN', name: 'JANE "ELEVEN" IVES', category: 'LAB SUBJECTS', command: 'ELEVEN or 011', color: '#ff3300' },
    { id: 'HOPPER', name: 'JIM HOPPER', category: 'HAWKINS PD', command: 'HOPPER', color: '#cc8844' },
    { id: 'JOYCE', name: 'JOYCE BYERS', category: 'HAWKINS RESIDENTS', command: 'JOYCE', color: '#cc9966' },
    { id: 'MIKE', name: 'MIKE WHEELER', category: 'THE PARTY', command: 'MIKE', color: '#6699cc' },
    { id: 'DUSTIN', name: 'DUSTIN HENDERSON', category: 'THE PARTY', command: 'DUSTIN', color: '#66aa66' },
    { id: 'LUCAS', name: 'LUCAS SINCLAIR', category: 'THE PARTY', command: 'LUCAS', color: '#cc9933' },
    { id: 'MAX', name: 'MAX MAYFIELD', category: 'THE PARTY', command: 'MAX', color: '#cc6666' },
    { id: 'NANCY', name: 'NANCY WHEELER', category: 'HAWKINS RESIDENTS', command: 'NANCY', color: '#cc99cc' },
    { id: 'JONATHAN', name: 'JONATHAN BYERS', category: 'HAWKINS RESIDENTS', command: 'JONATHAN', color: '#999966' },
    { id: 'STEVE', name: 'STEVE HARRINGTON', category: 'HAWKINS RESIDENTS', command: 'STEVE', color: '#cc9966' },
    { id: 'ROBIN', name: 'ROBIN BUCKLEY', category: 'HAWKINS RESIDENTS', command: 'ROBIN', color: '#66cccc' },
    { id: 'ERICA', name: 'ERICA SINCLAIR', category: 'HAWKINS RESIDENTS', command: 'ERICA', color: '#ff66cc' },

    // Season 4 Characters
    { id: 'EDDIE', name: 'EDDIE MUNSON', category: 'HELLFIRE CLUB', command: 'EDDIE', color: '#9966cc' },
    { id: 'ARGYLE', name: 'ARGYLE', category: 'LENORA HILLS', command: 'ARGYLE', color: '#99cc66' },
    { id: 'JASON', name: 'JASON CARVER', category: 'HAWKINS HIGH', command: 'JASON', color: '#cc6633' },
    { id: 'CHRISSY', name: 'CHRISSY CUNNINGHAM', category: 'VECNA VICTIMS', command: 'CHRISSY', color: '#cc66cc' },
    { id: 'FRED', name: 'FRED BENSON', category: 'VECNA VICTIMS', command: 'FRED', color: '#9966cc' },
    { id: 'PATRICK', name: 'PATRICK MCKINNEY', category: 'VECNA VICTIMS', command: 'PATRICK', color: '#cc6666' },

    // Family
    { id: 'BYERS', name: 'WILL BYERS', category: 'THE PARTY', command: 'BYERS or WILL', color: '#8899aa' },
    { id: 'KAREN', name: 'KAREN WHEELER', category: 'HAWKINS RESIDENTS', command: 'KAREN', color: '#cc9999' },
    { id: 'TED', name: 'TED WHEELER', category: 'HAWKINS RESIDENTS', command: 'TED', color: '#999966' },

    // Antagonists & Entities
    { id: 'VECNA', name: 'VECNA / HENRY CREEL', category: 'ENTITIES', command: 'VECNA', color: '#00ff88' },
    { id: 'HENRY', name: 'HENRY CREEL / 001', category: 'LAB SUBJECTS', command: 'HENRY or 001', color: '#00ff88' },
    { id: 'MINDFLAYER', name: 'THE MIND FLAYER', category: 'ENTITIES', command: 'MINDFLAYER', color: '#6633ff' },
    { id: 'DEMOGORGON', name: 'THE DEMOGORGON', category: 'ENTITIES', command: 'DEMOGORGON', color: '#ff4444' },
    { id: 'BRENNER', name: 'DR. MARTIN BRENNER', category: 'HAWKINS LAB', command: 'BRENNER or PAPA', color: '#ff6600' },
    { id: 'BILLY', name: 'BILLY HARGROVE', category: 'HAWKINS RESIDENTS', command: 'BILLY', color: '#cc6633' },

    // Supporting Characters
    { id: 'MURRAY', name: 'MURRAY BAUMAN', category: 'ASSOCIATES', command: 'MURRAY', color: '#99aa66' },
    { id: 'ALEXEI', name: 'ALEXEI (SMIRNOFF)', category: 'SOVIET OPERATIVES', command: 'ALEXEI', color: '#00cccc' },
    { id: 'BARB', name: 'BARBARA HOLLAND', category: 'MISSING PERSONS', command: 'BARB', color: '#cc6666' },
  ];

  // Zoom constraints
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 1.5;
  const ZOOM_STEP = 0.1;

  // Load scan history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('hawkins_scan_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        setScanHistory(parsed.map(s => ({ ...s, timestamp: new Date(s.timestamp) })));
      }
    } catch (e) {
      console.warn('Failed to load scan history:', e);
    }
  }, []);

  // Load discovered easter eggs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('hawkins_discovered_eggs');
      if (stored) {
        setDiscoveredEasterEggs(new Set(JSON.parse(stored)));
      }
    } catch (e) {
      console.warn('Failed to load easter eggs:', e);
    }
  }, []);

  // Save discovered easter eggs to localStorage
  useEffect(() => {
    if (discoveredEasterEggs.size > 0) {
      localStorage.setItem('hawkins_discovered_eggs', JSON.stringify([...discoveredEasterEggs]));
    }
  }, [discoveredEasterEggs]);

  // Update sparkline data for hot zones view (normalized 0-1 values)
  useEffect(() => {
    const interval = setInterval(() => {
      setHotZoneSparkline(prev => {
        const newData = [...prev.slice(1)];
        // Generate new normalized value with continuity from the last value
        const lastVal = prev[prev.length - 1];
        const variance = (Math.random() - 0.5) * 0.15;
        const trend = Math.sin(Date.now() / 3000) * 0.05;
        let newVal = lastVal + variance + trend;
        // Clamp between 0 and 1
        newVal = Math.max(0, Math.min(1, newVal));
        newData.push(newVal);
        return newData;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Use live seismic data from USGS API
  const {
    seismicData,
    isLive: seismicIsLive,
    quakeCount,
    mostSignificantQuake,
  } = useSeismicData(easterEggState);

  // Use live atmospheric data from Open-Meteo API
  const {
    readings: atmosphericReadings,
    isLive: atmosphericIsLive,
    locationName: atmosphericLocation,
  } = useAtmosphericData(easterEggState);

  // Location risk scanner
  const {
    scanLocation,
    clearScan,
    isScanning,
    scanResult,
    error: scanError,
  } = useLocationRisk();

  // Global hot zones from real seismic data
  const {
    hotZones: globalHotZones,
    isLoading: hotZonesLoading,
    lastUpdate: hotZonesLastUpdate,
  } = useGlobalHotZones();

  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

  // Subject files data
  const subjectFiles = [
    {
      id: '001', name: '████████ ████', status: 'DECEASED', abilities: 'REMOTE VIEWING',
      notes: 'Initial success. Subject expired during extraction test.',
      dob: '██/██/1951', acquired: '03-MAR-71', handler: 'DR. ████████',
      testPhase: 'PHASE I', successRate: '34%', containment: 'N/A',
      incidents: ['Nosebleed during session 12', 'Cardiac arrest during extraction'],
      psychProfile: 'COMPLIANT. SHOWED INITIAL RESISTANCE BUT RESPONDED TO CONDITIONING.',
    },
    {
      id: '002', name: '████████ ██████', status: 'DECEASED', abilities: 'SENSORY DEPRIVATION RESPONSE',
      notes: 'Promising results. Cardiac event during week 12.',
      dob: '██/██/1948', acquired: '15-JUN-72', handler: 'DR. ████████',
      testPhase: 'PHASE II', successRate: '67%', containment: 'N/A',
      incidents: ['Seizure activity week 8', 'Cardiac event week 12 - FATAL'],
      psychProfile: 'HIGHLY SUGGESTIBLE. IDEAL CANDIDATE FOR DEEP CONDITIONING.',
    },
    {
      id: '003', name: '███████ ████', status: 'TERMINATED', abilities: 'ENHANCED PERCEPTION',
      notes: 'Psychological break. Protocol SIGMA enacted.',
      dob: '██/██/1955', acquired: '22-AUG-73', handler: 'DR. BRENNER',
      testPhase: 'PHASE III', successRate: '89%', containment: 'CELL 3-A',
      incidents: ['Attacked handler session 31', 'Self-harm attempts x3', 'Protocol SIGMA enacted'],
      psychProfile: 'UNSTABLE. DEVELOPED PARANOID TENDENCIES. TERMINATION RECOMMENDED.',
    },
    {
      id: '008', name: '██████ ███████', status: 'ESCAPED', abilities: 'BIOELECTRIC MANIPULATION',
      notes: 'Whereabouts unknown since ██/██/79.',
      dob: '██/██/1962', acquired: '07-FEB-75', handler: 'DR. BRENNER',
      testPhase: 'PHASE IV', successRate: '78%', containment: 'FORMERLY CELL 8-C',
      incidents: ['Power surge incident', 'Guard incapacitation', 'SECURITY BREACH - ESCAPED'],
      psychProfile: 'DEFIANT. RESISTED CONDITIONING. HIGH INTELLIGENCE. THREAT LEVEL: HIGH',
    },
    {
      id: '010', name: '████ ████████', status: 'CONTAINED', abilities: 'LIMITED TELEPATHY',
      notes: 'Currently in isolation unit 4.',
      dob: '██/██/1968', acquired: '14-SEP-79', handler: 'DR. BRENNER',
      testPhase: 'PHASE V', successRate: '45%', containment: 'ISOLATION UNIT 4',
      incidents: ['Communicated with Subject 011 remotely', 'Sedation required x2'],
      psychProfile: 'WITHDRAWN. LIMITED VERBAL COMMUNICATION. RESPONDS TO SUBJECT 011.',
    },
    {
      id: '011', name: '███ ██████', status: '██████████', abilities: '████████████████████',
      notes: 'SEE FILE: DR. BRENNER EYES ONLY',
      dob: '██/██/1971', acquired: 'BIRTH', handler: 'DR. BRENNER',
      testPhase: '████████', successRate: '███%', containment: '████████████',
      incidents: ['████████████', '████████████', '████████████'],
      psychProfile: '████████████████████████████████████████████████████████',
      // Unlocked version shown when ELEVEN easter egg is active
      unlockedData: {
        name: 'JANE IVES', status: 'ESCAPED / AT LARGE',
        abilities: 'TELEKINESIS, REMOTE VIEWING, INTERDIMENSIONAL CONTACT',
        dob: '1971', acquired: 'BIRTH - MOTHER: TERRY IVES',
        handler: 'DR. MARTIN BRENNER ("PAPA")',
        testPhase: 'PHASE VI - GATEWAY', successRate: '100%',
        containment: 'ESCAPED 11/06/83',
        incidents: [
          'First contact with alternate dimension - 1979',
          'Gateway opened during enhanced session - 11/06/83',
          'Entity breach - Codename: DEMOGORGON',
          'Facility escape during breach event',
        ],
        psychProfile: 'BONDED WITH HANDLER. SHOWED EMOTIONAL ATTACHMENT TO OTHER SUBJECTS. DEVELOPED INDEPENDENT WILL. EXTREME THREAT IF UNCONTROLLED.',
        threatLevel: 'EXTREME',
      },
    },
  ];

  // Sector data
  const sectors = [
    {
      id: '1A', name: 'ADMINISTRATION', status: 'NORMAL', personnel: 12,
      clearance: 'LEVEL 2',
      description: 'FACILITY MANAGEMENT AND COORDINATION CENTER',
      equipment: ['MAINFRAME TERMINAL', 'SECURE COMM ARRAY', 'RECORD ARCHIVES'],
      incidents: 0,
      lastInspection: '12-NOV-83',
      notes: 'STANDARD OPERATIONS. ALL PERSONNEL ACCOUNTED FOR.',
    },
    {
      id: '2B', name: 'RESEARCH WING', status: 'NORMAL', personnel: 8,
      clearance: 'LEVEL 3',
      description: 'PRIMARY RESEARCH AND DEVELOPMENT FACILITY',
      equipment: ['SPECTRAL ANALYZER', 'PARTICLE DETECTOR', 'CRYOGENIC STORAGE'],
      incidents: 2,
      lastInspection: '08-NOV-83',
      notes: 'MINOR EQUIPMENT MALFUNCTIONS REPORTED. UNDER INVESTIGATION.',
    },
    {
      id: '3C', name: 'CONTAINMENT', status: 'ELEVATED', personnel: 4,
      clearance: 'LEVEL 4',
      description: 'BIOLOGICAL AND ANOMALOUS MATERIAL STORAGE',
      equipment: ['ISOLATION CHAMBERS', 'DECONTAM SYSTEMS', 'HAZMAT STORAGE'],
      incidents: 7,
      lastInspection: '15-NOV-83',
      notes: 'SPECIMEN ████ SHOWING UNUSUAL ACTIVITY. MONITORING INCREASED.',
    },
    {
      id: '4D', name: 'SENSORY LABS', status: 'RESTRICTED', personnel: 2,
      clearance: 'LEVEL 5',
      description: 'PSYCHOKINETIC TESTING AND ENHANCEMENT FACILITY',
      equipment: ['SENSORY DEPRIVATION TANKS', 'EEG MONITORS', '████████████'],
      incidents: 14,
      lastInspection: '██-███-83',
      notes: 'SUBJECT TESTING IN PROGRESS. DR. BRENNER AUTHORIZATION REQUIRED.',
    },
    {
      id: '5E', name: 'POWER SYSTEMS', status: 'NORMAL', personnel: 3,
      clearance: 'LEVEL 2',
      description: 'FACILITY POWER GENERATION AND DISTRIBUTION',
      equipment: ['BACKUP GENERATORS', 'TRANSFORMER ARRAY', 'UPS SYSTEMS'],
      incidents: 1,
      lastInspection: '10-NOV-83',
      notes: 'POWER FLUCTUATIONS CORRELATE WITH ACTIVITY IN SECTOR 7G.',
    },
    {
      id: '6F', name: 'SUBLEVEL ACCESS', status: 'NORMAL', personnel: 1,
      clearance: 'LEVEL 3',
      description: 'VERTICAL TRANSIT AND SECURITY CHECKPOINT',
      equipment: ['FREIGHT ELEVATOR', 'SECURITY SCANNER', 'BLAST DOORS'],
      incidents: 0,
      lastInspection: '14-NOV-83',
      notes: 'ACCESS LOGS SHOW UNUSUAL TRAFFIC PATTERNS AFTER 0200 HOURS.',
    },
    {
      id: '7G', name: 'THE GATE', status: '████████', personnel: 0,
      clearance: 'LEVEL ██',
      description: '██████████ ████████ ███████████████',
      equipment: ['████████████', '████████████', '████████████'],
      incidents: '███',
      lastInspection: '██-███-██',
      notes: 'ALL INFORMATION REGARDING THIS SECTOR IS ████████████. UNAUTHORIZED ACCESS WILL RESULT IN ████████████.',
    },
  ];

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Gate instability
  useEffect(() => {
    const interval = setInterval(() => {
      setGateStatus(prev => ({
        stability: Math.max(0, Math.min(100, prev.stability + (Math.random() - 0.5) * 3 + (easterEggState === 'DEMOGORGON' ? -2 : 0))),
        size: Math.max(0.1, prev.size + (Math.random() - 0.5) * 0.3 + (easterEggState === 'DEMOGORGON' ? 0.2 : 0)),
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [easterEggState]);

  // Handle scan completion - transition from SCANNING to SCAN_RESULT and save to history
  useEffect(() => {
    if (easterEggState === 'SCANNING' && !isScanning && scanResult) {
      setEasterEggState('SCAN_RESULT');

      // Save to scan history
      const historyEntry = {
        id: Date.now(),
        location: scanResult.location,
        risk: scanResult.risk,
        weather: {
          temperature: scanResult.weather.temperature,
          weatherCode: scanResult.weather.weatherCode,
        },
        seismic: scanResult.seismic,
        timestamp: scanResult.timestamp,
      };

      setScanHistory(prev => {
        // Check if this location was already scanned (update it) or add new
        const existingIndex = prev.findIndex(s =>
          s.location.name === historyEntry.location.name &&
          s.location.country === historyEntry.location.country
        );

        let newHistory;
        if (existingIndex >= 0) {
          // Update existing entry
          newHistory = [...prev];
          newHistory[existingIndex] = historyEntry;
        } else {
          // Add new entry, keep max 50 entries
          newHistory = [historyEntry, ...prev].slice(0, 50);
        }

        // Save to localStorage
        try {
          localStorage.setItem('hawkins_scan_history', JSON.stringify(newHistory));
        } catch (e) {
          console.warn('Failed to save scan history:', e);
        }

        return newHistory;
      });
    }
  }, [easterEggState, isScanning, scanResult]);

  // Screen flicker
  useEffect(() => {
    const flickerInterval = setInterval(() => {
      const flickerChance = easterEggState === 'DEMOGORGON' ? 0.7 : 0.95;
      if (Math.random() > flickerChance) {
        setFlickering(true);
        setTimeout(() => setFlickering(false), 50 + Math.random() * 100);
      }
    }, 500);
    return () => clearInterval(flickerInterval);
  }, [easterEggState]);

  // Alert level logic
  useEffect(() => {
    const latest = parseFloat(seismicData[seismicData.length - 1]?.value) || 0;
    if (latest > 5.5 || easterEggState === 'DEMOGORGON' || easterEggState === 'MINDFLAYER') {
      setAlertLevel('CRITICAL');
      if (latest > 5.5) {
        setLogEntries(prev => [...prev, `${formatTime(time)} ██ ANOMALY DETECTED - SECTOR 7G ██`].slice(-8));
      }
    } else if (latest > 4.5) {
      setAlertLevel('ELEVATED');
    } else {
      setAlertLevel('NOMINAL');
    }
  }, [seismicData, easterEggState]);

  // Idle timeout - creepy events after 2 minutes of inactivity
  useEffect(() => {
    const creepyMessages = [
      'THE LIGHTS... THEY FLICKER WHEN HE\'S NEAR',
      'CAN YOU HEAR IT? THE SCRATCHING?',
      '̷̧̛H̸̨̛E̵̡͝ ̸̨͝I̵̧͠S̷̛̕ ̵̨͝C̷̢͝O̸̧͝M̵̨͝I̸̢̛N̵̨͝G̷̢͠',
      'SUBJECT 011 WAS LAST SEEN IN YOUR SECTOR',
      'UNAUTHORIZED DIMENSIONAL BREACH DETECTED',
      'R U N',
      'THEY\'RE WATCHING THROUGH THE WALLS',
      'MOTHER... IS THAT YOU?',
    ];

    const checkIdle = setInterval(() => {
      const idleTime = Date.now() - lastActivity;
      if (idleTime > 120000 && !idleCreepyEvent) { // 2 minutes
        // Random creepy event
        const eventType = Math.floor(Math.random() * 4);
        if (eventType === 0) {
          // Flicker and message
          setPowerFlicker(true);
          setTimeout(() => setPowerFlicker(false), 150);
          setTimeout(() => {
            setPowerFlicker(true);
            setTimeout(() => setPowerFlicker(false), 100);
          }, 300);
          const msg = creepyMessages[Math.floor(Math.random() * creepyMessages.length)];
          setLogEntries(prev => [...prev, `${formatTime(new Date())} ▓▓▓ ${msg} ▓▓▓`].slice(-8));
          setIdleCreepyEvent('message');
        } else if (eventType === 1) {
          // VHS tracking distortion
          setVhsTracking(100);
          setTimeout(() => setVhsTracking(0), 2000);
          setIdleCreepyEvent('vhs');
        } else if (eventType === 2) {
          // Intense flicker
          setGlitchIntensity(80);
          setTimeout(() => setGlitchIntensity(0), 1500);
          setIdleCreepyEvent('glitch');
        } else {
          // Temperature drop in logs
          setLogEntries(prev => [...prev,
            `${formatTime(new Date())} WARNING: TEMPERATURE ANOMALY`,
            `${formatTime(new Date())} SECTOR 7G: -45.2°C DETECTED`
          ].slice(-8));
          setIdleCreepyEvent('temp');
        }
        // Reset after showing event
        setTimeout(() => setIdleCreepyEvent(null), 30000);
      }
    }, 10000);

    return () => clearInterval(checkIdle);
  }, [lastActivity, idleCreepyEvent]);

  // VHS tracking effect during easter eggs
  useEffect(() => {
    if (easterEggState === 'DEMOGORGON' || easterEggState === 'MINDFLAYER') {
      const vhsInterval = setInterval(() => {
        if (Math.random() > 0.7) {
          setVhsTracking(30 + Math.random() * 70);
          setTimeout(() => setVhsTracking(0), 100 + Math.random() * 200);
        }
      }, 800);
      return () => clearInterval(vhsInterval);
    }
  }, [easterEggState]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Reset idle timer on any activity
      setLastActivity(Date.now());
      setIdleCreepyEvent(null);

      // Konami code detection
      if (e.key === konamiCode[konamiProgress]) {
        const newProgress = konamiProgress + 1;
        setKonamiProgress(newProgress);
        if (newProgress === konamiCode.length) {
          triggerEasterEgg('KONAMI');
          setKonamiProgress(0);
        }
      } else if (e.key === konamiCode[0]) {
        setKonamiProgress(1);
      } else if (!showCommand) {
        setKonamiProgress(0);
      }

      // Zoom controls (+/- keys, also = for plus without shift)
      if ((e.key === '+' || e.key === '=') && !showCommand && !showScanInput) {
        e.preventDefault();
        setZoomLevel(prev => Math.min(MAX_ZOOM, Math.round((prev + ZOOM_STEP) * 10) / 10));
      }
      if (e.key === '-' && !showCommand && !showScanInput) {
        e.preventDefault();
        setZoomLevel(prev => Math.max(MIN_ZOOM, Math.round((prev - ZOOM_STEP) * 10) / 10));
      }
      if (e.key === '0' && !showCommand && !showScanInput) {
        e.preventDefault();
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
      }

      // Function keys for views
      if (e.key === 'F1') { e.preventDefault(); setCurrentView('DASHBOARD'); trackEvent('view_change', { view: 'DASHBOARD', method: 'keyboard' }); }
      if (e.key === 'F2') { e.preventDefault(); setCurrentView('HOTZONES'); setEasterEggState(null); trackEvent('view_change', { view: 'HOTZONES', method: 'keyboard' }); }
      if (e.key === 'F3') { e.preventDefault(); setCurrentView('SUBJECTS'); trackEvent('view_change', { view: 'SUBJECTS', method: 'keyboard' }); }
      if (e.key === 'F5') { e.preventDefault(); setCurrentView('SECTORS'); trackEvent('view_change', { view: 'SECTORS', method: 'keyboard' }); }
      if (e.key === 'F7') { e.preventDefault(); setCurrentView('GATE'); trackEvent('view_change', { view: 'GATE', method: 'keyboard' }); }
      if (e.key === 'F8') { e.preventDefault(); setCurrentView('INFO'); trackEvent('view_change', { view: 'INFO', method: 'keyboard' }); }
      if (e.key === 'F9') { e.preventDefault(); setShowCommand(true); setCommandError(false); trackEvent('command_input_opened', { method: 'keyboard' }); }
      
      // Command input
      if (showCommand) {
        e.preventDefault();
        if (e.key === 'Escape') {
          setShowCommand(false);
          setCommandBuffer('');
          setCommandError(false);
        } else if (e.key === 'Enter') {
          const success = processCommand(commandBuffer);
          if (success) {
            setCommandBuffer('');
            setShowCommand(false);
            setCommandError(false);
          } else {
            setCommandError(true);
          }
        } else if (e.key === 'Backspace') {
          setCommandBuffer(prev => prev.slice(0, -1));
          setCommandError(false);
        } else if (e.key.length === 1) {
          setCommandBuffer(prev => (prev + e.key).toUpperCase().slice(0, 20));
          setCommandError(false);
        }
        return;
      }

      // Scan input - handle first and return to prevent other handlers
      if (showScanInput) {
        e.preventDefault();
        if (e.key === 'Escape') {
          setShowScanInput(false);
          setScanInputBuffer('');
        } else if (e.key === 'Enter' && scanInputBuffer.trim()) {
          const location = scanInputBuffer.trim();
          setShowScanInput(false);
          setScanInputBuffer('');
          setEasterEggState('SCANNING');
          trackEvent('location_scan', { location: location, method: 'keyboard' });
          scanLocation(location);
        } else if (e.key === 'Backspace') {
          setScanInputBuffer(prev => prev.slice(0, -1));
        } else if (e.key.length === 1) {
          setScanInputBuffer(prev => (prev + e.key).slice(0, 50));
        }
        return; // Don't process other key handlers
      }

      // Subject file navigation
      if (currentView === 'SUBJECTS') {
        if (e.key === 'ArrowUp') { e.preventDefault(); setSubjectFileIndex(prev => Math.max(0, prev - 1)); }
        if (e.key === 'ArrowDown') { e.preventDefault(); setSubjectFileIndex(prev => Math.min(subjectFiles.length - 1, prev + 1)); }
        if (e.key === 'Enter' && !showSubjectDetail) { e.preventDefault(); setShowSubjectDetail(true); }
        if (e.key === 'Escape' && showSubjectDetail) { e.preventDefault(); setShowSubjectDetail(false); }
      }

      // Sector navigation
      if (currentView === 'SECTORS') {
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedSectorIndex(prev => Math.max(0, prev - 1)); }
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedSectorIndex(prev => Math.min(sectors.length - 1, prev + 1)); }
        if (e.key === 'Enter' && !showSectorDetail) { e.preventDefault(); setShowSectorDetail(true); }
        if (e.key === 'Escape' && showSectorDetail) { e.preventDefault(); setShowSectorDetail(false); }
      }

      // Hot zones navigation
      if (currentView === 'HOTZONES') {
        const maxIndex = Math.min(globalHotZones.length - 1, 11); // Max 12 zones displayed
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedHotZoneIndex(prev => Math.max(0, prev - 1)); }
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedHotZoneIndex(prev => Math.min(maxIndex, prev + 1)); }
        if (e.key === 'Enter' && !showHotZoneDetail && globalHotZones.length > 0) { e.preventDefault(); setShowHotZoneDetail(true); }
        if (e.key === 'Escape' && showHotZoneDetail) { e.preventDefault(); setShowHotZoneDetail(false); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommand, commandBuffer, showScanInput, scanInputBuffer, konamiProgress, currentView, scanLocation, showSubjectDetail, showSectorDetail, showHotZoneDetail, globalHotZones]);

  // Pinch-to-zoom handler (trackpad gestures via wheel + ctrlKey)
  useEffect(() => {
    const handleWheel = (e) => {
      // ctrlKey is set when pinch-zooming on trackpad
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.01; // Invert and scale
        setZoomLevel(prev => {
          const newZoom = prev + delta;
          return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(newZoom * 100) / 100));
        });
      }
    };

    // Touch pinch zoom for mobile/tablet
    let initialDistance = null;
    let initialZoom = 1;

    const getDistance = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance = getDistance(e.touches);
        initialZoom = zoomLevel;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && initialDistance !== null) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        const scale = currentDistance / initialDistance;
        const newZoom = initialZoom * scale;
        setZoomLevel(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(newZoom * 100) / 100)));
      }
    };

    const handleTouchEnd = () => {
      initialDistance = null;
    };

    // Must use passive: false to allow preventDefault
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [zoomLevel]);

  // Reset pan offset when zoom returns to 100%
  useEffect(() => {
    if (zoomLevel === 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  // Drag handlers for panning when zoomed in
  const handleMouseDown = (e) => {
    if (zoomLevel > 1 && e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      // Limit pan range based on zoom level
      const maxPan = (zoomLevel - 1) * 200;
      setPanOffset({
        x: Math.max(-maxPan, Math.min(maxPan, newX)),
        y: Math.max(-maxPan, Math.min(maxPan, newY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const processCommand = (cmd) => {
    const command = cmd.trim().toUpperCase();
    if (!command) {
      return false;
    }

    // Track command submission
    trackEvent('command_submitted', {
      command: command,
      device_type: isMobile ? 'mobile' : 'desktop'
    });
    if (command === 'ELEVEN' || command === '011') {
      triggerEasterEgg('ELEVEN');
      return true;
    } else if (command === 'DEMOGORGON') {
      triggerEasterEgg('DEMOGORGON');
      return true;
    } else if (command === 'BARB') {
      triggerEasterEgg('BARB');
      return true;
    } else if (command === 'UPSIDE DOWN' || command === 'UPSIDEDOWN') {
      triggerEasterEgg('UPSIDE_DOWN');
      return true;
    } else if (command === 'PAPA' || command === 'BRENNER') {
      triggerEasterEgg('BRENNER');
      return true;
    } else if (command === 'MKULTRA' || command === 'MK ULTRA') {
      triggerEasterEgg('MKULTRA');
      return true;
    } else if (command === 'HOPPER' || command === 'JIM' || command === 'CHIEF') {
      triggerEasterEgg('HOPPER');
      return true;
    } else if (command === 'BYERS' || command === 'WILL') {
      triggerEasterEgg('BYERS');
      return true;
    } else if (command === 'JOYCE' || command === 'JOYCE BYERS') {
      triggerEasterEgg('JOYCE');
      return true;
    } else if (command === 'BOB' || command === 'BOB NEWBY' || command === 'NEWBY' || command === 'BOB THE BRAIN') {
      triggerEasterEgg('BOB');
      return true;
    } else if (command === 'JONATHAN' || command === 'JONATHAN BYERS') {
      triggerEasterEgg('JONATHAN');
      return true;
    } else if (command === 'DUSTIN' || command === 'DUSTIN HENDERSON' || command === 'HENDERSON') {
      triggerEasterEgg('DUSTIN');
      return true;
    } else if (command === 'LUCAS' || command === 'LUCAS SINCLAIR' || command === 'SINCLAIR') {
      triggerEasterEgg('LUCAS');
      return true;
    } else if (command === 'MIKE' || command === 'MIKE WHEELER' || command === 'WHEELER') {
      triggerEasterEgg('MIKE');
      return true;
    } else if (command === 'STEVE' || command === 'STEVE HARRINGTON' || command === 'HARRINGTON') {
      triggerEasterEgg('STEVE');
      return true;
    } else if (command === 'NANCY' || command === 'NANCY WHEELER') {
      triggerEasterEgg('NANCY');
      return true;
    } else if (command === 'EDDIE' || command === 'EDDIE MUNSON' || command === 'MUNSON' || command === 'HELLFIRE') {
      triggerEasterEgg('EDDIE');
      return true;
    } else if (command === 'HENRY' || command === 'HENRY CREEL' || command === 'CREEL' || command === 'SUBJECT ONE' || command === 'SUBJECT 001') {
      triggerEasterEgg('HENRY');
      return true;
    } else if (command === 'MINDFLAYER' || command === 'MIND FLAYER' || command === 'SHADOW') {
      triggerEasterEgg('MINDFLAYER');
      return true;
    } else if (command === 'VECNA' || command === 'ONE' || command === '001') {
      triggerEasterEgg('VECNA');
      return true;
    } else if (command === 'RAINBOW' || command === 'RAINBOW ROOM') {
      triggerEasterEgg('RAINBOW_ROOM');
      return true;
    } else if (command === 'EXPERIMENT' || command === 'INDIGO' || command === 'PROJECT INDIGO') {
      triggerEasterEgg('EXPERIMENT_LOG');
      return true;
    } else if (command === 'TERRY' || command === 'TERRY IVES' || command === 'JANE') {
      triggerEasterEgg('TERRY_IVES');
      return true;
    } else if (command === 'GATE' || command === 'ORIGIN' || command === 'BREACH') {
      triggerEasterEgg('THE_GATE_ORIGIN');
      return true;
    } else if (command === 'RUSSIANS' || command === 'SOVIET' || command === 'STARCOURT') {
      triggerEasterEgg('RUSSIANS');
      return true;
    } else if (command === 'CREEL' || command === 'CREEL HOUSE' || command === 'VICTOR') {
      triggerEasterEgg('CREEL_HOUSE');
      return true;
    } else if (command === 'PIGGYBACK' || command === 'OPERATION PIGGYBACK') {
      triggerEasterEgg('PIGGYBACK');
      return true;
    } else if (command === 'MAX' || command === 'MAX MAYFIELD' || command === 'MAYFIELD' || command === 'MADMAX') {
      triggerEasterEgg('MAX');
      return true;
    } else if (command === 'MURRAY' || command === 'MURRAY BAUMAN' || command === 'BAUMAN') {
      triggerEasterEgg('MURRAY');
      return true;
    } else if (command === 'BILLY' || command === 'BILLY HARGROVE' || command === 'HARGROVE') {
      triggerEasterEgg('BILLY');
      return true;
    } else if (command === 'ROBIN' || command === 'ROBIN BUCKLEY' || command === 'BUCKLEY') {
      triggerEasterEgg('ROBIN');
      return true;
    } else if (command === 'ERICA' || command === 'ERICA SINCLAIR') {
      triggerEasterEgg('ERICA');
      return true;
    } else if (command === 'ARGYLE' || command === 'SURFER BOY' || command === 'SURFER BOY PIZZA') {
      triggerEasterEgg('ARGYLE');
      return true;
    } else if (command === 'CHRISSY' || command === 'CHRISSY CUNNINGHAM') {
      triggerEasterEgg('CHRISSY');
      return true;
    } else if (command === 'FRED' || command === 'FRED BENSON') {
      triggerEasterEgg('FRED');
      return true;
    } else if (command === 'PATRICK' || command === 'PATRICK MCKINNEY') {
      triggerEasterEgg('PATRICK');
      return true;
    } else if (command === 'KAREN' || command === 'KAREN WHEELER' || command === 'MRS WHEELER') {
      triggerEasterEgg('KAREN');
      return true;
    } else if (command === 'TED' || command === 'TED WHEELER' || command === 'MR WHEELER') {
      triggerEasterEgg('TED');
      return true;
    } else if (command === 'JASON' || command === 'JASON CARVER' || command === 'CARVER') {
      triggerEasterEgg('JASON');
      return true;
    } else if (command === 'ALEXEI' || command === 'SMIRNOFF') {
      triggerEasterEgg('ALEXEI');
      return true;
    } else if (command === 'KATE BUSH' || command === 'RUNNING UP THAT HILL' || command === 'MAX_TAPE') {
      triggerEasterEgg('MAX_TAPE');
      return true;
    } else if (command === 'RESET' || command === 'CLEAR') {
      setEasterEggState(null);
      setGlitchIntensity(0);
      setVhsTracking(0);
      clearScan();
      return true;
    } else if (command.startsWith('SCAN ') || command.startsWith('SCAN:')) {
      // Location scan command
      const location = command.replace(/^SCAN[:\s]+/, '').trim();
      if (location) {
        setEasterEggState('SCANNING');
        trackEvent('location_scan', { location: location, method: 'command' });
        setLogEntries(prev => [...prev,
          `${formatTime(time)} INITIATING DIMENSIONAL SCAN...`,
          `${formatTime(time)} TARGET: ${location.toUpperCase()}`,
        ].slice(-8));
        scanLocation(location).then((result) => {
          if (result) {
            setEasterEggState('SCAN_RESULT');
            setLogEntries(prev => [...prev,
              `${formatTime(time)} SCAN COMPLETE - RISK LEVEL: ${result.risk.level}`,
            ].slice(-8));
          } else {
            setEasterEggState(null);
            setLogEntries(prev => [...prev,
              `${formatTime(time)} ERROR: LOCATION NOT FOUND IN DATABASE`,
            ].slice(-8));
          }
        });
        return true;
      } else {
        setLogEntries(prev => [...prev, `${formatTime(time)} USAGE: SCAN [CITY] or SCAN [ZIPCODE]`].slice(-8));
        return true;
      }
    } else if (command === 'SCAN' || command === 'HELP SCAN') {
      setLogEntries(prev => [...prev,
        `${formatTime(time)} DIMENSIONAL RISK SCANNER`,
        `${formatTime(time)} USAGE: SCAN [LOCATION]`,
        `${formatTime(time)} EXAMPLES: SCAN NEW YORK, SCAN 90210, SCAN TOKYO`,
      ].slice(-8));
      return true;
    } else {
      setLogEntries(prev => [...prev, `${formatTime(time)} UNKNOWN COMMAND: ${command}`].slice(-8));
      return false;
    }
  };

  const triggerEasterEgg = (type) => {
    const isNewDiscovery = !discoveredEasterEggs.has(type);

    // Track easter egg unlock in Google Analytics
    trackEvent('easter_egg_unlock', {
      easter_egg_name: type,
      is_new_discovery: isNewDiscovery,
      total_discovered: discoveredEasterEggs.size + (isNewDiscovery ? 1 : 0),
      device_type: isMobile ? 'mobile' : 'desktop'
    });

    // Track this discovery
    if (isNewDiscovery) {
      setDiscoveredEasterEggs(prev => new Set([...prev, type]));
    }

    // Show ACCESS GRANTED animation for new discoveries, then reveal content
    if (isNewDiscovery) {
      setPendingEasterEgg(type);
      setShowAccessGranted(true);
      setPowerFlicker(true);
      setGlitchIntensity(80);

      // After animation, reveal the actual content
      setTimeout(() => {
        setShowAccessGranted(false);
        setPendingEasterEgg(null);
        activateEasterEgg(type);
      }, 2500);

      setTimeout(() => setPowerFlicker(false), 300);
      setTimeout(() => setGlitchIntensity(0), 800);
    } else {
      // Already discovered - go straight to content
      activateEasterEgg(type);
    }
  };

  const activateEasterEgg = (type) => {
    setEasterEggState(type);
    setPowerFlicker(true);
    setGlitchIntensity(100);

    // Play glitch sound for sinister characters, clock sound for others
    if (sinisterCharacters.includes(type)) {
      if (glitchAudioRef.current) {
        glitchAudioRef.current.currentTime = 0;
        glitchAudioRef.current.volume = 0.4;
        glitchAudioRef.current.play().catch(() => {});
      }
      // Play demogorgon sound for DEMOGORGON
      if (type === 'DEMOGORGON' && demogorgonAudioRef.current) {
        demogorgonAudioRef.current.currentTime = 0;
        demogorgonAudioRef.current.volume = 0.5;
        demogorgonAudioRef.current.play().catch(() => {});
      }
    } else if (clockAudioRef.current) {
      // Standard unlock sound for non-sinister characters
      clockAudioRef.current.currentTime = 0;
      clockAudioRef.current.volume = 0.4;
      clockAudioRef.current.play().catch(() => {});
    }

    setTimeout(() => setPowerFlicker(false), 200);
    setTimeout(() => setGlitchIntensity(
      type === 'DEMOGORGON' ? 30 :
      type === 'MINDFLAYER' ? 40 :
      type === 'VECNA' ? 25 : 0
    ), 500);

    if (type === 'DEMOGORGON') {
      setLogEntries(prev => [...prev,
        `${formatTime(time)} ▓▓▓ WARNING: CONTAINMENT BREACH ▓▓▓`,
        `${formatTime(time)} ▓▓▓ ENTITY DETECTED IN SUBLEVEL 3 ▓▓▓`,
      ].slice(-8));
    } else if (type === 'MINDFLAYER') {
      setVhsTracking(50);
      setLogEntries(prev => [...prev,
        `${formatTime(time)} ▓▓▓ MASSIVE ENTITY DETECTED ▓▓▓`,
        `${formatTime(time)} ▓▓▓ SHADOW ANOMALY EXPANDING ▓▓▓`,
        `${formatTime(time)} ▓▓▓ ALL PERSONNEL: EVACUATE ▓▓▓`,
      ].slice(-8));
      setTimeout(() => setVhsTracking(20), 1000);
    } else if (type === 'VECNA') {
      // Clock chime effect - rapid flickers
      let chimes = 0;
      const chimeInterval = setInterval(() => {
        setPowerFlicker(true);
        setTimeout(() => setPowerFlicker(false), 50);
        chimes++;
        if (chimes >= 4) clearInterval(chimeInterval);
      }, 500);
      setLogEntries(prev => [...prev,
        `${formatTime(time)} ▓▓▓ TEMPORAL ANOMALY DETECTED ▓▓▓`,
        `${formatTime(time)} ▓▓▓ SUBJECT 001 STATUS: ████████ ▓▓▓`,
      ].slice(-8));
    } else if (type === 'HOPPER') {
      setLogEntries(prev => [...prev,
        `${formatTime(time)} ACCESSING HPD CASE FILES...`,
        `${formatTime(time)} CLEARANCE: CHIEF JIM HOPPER`,
      ].slice(-8));
    } else if (type === 'BYERS') {
      setLogEntries(prev => [...prev,
        `${formatTime(time)} MISSING PERSONS FILE ACCESSED`,
        `${formatTime(time)} CASE #: 1183-WB`,
      ].slice(-8));
    }
  };

  const formatTime = (d) => {
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return `${String(d.getDate()).padStart(2,'0')}-${months[d.getMonth()]}-83 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
  };

  // Clickable redacted text component - clicking reveals hidden easter eggs
  const RedactedText = ({ easterEgg, children, hint }) => (
    <span
      onClick={(e) => {
        e.stopPropagation();
        triggerEasterEgg(easterEgg);
      }}
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.target.style.textShadow = '0 0 8px #ff6600';
        e.target.style.color = '#ff6600';
      }}
      onMouseLeave={(e) => {
        e.target.style.textShadow = 'none';
        e.target.style.color = 'inherit';
      }}
      title={hint || 'CLASSIFIED - CLICK TO ACCESS'}
    >
      {children || '████████'}
    </span>
  );

  const getAlertColor = () => {
    if (alertLevel === 'CRITICAL') return '#ff3300';
    if (alertLevel === 'ELEVATED') return '#ffcc00';
    return '#ffb000';
  };

  const renderSeismicBar = (value) => {
    const bars = Math.min(Math.floor(value * 4), 30);
    return '█'.repeat(bars) + '░'.repeat(30 - bars);
  };

  // Styles - brighter amber on mobile for better readability
  const baseColor = easterEggState === 'UPSIDE_DOWN' ? '#ff3300' : (isMobile ? '#ffcc00' : '#ffb000');
  const dimColor = easterEggState === 'UPSIDE_DOWN' ? '#801a00' : (isMobile ? '#aa8800' : '#805800');
  const bgColor = easterEggState === 'UPSIDE_DOWN' ? '#0a0205' : '#1a1205';
  const borderColor = easterEggState === 'UPSIDE_DOWN' ? '#3d0a1a' : '#3d2e0a';

  const containerStyle = {
    background: easterEggState === 'UPSIDE_DOWN' ? '#020005' : '#0a0802',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '"VT323", "Courier New", monospace',
    fontSize: isMobile ? '13px' : '16px', // Base font size - smaller on mobile
    position: 'relative',
    overflow: 'hidden',
    filter: easterEggState === 'UPSIDE_DOWN' ? 'hue-rotate(180deg) invert(0.1)' : 'none',
    transform: easterEggState === 'UPSIDE_DOWN' ? 'scaleY(-1)' : 'none',
  };

  // Custom scrollbar styling for CRT aesthetic (global)
  const scrollbarCSS = `
    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    ::-webkit-scrollbar-track {
      background: #1a1205;
      border: 1px solid #3d2e0a;
    }
    ::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, #805800 0%, #604000 100%);
      border-radius: 2px;
      border: 1px solid #3d2e0a;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(180deg, #ffb000 0%, #805800 100%);
    }
    ::-webkit-scrollbar-corner {
      background: #1a1205;
    }
    * {
      scrollbar-width: thin;
      scrollbar-color: #805800 #1a1205;
    }
  `;

  const screenStyle = {
    background: bgColor,
    border: `1px solid ${borderColor}`,
    borderRadius: '4px',
    padding: isMobile ? '6px' : '8px',
    margin: '0 auto',
    position: 'relative',
    boxShadow: `inset 0 0 60px rgba(0,0,0,0.5), 0 0 15px rgba(${easterEggState === 'UPSIDE_DOWN' ? '255,51,0' : '255,176,0'},0.1)`,
    opacity: flickering || powerFlicker ? 0.3 : 1,
    transform: `translate(${glitchIntensity > 0 ? (Math.random() - 0.5) * glitchIntensity * 0.1 : 0}px, ${glitchIntensity > 0 ? (Math.random() - 0.5) * glitchIntensity * 0.1 : 0}px)`,
    overflow: 'hidden',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  };

  // VHS tracking line positions (random horizontal bands)
  const vhsTrackingStyle = vhsTracking > 0 ? {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 50,
    background: `
      repeating-linear-gradient(
        0deg,
        transparent 0px,
        transparent ${Math.floor(Math.random() * 50 + 50)}px,
        rgba(255,255,255,${vhsTracking * 0.003}) ${Math.floor(Math.random() * 50 + 50)}px,
        rgba(255,255,255,${vhsTracking * 0.003}) ${Math.floor(Math.random() * 50 + 55)}px
      )
    `,
    transform: `translateX(${(Math.random() - 0.5) * vhsTracking * 0.5}px)`,
  } : null;

  // View renderers
  const renderDashboard = () => (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? '8px' : '10px',
        color: baseColor,
        fontSize: isMobile ? '12px' : '13px',
      }}>
        {/* Seismic Panel */}
        <div style={{
          border: `1px solid ${borderColor}`,
          padding: isMobile ? '8px' : '10px',
          background: 'rgba(0,0,0,0.3)',
        }}>
          <div style={{ borderBottom: `1px solid ${borderColor}`, paddingBottom: '6px', marginBottom: '8px', fontSize: isMobile ? '11px' : '13px', letterSpacing: isMobile ? '0.5px' : '1px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{isMobile ? '◢ SEISMIC' : '◢ SEISMIC ACTIVITY'}</span>
            <span style={{ fontSize: isMobile ? '10px' : '13px', color: seismicIsLive ? '#4a8' : dimColor }}>
              {seismicIsLive ? '● HAWKINS, IN' : '○ SIM'}
            </span>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: dimColor, fontSize: isMobile ? '10px' : '12px' }}>{isMobile ? 'RDG: ' : 'READING: '}</span>
            <span style={{ color: getAlertColor(), textShadow: `0 0 8px ${getAlertColor()}`, fontSize: isMobile ? '16px' : '20px' }}>
              {seismicData[seismicData.length - 1]?.value || '0.00'} Sv
            </span>
          </div>

          <div style={{ fontFamily: 'inherit', fontSize: isMobile ? '10px' : '12px', lineHeight: '1.4' }}>
            {seismicData.slice(isMobile ? -6 : -8).map((reading, i) => (
              <div key={i} style={{
                color: reading.value > 5 ? '#ff3300' : reading.value > 4 ? '#ffcc00' : baseColor,
                opacity: 0.5 + (i * 0.07),
              }}>
                {renderSeismicBar(reading.value)} {reading.value}
              </div>
            ))}
          </div>

          {/* Real earthquake info (disguised as dimensional breach) */}
          {seismicIsLive && mostSignificantQuake && mostSignificantQuake.properties.mag >= 2.5 && (
            <div style={{
              marginTop: '8px',
              padding: '6px',
              border: `1px solid ${mostSignificantQuake.properties.mag >= 4 ? '#ff3300' : '#ffcc00'}`,
              background: 'rgba(255,176,0,0.1)',
              fontSize: '13px',
            }}>
              <div style={{ color: mostSignificantQuake.properties.mag >= 4 ? '#ff3300' : '#ffcc00' }}>
                ▓ DIMENSIONAL BREACH DETECTED ▓
              </div>
              <div style={{ color: dimColor, marginTop: '4px' }}>
                MAGNITUDE: {mostSignificantQuake.properties.mag.toFixed(1)} |
                ORIGIN: {mostSignificantQuake.properties.place || 'UNKNOWN'}
              </div>
            </div>
          )}

          <div style={{
            marginTop: '8px', padding: '6px', border: `1px solid ${getAlertColor()}`,
            textAlign: 'center',
            animation: alertLevel === 'CRITICAL' ? 'blink 0.5s infinite' : 'none',
          }}>
            <span style={{ color: dimColor }}>STATUS: </span>
            <span style={{ color: getAlertColor(), textShadow: `0 0 10px ${getAlertColor()}` }}>
              {alertLevel}
            </span>
            {seismicIsLive && quakeCount > 0 && (
              <span style={{ color: dimColor, fontSize: '13px', marginLeft: '8px' }}>
                ({quakeCount} EVENT{quakeCount !== 1 ? 'S' : ''} /1HR)
              </span>
            )}
          </div>
        </div>

        {/* Atmospheric Panel */}
        <div style={{
          border: `1px solid ${borderColor}`,
          padding: isMobile ? '8px' : '10px',
          background: 'rgba(0,0,0,0.3)',
        }}>
          <div style={{ borderBottom: `1px solid ${borderColor}`, paddingBottom: '6px', marginBottom: '8px', fontSize: isMobile ? '11px' : '13px', letterSpacing: isMobile ? '0.5px' : '1px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{isMobile ? '◢ ATMOS' : '◢ ATMOSPHERIC'}</span>
            <span style={{ fontSize: isMobile ? '10px' : '13px', color: atmosphericIsLive ? '#4a8' : dimColor }}>
              {atmosphericIsLive ? '● HAWKINS, IN' : '○ SIM'}
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? '11px' : '12px' }}>
            <tbody>
              {[
                ['PRESSURE', atmosphericReadings.pressure.value, atmosphericReadings.pressure.status],
                ['TEMPERATURE', atmosphericReadings.temperature.value, atmosphericReadings.temperature.status],
                ['HUMIDITY', atmosphericReadings.humidity.value, atmosphericReadings.humidity.status],
                ['EM FIELD', atmosphericReadings.emField.value, atmosphericReadings.emField.status],
                ['RADIATION', atmosphericReadings.radiation.value, atmosphericReadings.radiation.status],
                ['PARTICLE FLUX', atmosphericReadings.particleFlux.value, atmosphericReadings.particleFlux.status],
              ].map(([label, value, status], i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${bgColor}` }}>
                  <td style={{ padding: '5px 0', color: dimColor }}>{label}</td>
                  <td style={{ padding: '5px 0', textAlign: 'right' }}>{value}</td>
                  <td style={{
                    padding: '5px 0', textAlign: 'right',
                    color: status === 'DANGER' || status === 'CRITICAL' ? '#ff3300' :
                           status === 'ANOMALY' || status === 'UNSTABLE' ? '#ff3300' :
                           status === 'ELEVATED' || status === 'HIGH' ? '#ffcc00' :
                           status === 'LOW' ? '#6699ff' :
                           status.includes('█') ? '#ff3300' : '#4a8'
                  }}>
                    {status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Storm warning if detected */}
          {atmosphericReadings.isStormy && (
            <div style={{
              marginTop: '8px',
              padding: '6px',
              border: '1px solid #ff3300',
              background: 'rgba(255,51,0,0.1)',
              fontSize: '13px',
              textAlign: 'center',
              animation: 'blink 1s infinite',
            }}>
              <span style={{ color: '#ff3300' }}>▓ ELECTROMAGNETIC STORM DETECTED ▓</span>
            </div>
          )}
        </div>
      </div>

      {/* Log Panel */}
      <div style={{
        marginTop: '10px',
        border: `1px solid ${borderColor}`,
        padding: '10px',
        background: 'rgba(0,0,0,0.3)',
        color: baseColor,
        fontSize: '12px',
      }}>
        <div style={{ borderBottom: `1px solid ${borderColor}`, paddingBottom: '5px', marginBottom: '6px', fontSize: '13px', letterSpacing: '1px' }}>
          ◢ SYSTEM LOG
        </div>
        <div style={{ fontFamily: 'inherit', fontSize: '12px', lineHeight: '1.4', maxHeight: '80px', overflow: 'hidden' }}>
          <div style={{ color: dimColor }}>{formatTime(time)} System initialized. All monitors active.</div>
          <div style={{ color: dimColor }}>{formatTime(time)} Connecting to SECTOR 7G sensors... OK</div>
          <div style={{ color: '#ffcc00' }}>{formatTime(time)} NOTE: Elevated readings in sublevel 3</div>
          {logEntries.map((entry, i) => (
            <div key={i} style={{ color: entry.includes('WARNING') || entry.includes('ANOMALY') ? '#ff3300' : '#ffcc00' }}>{entry}</div>
          ))}
          <div style={{ color: baseColor }}>
            <span style={{ animation: 'blink 1s infinite' }}>█</span>
          </div>
        </div>
      </div>
    </>
  );

  const renderSubjects = () => {
    const selectedSubject = subjectFiles[subjectFileIndex];
    const isElevenUnlocked = selectedSubject?.id === '011' && easterEggState === 'ELEVEN';
    const subjectData = isElevenUnlocked && selectedSubject?.unlockedData ? selectedSubject.unlockedData : selectedSubject;

    const getStatusColor = (status) => {
      if (status === 'ESCAPED' || status === 'ESCAPED / AT LARGE') return '#ffcc00';
      if (status === 'CONTAINED') return '#4a8';
      if (status === 'DECEASED' || status === 'TERMINATED') return '#ff6600';
      if (status?.includes('█')) return '#ff3300';
      return baseColor;
    };

    // Detail view
    if (showSubjectDetail && selectedSubject) {
      const statusColor = getStatusColor(subjectData.status);

      return (
        <div style={{ color: baseColor, fontSize: '13px' }}>
          <div style={{
            border: `1px solid ${isElevenUnlocked ? '#ff3300' : statusColor}`,
            padding: '8px',
            background: 'rgba(0,0,0,0.3)',
          }}>
{isMobile && (
              <button
                onClick={() => setShowSubjectDetail(false)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${borderColor}`,
                  color: baseColor,
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                ◀ BACK TO LIST
              </button>
            )}
            <div style={{
              fontSize: '12px',
              marginBottom: '8px',
              textAlign: 'center',
              color: isElevenUnlocked ? '#ff3300' : baseColor,
              textShadow: isElevenUnlocked ? '0 0 10px #ff3300' : 'none',
            }}>
              ◢ CLASSIFIED SUBJECT FILE ◣
            </div>

            {/* Subject Header */}
            <div style={{
              marginBottom: '8px',
              padding: '6px',
              border: `1px solid ${borderColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ color: dimColor, fontSize: '14px', marginBottom: '2px' }}>SUBJECT DESIGNATION</div>
                <div style={{ fontSize: '16px', color: isElevenUnlocked ? '#ff3300' : baseColor }}>
                  {selectedSubject.id}
                </div>
              </div>
              <div style={{
                padding: '4px 8px',
                border: `1px solid ${statusColor}`,
                background: `${statusColor}22`,
                color: statusColor,
                fontSize: '13px',
                animation: subjectData.status === 'ESCAPED / AT LARGE' ? 'blink 1s infinite' : 'none',
              }}>
                {subjectData.status}
              </div>
            </div>

            {/* Subject Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
              <div style={{ padding: '4px', border: `1px solid ${borderColor}` }}>
                <div style={{ color: dimColor, fontSize: '7px', marginBottom: '2px' }}>NAME</div>
                <div style={{ fontSize: '13px', color: isElevenUnlocked ? '#ff3300' : baseColor }}>{subjectData.name}</div>
              </div>
              <div style={{ padding: '4px', border: `1px solid ${borderColor}` }}>
                <div style={{ color: dimColor, fontSize: '7px', marginBottom: '2px' }}>DATE OF BIRTH</div>
                <div style={{ fontSize: '13px' }}>{subjectData.dob}</div>
              </div>
              <div style={{ padding: '4px', border: `1px solid ${borderColor}` }}>
                <div style={{ color: dimColor, fontSize: '7px', marginBottom: '2px' }}>ACQUIRED</div>
                <div style={{ fontSize: '13px' }}>{subjectData.acquired}</div>
              </div>
              <div style={{ padding: '4px', border: `1px solid ${borderColor}` }}>
                <div style={{ color: dimColor, fontSize: '7px', marginBottom: '2px' }}>HANDLER</div>
                <div style={{ fontSize: '13px' }}>
                  {subjectData.handler === 'DR. BRENNER' ? (
                    <RedactedText easterEgg="BRENNER" hint="DR. BRENNER - CLICK FOR FILE">DR. BRENNER</RedactedText>
                  ) : subjectData.handler?.includes('████') ? (
                    <RedactedText easterEgg="EXPERIMENT_LOG" hint="CLASSIFIED - CLICK TO DECRYPT">{subjectData.handler}</RedactedText>
                  ) : (
                    subjectData.handler
                  )}
                </div>
              </div>
              <div style={{ padding: '4px', border: `1px solid ${borderColor}` }}>
                <div style={{ color: dimColor, fontSize: '7px', marginBottom: '2px' }}>TEST PHASE</div>
                <div style={{ fontSize: '13px' }}>{subjectData.testPhase}</div>
              </div>
              <div style={{ padding: '4px', border: `1px solid ${borderColor}` }}>
                <div style={{ color: dimColor, fontSize: '7px', marginBottom: '2px' }}>SUCCESS RATE</div>
                <div style={{ fontSize: '13px', color: subjectData.successRate === '100%' ? '#ff3300' : baseColor }}>{subjectData.successRate}</div>
              </div>
            </div>

            {/* Abilities */}
            <div style={{ marginBottom: '8px', padding: '4px', border: `1px solid ${borderColor}` }}>
              <div style={{ color: dimColor, fontSize: '7px', marginBottom: '2px' }}>DOCUMENTED ABILITIES</div>
              <div style={{ fontSize: '13px', color: isElevenUnlocked ? '#ff3300' : baseColor }}>{subjectData.abilities}</div>
            </div>

            {/* Containment */}
            <div style={{ marginBottom: '8px', padding: '4px', border: `1px solid ${borderColor}` }}>
              <div style={{ color: dimColor, fontSize: '7px', marginBottom: '2px' }}>CONTAINMENT STATUS</div>
              <div style={{ fontSize: '13px', color: statusColor }}>{subjectData.containment}</div>
            </div>

            {/* Incidents */}
            <div style={{ marginBottom: '8px', padding: '4px', border: `1px solid ${borderColor}` }}>
              <div style={{ color: dimColor, fontSize: '7px', marginBottom: '4px' }}>INCIDENT LOG</div>
              {subjectData.incidents?.map((incident, i) => (
                <div key={i} style={{
                  fontSize: '12px',
                  marginBottom: '3px',
                  paddingLeft: '6px',
                  borderLeft: `1px solid ${incident.includes('FATAL') || incident.includes('ESCAPED') || incident.includes('DEMOGORGON') ? '#ff3300' : borderColor}`,
                  color: incident.includes('FATAL') || incident.includes('ESCAPED') || incident.includes('DEMOGORGON') ? '#ff6600' : baseColor,
                }}>
                  • {incident}
                </div>
              ))}
            </div>

            {/* Psychological Profile */}
            <div style={{
              padding: '6px',
              border: `1px solid ${isElevenUnlocked ? '#ff3300' : borderColor}`,
              background: isElevenUnlocked ? 'rgba(255,51,0,0.1)' : 'rgba(0,0,0,0.3)',
              marginBottom: '8px',
            }}>
              <div style={{ color: dimColor, fontSize: '7px', marginBottom: '2px' }}>PSYCHOLOGICAL PROFILE</div>
              <div style={{ fontSize: '12px', color: isElevenUnlocked ? '#ffcc00' : dimColor, lineHeight: '1.4' }}>
                {subjectData.psychProfile}
              </div>
            </div>

            {/* Threat Level for Eleven */}
            {isElevenUnlocked && subjectData.threatLevel && (
              <div style={{
                padding: '8px',
                border: '1px solid #ff3300',
                background: 'rgba(255,0,0,0.15)',
                textAlign: 'center',
                marginBottom: '8px',
              }}>
                <div style={{ color: dimColor, fontSize: '14px', marginBottom: '2px' }}>THREAT ASSESSMENT</div>
                <div style={{
                  fontSize: '16px',
                  color: '#ff3300',
                  animation: 'blink 0.5s infinite',
                  textShadow: '0 0 10px #ff3300',
                }}>
                  {subjectData.threatLevel}
                </div>
              </div>
            )}

            {isMobile ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <button
                  onClick={() => setSubjectFileIndex(prev => Math.max(0, prev - 1))}
                  disabled={subjectFileIndex === 0}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${subjectFileIndex === 0 ? bgColor : borderColor}`,
                    color: subjectFileIndex === 0 ? bgColor : baseColor,
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    cursor: subjectFileIndex === 0 ? 'default' : 'pointer',
                  }}
                >
                  ◀ PREV
                </button>
                <button
                  onClick={() => setShowSubjectDetail(false)}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${borderColor}`,
                    color: baseColor,
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  ✕ BACK
                </button>
                <button
                  onClick={() => setSubjectFileIndex(prev => Math.min(subjectFiles.length - 1, prev + 1))}
                  disabled={subjectFileIndex === subjectFiles.length - 1}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${subjectFileIndex === subjectFiles.length - 1 ? bgColor : borderColor}`,
                    color: subjectFileIndex === subjectFiles.length - 1 ? bgColor : baseColor,
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    cursor: subjectFileIndex === subjectFiles.length - 1 ? 'default' : 'pointer',
                  }}
                >
                  NEXT ▶
                </button>
              </div>
            ) : (
              <div style={{ color: dimColor, fontSize: '14px', textAlign: 'center' }}>
                [ESC] BACK TO LIST   [↑/↓] PREV/NEXT SUBJECT
              </div>
            )}
          </div>
        </div>
      );
    }

    // Count unlocked dossiers
    const unlockedCount = DOSSIER_ENTRIES.filter(d => discoveredEasterEggs.has(d.id)).length;
    const totalDossiers = DOSSIER_ENTRIES.length;

    // Render Dossiers Grid
    const renderDossiers = () => {
      // Group by category
      const categories = [...new Set(DOSSIER_ENTRIES.map(d => d.category))];

      return (
        <div>
          {/* Progress indicator */}
          <div style={{
            marginBottom: '12px',
            padding: '8px',
            border: `1px solid ${borderColor}`,
            background: 'rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ color: dimColor, fontSize: '11px' }}>DOSSIER COLLECTION PROGRESS</span>
              <span style={{ color: unlockedCount === totalDossiers ? '#4a8' : baseColor, fontSize: '12px' }}>
                {unlockedCount}/{totalDossiers} UNLOCKED
              </span>
            </div>
            <div style={{
              height: '6px',
              background: bgColor,
              border: `1px solid ${borderColor}`,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(unlockedCount / totalDossiers) * 100}%`,
                background: unlockedCount === totalDossiers
                  ? 'linear-gradient(90deg, #4a8, #6c6)'
                  : `linear-gradient(90deg, ${dimColor}, ${baseColor})`,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          {/* Dossier Grid by Category */}
          {categories.map(category => {
            const entries = DOSSIER_ENTRIES.filter(d => d.category === category);
            const categoryUnlocked = entries.filter(d => discoveredEasterEggs.has(d.id)).length;

            return (
              <div key={category} style={{ marginBottom: '12px' }}>
                <div style={{
                  color: dimColor,
                  fontSize: '10px',
                  marginBottom: '6px',
                  borderBottom: `1px solid ${borderColor}`,
                  paddingBottom: '3px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span>▓ {category}</span>
                  <span style={{ color: categoryUnlocked === entries.length ? '#4a8' : dimColor }}>
                    {categoryUnlocked}/{entries.length}
                  </span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(90px, 1fr))' : 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: isMobile ? '4px' : '6px',
                }}>
                  {entries.map((dossier, i) => {
                    const isUnlocked = discoveredEasterEggs.has(dossier.id);
                    const isSelected = selectedDossierIndex === DOSSIER_ENTRIES.indexOf(dossier);

                    return (
                      <div
                        key={dossier.id}
                        onClick={() => {
                          if (isUnlocked) {
                            // Navigate to the character's easter egg
                            setEasterEggState(dossier.id);
                          }
                        }}
                        style={{
                          padding: isMobile ? '6px' : '8px',
                          border: `1px solid ${isUnlocked ? dossier.color : borderColor}`,
                          background: isUnlocked
                            ? `${dossier.color}15`
                            : 'rgba(0,0,0,0.5)',
                          cursor: isUnlocked ? 'pointer' : 'default',
                          opacity: isUnlocked ? 1 : 0.6,
                          transition: 'all 0.2s ease',
                        }}
                        onMouseOver={(e) => {
                          if (isUnlocked) {
                            e.currentTarget.style.background = `${dossier.color}30`;
                            e.currentTarget.style.boxShadow = `0 0 10px ${dossier.color}40`;
                          }
                        }}
                        onMouseOut={(e) => {
                          if (isUnlocked) {
                            e.currentTarget.style.background = `${dossier.color}15`;
                            e.currentTarget.style.boxShadow = 'none';
                          }
                        }}
                      >
                        {isUnlocked ? (
                          <>
                            <div style={{
                              fontSize: isMobile ? '9px' : '11px',
                              color: dossier.color,
                              marginBottom: '2px',
                              fontWeight: 'bold',
                              wordBreak: 'break-word',
                            }}>
                              {dossier.name}
                            </div>
                            <div style={{
                              fontSize: isMobile ? '8px' : '9px',
                              color: dimColor,
                            }}>
                              ✓ UNLOCKED
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{
                              fontSize: isMobile ? '9px' : '11px',
                              color: dimColor,
                              marginBottom: '2px',
                            }}>
                              {isMobile ? '████████' : '████████████'}
                            </div>
                            <div style={{
                              fontSize: isMobile ? '8px' : '9px',
                              color: isMobile ? '#cc9900' : '#664400',
                            }}>
                              🔒 {isMobile ? 'LOCKED' : 'CLASSIFIED'}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div style={{
            marginTop: '10px',
            padding: '8px',
            border: `1px dashed ${borderColor}`,
            background: 'rgba(0,0,0,0.3)',
            fontSize: '11px',
            color: dimColor,
            textAlign: 'center',
          }}>
            <div style={{ marginBottom: '4px' }}>💡 USE [F9] COMMAND INPUT TO UNLOCK DOSSIERS</div>
            <div style={{ fontSize: '10px', color: isMobile ? '#cc9900' : '#664400' }}>
              TRY CHARACTER NAMES, CODENAMES, OR DESIGNATIONS
            </div>
          </div>
        </div>
      );
    };

    // List view
    return (
      <div style={{ color: baseColor, fontSize: isMobile ? '10px' : '12px', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        {/* Tab Bar */}
        <div style={{
          display: 'flex',
          marginBottom: isMobile ? '6px' : '10px',
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <div
            onClick={() => setSubjectsTab('SUBJECTS')}
            style={{
              padding: isMobile ? '6px 10px' : '8px 16px',
              cursor: 'pointer',
              color: subjectsTab === 'SUBJECTS' ? baseColor : dimColor,
              borderBottom: subjectsTab === 'SUBJECTS' ? `2px solid ${baseColor}` : '2px solid transparent',
              background: subjectsTab === 'SUBJECTS' ? 'rgba(255,176,0,0.1)' : 'transparent',
              transition: 'all 0.2s ease',
              fontSize: isMobile ? '10px' : '12px',
            }}
          >
            {isMobile ? '◢ SUBJECTS' : '◢ TEST SUBJECTS'}
          </div>
          <div
            onClick={() => setSubjectsTab('DOSSIERS')}
            style={{
              padding: isMobile ? '6px 10px' : '8px 16px',
              cursor: 'pointer',
              color: subjectsTab === 'DOSSIERS' ? baseColor : dimColor,
              borderBottom: subjectsTab === 'DOSSIERS' ? `2px solid ${baseColor}` : '2px solid transparent',
              background: subjectsTab === 'DOSSIERS' ? 'rgba(255,176,0,0.1)' : 'transparent',
              transition: 'all 0.2s ease',
              fontSize: isMobile ? '10px' : '12px',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '4px' : '8px',
            }}
          >
            ◢ DOSSIERS
            <span style={{
              fontSize: isMobile ? '8px' : '10px',
              padding: '2px 4px',
              background: unlockedCount === totalDossiers ? 'rgba(68,170,68,0.3)' : 'rgba(255,176,0,0.2)',
              border: `1px solid ${unlockedCount === totalDossiers ? '#4a8' : dimColor}`,
              color: unlockedCount === totalDossiers ? '#4a8' : dimColor,
            }}>
              {unlockedCount}/{totalDossiers}
            </span>
          </div>
        </div>

        {subjectsTab === 'DOSSIERS' ? renderDossiers() : (
          <>
            <div style={{
              border: `1px solid ${borderColor}`,
              padding: isMobile ? '8px' : '12px',
              background: 'rgba(0,0,0,0.3)',
              marginBottom: isMobile ? '6px' : '10px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}>
              <div style={{ borderBottom: `1px solid ${borderColor}`, paddingBottom: '6px', marginBottom: isMobile ? '6px' : '10px', fontSize: isMobile ? '11px' : '13px', letterSpacing: isMobile ? '0.5px' : '1px' }}>
                {isMobile ? '◢ TEST SUBJECTS' : '◢ PROJECT INDIGO - TEST SUBJECTS'}
              </div>

              {/* Subject List */}
              <div style={{ maxHeight: isMobile ? '200px' : '280px', overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', width: '100%', maxWidth: '100%' }}>
                <table style={{ width: '100%', maxWidth: '100%', borderCollapse: 'collapse', fontSize: isMobile ? '10px' : '12px', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${borderColor}`, color: dimColor }}>
                      <th style={{ padding: isMobile ? '4px 2px' : '6px', textAlign: 'left', width: isMobile ? '28px' : 'auto' }}>ID</th>
                      <th style={{ padding: isMobile ? '4px 2px' : '6px', textAlign: 'left' }}>NAME</th>
                      <th style={{ padding: isMobile ? '4px 2px' : '6px', textAlign: 'center' }}>STATUS</th>
                      <th style={{ padding: isMobile ? '4px 2px' : '6px', textAlign: 'left' }}>{isMobile ? 'ABILITY' : 'ABILITIES'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectFiles.map((subject, i) => {
                      const isSelected = i === subjectFileIndex;
                      const isEleven = subject.id === '011' && easterEggState === 'ELEVEN';
                      const abilities = isEleven ? 'TELEKINESIS, REMOTE VIEWING...' : subject.abilities;
                      const mobileAbilities = abilities.length > 12 ? abilities.substring(0, 12) + '...' : abilities;
                      return (
                        <tr
                          key={i}
                          onClick={() => { setSubjectFileIndex(i); setShowSubjectDetail(true); }}
                          style={{
                            borderBottom: `1px solid ${bgColor}`,
                            background: isSelected ? 'rgba(255,176,0,0.15)' : 'transparent',
                            cursor: 'pointer',
                          }}
                        >
                          <td style={{ padding: isMobile ? '4px 2px' : '6px', color: isEleven ? '#ff3300' : (isSelected ? baseColor : dimColor) }}>
                            {isSelected ? '▶' : ''}{subject.id}
                          </td>
                          <td style={{ padding: isMobile ? '4px 2px' : '6px', color: isSelected ? baseColor : dimColor }}>
                            {isEleven ? 'JANE IVES' : subject.name}
                          </td>
                          <td style={{
                            padding: isMobile ? '4px 2px' : '6px',
                            textAlign: 'center',
                            color: getStatusColor(isEleven ? 'ESCAPED / AT LARGE' : subject.status),
                            fontSize: isMobile ? '9px' : '14px',
                          }}>
                            {isEleven ? 'ESCAPED' : subject.status}
                          </td>
                          <td style={{ padding: isMobile ? '4px 2px' : '6px', color: isSelected ? baseColor : dimColor, fontSize: isMobile ? '9px' : '14px' }}>
                            {isMobile ? (abilities.length > 14 ? abilities.substring(0, 14) + '..' : abilities) : abilities}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ color: dimColor, fontSize: isMobile ? '11px' : '13px', marginTop: '10px', textAlign: 'center' }}>
                {isMobile ? '[TAP] VIEW FILE' : '[↑/↓] SELECT   [ENTER] VIEW FILE'}
              </div>
            </div>

            {easterEggState === 'BRENNER' && (
              <div style={{
                border: '1px solid #ff3300',
                padding: '12px',
                background: 'rgba(255,51,0,0.1)',
                animation: 'blink 2s infinite',
              }}>
                <div style={{ color: '#ff3300', fontSize: '13px', marginBottom: '8px' }}>◢ FILE: DR. MARTIN BRENNER</div>
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                  <div>CLEARANCE: LEVEL 5 - DIRECTOR</div>
                  <div>PROJECT LEAD: INDIGO, MKULTRA SUBCONTRACT</div>
                  <div>STATUS: ████████████</div>
                  <div style={{ marginTop: '8px', color: '#ffcc00' }}>
                    "The children are the key. Their minds are... malleable."
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderSectors = () => {
    const selectedSector = sectors[selectedSectorIndex];
    const getStatusColor = (status) => {
      if (status === 'ELEVATED') return '#ffcc00';
      if (status === 'RESTRICTED') return '#ff6600';
      if (status.includes('█')) return '#ff3300';
      return '#4a8';
    };

    return (
      <div style={{ color: baseColor, fontSize: isMobile ? '11px' : '13px', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        <div style={{
          border: `1px solid ${borderColor}`,
          padding: isMobile ? '6px' : '8px',
          background: 'rgba(0,0,0,0.3)',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}>
          <div style={{ borderBottom: `1px solid ${borderColor}`, paddingBottom: '4px', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '14px', letterSpacing: isMobile ? '0.5px' : '1px' }}>
            {isMobile ? '◢ SECTOR STATUS' : '◢ FACILITY SECTOR STATUS'}
          </div>

          {!showSectorDetail ? (
            <>
              {/* ASCII Facility Map - Hidden on mobile */}
              {!isMobile && (
                <div style={{ marginBottom: '10px' }}>
                  <pre style={{
                    fontSize: '7px',
                    lineHeight: '1.1',
                    color: dimColor,
                    margin: 0,
                    fontFamily: 'inherit',
                    letterSpacing: '0.5px',
                  }}>
{`╔═══════════════════════════════════════════════════════════════════════════════╗
║                    HAWKINS NATIONAL LABORATORY - SUBLEVEL 3                    ║
║                         FACILITY SCHEMATIC [CLASSIFIED]                        ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║         ┌──────────────┐         ┌──────────────┐         ┌──────────────┐    ║
║         │              │         │              │         │              │    ║
║         │    A-1       │─────────│    B-2       │─────────│    D-4       │    ║
║         │    ADMIN     │         │  RESEARCH    │         │    POWER     │    ║
║         │              │         │              │         │              │    ║
║         └──────┬───────┘         └──────┬───────┘         └──────┬───────┘    ║
║                │                        │                        │            ║
║    ════════════╪════════════════════════╪════════════════════════╪══════════  ║
║                │      MAIN CORRIDOR     │                        │            ║
║                │                        │                        │            ║
║         ┌──────┴───────┐         ┌──────┴───────┐         ┌──────┴───────┐    ║
║         │              │         │   ░░░░░░░    │         │              │    ║
║         │    F-6       │─────────│    C-3       │─────────│    E-5       │    ║
║         │   MEDICAL    │         │  TEST CHAM   │         │ CONTAINMENT  │    ║
║         │              │         │   ░░░░░░░    │         │   [LOCKED]   │    ║
║         └──────────────┘         └──────────────┘         └──────────────┘    ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  ░ = ACTIVE ANOMALY    [LOCKED] = RESTRICTED ACCESS    ─── = CORRIDOR         ║
╚═══════════════════════════════════════════════════════════════════════════════╝`}
                  </pre>
                </div>
              )}

              {/* Sector Table */}
              <div style={{ overflowX: 'hidden', overflowY: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', maxWidth: '100%' }}>
              <table style={{ width: '100%', maxWidth: '100%', borderCollapse: 'collapse', fontSize: isMobile ? '12px' : '13px', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                    <th style={{ padding: isMobile ? '4px' : '4px', textAlign: 'left', color: dimColor, width: isMobile ? '15%' : 'auto' }}>{isMobile ? 'SEC' : 'SECTOR'}</th>
                    <th style={{ padding: isMobile ? '4px' : '4px', textAlign: 'left', color: dimColor, width: isMobile ? '40%' : 'auto' }}>NAME</th>
                    <th style={{ padding: isMobile ? '4px' : '4px', textAlign: 'center', color: dimColor, width: isMobile ? '10%' : 'auto' }}>#</th>
                    <th style={{ padding: isMobile ? '4px' : '4px', textAlign: 'right', color: dimColor, width: isMobile ? '35%' : 'auto' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {sectors.map((sector, i) => (
                    <tr
                      key={i}
                      onClick={() => { setSelectedSectorIndex(i); setShowSectorDetail(true); }}
                      style={{
                        borderBottom: `1px solid ${bgColor}`,
                        background: i === selectedSectorIndex ? 'rgba(255,176,0,0.15)' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <td style={{ padding: isMobile ? '4px' : '4px', color: i === selectedSectorIndex ? baseColor : dimColor }}>
                        {i === selectedSectorIndex ? '▶' : ''}{sector.id}
                      </td>
                      <td style={{ padding: isMobile ? '4px' : '4px', color: i === selectedSectorIndex ? baseColor : dimColor }}>
                        {sector.name}
                      </td>
                      <td style={{ padding: isMobile ? '4px' : '4px', textAlign: 'center', color: i === selectedSectorIndex ? baseColor : dimColor }}>{sector.personnel}</td>
                      <td style={{
                        padding: isMobile ? '4px' : '4px', textAlign: 'right',
                        color: getStatusColor(sector.status),
                        fontSize: isMobile ? '10px' : 'inherit',
                      }}>
                        {sector.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              <div style={{ color: dimColor, fontSize: isMobile ? '11px' : '14px', marginTop: '8px', textAlign: 'center' }}>
                {isMobile ? '[TAP] VIEW DETAILS' : '[↑/↓] SELECT   [ENTER] VIEW DETAILS'}
              </div>
            </>
          ) : (
            /* Sector Detail View */
            <div>
              {isMobile && (
                <button
                  onClick={() => setShowSectorDetail(false)}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${borderColor}`,
                    color: baseColor,
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  ◀ BACK TO LIST
                </button>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: isMobile ? '6px' : '8px',
                paddingBottom: isMobile ? '4px' : '6px',
                borderBottom: `1px solid ${borderColor}`,
              }}>
                <div style={{ fontSize: isMobile ? '10px' : '12px' }}>
                  ◢ {selectedSector.id}: {isMobile && selectedSector.name.length > 14 ? selectedSector.name.substring(0, 14) + '..' : selectedSector.name}
                </div>
                <div style={{
                  color: getStatusColor(selectedSector.status),
                  fontSize: isMobile ? '9px' : '13px',
                  padding: isMobile ? '2px 4px' : '2px 8px',
                  border: `1px solid ${getStatusColor(selectedSector.status)}`,
                  background: `${getStatusColor(selectedSector.status)}22`,
                }}>
                  {selectedSector.status}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: isMobile ? '6px' : '8px', marginBottom: isMobile ? '6px' : '8px' }}>
                <div>
                  <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '11px', marginBottom: '2px' }}>CLEARANCE</div>
                  <div style={{ color: baseColor, fontSize: isMobile ? '10px' : '12px' }}>{selectedSector.clearance}</div>
                </div>
                <div>
                  <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '11px', marginBottom: '2px' }}>PERSONNEL</div>
                  <div style={{ color: baseColor, fontSize: isMobile ? '10px' : '12px' }}>{selectedSector.personnel}</div>
                </div>
                <div>
                  <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '11px', marginBottom: '2px' }}>INSPECTION</div>
                  <div style={{ color: baseColor, fontSize: isMobile ? '10px' : '12px' }}>{selectedSector.lastInspection}</div>
                </div>
                <div>
                  <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '11px', marginBottom: '2px' }}>INCIDENTS</div>
                  <div style={{ color: typeof selectedSector.incidents === 'number' && selectedSector.incidents > 5 ? '#ff6600' : baseColor, fontSize: isMobile ? '10px' : '12px' }}>
                    {selectedSector.incidents}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: isMobile ? '6px' : '8px' }}>
                <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '11px', marginBottom: '2px' }}>DESCRIPTION</div>
                <div style={{ color: baseColor, fontSize: isMobile ? '10px' : '12px' }}>{selectedSector.description}</div>
              </div>

              <div style={{ marginBottom: isMobile ? '6px' : '8px' }}>
                <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '11px', marginBottom: '2px' }}>EQUIPMENT</div>
                <div style={{ color: baseColor, fontSize: isMobile ? '10px' : '12px' }}>
                  {selectedSector.equipment.map((eq, i) => (
                    <span key={i}>• {eq}{i < selectedSector.equipment.length - 1 ? '  ' : ''}</span>
                  ))}
                </div>
              </div>

              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: isMobile ? '4px' : '6px',
                border: `1px solid ${borderColor}`,
                marginBottom: isMobile ? '6px' : '8px',
              }}>
                <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '11px', marginBottom: '2px' }}>NOTES</div>
                <div style={{ color: '#ffcc00', fontSize: isMobile ? '10px' : '12px' }}>
                  {selectedSector.notes?.includes('████') ? (
                    <>
                      {selectedSector.notes.split('████').map((part, i, arr) => (
                        <span key={i}>
                          {part}
                          {i < arr.length - 1 && (
                            <RedactedText
                              easterEgg={selectedSector.id === '4D' ? 'RAINBOW_ROOM' : 'EXPERIMENT_LOG'}
                              hint="CLASSIFIED DATA - CLICK TO DECRYPT"
                            >
                              ████
                            </RedactedText>
                          )}
                        </span>
                      ))}
                    </>
                  ) : selectedSector.notes?.includes('DR. BRENNER') ? (
                    <>
                      {selectedSector.notes.replace('DR. BRENNER', '').split('DR. BRENNER')[0]}
                      <RedactedText easterEgg="BRENNER" hint="DR. BRENNER - CLASSIFIED FILE">DR. BRENNER</RedactedText>
                      {selectedSector.notes.split('DR. BRENNER')[1]}
                    </>
                  ) : (
                    selectedSector.notes
                  )}
                </div>
              </div>

              {isMobile ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <button
                    onClick={() => setSelectedSectorIndex(prev => Math.max(0, prev - 1))}
                    disabled={selectedSectorIndex === 0}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${selectedSectorIndex === 0 ? bgColor : borderColor}`,
                      color: selectedSectorIndex === 0 ? bgColor : baseColor,
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      cursor: selectedSectorIndex === 0 ? 'default' : 'pointer',
                    }}
                  >
                    ◀ PREV
                  </button>
                  <button
                    onClick={() => setShowSectorDetail(false)}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${borderColor}`,
                      color: baseColor,
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    ✕ BACK
                  </button>
                  <button
                    onClick={() => setSelectedSectorIndex(prev => Math.min(sectors.length - 1, prev + 1))}
                    disabled={selectedSectorIndex === sectors.length - 1}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${selectedSectorIndex === sectors.length - 1 ? bgColor : borderColor}`,
                      color: selectedSectorIndex === sectors.length - 1 ? bgColor : baseColor,
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      cursor: selectedSectorIndex === sectors.length - 1 ? 'default' : 'pointer',
                    }}
                  >
                    NEXT ▶
                  </button>
                </div>
              ) : (
                <div style={{ color: dimColor, fontSize: '14px', textAlign: 'center' }}>
                  [ESC] BACK TO LIST   [↑/↓] PREV/NEXT SECTOR
                </div>
              )}
            </div>
          )}
        </div>

        {easterEggState === 'MKULTRA' && (
          <div style={{
            marginTop: '10px',
            border: '1px solid #ff3300',
            padding: '8px',
            background: 'rgba(255,51,0,0.1)',
          }}>
            <div style={{ color: '#ff3300', fontSize: '14px', marginBottom: '6px' }}>
              ◢ CLASSIFIED: PROJECT MKULTRA - SUBCONTRACT 7
            </div>
            <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#ffcc00' }}>
              <div>FUNDING SOURCE: CIA / DOD BLACK BUDGET</div>
              <div>OBJECTIVE: PSYCHIC WARFARE APPLICATIONS</div>
              <div>METHODS: SENSORY DEPRIVATION, ████████, PHARMACOLOGICAL ENHANCEMENT</div>
              <div style={{ marginTop: '6px' }}>
                SUCCESS RATE: ██% | FATALITY RATE: ██% | SUBJECTS PROCESSED: ███
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGate = () => (
    <div style={{ color: baseColor, fontSize: isMobile ? '11px' : '13px', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{
        border: `1px solid ${easterEggState === 'DEMOGORGON' ? '#ff3300' : borderColor}`,
        padding: isMobile ? '6px' : '8px',
        background: 'rgba(0,0,0,0.3)',
        marginBottom: isMobile ? '6px' : '10px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        <div style={{
          borderBottom: `1px solid ${borderColor}`,
          paddingBottom: '4px',
          marginBottom: isMobile ? '6px' : '10px',
          fontSize: isMobile ? '11px' : '14px',
          letterSpacing: isMobile ? '0.5px' : '1px',
          color: easterEggState === 'DEMOGORGON' ? '#ff3300' : baseColor,
        }}>
          {isMobile ? '◢ GATEWAY MONITOR' : '◢ INTERDIMENSIONAL GATEWAY MONITOR'}
        </div>

        {/* Gate Visualization */}
        {(() => {
          const stability = gateStatus.stability;
          const isBreached = easterEggState === 'DEMOGORGON';

          // Color based on stability
          const outerColor = isBreached ? '#ff3300' : stability < 30 ? '#ff3300' : stability < 50 ? '#ff6600' : stability < 75 ? '#ffcc00' : baseColor;
          const midColor = isBreached ? '#ff3300' : stability < 40 ? '#ff3300' : stability < 60 ? '#ff6600' : stability < 80 ? '#cc9900' : baseColor;
          const innerColor = isBreached ? '#ff3300' : stability < 50 ? '#ff6600' : stability < 70 ? '#ffcc00' : baseColor;
          const coreColor = isBreached ? '#ff3300' : stability < 60 ? '#ff3300' : stability < 80 ? '#ffcc00' : '#4a8';
          const statusText = isBreached ? 'BREACH' : stability < 30 ? 'CRITICAL' : stability < 50 ? 'DANGER' : stability < 75 ? 'CAUTION' : 'STABLE';
          const statusColor = isBreached ? '#ff3300' : stability < 30 ? '#ff3300' : stability < 50 ? '#ff6600' : stability < 75 ? '#ffcc00' : '#4a8';

          return (
            <div style={{ textAlign: 'center', marginBottom: isMobile ? '8px' : '10px' }}>
              <pre style={{
                fontSize: isMobile ? '5px' : '6px',
                lineHeight: '1',
                display: 'inline-block',
                margin: 0,
                textShadow: isBreached ? '0 0 10px #ff3300' : `0 0 5px ${outerColor}`,
                animation: isBreached || stability < 30 ? 'blink 0.5s infinite' : 'none',
              }}>
{isMobile ? (<>
<span style={{ color: outerColor }}>{`        ░░░░░░░░░░░░░░░░░░░░
      ░░                  ░░
`}</span><span style={{ color: midColor }}>{`    ░░    ▄▄▄▄▄▄▄▄▄▄▄▄    ░░
   ░    ▄█▀▀▀▀▀▀▀▀▀▀▀▀█▄    ░
`}</span><span style={{ color: innerColor }}>{`  ░    █▀              ▀█    ░
  ░   █░  `}</span><span style={{ color: statusColor }}>{`╔════════╗`}</span><span style={{ color: innerColor }}>{`  ░█   ░
  ░   █░  `}</span><span style={{ color: statusColor }}>{`║${statusText.padStart(4).padEnd(8)}║`}</span><span style={{ color: innerColor }}>{`  ░█   ░
  ░   █░  `}</span><span style={{ color: statusColor }}>{`╚════════╝`}</span><span style={{ color: innerColor }}>{`  ░█   ░
  ░    █▄              ▄█    ░
`}</span><span style={{ color: midColor }}>{`   ░    ▀█▄▄▄▄▄▄▄▄▄▄▄▄█▀    ░
    ░░                    ░░
`}</span><span style={{ color: outerColor }}>{`      ░░                ░░
        ░░░░░░░░░░░░░░░░`}</span>
</>) : (<>
<span style={{ color: outerColor }}>{`                    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
                ░░░░                            ░░░░
              ░░                                    ░░
`}</span><span style={{ color: midColor }}>{`            ░░      ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄      ░░
           ░      ▄█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█▄      ░
          ░     ▄█▀                          ▀█▄     ░
`}</span><span style={{ color: innerColor }}>{`         ░     █▀                              ▀█     ░
         ░    █▀                                ▀█    ░
        ░    █░                                  ░█    ░
        ░   █░           `}</span><span style={{ color: statusColor }}>{`╔══════════╗`}</span><span style={{ color: innerColor }}>{`           ░█   ░
        ░   █░           `}</span><span style={{ color: statusColor }}>{`║ ${statusText.padStart(4).padEnd(8)} ║`}</span><span style={{ color: innerColor }}>{`           ░█   ░
        ░   █░           `}</span><span style={{ color: statusColor }}>{`╚══════════╝`}</span><span style={{ color: innerColor }}>{`           ░█   ░
        ░    █░                                  ░█    ░
        ░     █▄                                ▄█     ░
`}</span><span style={{ color: midColor }}>{`         ░     ▀█▄                            ▄█▀     ░
         ░      ▀█▄                          ▄█▀      ░
          ░       ▀█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█▀       ░
           ░         ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀         ░
`}</span><span style={{ color: outerColor }}>{`            ░░                                    ░░
              ░░                                ░░
                ░░░░                        ░░░░
                    ░░░░░░░░░░░░░░░░░░░░░░░░`}</span>
</>)}
              </pre>
            </div>
          );
        })()}

        {/* Gate Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: isMobile ? '6px' : '10px' }}>
          <div style={{ padding: isMobile ? '6px' : '8px', border: `1px solid ${borderColor}` }}>
            <div style={{ color: dimColor, marginBottom: '3px', fontSize: isMobile ? '9px' : '12px' }}>{isMobile ? 'STABILITY' : 'STABILITY INDEX'}</div>
            <div style={{
              fontSize: isMobile ? '14px' : '18px',
              color: gateStatus.stability < 50 ? '#ff3300' : gateStatus.stability < 75 ? '#ffcc00' : '#4a8',
              textShadow: `0 0 8px ${gateStatus.stability < 50 ? '#ff3300' : gateStatus.stability < 75 ? '#ffcc00' : '#4a8'}`,
            }}>
              {gateStatus.stability.toFixed(1)}%
            </div>
            <div style={{
              marginTop: isMobile ? '4px' : '6px',
              height: isMobile ? '4px' : '6px',
              background: bgColor,
              border: `1px solid ${borderColor}`,
            }}>
              <div style={{
                width: `${gateStatus.stability}%`,
                height: '100%',
                background: gateStatus.stability < 50 ? '#ff3300' : gateStatus.stability < 75 ? '#ffcc00' : '#4a8',
              }} />
            </div>
          </div>

          <div style={{ padding: isMobile ? '6px' : '8px', border: `1px solid ${borderColor}` }}>
            <div style={{ color: dimColor, marginBottom: '3px', fontSize: isMobile ? '9px' : '12px' }}>{isMobile ? 'APERTURE' : 'APERTURE SIZE'}</div>
            <div style={{
              fontSize: isMobile ? '14px' : '18px',
              color: gateStatus.size > 4 ? '#ff3300' : gateStatus.size > 3 ? '#ffcc00' : baseColor,
            }}>
              {gateStatus.size.toFixed(2)}m
            </div>
            <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '12px', marginTop: isMobile ? '4px' : '6px' }}>
              {isMobile ? 'CRIT: 5.00m' : 'THRESHOLD: 5.00m (CRITICAL)'}
            </div>
          </div>
        </div>

        {/* Clickable Origin Link */}
        <div style={{
          marginTop: isMobile ? '6px' : '10px',
          padding: isMobile ? '4px' : '6px',
          border: `1px dashed ${dimColor}`,
          textAlign: 'center',
        }}>
          <span style={{ color: dimColor, fontSize: isMobile ? '9px' : '12px' }}>
            {isMobile ? 'ORIGIN: ' : 'INCIDENT ORIGIN: '}<RedactedText easterEgg="THE_GATE_ORIGIN" hint="ACCESS GATE ORIGIN FILE">06-NOV-83 ████████</RedactedText>
          </span>
        </div>

        {easterEggState === 'DEMOGORGON' && (
          <div style={{
            marginTop: isMobile ? '6px' : '10px',
            padding: isMobile ? '6px' : '8px',
            border: '1px solid #ff3300',
            background: 'rgba(255,51,0,0.2)',
            textAlign: 'center',
            animation: 'blink 0.5s infinite',
          }}>
            <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#ff3300' }}>
              ▓▓▓ ENTITY BREACH ▓▓▓
            </div>
            <div style={{ fontSize: isMobile ? '9px' : '12px', marginTop: isMobile ? '4px' : '6px', color: '#ffcc00' }}>
              {isMobile ? 'THREAT: EXTREME | EVACUATE' : 'CLASSIFICATION: DEMOGORGON | THREAT LEVEL: EXTREME | EVACUATE IMMEDIATELY'}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderBarb = () => (
    <div style={{ color: baseColor, fontSize: isMobile ? '11px' : '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: '2px solid #ff3300',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(0,0,0,0.3)',
      }}>
        {/* Missing person header */}
        <div style={{
          fontSize: isMobile ? '10px' : '12px',
          marginBottom: isMobile ? '6px' : '8px',
          color: '#ff3300',
          textAlign: 'center',
          animation: 'blink 1s infinite',
        }}>
          ▓▓▓ MISSING PERSON ▓▓▓
        </div>
        <div style={{ fontSize: isMobile ? '11px' : '14px', marginBottom: isMobile ? '8px' : '12px', color: '#ff3300', textAlign: 'center' }}>
          ◢ HPD CASE FILE ◣
        </div>
        <div style={{ fontSize: isMobile ? '9px' : '12px', color: dimColor, textAlign: 'center', marginBottom: isMobile ? '8px' : '12px' }}>
          {isMobile ? 'CASE #1183-BH' : 'HPD CASE #1183-BH // DOE CLASSIFIED ANNEX ATTACHED'}
        </div>

        {/* Photo with CRT terminal styling */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '8px' : '12px',
          marginBottom: isMobile ? '8px' : '12px',
          paddingBottom: isMobile ? '8px' : '12px',
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: '2px solid #ff3300',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}>
            <img
              src="/barb.jpeg"
              alt="Barbara Holland"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>
          <div style={{ flex: 1, fontSize: isMobile ? '10px' : '13px' }}>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>NAME: </span>{isMobile ? 'BARB HOLLAND' : 'BARBARA "BARB" HOLLAND'}</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>DOB: </span>{isMobile ? '09/13/67' : 'SEPTEMBER 13, 1967'}</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>AGE: </span>16</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>HEIGHT: </span>5'9"</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>HAIR: </span>REDDISH-BROWN</div>
            <div><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#ff3300', animation: 'blink 0.5s infinite' }}>MISSING</span></div>
          </div>
        </div>

        {/* Family Information */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: '1px solid #ffcc00', background: 'rgba(255,204,0,0.1)' }}>
          <div style={{ color: '#ffcc00', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ FAMILY
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>FATHER: </span>MR. HOLLAND</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>MOTHER: </span>MARSHA HOLLAND</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>RESIDENCE: </span>HAWKINS, IN</div>
            <div style={{ fontSize: isMobile ? '9px' : '12px', color: dimColor, marginTop: '6px', borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              Parents actively searching. Family hired PI. Flyers posted throughout Hawkins.
            </div>
          </div>
        </div>

        {/* Academic Record */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ ACADEMIC RECORD
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SCHOOL: </span>HAWKINS HIGH</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>YEAR: </span>JUNIOR</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>GPA: </span>3.7</div>
            <div style={{ fontSize: isMobile ? '9px' : '12px', color: dimColor, borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              Reliable student, consistent attendance. No behavioral issues. No history of running away.
            </div>
          </div>
        </div>

        {/* Personality Assessment */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: '1px solid #4a8844', background: 'rgba(74,136,68,0.1)' }}>
          <div style={{ color: '#4a8844', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ PERSONALITY
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Subject described as loyal, protective of friends, and
              socially observant. Known for trustworthiness and discretion.
              Prioritized friends' wellbeing over personal interests.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>SOCIAL CIRCLE: </span>
              Small but close friend group. Best friend: NANCY WHEELER.
              Previously close with Robin Buckley (elementary school).
              Not part of "popular" crowd but well-liked by peers.
            </div>
            <div style={{ color: '#ffcc00' }}>
              INTERVIEW NOTE (Wheeler): "Barb wouldn't just leave.
              Something happened to her. I know it."
            </div>
          </div>
        </div>

        {/* Known Associates */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ ASSOCIATES
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px', color: '#ffcc00' }}><span style={{ color: dimColor }}>NANCY WHEELER: </span>Best friend. Last to see subject.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>STEVE HARRINGTON: </span>Party host.</div>
          </div>
        </div>

        {/* Disappearance Timeline */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)' }}>
          <div style={{ color: '#ff6600', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ TIMELINE
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>19:30 - </span>Arrived at Harrington residence</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>20:30 - </span>Cut hand on beer can</div>
            <div style={{ marginBottom: '4px', color: '#ff3300' }}><span style={{ color: dimColor }}>~21:00 - </span>LAST SIGHTING (alone at pool)</div>
            <div style={{ color: '#ff3300' }}><span style={{ color: dimColor }}>11/08 - </span>Reported missing</div>
          </div>
        </div>

        {/* Physical Evidence */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: '1px solid #ff3300', background: 'rgba(255,51,0,0.1)' }}>
          <div style={{ color: '#ff3300', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ EVIDENCE
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}>• Blood trace on diving board</div>
            <div style={{ marginBottom: '4px' }}>• Vehicle abandoned at scene</div>
            <div style={{ marginBottom: '4px' }}>• Glasses found near pool</div>
            <div style={{ marginBottom: '4px', color: '#ff6600' }}>• Unusual atmospheric readings (classified)</div>
            <div style={{ color: '#ff3300' }}>
              HPD: Evidence inconsistent with runaway. Foul play suspected.
            </div>
          </div>
        </div>

        {/* DOE Classified Section */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: '2px solid #ff3300', background: 'rgba(255,51,0,0.15)' }}>
          <div style={{ color: '#ff3300', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px', animation: 'blink 1s infinite' }}>
            ■ DOE CLASSIFIED
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>STATUS: </span>
              <span style={{ color: '#ff3300' }}>DECEASED - ENTITY ATTACK</span>
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>CAUSE: </span>
              Taken by Demogorgon through dimensional breach. Blood attracted predator.
            </div>
            <div style={{ color: '#ffcc00' }}>
              RECOVERY: Deemed impossible. Remains in alternate dimension.
            </div>
          </div>
        </div>

        {/* Cover Story */}
        <div style={{ padding: isMobile ? '8px' : '10px', border: '1px solid #ff3300', background: 'rgba(255,51,0,0.1)' }}>
          <div style={{ color: '#ff3300', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ COVER OPERATION
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div style={{ marginBottom: '6px' }}>
              NARRATIVE: Subject ran away. HPD directed to close case.
            </div>
            <div style={{ color: baseColor }}>
              PRIORITY: Prevent family from discovering HNL connection.
            </div>
          </div>
          <div style={{ marginTop: isMobile ? '6px' : '8px', fontSize: isMobile ? '9px' : '14px', color: dimColor, textAlign: 'center' }}>
            "FAMILY TO BE INFORMED OF RUNAWAY COVER STORY." - DR. BRENNER
          </div>
        </div>
      </div>
    </div>
  );

  const renderKonami = () => (
    <div style={{ color: '#ff00ff', fontSize: isMobile ? '11px' : '13px', textAlign: 'center' }}>
      <div style={{
        border: '1px solid #ff00ff',
        padding: isMobile ? '10px' : '30px',
        background: 'rgba(255,0,255,0.1)',
      }}>
        {!isMobile && (
          <pre style={{ fontSize: '16px', marginBottom: '20px' }}>
{`
 █████╗ ██████╗ ██████╗ ██████╗ ██████╗ ███████╗
██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔════╝
███████║██████╔╝██████╔╝██████╔╝██║  ██║███████╗
██╔══██║██╔══██╗██╔══██╗██╔══██╗██║  ██║╚════██║
██║  ██║██║  ██║██║  ██║██║  ██║██████╔╝███████║
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝
`}
          </pre>
        )}
        <div style={{ fontSize: isMobile ? '11px' : '14px', marginBottom: isMobile ? '6px' : '10px' }}>
          30 LIVES GRANTED
        </div>
        <div style={{ fontSize: isMobile ? '9px' : '12px', color: '#aa00aa' }}>
          "Mornings are for coffee and contemplation." - Hopper
        </div>
        <div style={{ fontSize: isMobile ? '10px' : '13px', marginTop: isMobile ? '12px' : '20px', color: '#660066' }}>
          PRESS F1 TO RETURN TO DASHBOARD
        </div>
      </div>
    </div>
  );

  const renderHopper = () => (
    <div style={{ color: baseColor, fontSize: isMobile ? '11px' : '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: '1px solid #4a8844',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: isMobile ? '11px' : '14px', marginBottom: isMobile ? '8px' : '12px', color: '#4a8844', textAlign: 'center' }}>
          ◢ PERSONNEL FILE ◣
        </div>
        <div style={{ fontSize: isMobile ? '9px' : '12px', color: dimColor, textAlign: 'center', marginBottom: isMobile ? '8px' : '12px' }}>
          {isMobile ? 'HPD // VETERAN RECORDS' : 'HAWKINS POLICE DEPT // INDIANA STATE RECORDS // DOD VETERAN AFFAIRS'}
        </div>

        {/* Officer photo with CRT terminal styling */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '8px' : '12px',
          marginBottom: isMobile ? '8px' : '12px',
          paddingBottom: isMobile ? '8px' : '12px',
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: `1px solid ${borderColor}`,
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}>
            <img
              src="/hopper.jpeg"
              alt="Chief Hopper"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>
          <div style={{ flex: 1, fontSize: isMobile ? '10px' : '13px' }}>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>NAME: </span>{isMobile ? 'JIM HOPPER' : 'JAMES HOPPER JR.'}</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>DOB: </span>AUG 1941</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>RANK: </span>CHIEF OF POLICE</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>BADGE: </span>#001</div>
            <div><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#4a8844' }}>ACTIVE</span></div>
          </div>
        </div>

        {/* Military Service Record */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: '#4a8844', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ MILITARY SERVICE
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>BRANCH: </span>U.S. ARMY</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SERVICE: </span>1959-1963 | VIETNAM</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>DECORATIONS: </span>BRONZE STAR, PURPLE HEART</div>
            <div style={{ color: '#ff6600', fontSize: isMobile ? '8px' : '12px', padding: isMobile ? '4px' : '6px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)' }}>
              EXPOSURE: Agent Orange contact. Health complications documented.
            </div>
          </div>
        </div>

        {/* Family History */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: '#ffcc00', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ FAMILY
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>MARITAL: </span>DIVORCED (1979)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>DEPENDENTS: </span>1 (DECEASED)</div>
            <div style={{ color: '#ff3300', fontSize: isMobile ? '8px' : '12px', padding: isMobile ? '4px' : '6px', border: '1px solid #ff3300', background: 'rgba(255,51,0,0.1)' }}>
              SARA HOPPER - Died Sept 1978 (Cancer). Agent Orange correlation under investigation.
            </div>
          </div>
        </div>

        {/* Career History */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ CAREER
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>1963-72: </span>HPD Patrol</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>1972-79: </span>NYPD Homicide/Special Cases</div>
            <div><span style={{ color: dimColor }}>1979-NOW: </span>HPD Chief of Police</div>
          </div>
        </div>

        {/* Psychological Evaluation */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)' }}>
          <div style={{ color: '#ff6600', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ PSYCH EVAL
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6', color: dimColor }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              PTSD (combat). Grief disorder post daughter's death. Protective instincts toward children.
            </div>
            <div style={{ color: '#ffcc00' }}>
              UPDATE 11/83: Renewed engagement on Byers case. Possible transference.
            </div>
          </div>
        </div>

        {/* Active Case Notes */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: '#ffcc00', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ BYERS CASE
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.5' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>11/06 - </span>Will reported missing</div>
            <div style={{ marginBottom: '4px', color: '#ff6600' }}><span style={{ color: dimColor }}>11/08 - </span>Body recovered. INCONSISTENT.</div>
            <div style={{ color: '#ff3300' }}><span style={{ color: dimColor }}>11/08 - </span>DOE seized jurisdiction</div>
          </div>
        </div>

        {/* Encrypted Personal Notes */}
        <div style={{ padding: isMobile ? '8px' : '10px', border: '1px solid #ff3300', background: 'rgba(255,51,0,0.1)' }}>
          <div style={{ color: '#ff3300', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ PERSONAL LOG
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div style={{ marginBottom: '6px' }}>
              The girl has abilities. Brenner calls her "Eleven." The lab opened a door to something.
            </div>
            <div style={{ color: baseColor }}>
              I couldn't save Sara. But I can save this girl. I can save Will.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderByers = () => (
    <div style={{ color: baseColor, fontSize: isMobile ? '11px' : '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: '2px solid #ff3300',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: isMobile ? '11px' : '14px', marginBottom: isMobile ? '6px' : '8px', color: '#ff3300', textAlign: 'center', animation: 'blink 1s infinite' }}>
          ◢ MISSING PERSON ◣
        </div>
        <div style={{ fontSize: isMobile ? '10px' : '14px', marginBottom: isMobile ? '8px' : '12px', color: '#ffcc00', textAlign: 'center' }}>
          CASE #1183-WB
        </div>

        {/* Photo with CRT terminal styling */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '8px' : '12px',
          marginBottom: isMobile ? '8px' : '12px',
          paddingBottom: isMobile ? '8px' : '12px',
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: '2px solid #ff3300',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}>
            <img
              src="/will.jpeg"
              alt="Will Byers"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>
          <div style={{ flex: 1, fontSize: isMobile ? '10px' : '13px' }}>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>NAME: </span>{isMobile ? 'WILL BYERS' : 'WILLIAM "WILL" BYERS'}</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>DOB: </span>{isMobile ? '03/22/71' : 'MARCH 22, 1971'}</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>AGE: </span>12</div>
            <div><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#ff0000', animation: 'blink 0.5s infinite' }}>MISSING</span></div>
          </div>
        </div>

        {/* Disappearance Details */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: '2px solid #ff3300', background: 'rgba(255,51,0,0.15)' }}>
          <div style={{ color: '#ff3300', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ DISAPPEARANCE
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>DATE: </span>NOV 6, 1983</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>LOCATION: </span>MIRKWOOD</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>LAST SEEN: </span>D&D at Wheeler's</div>
            <div><span style={{ color: dimColor }}>EVIDENCE: </span>Bicycle recovered</div>
          </div>
        </div>

        {/* Family Information */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: '#ffcc00', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ FAMILY
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>MOTHER: </span>JOYCE BYERS</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>BROTHER: </span>JONATHAN BYERS</div>
            <div><span style={{ color: dimColor }}>FATHER: </span>LONNIE (ESTRANGED)</div>
          </div>
        </div>

        {/* School & Social */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ SCHOOL
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SCHOOL: </span>HAWKINS MIDDLE - 7TH</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>INTERESTS: </span>Art, D&D</div>
            <div style={{ fontSize: isMobile ? '8px' : '12px', color: dimColor, borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              "THE PARTY": Mike, Dustin, Lucas
            </div>
          </div>
        </div>

        {/* D&D Profile */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: '1px solid #4a8844', background: 'rgba(74,136,68,0.1)' }}>
          <div style={{ color: '#4a8844', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ PROFILE
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Shy, sensitive, artistic. Known as "WILL THE WISE" to friends.
            </div>
            <div style={{ color: '#ffcc00' }}>
              SEARCH PRIORITY: "Castle Byers" fort in woods.
            </div>
          </div>
        </div>

        {/* Investigation Timeline */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: '#ffcc00', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ INVESTIGATION
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.5' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>11/06 - </span>Reported missing</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>11/07 - </span>Bicycle found</div>
            <div style={{ marginBottom: '4px', color: '#ff6600' }}><span style={{ color: dimColor }}>11/08 - </span>Body recovered. ████████.</div>
            <div style={{ color: '#ff0000' }}><span style={{ color: dimColor }}>11/09 - </span>Mother reports electrical contact.</div>
          </div>
        </div>

        {/* DOE Classified Section */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: '2px solid #ff0000', background: 'rgba(255,0,0,0.1)' }}>
          <div style={{ color: '#ff0000', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ DOE CLASSIFIED
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6', color: '#ff3300' }}>
            <div style={{ marginBottom: '6px' }}>
              Body from quarry is SYNTHETIC. Fabricated to close case.
            </div>
            <div style={{ marginBottom: '6px' }}>
              Subject taken by Demogorgon to "Upside Down" dimension.
            </div>
            <div style={{ color: '#ffcc00' }}>
              Subject 011 confirms alive but weakening. Located in D-B Castle Byers.
            </div>
          </div>
        </div>

        {/* Extraction Status */}
        <div style={{ padding: isMobile ? '8px' : '10px', border: '2px solid #ff3300', background: 'rgba(255,51,0,0.15)' }}>
          <div style={{ color: '#ff3300', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ EXTRACTION
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: '#ffcc00' }}>
              DAYS IN UPSIDE DOWN: 7+<br/>
              CONDITION: DETERIORATING
            </div>
            <div style={{ color: '#ff0000', animation: 'blink 1s infinite' }}>
              Hopper + Joyce entering Dimension-B. OPERATION IN PROGRESS.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderJoyce = () => (
    <div style={{ color: baseColor, fontSize: isMobile ? '11px' : '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: '1px solid #ffcc00',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: isMobile ? '11px' : '14px', marginBottom: isMobile ? '8px' : '12px', color: '#ffcc00', textAlign: 'center' }}>
          ◢ HAWKINS POLICE DEPT - CIVILIAN FILE ◣
        </div>
        <div style={{ fontSize: isMobile ? '9px' : '12px', color: dimColor, textAlign: 'center', marginBottom: isMobile ? '8px' : '12px' }}>
          {isMobile ? 'POI // CASE #1183-WB' : 'PERSON OF INTEREST // CASE #1183-WB // DOE SURVEILLANCE TARGET'}
        </div>

        {/* Photo with CRT terminal styling */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: `1px solid ${borderColor}`,
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}>
            <img
              src="/joyce.jpeg"
              alt="Joyce Byers"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>
          <div style={{ flex: 1, fontSize: '13px' }}>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>NAME: </span>JOYCE BYERS</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>MAIDEN: </span>MALDONADO</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>DOB: </span>1943</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>HEIGHT: </span>5'3"</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>EYES: </span>BROWN</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>ADDRESS: </span>CORNWALLIS RD, HAWKINS</div>
            <div><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#ff6600' }}>SURVEILLANCE ACTIVE</span></div>
          </div>
        </div>

        {/* Employment History */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === EMPLOYMENT HISTORY ===
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>1959: </span>MELVALD'S DINER - WAITRESS (PART-TIME)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>1973-PRES: </span>MELVALD'S GENERAL STORE - RETAIL CLERK</div>
            <div style={{ marginTop: '6px', fontSize: '12px', color: dimColor }}>
              NOTE: Subject works excessive hours including holidays. Financial
              strain documented. Single income household supporting two dependents.
            </div>
          </div>
        </div>

        {/* Family Status */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: '#ffcc00', marginBottom: '8px', fontSize: '13px' }}>
            === FAMILY STATUS ===
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>MARITAL: </span>DIVORCED (1982)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>EX-SPOUSE: </span>LONNIE BYERS (INDIANAPOLIS)</div>
            <div style={{ marginBottom: '8px' }}><span style={{ color: dimColor }}>DEPENDENTS: </span>2</div>
            <div style={{ padding: '6px', border: `1px solid ${borderColor}`, marginBottom: '6px' }}>
              <span style={{ color: dimColor }}>SON 1: </span>JONATHAN BYERS<br/>
              <span style={{ fontSize: '12px', color: dimColor }}>DOB: 1967 | HAWKINS HIGH - SENIOR | PHOTOGRAPHER</span>
            </div>
            <div style={{ padding: '6px', border: '1px solid #ff3300', background: 'rgba(255,51,0,0.1)' }}>
              <span style={{ color: '#ff3300' }}>SON 2: </span>WILLIAM "WILL" BYERS<br/>
              <span style={{ fontSize: '12px', color: '#ff3300' }}>DOB: 1971 | STATUS: MISSING (11/06/83) | CASE ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Background - High School */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === BACKGROUND CHECK ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: dimColor }}>EDUCATION: </span>HAWKINS HIGH SCHOOL (CLASS OF '59)
            </div>
            <div style={{ marginBottom: '6px' }}>
              Known associates during school years: JAMES HOPPER JR. (current
              Hawkins Police Chief), BOB NEWBY (RadioShack manager), LONNIE BYERS
              (ex-husband). Drama club participant. Briefly dated HOPPER before
              relationship with BYERS.
            </div>
            <div style={{ color: dimColor }}>
              Subject reportedly dreamed of leaving Hawkins for performing arts
              career. Never left town. Pattern consistent with economic constraints
              and early pregnancy.
            </div>
          </div>
        </div>

        {/* Relationship History */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === RELATIONSHIP HISTORY ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', padding: '6px', border: `1px solid ${borderColor}` }}>
              <span style={{ color: dimColor }}>LONNIE BYERS (M. 1965, DIV. 1982): </span>
              Marriage dissolved on contentious terms. Reports indicate domestic
              verbal abuse, financial irresponsibility. Father showed hostility
              toward sons' interests. Called younger son "queer" for artistic
              inclinations. Currently estranged. Indianapolis residence.
            </div>
            <div style={{ marginBottom: '6px', padding: '6px', border: '1px solid #4a8844' }}>
              <span style={{ color: '#4a8844' }}>BOB NEWBY (1984): </span>
              RadioShack manager. High school acquaintance reconnection. Described
              as devoted, supportive of both sons. Proposed relocation to Maine.
              Subject hesitant due to sons' attachments. Relationship ongoing.
            </div>
            <div style={{ padding: '6px', border: `1px solid ${dimColor}` }}>
              <span style={{ color: dimColor }}>JAMES HOPPER: </span>
              Renewed contact following missing person case. Historical romantic
              interest (high school). Current relationship: professional/personal
              unclear. Frequent contact documented.
            </div>
          </div>
        </div>

        {/* Psychological Profile */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)' }}>
          <div style={{ color: '#ff6600', marginBottom: '8px', fontSize: '13px' }}>
            === PSYCHOLOGICAL ASSESSMENT (DOE) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Subject exhibits extreme maternal protective instincts. Refuses to
              accept official narrative regarding son's disappearance. Displays
              symptoms consistent with acute stress response but remains
              functional. High pain tolerance. Stubborn. Resourceful.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              QUOTE ON FILE: "Maybe I am a mess, maybe I'm crazy, maybe I'm out of
              my mind! But, God help me, I will keep these lights up until the day
              I die, if I think there's a chance that Will's still out there!"
            </div>
            <div style={{ color: '#ffcc00' }}>
              ASSESSMENT: Subject is not delusional. Recommend continued monitoring.
              May possess accurate intelligence regarding HNL operations.
            </div>
          </div>
        </div>

        {/* DOE Surveillance Notes */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: '#ffcc00', marginBottom: '8px', fontSize: '13px' }}>
            === SURVEILLANCE LOG (CASE #1183-WB) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>11/06/83 22:30 - </span>Subject reported son missing to HPD.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>11/07/83 14:00 - </span>Subject claims phone call from son. Static interference only.</div>
            <div style={{ marginBottom: '4px', color: '#ff6600' }}><span style={{ color: dimColor }}>11/07/83 19:00 - </span>Subject claims lights in home are "communicating."</div>
            <div style={{ marginBottom: '4px', color: '#ff6600' }}><span style={{ color: dimColor }}>11/08/83 08:00 - </span>Purchased additional Christmas lights. 10+ strands.</div>
            <div style={{ marginBottom: '4px', color: '#ff3300' }}><span style={{ color: dimColor }}>11/08/83 21:00 - </span>Subject created alphabetic light system on wall.</div>
            <div style={{ color: '#ff0000' }}><span style={{ color: dimColor }}>11/09/83 03:00 - </span>CLAIMS DIRECT COMMUNICATION WITH SON VIA LIGHTS. POSSIBLE BREACH EXPOSURE.</div>
          </div>
        </div>

        {/* Classified DOE Assessment */}
        <div style={{ padding: '10px', border: '1px solid #ff3300', background: 'rgba(255,51,0,0.1)' }}>
          <div style={{ color: '#ff3300', marginBottom: '8px', fontSize: '13px' }}>
            === DOE INTERNAL ASSESSMENT (CLASSIFIED) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div style={{ marginBottom: '6px' }}>
              Subject demonstrates unexplained awareness of DIMENSION-B phenomena.
              "Light communication" claims align with documented EM interference
              patterns from gate proximity. Cannot rule out legitimate contact with
              missing child.
            </div>
            <div style={{ marginBottom: '6px' }}>
              THREAT LEVEL: MODERATE. Subject is persistent and resourceful. Has
              recruited Chief HOPPER (see file). May pose exposure risk to
              facility operations if not contained.
            </div>
            <div style={{ color: baseColor }}>
              RECOMMENDATION: Maintain surveillance. Prepare cover story for child
              recovery or permanent disappearance. Subject too visible in community
              for direct intervention. Handle with caution.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBob = () => (
    <div style={{ color: baseColor, fontSize: isMobile ? '11px' : '14px' }}>
      <div style={{
        border: '2px solid #ff6600',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(255,102,0,0.05)',
        position: 'relative',
      }}>
        {/* Memorial banner */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '4px 12px',
          background: '#1a0a00',
          border: '1px solid #ff6600',
          color: '#ff6600',
          fontSize: '10px',
        }}>
          ✦ IN MEMORIAM ✦
        </div>

        <div style={{ fontSize: isMobile ? '11px' : '14px', marginBottom: isMobile ? '8px' : '12px', color: '#ff6600', textAlign: 'center' }}>
          ◢ DOE CIVILIAN CASUALTY REPORT ◣
        </div>
        <div style={{ fontSize: isMobile ? '9px' : '12px', color: dimColor, textAlign: 'center', marginBottom: isMobile ? '8px' : '12px' }}>
          INCIDENT: HAWKINS LAB BREACH // DATE: 04-NOV-1984 // STATUS: DECEASED
        </div>

        <div style={{
          display: 'flex',
          gap: isMobile ? '10px' : '15px',
          marginBottom: isMobile ? '10px' : '15px',
          paddingBottom: isMobile ? '10px' : '15px',
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: '1px solid #ff6600',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}>
            <img
              src="/bob.jpeg"
              alt="Bob Newby"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div style={{
              display: 'none',
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ff6600',
              fontSize: '10px',
              textAlign: 'center',
              background: '#1a0a00',
            }}>
              [PHOTO<br/>CLASSIFIED]
            </div>
          </div>
          <div style={{ flex: 1, fontSize: isMobile ? '10px' : '13px' }}>
            <div style={{ color: '#ff6600', fontSize: isMobile ? '13px' : '16px', marginBottom: isMobile ? '4px' : '6px' }}>
              ROBERT "BOB" NEWBY
            </div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>ALIAS: </span>"BOB THE BRAIN"</div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>DOB: </span>1943</div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>ORIGIN: </span>MAINE (RELOCATED AGE 7)</div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>OCCUPATION: </span>RADIOSHACK MANAGER</div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>CLEARANCE: </span>NONE (CIVILIAN)</div>
            <div><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#ff3300' }}>DECEASED (04-NOV-84)</span></div>
          </div>
        </div>

        <div style={{ marginBottom: isMobile ? '10px' : '15px', padding: isMobile ? '8px' : '12px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: '#ff6600', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ BACKGROUND
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', lineHeight: '1.6', color: dimColor }}>
            Hawkins High School graduate (Class of 1959). Founding member of school AV Club.
            Known associates: JOYCE BYERS (girlfriend at time of death), JAMES HOPPER (classmate),
            SCOTT CLARKE (fellow electronics enthusiast). Subject demonstrated exceptional
            technical aptitude and problem-solving abilities. Employed at RadioShack since 1975.
            No prior involvement with DOE or classified operations until incident date.
          </div>
        </div>

        <div style={{ marginBottom: isMobile ? '10px' : '15px', padding: isMobile ? '8px' : '12px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: '#ff6600', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ INVOLVEMENT IN INCIDENT
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', lineHeight: '1.6' }}>
            <div style={{ color: dimColor, marginBottom: '8px' }}>
              Subject became involved through romantic relationship with JOYCE BYERS following
              the 1983 incident. When WILLIAM BYERS exhibited symptoms of interdimensional
              possession (OCT 1984), subject was present during family crisis.
            </div>
            <div style={{ color: baseColor }}>
              KEY CONTRIBUTION: Subject identified pattern in Will Byers' drawings - recognized
              as tunnel system mapping. Cross-referenced with county survey maps to locate
              central hub beneath Hawkins Lab. This intelligence proved CRITICAL to operation.
            </div>
          </div>
        </div>

        <div style={{ marginBottom: isMobile ? '10px' : '15px', padding: isMobile ? '8px' : '12px', border: '1px solid #ff3300', background: 'rgba(255,51,0,0.1)' }}>
          <div style={{ color: '#ff3300', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ INCIDENT REPORT - 04-NOV-1984
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', lineHeight: '1.6' }}>
            <div style={{ color: '#ffcc00', marginBottom: '8px' }}>
              LOCATION: Hawkins National Laboratory, Sublevel 3<br/>
              SITUATION: Multiple hostile entities (DEMODOGS) breached containment
            </div>
            <div style={{ color: dimColor, marginBottom: '8px' }}>
              Following power failure, subject volunteered to restore systems from basement
              BASIC terminal. Successfully rebooted security protocols while under extreme
              duress. Actions allowed evacuation of JOYCE BYERS, WILLIAM BYERS, JAMES HOPPER,
              MICHAEL WHEELER, and DOE personnel.
            </div>
            <div style={{ color: '#ff3300' }}>
              Subject was intercepted by hostile entities in main corridor during extraction.
              Despite proximity to exit, subject did not survive encounter. Death was immediate.
              Body recovered. Family notified via cover story (chemical exposure accident).
            </div>
          </div>
        </div>

        <div style={{ marginBottom: isMobile ? '10px' : '15px', padding: isMobile ? '8px' : '12px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: '#ff6600', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ ASSESSMENT
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', lineHeight: '1.6', color: dimColor }}>
            <div style={{ marginBottom: '8px' }}>
              Subject demonstrated exceptional courage under circumstances no civilian should
              face. Technical knowledge proved instrumental in operation success. Without
              his intervention, casualty count would have been significantly higher.
            </div>
            <div style={{ color: '#ffcc00', fontStyle: 'italic' }}>
              "He was no superhero. He was better. He was a good man."<br/>
              <span style={{ color: dimColor }}>— Statement from JOYCE BYERS (redacted from official record)</span>
            </div>
          </div>
        </div>

        <div style={{
          padding: isMobile ? '8px' : '12px',
          border: '1px solid #ff6600',
          background: 'rgba(255,102,0,0.1)',
          textAlign: 'center',
        }}>
          <div style={{ color: '#ff6600', fontSize: isMobile ? '11px' : '13px', marginBottom: '6px' }}>
            ✦ CIVILIAN HERO COMMENDATION (CLASSIFIED) ✦
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '11px', color: dimColor }}>
            Robert Newby gave his life so others could live. His sacrifice will never be
            publicly acknowledged, but it will not be forgotten by those who survived.
          </div>
          <div style={{ marginTop: '8px', color: '#ffcc00', fontSize: isMobile ? '10px' : '12px' }}>
            "BOB NEWBY - SUPERHERO"
          </div>
        </div>
      </div>
    </div>
  );

  const renderJonathan = () => (
    <div style={{ color: baseColor, fontSize: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: '1px solid #4a8844',
        padding: '15px',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: '14px', marginBottom: '12px', color: '#4a8844', textAlign: 'center' }}>
          ◢ HAWKINS HIGH SCHOOL - STUDENT FILE ◣
        </div>
        <div style={{ fontSize: '12px', color: dimColor, textAlign: 'center', marginBottom: '12px' }}>
          ACADEMIC RECORDS // DOE SURVEILLANCE ANNEX // CASE #1183-WB RELATED
        </div>

        {/* Photo with CRT terminal styling */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: `1px solid ${borderColor}`,
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}>
            <img
              src="/jonathan.jpeg"
              alt="Jonathan Byers"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>
          <div style={{ flex: 1, fontSize: '13px' }}>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>NAME: </span>JONATHAN BYERS</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>DOB: </span>1967</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>AGE: </span>16</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>HEIGHT: </span>5'8"</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>EYES: </span>BROWN</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>GRADE: </span>SENIOR</div>
            <div><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#4a8844' }}>ENROLLED</span></div>
          </div>
        </div>

        {/* Academic Record */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === ACADEMIC RECORD ===
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SCHOOL: </span>HAWKINS HIGH SCHOOL</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>YEAR: </span>SENIOR (CLASS OF '84)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>GPA: </span>3.4</div>
            <div style={{ marginBottom: '8px' }}><span style={{ color: dimColor }}>STANDING: </span>GOOD</div>
            <div style={{ fontSize: '12px', color: dimColor, borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              EXTRACURRICULARS:<br/>
              - Photography Club (President)<br/>
              - School Newspaper (Photographer)<br/>
              - Yearbook Committee
            </div>
          </div>
        </div>

        {/* Aspirations */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #4a8844', background: 'rgba(74,136,68,0.1)' }}>
          <div style={{ color: '#4a8844', marginBottom: '8px', fontSize: '13px' }}>
            === COLLEGE ASPIRATIONS ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: dimColor }}>TARGET: </span>NEW YORK UNIVERSITY (NYU)
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: dimColor }}>PROGRAM: </span>PHOTOGRAPHY / FINE ARTS
            </div>
            <div style={{ color: baseColor }}>
              Per counselor notes: Student has expressed desire to attend NYU since
              age 6. Demonstrates exceptional aptitude for photography. Financial
              constraints may impact application. Single-parent household.
            </div>
          </div>
        </div>

        {/* Family Background */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: '#ffcc00', marginBottom: '8px', fontSize: '13px' }}>
            === FAMILY BACKGROUND ===
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>MOTHER: </span>JOYCE BYERS (MELVALD'S EMPLOYEE)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>FATHER: </span>LONNIE BYERS (ABSENT - INDIANAPOLIS)</div>
            <div style={{ marginBottom: '8px' }}><span style={{ color: dimColor }}>SIBLING: </span>WILLIAM BYERS (YOUNGER BROTHER)</div>
            <div style={{ padding: '6px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)', fontSize: '12px' }}>
              NOTE: Parents divorced 1982. Father largely absent from children's
              lives. Student has assumed significant household responsibilities.
              Counselor flagged for potential parentification. Works part-time to
              supplement family income.
            </div>
          </div>
        </div>

        {/* Psychological Notes - The Rabbit Incident */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)' }}>
          <div style={{ color: '#ff6600', marginBottom: '8px', fontSize: '13px' }}>
            === COUNSELOR NOTES (CONFIDENTIAL) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>1977 INCIDENT: </span>
              Father forced subject to kill rabbit during hunting trip (10th birthday).
              Subject reportedly "cried for nine days" afterward. Demonstrates
              sensitivity inconsistent with father's expectations of masculinity.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>PERSONALITY: </span>
              Introverted. Socially isolated. Few peer relationships. Strong
              protective instincts toward younger brother. Mature beyond years.
              Finds solace in photography and music. Prefers solitude.
            </div>
            <div style={{ color: '#ffcc00' }}>
              <span style={{ color: dimColor }}>1982 NOTE: </span>
              Following father's departure, subject and brother constructed
              "Castle Byers" - woodland fort. Healthy coping mechanism. Brothers
              maintain close bond despite family dysfunction.
            </div>
          </div>
        </div>

        {/* DOE Interest */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: '#ffcc00', marginBottom: '8px', fontSize: '13px' }}>
            === DOE SURVEILLANCE NOTES ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>11/06/83 - </span>Subject working late shift. Brother vanished during this time.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>11/07/83 - </span>Subject searching for brother independently. Photographing woods.</div>
            <div style={{ marginBottom: '4px', color: '#ff6600' }}><span style={{ color: dimColor }}>11/08/83 - </span>Subject photographed Harrington residence. Images show HOLLAND, B. moments before disappearance.</div>
            <div style={{ marginBottom: '4px', color: '#ff6600' }}><span style={{ color: dimColor }}>11/09/83 - </span>Subject collaborating with WHEELER, N. Investigation ongoing.</div>
            <div style={{ color: '#ff3300' }}><span style={{ color: dimColor }}>11/10/83 - </span>Subject and associates constructed trap at Byers residence. ENTITY ENCOUNTERED.</div>
          </div>
        </div>

        {/* Photography Evidence */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === PHOTOGRAPHIC EVIDENCE (CONFISCATED) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: dimColor }}>
            <div style={{ marginBottom: '4px' }}>ROLL 1: Forest search photos - CLEARED</div>
            <div style={{ marginBottom: '4px' }}>ROLL 2: Harrington party - FLAGGED (Holland sighting)</div>
            <div style={{ marginBottom: '4px', color: '#ff3300' }}>ROLL 3: Anomalous light phenomena - CLASSIFIED</div>
            <div style={{ marginBottom: '4px', color: '#ff3300' }}>ROLL 4: Entity encounter evidence - DESTROYED</div>
            <div style={{ marginTop: '6px', color: '#ff6600' }}>
              Subject possesses visual documentation of HNL-related incidents.
              Photography equipment should be monitored. Potential exposure risk.
            </div>
          </div>
        </div>

        {/* Social Connections */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === KNOWN ASSOCIATES ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', padding: '6px', border: `1px solid ${borderColor}` }}>
              <span style={{ color: dimColor }}>WHEELER, NANCY: </span>
              Hawkins High junior. Initial contact during Byers/Holland investigation.
              Relationship status: Developing. Shared exposure to HNL phenomena.
            </div>
            <div style={{ padding: '6px', border: `1px solid ${borderColor}` }}>
              <span style={{ color: dimColor }}>HARRINGTON, STEVE: </span>
              Hawkins High senior. Initially adversarial (bullying incident re:
              photography). Later cooperated during entity encounter. Status: Uncertain.
            </div>
          </div>
        </div>

        {/* Classified Assessment */}
        <div style={{ padding: '10px', border: '1px solid #ff3300', background: 'rgba(255,51,0,0.1)' }}>
          <div style={{ color: '#ff3300', marginBottom: '8px', fontSize: '13px' }}>
            === DOE ASSESSMENT (CLASSIFIED) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div style={{ marginBottom: '6px' }}>
              Subject demonstrates high intelligence and observational skills.
              Photography hobby makes him uniquely dangerous as potential
              documenter of classified phenomena. Has captured evidence of
              DIMENSION-B incursion.
            </div>
            <div style={{ marginBottom: '6px' }}>
              Emotional vulnerability noted (guilt over brother's disappearance,
              protective instincts). May be leveraged if necessary. Strong bond
              with mother - approach through family pressure if required.
            </div>
            <div style={{ color: baseColor }}>
              THREAT LEVEL: MODERATE-HIGH. Subject is quiet but resourceful.
              Allied with Wheeler (see file) and potentially Harrington.
              Forming investigative cell. Monitor closely.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDustin = () => (
    <div style={{ color: baseColor, fontSize: isMobile ? '11px' : '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: '1px solid #00ccff',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(0,0,0,0.3)',
      }}>
        {!isMobile && (
          <div style={{ fontSize: '14px', marginBottom: '12px', color: '#00ccff', textAlign: 'center' }}>
            ◢ HAWKINS MIDDLE SCHOOL - STUDENT FILE ◣
          </div>
        )}
        <div style={{ fontSize: isMobile ? '9px' : '12px', color: dimColor, textAlign: 'center', marginBottom: isMobile ? '8px' : '12px' }}>
          {isMobile ? 'STUDENT FILE - DUSTIN HENDERSON' : 'ACADEMIC RECORDS // SCIENCE DEPT NOTES // DOE SURVEILLANCE ANNEX'}
        </div>

        {/* Photo with CRT terminal styling */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '8px' : '12px',
          marginBottom: isMobile ? '8px' : '12px',
          paddingBottom: isMobile ? '8px' : '12px',
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: `1px solid ${borderColor}`,
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}>
            <img
              src="/dustin.jpeg"
              alt="Dustin Henderson"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>
          <div style={{ flex: 1, fontSize: '13px' }}>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>NAME: </span>DUSTIN CLARENCE HENDERSON</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>DOB: </span>MAY 29, 1971</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>AGE: </span>12</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>HEIGHT: </span>5'4"</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>EYES: </span>BLUE</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>GRADE: </span>7TH</div>
            <div><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#4a8844' }}>ENROLLED</span></div>
          </div>
        </div>

        {/* Medical Information */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #00ccff', background: 'rgba(0,204,255,0.1)' }}>
          <div style={{ color: '#00ccff', marginBottom: '8px', fontSize: '13px' }}>
            === MEDICAL RECORD (CONFIDENTIAL) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: dimColor }}>CONDITION: </span>CLEIDOCRANIAL DYSPLASIA
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Rare genetic disorder affecting bone and tooth development. Subject
              missing some adult teeth; may require prosthetics. Minor speech
              impediment noted (lisp). Condition does not affect cognitive function.
            </div>
            <div style={{ color: '#ffcc00' }}>
              NOTE: Subject has experienced bullying related to condition. Shows
              remarkable resilience and self-confidence despite challenges.
            </div>
          </div>
        </div>

        {/* Academic Record */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === ACADEMIC RECORD ===
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SCHOOL: </span>HAWKINS MIDDLE SCHOOL</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>YEAR: </span>7TH GRADE</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>GPA: </span>3.8</div>
            <div style={{ marginBottom: '8px' }}><span style={{ color: dimColor }}>STANDING: </span>EXCELLENT</div>
            <div style={{ fontSize: '12px', color: dimColor, borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              NOTABLE STRENGTHS:<br/>
              - Science (Biology, Chemistry) - Exceptional<br/>
              - Technology / Electronics - Advanced aptitude<br/>
              - Problem-solving - Creative approach<br/>
              ACTIVITIES: AV Club, Science Fair participant
            </div>
          </div>
        </div>

        {/* Family Background */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: '#ffcc00', marginBottom: '8px', fontSize: '13px' }}>
            === FAMILY BACKGROUND ===
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>MOTHER: </span>CLAUDIA HENDERSON</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>FATHER: </span>WALTER HENDERSON (STATUS UNKNOWN)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>RESIDENCE: </span>MAPLE STREET, HAWKINS</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>PET: </span>MEWS (CAT - DECEASED)</div>
            <div style={{ fontSize: '12px', color: dimColor, marginTop: '6px' }}>
              Single-parent household. Mother described as supportive but unaware
              of son's extracurricular activities involving Byers case.
            </div>
          </div>
        </div>

        {/* D&D Profile */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #4a8844', background: 'rgba(74,136,68,0.1)' }}>
          <div style={{ color: '#4a8844', marginBottom: '8px', fontSize: '13px' }}>
            === BEHAVIORAL PROFILE ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Subject exhibits high intelligence, scientific curiosity, and
              exceptional knowledge of fantasy/sci-fi media. Functions as group
              mediator during conflicts. Quick-witted with strong verbal skills
              despite speech impediment.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>D&D ROLE: </span>
              "THE BARD" - Demonstrates extensive game knowledge, particularly
              regarding monster lore. Often serves as party strategist.
            </div>
            <div style={{ color: '#ffcc00' }}>
              PERSONALITY: Confident, loyal, enthusiastic. Natural problem-solver.
              Shows unusual maturity in crisis situations.
            </div>
          </div>
        </div>

        {/* Technical Aptitude */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #00ccff', background: 'rgba(0,204,255,0.1)' }}>
          <div style={{ color: '#00ccff', marginBottom: '8px', fontSize: '13px' }}>
            === TECHNICAL APTITUDE ASSESSMENT ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>HAM RADIO: </span>
              Licensed operator. Has constructed personal radio equipment.
              Demonstrated ability to intercept and decode transmissions.
              Range capabilities exceed standard amateur equipment.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>ELECTRONICS: </span>
              Self-taught. Has modified consumer electronics. Built custom
              compass devices using electromagnetic principles.
            </div>
            <div style={{ color: '#ff6600' }}>
              FLAGGED: Subject's technical skills may pose intelligence risk.
              Capable of intercepting classified communications.
            </div>
          </div>
        </div>

        {/* Known Associates */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === KNOWN ASSOCIATES ("THE PARTY") ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>WHEELER, MICHAEL: </span>Group leader. Close friend.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SINCLAIR, LUCAS: </span>Close friend. Fellow strategist.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>BYERS, WILLIAM: </span>Close friend. MISSING (see Case #1183-WB).</div>
            <div style={{ marginBottom: '4px', color: '#ff6600' }}><span style={{ color: dimColor }}>████████ ("ELEVEN"): </span>HNL escapee. Subject aware of abilities.</div>
            <div style={{ marginTop: '6px', padding: '6px', border: `1px solid ${borderColor}` }}>
              <span style={{ color: dimColor }}>HARRINGTON, STEVE: </span>
              Hawkins High senior. Unusual association noted. Subject observed
              receiving "advice" from Harrington. Relationship warrants monitoring.
            </div>
          </div>
        </div>

        {/* Incident Report - Dart */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)' }}>
          <div style={{ color: '#ff6600', marginBottom: '8px', fontSize: '13px' }}>
            === INCIDENT REPORT (CLASSIFIED) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: '#ff3300' }}>
              <span style={{ color: dimColor }}>INCIDENT: </span>D'ARTAGNAN ("DART")
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Subject discovered and concealed juvenile DIMENSION-B organism.
              Initially mistook creature for undiscovered terrestrial species.
              Fed and housed creature in personal residence until maturation
              revealed true nature (Demogorgon subspecies).
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Creature responsible for death of family pet (MEWS). Subject
              showed emotional attachment to organism despite threat level.
              Later exploited connection to assist in entity neutralization.
            </div>
            <div style={{ color: '#ffcc00' }}>
              NOTE: Subject's willingness to interact with D-B fauna is concerning
              but also potentially valuable. Scientific curiosity overrides
              self-preservation instinct.
            </div>
          </div>
        </div>

        {/* DOE Assessment */}
        <div style={{ padding: '10px', border: '1px solid #ff3300', background: 'rgba(255,51,0,0.1)' }}>
          <div style={{ color: '#ff3300', marginBottom: '8px', fontSize: '13px' }}>
            === DOE ASSESSMENT (CLASSIFIED) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div style={{ marginBottom: '6px' }}>
              Subject represents unique intelligence profile. Combination of
              technical aptitude, scientific curiosity, and exposure to HNL
              phenomena makes him HIGH VALUE for either recruitment or monitoring.
            </div>
            <div style={{ marginBottom: '6px' }}>
              Has demonstrated ability to identify, analyze, and adapt to
              DIMENSION-B threats. Monster lore knowledge (via D&D) provides
              unexpected tactical framework for entity classification.
            </div>
            <div style={{ color: baseColor }}>
              THREAT LEVEL: MODERATE. Subject is too visible and vocal to
              neutralize quietly. Recommend continued surveillance. Consider
              future recruitment to scientific division upon maturation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLucas = () => (
    <div style={{ color: baseColor, fontSize: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: '1px solid #cc6600',
        padding: '15px',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: '14px', marginBottom: '12px', color: '#cc6600', textAlign: 'center' }}>
          ◢ HAWKINS MIDDLE SCHOOL - STUDENT FILE ◣
        </div>
        <div style={{ fontSize: '12px', color: dimColor, textAlign: 'center', marginBottom: '12px' }}>
          ACADEMIC RECORDS // MILITARY FAMILY BACKGROUND // DOE SURVEILLANCE ANNEX
        </div>

        {/* Photo with CRT terminal styling */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: `1px solid ${borderColor}`,
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}>
            <img
              src="/lucas.jpeg"
              alt="Lucas Sinclair"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>
          <div style={{ flex: 1, fontSize: '13px' }}>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>NAME: </span>LUCAS CHARLES SINCLAIR</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>DOB: </span>1971</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>AGE: </span>12</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>HEIGHT: </span>5'0"</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>EYES: </span>BROWN</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>GRADE: </span>7TH</div>
            <div><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#4a8844' }}>ENROLLED</span></div>
          </div>
        </div>

        {/* Family Background - Military */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #cc6600', background: 'rgba(204,102,0,0.1)' }}>
          <div style={{ color: '#cc6600', marginBottom: '8px', fontSize: '13px' }}>
            === FAMILY BACKGROUND (MILITARY) ===
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>FATHER: </span>CHARLES SINCLAIR (U.S. ARMY VETERAN)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>MOTHER: </span>SUE SINCLAIR</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SIBLING: </span>ERICA SINCLAIR (YOUNGER SISTER)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>UNCLE: </span>JACK SINCLAIR</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>RESIDENCE: </span>HAWKINS, INDIANA</div>
            <div style={{ fontSize: '12px', color: dimColor, marginTop: '6px', borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              Father served in Vietnam War. Subject has inherited military
              equipment and demonstrates interest in tactical operations.
              Stable two-parent household. Sister noted for exceptional
              intelligence and assertive personality.
            </div>
          </div>
        </div>

        {/* Academic Record */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === ACADEMIC RECORD ===
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SCHOOL: </span>HAWKINS MIDDLE SCHOOL</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>YEAR: </span>7TH GRADE</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>GPA: </span>3.5</div>
            <div style={{ marginBottom: '8px' }}><span style={{ color: dimColor }}>STANDING: </span>GOOD</div>
            <div style={{ fontSize: '12px', color: dimColor, borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              NOTABLE STRENGTHS:<br/>
              - History - Excellent (favorite subject)<br/>
              - Physical Education - Above average<br/>
              - Strategic thinking / Problem-solving<br/>
              CAREER GOAL (per counselor): "Police detective by day,
              masked crime-fighter by night"
            </div>
          </div>
        </div>

        {/* Behavioral Profile */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #4a8844', background: 'rgba(74,136,68,0.1)' }}>
          <div style={{ color: '#4a8844', marginBottom: '8px', fontSize: '13px' }}>
            === BEHAVIORAL PROFILE ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Subject exhibits strong moral conviction and loyalty. Pragmatic
              thinker - often serves as voice of reason within peer group.
              Initially skeptical of new information but adapts quickly when
              presented with evidence.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>D&D ROLE: </span>
              "THE RANGER" - Specializes in reconnaissance, tracking, and
              tactical assessment. Demonstrates natural leadership abilities
              in field operations.
            </div>
            <div style={{ color: '#ffcc00' }}>
              HOBBIES: Bike riding, video games, wrist rocket target practice.
              Shows aptitude for surveillance and counter-surveillance techniques.
            </div>
          </div>
        </div>

        {/* Equipment Inventory */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #cc6600', background: 'rgba(204,102,0,0.1)' }}>
          <div style={{ color: '#cc6600', marginBottom: '8px', fontSize: '13px' }}>
            === EQUIPMENT INVENTORY (OBSERVED) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: dimColor }}>WRIST ROCKET: </span>
              Professional-grade slingshot. Subject demonstrates skilled accuracy.
              Has deployed against hostile entities with varying effectiveness.
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: dimColor }}>MILITARY BINOCULARS: </span>
              Inherited from father (Vietnam service). Used for long-range
              reconnaissance. Subject identified DOE surveillance vehicles
              using this equipment.
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: dimColor }}>MK1 KNIFE: </span>
              Father's Vietnam-era combat knife. Kept as secondary defense weapon.
            </div>
            <div style={{ color: '#ff6600' }}>
              NOTE: Subject's military family background has provided access to
              tactical equipment unusual for civilian minor. Monitor for
              escalation of armament.
            </div>
          </div>
        </div>

        {/* Known Associates */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === KNOWN ASSOCIATES ("THE PARTY") ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>WHEELER, MICHAEL: </span>Group leader. Close friend.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>HENDERSON, DUSTIN: </span>Close friend. Fellow strategist.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>BYERS, WILLIAM: </span>Close friend. MISSING (see Case #1183-WB).</div>
            <div style={{ marginBottom: '4px', color: '#ff6600' }}><span style={{ color: dimColor }}>████████ ("ELEVEN"): </span>HNL escapee. Subject initially hostile/skeptical. Later reconciled.</div>
          </div>
        </div>

        {/* Surveillance Notes */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: '#ffcc00', marginBottom: '8px', fontSize: '13px' }}>
            === DOE SURVEILLANCE LOG ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>11/07/83 - </span>Subject participated in unauthorized search for Byers.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>11/08/83 - </span>Used compass to track EM anomalies. Located HNL perimeter.</div>
            <div style={{ marginBottom: '4px', color: '#ff6600' }}><span style={{ color: dimColor }}>11/08/83 - </span>Climbed tree for recon. IDENTIFIED SURVEILLANCE TEAM.</div>
            <div style={{ marginBottom: '4px', color: '#ff6600' }}><span style={{ color: dimColor }}>11/09/83 - </span>Deployed wrist rocket against Demogorgon. Ineffective but noted for courage.</div>
            <div style={{ color: '#ff3300' }}><span style={{ color: dimColor }}>11/10/83 - </span>Present during entity neutralization. Full exposure to HNL phenomena.</div>
          </div>
        </div>

        {/* Subject Assessment */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)' }}>
          <div style={{ color: '#ff6600', marginBottom: '8px', fontSize: '13px' }}>
            === PSYCHOLOGICAL ASSESSMENT ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>ELEVEN ENCOUNTER: </span>
              Subject initially distrustful of HNL escapee. Believed she was
              "taking advantage of Wheeler's hospitality." Conducted independent
              investigation. Eventually reconciled after recognizing her
              protective intentions.
            </div>
            <div style={{ color: '#ffcc00' }}>
              Assessment: Subject's skepticism is asset - not easily manipulated.
              However, loyalty to friends ultimately overrides caution. Once
              trust is established, demonstrates unwavering commitment.
            </div>
          </div>
        </div>

        {/* DOE Assessment */}
        <div style={{ padding: '10px', border: '1px solid #ff3300', background: 'rgba(255,51,0,0.1)' }}>
          <div style={{ color: '#ff3300', marginBottom: '8px', fontSize: '13px' }}>
            === DOE ASSESSMENT (CLASSIFIED) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div style={{ marginBottom: '6px' }}>
              Subject represents tactical threat due to military family background,
              reconnaissance training, and demonstrated counter-surveillance
              capabilities. Successfully identified DOE observation posts.
            </div>
            <div style={{ marginBottom: '6px' }}>
              Ranger role within peer group makes him primary scout and early
              warning system. Physical courage noted - engaged Demogorgon with
              improvised weapon despite obvious ineffectiveness.
            </div>
            <div style={{ color: baseColor }}>
              THREAT LEVEL: MODERATE-HIGH. Subject's tactical mindset and military
              heritage make him natural leader in field operations. Recommend
              priority surveillance. Consider father's veteran status - may have
              contacts that complicate containment.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMike = () => (
    <div style={{ color: baseColor, fontSize: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: '1px solid #3366cc',
        padding: '15px',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: '14px', marginBottom: '12px', color: '#3366cc', textAlign: 'center' }}>
          ◢ HAWKINS MIDDLE SCHOOL - STUDENT FILE ◣
        </div>
        <div style={{ fontSize: '12px', color: dimColor, textAlign: 'center', marginBottom: '12px' }}>
          ACADEMIC RECORDS // BEHAVIORAL ASSESSMENT // DOE SURVEILLANCE ANNEX
        </div>

        {/* Photo with CRT terminal styling */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: `1px solid ${borderColor}`,
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}>
            <img
              src="/mike.jpeg"
              alt="Mike Wheeler"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>
          <div style={{ flex: 1, fontSize: '13px' }}>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>NAME: </span>MICHAEL "MIKE" WHEELER</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>DOB: </span>APRIL 7, 1971</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>AGE: </span>12</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>HEIGHT: </span>5'3"</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>EYES: </span>BROWN</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>GRADE: </span>7TH</div>
            <div><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#4a8844' }}>ENROLLED</span></div>
          </div>
        </div>

        {/* Family Background */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #3366cc', background: 'rgba(51,102,204,0.1)' }}>
          <div style={{ color: '#3366cc', marginBottom: '8px', fontSize: '13px' }}>
            === FAMILY BACKGROUND ===
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>FATHER: </span>TED WHEELER (EMPLOYED - HAWKINS)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>MOTHER: </span>KAREN WHEELER (HOMEMAKER)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SIBLINGS: </span>NANCY WHEELER (OLDER), HOLLY WHEELER (YOUNGER)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>RESIDENCE: </span>MAPLE STREET, HAWKINS, INDIANA</div>
            <div style={{ fontSize: '12px', color: dimColor, marginTop: '6px', borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              Upper-middle-class family. Suburban home with basement -
              primary gathering location for peer group activities.
              Sister Nancy Wheeler romantically linked to JONATHAN BYERS
              (see file #HMS-JB-1971). Parents appear unaware of children's
              involvement in HNL-related incidents.
            </div>
          </div>
        </div>

        {/* Academic Record */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === ACADEMIC RECORD ===
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SCHOOL: </span>HAWKINS MIDDLE SCHOOL</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>YEAR: </span>7TH GRADE</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>GPA: </span>3.6</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>CLUBS: </span>A.V. CLUB</div>
            <div style={{ marginBottom: '8px' }}><span style={{ color: dimColor }}>STANDING: </span>GOOD</div>
            <div style={{ fontSize: '12px', color: dimColor, borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              NOTABLE STRENGTHS:<br/>
              - Creative writing and storytelling<br/>
              - Leadership capabilities<br/>
              - Strategic planning (demonstrated in D&D campaigns)<br/>
              EXTRACURRICULAR: Primary organizer of tabletop gaming sessions.
              Shows strong narrative construction abilities.
            </div>
          </div>
        </div>

        {/* Leadership Profile */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #3366cc', background: 'rgba(51,102,204,0.1)' }}>
          <div style={{ color: '#3366cc', marginBottom: '8px', fontSize: '13px' }}>
            === LEADERSHIP PROFILE ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Subject serves as de facto leader of peer group ("The Party").
              Demonstrates strong organizational skills and ability to rally
              others during crisis situations. Natural authority figure among
              age-peers.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>D&D ROLE: </span>
              "DUNGEON MASTER" / "PALADIN" - Creates and manages complex
              narrative campaigns. Role indicates preference for control and
              storytelling. Paladin class suggests strong moral compass and
              protective instincts.
            </div>
            <div style={{ color: '#ffcc00' }}>
              ASSESSMENT: Subject's leadership style is characterized by
              emotional investment and fierce loyalty. Protective of friends
              to point of self-endangerment.
            </div>
          </div>
        </div>

        {/* Psychological Assessment */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)' }}>
          <div style={{ color: '#ff6600', marginBottom: '8px', fontSize: '13px' }}>
            === PSYCHOLOGICAL ASSESSMENT ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Subject exhibits deep emotional intensity. Forms strong attachments
              and demonstrates difficulty processing loss or separation. Extended
              distress observed following Byers disappearance and subsequent
              separation from Subject Eleven.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Shows tendency toward impulsive decision-making when emotionally
              activated. Loyalty to peer group supersedes self-preservation
              instincts.
            </div>
            <div style={{ color: '#ffcc00' }}>
              NOTE: Subject's emotional connection to HNL escapee ("Eleven")
              represents significant security concern. Bond appears mutual
              and deeply established.
            </div>
          </div>
        </div>

        {/* Known Associates */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === KNOWN ASSOCIATES ("THE PARTY") ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SINCLAIR, LUCAS: </span>Close friend. Tactical advisor.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>HENDERSON, DUSTIN: </span>Close friend. Technical specialist.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>BYERS, WILLIAM: </span>Best friend. MISSING (see Case #1183-WB).</div>
            <div style={{ marginBottom: '4px', color: '#ff6600' }}><span style={{ color: dimColor }}>████████ ("ELEVEN"): </span>HNL escapee. <span style={{ color: '#ff3300' }}>ROMANTIC ATTACHMENT CONFIRMED.</span></div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>WHEELER, NANCY: </span>Sister. Involved in separate HNL incident thread.</div>
          </div>
        </div>

        {/* Eleven Connection */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #ff3300', background: 'rgba(255,51,0,0.1)' }}>
          <div style={{ color: '#ff3300', marginBottom: '8px', fontSize: '13px' }}>
            === SUBJECT ELEVEN CONNECTION (CRITICAL) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Subject discovered HNL escapee ("Eleven") on 11/06/83 while
              searching for missing friend William Byers. Provided shelter,
              food, and concealment in family basement for approximately
              one week.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>BOND ASSESSMENT: </span>
              Subject demonstrated immediate protective instincts toward
              Eleven despite unknown origin and abilities. Taught her basic
              vocabulary, social concepts, explained "friends don't lie."
              Defended her against peer skepticism.
            </div>
            <div style={{ marginBottom: '6px', color: '#ffcc00' }}>
              "You can fly, you can move mountains. I believe that."
              - Subject, recorded 11/09/83
            </div>
            <div style={{ color: '#ff3300' }}>
              THREAT ASSESSMENT: Subject's emotional connection to Eleven
              makes him primary leverage point. If Eleven's location is
              compromised, subject will take extreme action. Recommend
              treating as HIGH PRIORITY surveillance target.
            </div>
          </div>
        </div>

        {/* DOE Surveillance Log */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: '#ffcc00', marginBottom: '8px', fontSize: '13px' }}>
            === DOE SURVEILLANCE LOG ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>11/06/83 - </span>Subject initiated unauthorized search for Byers.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>11/06/83 - </span>CONTACT WITH SUBJECT ELEVEN - provided shelter.</div>
            <div style={{ marginBottom: '4px', color: '#ff6600' }}><span style={{ color: dimColor }}>11/07/83 - </span>Concealed Eleven in basement. Parents unaware.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>11/08/83 - </span>Led party in compass-based tracking operation.</div>
            <div style={{ marginBottom: '4px', color: '#ff6600' }}><span style={{ color: dimColor }}>11/09/83 - </span>Confronted DOE agents. Displayed hostility toward Brenner.</div>
            <div style={{ color: '#ff3300' }}><span style={{ color: dimColor }}>11/10/83 - </span>Present during entity neutralization. Witnessed Eleven's disappearance. Extreme emotional distress.</div>
          </div>
        </div>

        {/* DOE Assessment */}
        <div style={{ padding: '10px', border: '1px solid #ff3300', background: 'rgba(255,51,0,0.1)' }}>
          <div style={{ color: '#ff3300', marginBottom: '8px', fontSize: '13px' }}>
            === DOE ASSESSMENT (CLASSIFIED) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div style={{ marginBottom: '6px' }}>
              Subject represents CRITICAL security concern due to:
              1) Deep emotional bond with HNL escapee
              2) Leadership position within exposed peer group
              3) Active hostility toward DOE/HNL personnel
              4) Demonstrated willingness to obstruct operations
            </div>
            <div style={{ marginBottom: '6px' }}>
              Subject's home (Wheeler residence, Maple St.) served as
              primary safehouse for Eleven. Basement configuration
              allows for concealment. Family remains unaware.
            </div>
            <div style={{ color: baseColor }}>
              THREAT LEVEL: HIGH. Subject is emotional center of civilian
              exposure group. His cooperation or neutralization directly
              affects control of entire peer network. Recommend maximum
              surveillance priority. DO NOT underestimate emotional
              volatility when Eleven-related matters arise.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEleven = () => (
    <div style={{ color: baseColor, fontSize: isMobile ? '11px' : '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: '2px solid #ff0066',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(0,0,0,0.3)',
        position: 'relative',
      }}>
        {/* Classified header with warning */}
        <div style={{
          fontSize: isMobile ? '9px' : '12px',
          marginBottom: isMobile ? '6px' : '8px',
          color: '#ff0066',
          textAlign: 'center',
          animation: 'blink 1s infinite',
        }}>
          ▓▓▓ TOP SECRET ▓▓▓
        </div>
        <div style={{ fontSize: isMobile ? '11px' : '14px', marginBottom: isMobile ? '8px' : '12px', color: '#ff0066', textAlign: 'center' }}>
          ◢ HNL TEST SUBJECT FILE ◣
        </div>
        <div style={{ fontSize: isMobile ? '9px' : '12px', color: dimColor, textAlign: 'center', marginBottom: isMobile ? '8px' : '12px' }}>
          {isMobile ? 'PROJECT INDIGO // DR. BRENNER' : 'PROJECT INDIGO // MKULTRA SUBCONTRACT // DR. MARTIN BRENNER - PRINCIPAL INVESTIGATOR'}
        </div>

        {/* Photo with CRT terminal styling */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '8px' : '12px',
          marginBottom: isMobile ? '8px' : '12px',
          paddingBottom: isMobile ? '8px' : '12px',
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: '2px solid #ff0066',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}>
            <img
              src="/eleven.jpeg"
              alt="Subject Eleven"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>
          <div style={{ flex: 1, fontSize: isMobile ? '10px' : '13px' }}>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>ID: </span><span style={{ color: '#ff0066' }}>011 (ELEVEN)</span></div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>NAME: </span>JANE IVES</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>DOB: </span>{isMobile ? '06/07/71' : 'JUNE 7, 1971'}</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>AGE: </span>12</div>
            <div><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#ff3300', animation: 'blink 0.5s infinite' }}>ESCAPED</span></div>
          </div>
        </div>

        {/* Origin / MKULTRA */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: '1px solid #ff0066', background: 'rgba(255,0,102,0.1)' }}>
          <div style={{ color: '#ff0066', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ ORIGIN
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>MOTHER: </span>TERRY IVES</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>FATHER: </span>ANDREW RICH (DECEASED)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>ACQUISITION: </span>BIRTH - JUNE 7, 1971</div>
            <div style={{ fontSize: isMobile ? '9px' : '12px', color: dimColor, marginTop: '6px', borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              Mother in MKULTRA (1969-71). Experiments during pregnancy resulted in psychokinetic abilities. Subject acquired at birth.
            </div>
          </div>
        </div>

        {/* Abilities Assessment */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: '1px solid #ffcc00', background: 'rgba(255,204,0,0.1)' }}>
          <div style={{ color: '#ffcc00', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ ABILITIES
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: '#ff0066' }}>PRIMARY: </span>TELEKINESIS - Matter manipulation via concentration
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: '#ff0066' }}>SECONDARY: </span>REMOTE VIEWING - Locate individuals across vast distances
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: '#ff0066' }}>TERTIARY: </span>BIOELECTRICAL - Disrupt electronics, lethal force capability
            </div>
            <div style={{ color: '#ff3300' }}>
              ⚠ WARNING: Abilities exceed all other subjects. EXTREME CAUTION.
            </div>
          </div>
        </div>

        {/* Laboratory History */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ LAB HISTORY (1971-1983)
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>HANDLER: </span>DR. BRENNER ("PAPA")</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>FACILITY: </span>HNL SUBLEVEL 3</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>TRAINING: </span>12 YEARS</div>
            <div style={{ fontSize: isMobile ? '8px' : '12px', color: dimColor, borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              Raised in lab from birth. Father figure imprinting with Brenner. Resistance increased pre-escape.
            </div>
          </div>
        </div>

        {/* The Gate Incident */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: '1px solid #ff3300', background: 'rgba(255,51,0,0.15)' }}>
          <div style={{ color: '#ff3300', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ GATE INCIDENT (11/06/83)
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Contact with Demogorgon caused dimensional breach. Gate opened to Upside Down.
            </div>
            <div style={{ color: '#ff3300' }}>
              Subject escaped during chaos. Only asset capable of closing rift.
            </div>
          </div>
        </div>

        {/* Known Contacts */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ CONTACTS
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px', color: '#ff6600' }}><span style={{ color: dimColor }}>MIKE WHEELER: </span><span style={{ color: '#ff0066' }}>EMOTIONAL BOND</span></div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>THE PARTY: </span>Lucas, Dustin, Will</div>
            <div style={{ marginBottom: '4px', color: '#ff6600' }}><span style={{ color: dimColor }}>HOPPER: </span>Recovery obstacle</div>
          </div>
        </div>

        {/* Other Test Subjects */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '8px' : '10px', border: '1px solid #ff0066', background: 'rgba(255,0,102,0.1)' }}>
          <div style={{ color: '#ff0066', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ RELATED SUBJECTS
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>001: </span><span style={{ color: '#ff3300' }}>SEE CREEL FILE</span></div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>008: </span>KALI - ESCAPED 1979</div>
            <div style={{ color: '#ffcc00' }}>
              Strongest abilities of all subjects. Only one capable of interdimensional contact.
            </div>
          </div>
        </div>

        {/* Recovery Directive */}
        <div style={{ padding: isMobile ? '8px' : '10px', border: '2px solid #ff3300', background: 'rgba(255,51,0,0.15)' }}>
          <div style={{ color: '#ff3300', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px', animation: 'blink 1s infinite' }}>
            ■ RECOVERY DIRECTIVE
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div style={{ marginBottom: '6px' }}>
              OBJECTIVE: Recover Subject 011 ALIVE
            </div>
            <div style={{ color: baseColor }}>
              ⚠ Direct confrontation inadvisable. Use "Papa" manipulation.
            </div>
          </div>
          <div style={{ marginTop: isMobile ? '6px' : '8px', fontSize: isMobile ? '9px' : '14px', color: dimColor, textAlign: 'center' }}>
            "SHE WILL COME BACK TO PAPA." - DR. BRENNER
          </div>
        </div>
      </div>
    </div>
  );

  const renderSteve = () => (
    <div style={{ color: baseColor, fontSize: isMobile ? '11px' : '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: '1px solid #cc9933',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(0,0,0,0.3)',
      }}>
        {!isMobile && <div style={{ fontSize: '14px', marginBottom: '12px', color: '#cc9933', textAlign: 'center' }}>
          ◢ HAWKINS HIGH SCHOOL - STUDENT FILE ◣
        </div>}
        <div style={{ fontSize: isMobile ? '9px' : '12px', color: dimColor, textAlign: 'center', marginBottom: isMobile ? '8px' : '12px' }}>
          {isMobile ? 'ACADEMIC // BEHAVIORAL // DOE' : 'ACADEMIC RECORDS // BEHAVIORAL ASSESSMENT // DOE SURVEILLANCE ANNEX'}
        </div>

        {/* Photo with CRT terminal styling */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '8px' : '12px',
          marginBottom: isMobile ? '8px' : '12px',
          paddingBottom: isMobile ? '8px' : '12px',
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: `1px solid ${borderColor}`,
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}>
            <img
              src="/steve.jpeg"
              alt="Steve Harrington"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>
          <div style={{ flex: 1, fontSize: isMobile ? '10px' : '13px' }}>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>NAME: </span>{isMobile ? 'STEVE HARRINGTON' : 'STEVEN "STEVE" HARRINGTON'}</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>DOB: </span>1966</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>AGE: </span>17</div>
            {!isMobile && <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>HEIGHT: </span>5'11"</div>}
            {!isMobile && <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>EYES: </span>BROWN</div>}
            {!isMobile && <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>HAIR: </span>BROWN (DISTINCTIVE STYLE)</div>}
            <div><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#4a8844' }}>{isMobile ? 'SENIOR' : 'ENROLLED - SENIOR'}</span></div>
          </div>
        </div>

        {/* Family Background */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #cc9933', background: 'rgba(204,153,51,0.1)' }}>
          <div style={{ color: '#cc9933', marginBottom: '8px', fontSize: '13px' }}>
            === FAMILY BACKGROUND ===
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>FATHER: </span>DANNY HARRINGTON (BUSINESSMAN)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>MOTHER: </span>MRS. HARRINGTON</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>RESIDENCE: </span>HARRINGTON HOUSE, HAWKINS, INDIANA</div>
            <div style={{ fontSize: '12px', color: dimColor, marginTop: '6px', borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              Affluent family. Parents frequently absent due to business travel.
              Large home with swimming pool - known party location. Subject
              has significant unsupervised time. Upper social tier.
            </div>
          </div>
        </div>

        {/* Academic Record */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === ACADEMIC RECORD ===
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SCHOOL: </span>HAWKINS HIGH SCHOOL</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>YEAR: </span>SENIOR (12TH GRADE)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>GPA: </span>2.8</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>ATHLETICS: </span>BASKETBALL TEAM</div>
            <div style={{ marginBottom: '8px' }}><span style={{ color: dimColor }}>STANDING: </span>AVERAGE</div>
            <div style={{ fontSize: '12px', color: dimColor, borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              ACADEMIC NOTES:<br/>
              - Average student, minimal academic motivation<br/>
              - Strong social standing / popularity<br/>
              - No post-secondary plans indicated<br/>
              COUNSELOR NOTE: "Steve has potential but lacks direction.
              More interested in social status than academics."
            </div>
          </div>
        </div>

        {/* Social Profile */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #cc9933', background: 'rgba(204,153,51,0.1)' }}>
          <div style={{ color: '#cc9933', marginBottom: '8px', fontSize: '13px' }}>
            === SOCIAL PROFILE ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Subject occupies top tier of high school social hierarchy.
              Known for hosting parties, athletic participation, and
              distinctive hair styling. High peer influence.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>RELATIONSHIP STATUS: </span>
              Dating NANCY WHEELER (see file #HHS-NW-1967).
              Relationship under strain following Barbara Holland
              disappearance.
            </div>
            <div style={{ color: '#ffcc00' }}>
              BEHAVIORAL NOTE: Recent behavioral shift observed. Subject
              distancing from previous peer group. Spending increased
              time with younger students (Wheeler friend group).
            </div>
          </div>
        </div>

        {/* Character Assessment */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #4a8844', background: 'rgba(74,136,68,0.1)' }}>
          <div style={{ color: '#4a8844', marginBottom: '8px', fontSize: '13px' }}>
            === PSYCHOLOGICAL ASSESSMENT ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>INITIAL PROFILE: </span>
              Typical popular athlete. Self-centered, status-conscious.
              Displayed bullying behavior toward social outsiders
              (Jonathan Byers incident - property destruction).
            </div>
            <div style={{ marginBottom: '6px', color: '#4a8844' }}>
              <span style={{ color: dimColor }}>REVISED ASSESSMENT: </span>
              Subject demonstrates unexpected character development.
              Turned against former friends who defaced movie theater.
              Showed remorse for previous behavior. Willing to risk
              social standing for moral action.
            </div>
            <div style={{ color: '#ffcc00' }}>
              NOTABLE: Subject exhibits surprising courage under pressure.
              Engaged hostile entity with improvised weapon (nail bat)
              despite obvious physical disadvantage.
            </div>
          </div>
        </div>

        {/* Known Associates */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === KNOWN ASSOCIATES ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>WHEELER, NANCY: </span>Girlfriend. Involved in HNL incidents.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>BYERS, JONATHAN: </span>Former rival. Now ally.</div>
            <div style={{ marginBottom: '4px', color: '#ffcc00' }}><span style={{ color: dimColor }}>HENDERSON, DUSTIN: </span>Younger associate. Unusual friendship developing.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>WHEELER, MICHAEL: </span>Nancy's brother. Party member.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SINCLAIR, LUCAS: </span>Party member.</div>
          </div>
        </div>

        {/* HNL Incident Involvement */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)' }}>
          <div style={{ color: '#ff6600', marginBottom: '8px', fontSize: '13px' }}>
            === HNL INCIDENT INVOLVEMENT ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Subject became involved in HNL-related events through
              relationship with Nancy Wheeler and Barbara Holland
              disappearance. Present during multiple entity encounters.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>COMBAT ASSESSMENT: </span>
              Subject acquired/constructed improvised weapon - baseball
              bat modified with protruding nails. Demonstrated effective
              use against Demogorgon. Showed tactical thinking under
              extreme stress.
            </div>
            <div style={{ color: '#ff3300' }}>
              ⚠ Subject has direct combat experience with extradimensional
              entities. Unusual for civilian with no military/security
              background. Natural combat instincts noted.
            </div>
          </div>
        </div>

        {/* DOE Surveillance Log */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: '#ffcc00', marginBottom: '8px', fontSize: '13px' }}>
            === DOE SURVEILLANCE LOG ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>11/08/83 - </span>Hosted party at residence. Barbara Holland last seen.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>11/09/83 - </span>Altercation with Jonathan Byers at school.</div>
            <div style={{ marginBottom: '4px', color: '#4a8844' }}><span style={{ color: dimColor }}>11/10/83 - </span>Observed returning to Byers residence. Showed remorse.</div>
            <div style={{ marginBottom: '4px', color: '#ff6600' }}><span style={{ color: dimColor }}>11/10/83 - </span>ENGAGED DEMOGORGON IN COMBAT. Used nail-studded bat.</div>
            <div style={{ color: '#ff3300' }}><span style={{ color: dimColor }}>11/10/83 - </span>Present at entity neutralization. Full exposure to HNL phenomena.</div>
          </div>
        </div>

        {/* DOE Assessment */}
        <div style={{ padding: '10px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)' }}>
          <div style={{ color: '#ff6600', marginBottom: '8px', fontSize: '13px' }}>
            === DOE ASSESSMENT (CLASSIFIED) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div style={{ marginBottom: '6px' }}>
              Subject represents unexpected asset. Unlike other civilian
              exposures, Harrington demonstrated combat capability and
              tactical value. Character arc suggests reliability.
            </div>
            <div style={{ marginBottom: '6px' }}>
              Connection to Wheeler and Byers networks provides secondary
              surveillance vector. Subject's transformation from
              self-interest to protective behavior is notable.
            </div>
            <div style={{ color: baseColor }}>
              THREAT LEVEL: LOW-MODERATE. Subject is combat-capable but
              appears motivated by protection of others rather than
              opposition to authority. May prove useful as informal
              asset. Developing "guardian" role toward younger exposed
              civilians suggests containment value.
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: dimColor, textAlign: 'center' }}>
            ASSET DESIGNATION: "THE BABYSITTER" (INFORMAL)
          </div>
        </div>
      </div>
    </div>
  );

  const renderNancy = () => (
    <div style={{ color: baseColor, fontSize: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: '1px solid #cc66aa',
        padding: '15px',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: '14px', marginBottom: '12px', color: '#cc66aa', textAlign: 'center' }}>
          ◢ HAWKINS HIGH SCHOOL - STUDENT FILE ◣
        </div>
        <div style={{ fontSize: '12px', color: dimColor, textAlign: 'center', marginBottom: '12px' }}>
          ACADEMIC RECORDS // BEHAVIORAL ASSESSMENT // DOE SURVEILLANCE ANNEX
        </div>

        {/* Photo with CRT terminal styling */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: `1px solid ${borderColor}`,
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}>
            <img
              src="/nancy.jpeg"
              alt="Nancy Wheeler"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>
          <div style={{ flex: 1, fontSize: '13px' }}>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>NAME: </span>NANCY WHEELER</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>DOB: </span>1967</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>AGE: </span>16</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>HEIGHT: </span>5'4"</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>EYES: </span>BLUE</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>HAIR: </span>BROWN</div>
            <div><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#4a8844' }}>ENROLLED - JUNIOR</span></div>
          </div>
        </div>

        {/* Family Background */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #cc66aa', background: 'rgba(204,102,170,0.1)' }}>
          <div style={{ color: '#cc66aa', marginBottom: '8px', fontSize: '13px' }}>
            === FAMILY BACKGROUND ===
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>FATHER: </span>TED WHEELER</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>MOTHER: </span>KAREN WHEELER</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SIBLINGS: </span>MIKE WHEELER (YOUNGER), HOLLY WHEELER (YOUNGER)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>RESIDENCE: </span>MAPLE STREET, HAWKINS, INDIANA</div>
            <div style={{ fontSize: '12px', color: dimColor, marginTop: '6px', borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              Upper-middle-class household. Brother MIKE WHEELER is
              directly involved in HNL incidents (see file #HMS-MW-1971).
              Parents appear unaware of children's activities. Stable
              family environment but limited parental oversight.
            </div>
          </div>
        </div>

        {/* Academic Record */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === ACADEMIC RECORD ===
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SCHOOL: </span>HAWKINS HIGH SCHOOL</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>YEAR: </span>JUNIOR (11TH GRADE)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>GPA: </span>3.9</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>ACTIVITIES: </span>SCHOOL NEWSPAPER</div>
            <div style={{ marginBottom: '8px' }}><span style={{ color: dimColor }}>STANDING: </span>EXCELLENT</div>
            <div style={{ fontSize: '12px', color: dimColor, borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              ACADEMIC NOTES:<br/>
              - High achiever, college-bound<br/>
              - Strong writing and research skills<br/>
              - Journalism/investigative interests<br/>
              COUNSELOR NOTE: "Nancy is an exemplary student with clear
              academic goals. Emerson College likely for journalism."
            </div>
          </div>
        </div>

        {/* Barbara Holland Connection */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #ff3300', background: 'rgba(255,51,0,0.1)' }}>
          <div style={{ color: '#ff3300', marginBottom: '8px', fontSize: '13px' }}>
            === BARBARA HOLLAND CONNECTION (CRITICAL) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Subject was best friend of BARBARA HOLLAND (deceased - see
              file #HHS-BH-1967). Holland disappeared 11/08/83 during party
              at Harrington residence while subject was inside.
            </div>
            <div style={{ marginBottom: '6px', color: '#ffcc00' }}>
              Subject exhibited extreme grief response and guilt. Began
              independent investigation into Holland disappearance. This
              investigation led directly to discovery of HNL activities.
            </div>
            <div style={{ color: '#ff3300' }}>
              ⚠ WARNING: Holland's death is primary motivation for subject's
              anti-HNL activities. Subject has stated intention to "expose
              the truth" about what happened. SIGNIFICANT THREAT TO
              OPERATIONAL SECURITY.
            </div>
          </div>
        </div>

        {/* Psychological Assessment */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #cc66aa', background: 'rgba(204,102,170,0.1)' }}>
          <div style={{ color: '#cc66aa', marginBottom: '8px', fontSize: '13px' }}>
            === PSYCHOLOGICAL ASSESSMENT ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>PRE-INCIDENT: </span>
              Typical high-achieving student. Social but studious.
              Relationship with Steve Harrington suggested desire
              for social advancement while maintaining academic focus.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>POST-INCIDENT: </span>
              Dramatic personality shift. Subject exhibits determination,
              resilience, and willingness to take extreme risks. Survivor's
              guilt regarding Holland drives aggressive investigative
              behavior.
            </div>
            <div style={{ color: '#ffcc00' }}>
              NOTABLE: Subject demonstrates unusual courage and competence
              in combat situations. Has acquired and used firearms against
              extradimensional entities. Tactical thinking exceeds typical
              civilian profile.
            </div>
          </div>
        </div>

        {/* Known Associates */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === KNOWN ASSOCIATES ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>HARRINGTON, STEVE: </span>Boyfriend (relationship strained).</div>
            <div style={{ marginBottom: '4px', color: '#ffcc00' }}><span style={{ color: dimColor }}>BYERS, JONATHAN: </span>Close ally. Collaborated on HNL investigation.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>WHEELER, MIKE: </span>Brother. Party member. Direct HNL exposure.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>BYERS, JOYCE: </span>Ally. Mother of Jonathan.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>HOPPER, JAMES: </span>Law enforcement contact.</div>
            <div style={{ marginBottom: '4px', color: '#ff3300' }}><span style={{ color: dimColor }}>HOLLAND, BARBARA: </span>Best friend. DECEASED - Demogorgon victim.</div>
          </div>
        </div>

        {/* HNL Investigation */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)' }}>
          <div style={{ color: '#ff6600', marginBottom: '8px', fontSize: '13px' }}>
            === HNL INVESTIGATION ACTIVITY ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Subject initiated independent investigation following Holland
              disappearance. Collaborated with Jonathan Byers to research
              HNL activities and document evidence.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>METHODS: </span>
              Photography, interviews, document research, physical
              surveillance of HNL facility perimeter. Subject acquired
              firearm and demonstrated proficiency.
            </div>
            <div style={{ color: '#ff3300' }}>
              ⚠ Subject has expressed intention to expose HNL to media.
              Journalistic aspirations make her particularly dangerous
              to containment efforts. Has contacts at The Hawkins Post.
            </div>
          </div>
        </div>

        {/* Combat Profile */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #4a8844', background: 'rgba(74,136,68,0.1)' }}>
          <div style={{ color: '#4a8844', marginBottom: '8px', fontSize: '13px' }}>
            === COMBAT PROFILE ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Despite civilian background, subject has demonstrated
              significant combat capability:
            </div>
            <div style={{ marginBottom: '4px' }}>• Firearms proficiency (handgun, shotgun)</div>
            <div style={{ marginBottom: '4px' }}>• Participated in Byers house trap (11/10/83)</div>
            <div style={{ marginBottom: '4px' }}>• Direct engagement with Demogorgon</div>
            <div style={{ marginBottom: '4px' }}>• Cool under extreme pressure</div>
            <div style={{ color: '#ffcc00', marginTop: '6px' }}>
              Assessment: Subject is most combat-effective female civilian
              in exposed population. Natural tactical instincts combined
              with determination make her formidable.
            </div>
          </div>
        </div>

        {/* DOE Surveillance Log */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: '#ffcc00', marginBottom: '8px', fontSize: '13px' }}>
            === DOE SURVEILLANCE LOG ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>11/08/83 - </span>Present at Harrington party. Holland disappeared.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>11/09/83 - </span>Began investigating Holland disappearance.</div>
            <div style={{ marginBottom: '4px', color: '#ff6600' }}><span style={{ color: dimColor }}>11/09/83 - </span>Acquired firearm. Photographed HNL perimeter.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>11/10/83 - </span>Collaborated with Byers on entity trap.</div>
            <div style={{ marginBottom: '4px', color: '#ff6600' }}><span style={{ color: dimColor }}>11/10/83 - </span>ENGAGED DEMOGORGON WITH FIREARM.</div>
            <div style={{ color: '#ff3300' }}><span style={{ color: dimColor }}>11/10/83 - </span>Full exposure to HNL phenomena. Witnessed entity neutralization.</div>
          </div>
        </div>

        {/* DOE Assessment */}
        <div style={{ padding: '10px', border: '1px solid #ff3300', background: 'rgba(255,51,0,0.1)' }}>
          <div style={{ color: '#ff3300', marginBottom: '8px', fontSize: '13px' }}>
            === DOE ASSESSMENT (CLASSIFIED) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div style={{ marginBottom: '6px' }}>
              Subject represents HIGHEST PRIORITY security threat among
              civilian exposures. Combination of factors makes containment
              extremely difficult:
            </div>
            <div style={{ marginBottom: '6px' }}>
              1) Journalistic skills and media aspirations<br/>
              2) Personal vendetta (Holland death)<br/>
              3) High intelligence and research capability<br/>
              4) Combat effectiveness<br/>
              5) Network of allies with HNL exposure
            </div>
            <div style={{ color: baseColor }}>
              THREAT LEVEL: HIGH. Subject actively seeks to expose HNL
              operations. Standard intimidation unlikely to succeed -
              has already faced extradimensional entities. Recommend
              continued surveillance and preparation of discreditation
              contingencies. DO NOT underestimate.
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: dimColor, textAlign: 'center' }}>
            ASSET DESIGNATION: "THE JOURNALIST" / THREAT PRIORITY: ALPHA
          </div>
        </div>
      </div>
    </div>
  );

  const renderEddie = () => (
    <div style={{ color: baseColor, fontSize: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: '1px solid #990000',
        padding: '15px',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: '14px', marginBottom: '12px', color: '#990000', textAlign: 'center' }}>
          ◢ HAWKINS HIGH SCHOOL - STUDENT FILE ◣
        </div>
        <div style={{ fontSize: '12px', color: dimColor, textAlign: 'center', marginBottom: '12px' }}>
          DISCIPLINARY RECORDS // BEHAVIORAL ASSESSMENT // HPD CRIMINAL FILE ANNEX
        </div>

        {/* Photo with CRT terminal styling */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: `1px solid ${borderColor}`,
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}>
            <img
              src="/eddie.jpeg"
              alt="Eddie Munson"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>
          <div style={{ flex: 1, fontSize: '13px' }}>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>NAME: </span>EDWARD "EDDIE" MUNSON</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>DOB: </span>1966</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>AGE: </span>19-20</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>HEIGHT: </span>5'11"</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>EYES: </span>BROWN</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>HAIR: </span>BROWN (LONG)</div>
            <div><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#ff6600' }}>ENROLLED - SENIOR (REPEATED)</span></div>
          </div>
        </div>

        {/* Family Background */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #990000', background: 'rgba(153,0,0,0.1)' }}>
          <div style={{ color: '#990000', marginBottom: '8px', fontSize: '13px' }}>
            === FAMILY BACKGROUND ===
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>MOTHER: </span>ELIZABETH MUNSON (DECEASED - 1972)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>FATHER: </span>ALAN MUNSON (INCARCERATED - CRIMINAL FRAUD)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>GUARDIAN: </span>WAYNE MUNSON (PATERNAL UNCLE)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>RESIDENCE: </span>FOREST HILLS TRAILER PARK, HAWKINS</div>
            <div style={{ fontSize: '12px', color: dimColor, marginTop: '6px', borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              Troubled family background. Mother deceased when subject was 6.
              Father incarcerated for criminal schemes. Raised by uncle Wayne,
              a factory worker. Low income household. Uncle has no criminal
              record and appears to provide stable environment despite
              limited resources.
            </div>
          </div>
        </div>

        {/* Academic Record */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === ACADEMIC RECORD ===
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SCHOOL: </span>HAWKINS HIGH SCHOOL</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>YEAR: </span>SENIOR (12TH GRADE) - <span style={{ color: '#ff6600' }}>REPEATED MULTIPLE TIMES</span></div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>GPA: </span>1.8</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>CLUBS: </span>HELLFIRE CLUB (FOUNDER/PRESIDENT)</div>
            <div style={{ marginBottom: '8px' }}><span style={{ color: dimColor }}>STANDING: </span>ACADEMIC PROBATION</div>
            <div style={{ fontSize: '12px', color: dimColor, borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              ACADEMIC NOTES:<br/>
              - Multiple grade repeats (should have graduated 1984)<br/>
              - Chronic truancy and tardiness<br/>
              - No disciplinary issues beyond attendance<br/>
              COUNSELOR NOTE: "Eddie is intelligent but unmotivated by
              traditional academics. Shows leadership in extracurricular
              activities. Needs direction."
            </div>
          </div>
        </div>

        {/* Hellfire Club */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #990000', background: 'rgba(153,0,0,0.1)' }}>
          <div style={{ color: '#990000', marginBottom: '8px', fontSize: '13px' }}>
            === HELLFIRE CLUB (FLAGGED) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Subject founded and leads "Hellfire Club" - a Dungeons & Dragons
              gaming society at Hawkins High School. Club has drawn concern
              from parent groups due to perceived "Satanic" themes.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>ROLE: </span>
              "DUNGEON MASTER" - Creates and manages fantasy campaigns.
              Demonstrates strong narrative and leadership abilities.
              Club provides social outlet for marginalized students.
            </div>
            <div style={{ color: '#ffcc00' }}>
              ASSESSMENT: Despite parental concerns, club appears to be
              standard recreational activity. No evidence of actual
              occult practices. "Satanic Panic" concerns likely unfounded.
              However, public perception creates vulnerability.
            </div>
          </div>
        </div>

        {/* Musical Activities */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === MUSICAL ACTIVITIES ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>BAND: </span>CORRODED COFFIN (FOUNDER/GUITARIST)
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>INSTRUMENT: </span>ELECTRIC GUITAR
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>GENRE: </span>HEAVY METAL
            </div>
            <div style={{ color: '#ffcc00' }}>
              Subject demonstrates significant musical talent. Band
              performs locally. Guitar noted as prized possession -
              BC Rich Warlock model. Music provides positive outlet
              but contributes to "outsider" social status.
            </div>
          </div>
        </div>

        {/* Psychological Assessment */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #4a8844', background: 'rgba(74,136,68,0.1)' }}>
          <div style={{ color: '#4a8844', marginBottom: '8px', fontSize: '13px' }}>
            === PSYCHOLOGICAL ASSESSMENT ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Subject presents as outspoken nonconformist with theatrical
              personality. Deliberately cultivates "freak" image as defense
              mechanism against social rejection. Beneath exterior shows
              genuine warmth and loyalty to friends.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>NOTABLE TRAITS: </span>
              High creativity, natural leadership, strong moral compass
              despite rebellious presentation. Protective of younger and
              marginalized students. Advocates for outsiders.
            </div>
            <div style={{ color: '#ffcc00' }}>
              Assessment: Subject's anti-conformist stance is performative
              rather than genuinely antisocial. Despite appearance and
              reputation, demonstrates prosocial values and genuine empathy.
            </div>
          </div>
        </div>

        {/* Known Associates */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === KNOWN ASSOCIATES ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px', color: '#ffcc00' }}><span style={{ color: dimColor }}>HENDERSON, DUSTIN: </span>Hellfire Club member. Close friendship.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>WHEELER, MICHAEL: </span>Hellfire Club member.</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SINCLAIR, LUCAS: </span>Hellfire Club member (occasional).</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>CORRODED COFFIN: </span>Band members (names in separate file).</div>
            <div style={{ marginBottom: '4px', color: '#990000' }}><span style={{ color: dimColor }}>CARVER, JASON: </span>Basketball captain. HOSTILE relationship.</div>
          </div>
        </div>

        {/* HPD Criminal File */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)' }}>
          <div style={{ color: '#ff6600', marginBottom: '8px', fontSize: '13px' }}>
            === HPD CRIMINAL FILE ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>PRIOR OFFENSES: </span>
              Minor drug possession (marijuana) - charges dropped.
              No violent offenses on record.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>KNOWN ACTIVITIES: </span>
              Suspected small-scale marijuana distribution to peers.
              No evidence of harder substances. Not considered
              significant threat.
            </div>
            <div style={{ color: '#ffcc00' }}>
              NOTE: Subject maintains low-level illegal activity but
              has no history of violence. Criminal profile: MINOR.
            </div>
          </div>
        </div>

        {/* Social Vulnerability Assessment */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #ff3300', background: 'rgba(255,51,0,0.1)' }}>
          <div style={{ color: '#ff3300', marginBottom: '8px', fontSize: '13px' }}>
            === SOCIAL VULNERABILITY ASSESSMENT ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Subject occupies lowest tier of social hierarchy. "Freak"
              designation by mainstream students. Combined with Hellfire
              Club leadership and metal music association, subject is
              highly vulnerable to scapegoating.
            </div>
            <div style={{ marginBottom: '6px', color: '#ffcc00' }}>
              SATANIC PANIC EXPOSURE: Current cultural climate makes
              subject ideal target for unfounded accusations. D&D and
              heavy metal interests align with media-driven moral panic.
            </div>
            <div style={{ color: '#ff3300' }}>
              ⚠ WARNING: In event of unexplained incidents in Hawkins,
              subject's profile makes him likely scapegoat. Low social
              standing, fringe interests, and existing suspicion create
              perfect conditions for mob mentality response.
            </div>
          </div>
        </div>

        {/* DOE Assessment */}
        <div style={{ padding: '10px', border: '1px solid #990000', background: 'rgba(153,0,0,0.1)' }}>
          <div style={{ color: '#990000', marginBottom: '8px', fontSize: '13px' }}>
            === DOE ASSESSMENT (CLASSIFIED) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div style={{ marginBottom: '6px' }}>
              Subject has NO direct connection to HNL operations. However,
              association with Henderson and Wheeler creates secondary
              exposure risk. Hellfire Club membership overlaps with
              known HNL-exposed individuals.
            </div>
            <div style={{ marginBottom: '6px' }}>
              Subject's social vulnerability and existing "outsider" status
              could prove useful for deflection purposes. In event of
              public incident requiring explanation, subject's profile
              provides plausible alternative narrative.
            </div>
            <div style={{ color: baseColor }}>
              THREAT LEVEL: MINIMAL. Subject poses no direct threat to
              operations. However, monitor for increased contact with
              exposed population. Social profile makes him potential
              ASSET for cover operations - expendable public scapegoat
              if required.
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: dimColor, textAlign: 'center' }}>
            CLASSIFICATION: PERIPHERAL / POTENTIAL COVER ASSET
          </div>
        </div>
      </div>
    </div>
  );

  const renderHenry = () => (
    <div style={{ color: baseColor, fontSize: isMobile ? '11px' : '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: '2px solid #660066',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(0,0,0,0.3)',
        position: 'relative',
      }}>
        {/* Ultra classified header */}
        <div style={{
          fontSize: isMobile ? '9px' : '12px',
          marginBottom: isMobile ? '6px' : '8px',
          color: '#ff0000',
          textAlign: 'center',
          animation: 'blink 0.5s infinite',
        }}>
          ▓▓▓ OMEGA CLEARANCE ONLY // EYES ONLY // BRENNER ▓▓▓
        </div>
        {!isMobile && (
          <div style={{ fontSize: '14px', marginBottom: '12px', color: '#660066', textAlign: 'center' }}>
            ◢ HAWKINS NATIONAL LABORATORY - SUBJECT FILE ◣
          </div>
        )}
        {isMobile && (
          <div style={{ fontSize: '10px', marginBottom: '8px', color: '#660066', textAlign: 'center' }}>
            ◢ HNL - SUBJECT FILE ◣
          </div>
        )}
        <div style={{ fontSize: isMobile ? '9px' : '12px', color: dimColor, textAlign: 'center', marginBottom: isMobile ? '8px' : '12px' }}>
          {isMobile ? 'PROJECT INDIGO // FILE #001' : 'PROJECT INDIGO // ORIGINAL TEST SUBJECT // FILE #001'}
        </div>

        {/* Photo with CRT terminal styling */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: '2px solid #660066',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}>
            <img
              src="/henry.jpeg"
              alt="Henry Creel / Subject 001"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>
          <div style={{ flex: 1, fontSize: '13px' }}>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>DESIGNATION: </span><span style={{ color: '#660066' }}>001 (ONE)</span></div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>BIRTH NAME: </span>HENRY CREEL</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>DOB: </span>1947 (ESTIMATED)</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>AGE AT ACQUISITION: </span>12</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>EYES: </span>BLUE</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>HAIR: </span>BLONDE</div>
            <div><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#ff0000', animation: 'blink 0.5s infinite' }}>██████████ [SEE ADDENDUM]</span></div>
          </div>
        </div>

        {/* Origin */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #660066', background: 'rgba(102,0,102,0.1)' }}>
          <div style={{ color: '#660066', marginBottom: '8px', fontSize: '13px' }}>
            === ORIGIN (PRE-ACQUISITION) ===
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>BIRTHPLACE: </span>RACHEL, NEVADA</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>FATHER: </span>VICTOR CREEL (INCARCERATED - PENNHURST)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>MOTHER: </span>VIRGINIA CREEL (DECEASED - 1959)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SIBLING: </span>ALICE CREEL (DECEASED - 1959)</div>
            <div style={{ fontSize: '12px', color: dimColor, marginTop: '6px', borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              Family relocated to Hawkins, Indiana in 1959. Parents hoped
              new environment would help subject's "troubled behavior."
              Shortly after arrival, subject began manifesting psychokinetic
              abilities. Family deaths occurred within months of relocation.
            </div>
          </div>
        </div>

        {/* Creel House Incident */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #ff3300', background: 'rgba(255,51,0,0.1)' }}>
          <div style={{ color: '#ff3300', marginBottom: '8px', fontSize: '13px' }}>
            === CREEL HOUSE INCIDENT (1959) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Subject used emerging psychokinetic abilities to systematically
              torment family members. Induced hallucinations, psychological
              torture over period of weeks.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>VIRGINIA CREEL: </span>
              Killed via telekinetic assault. Eyes destroyed. Official
              cause listed as "unknown."
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>ALICE CREEL: </span>
              Killed via telekinetic assault. Eyes destroyed. Official
              cause listed as "unknown."
            </div>
            <div style={{ color: '#ff3300' }}>
              <span style={{ color: dimColor }}>VICTOR CREEL: </span>
              Survived. Wrongly convicted of murders. Currently held at
              Pennhurst State Hospital. Subject allowed father to take
              blame - demonstrated early signs of manipulation capability.
            </div>
          </div>
        </div>

        {/* Abilities Assessment */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #ffcc00', background: 'rgba(255,204,0,0.1)' }}>
          <div style={{ color: '#ffcc00', marginBottom: '8px', fontSize: '13px' }}>
            === ABILITIES ASSESSMENT (ORIGINAL) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: '#660066' }}>PRIMARY: </span>PSYCHOKINESIS
              <br/>Ability to manipulate matter at molecular level. Strength
              exceeds all subsequent subjects. Capable of lethal force at
              distance.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: '#660066' }}>SECONDARY: </span>TELEPATHIC MANIPULATION
              <br/>Can access minds, induce hallucinations, extract memories,
              and inflict psychological trauma. Victims describe
              "waking nightmares."
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: '#660066' }}>TERTIARY: </span>BIOLOGICAL DISRUPTION
              <br/>Capable of destroying organic tissue from within. Signature
              method: ocular/cranial destruction.
            </div>
            <div style={{ color: '#ff3300' }}>
              ⚠ DANGER LEVEL: EXTREME. Subject's abilities represent most
              powerful manifestation of psychokinetic phenomena ever
              documented. ALL subsequent subjects derived from his genetic
              template.
            </div>
          </div>
        </div>

        {/* Laboratory History */}
        <div style={{ marginBottom: '12px', padding: '10px', border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            === LABORATORY HISTORY (1959-1979) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>ACQUISITION: </span>1959 - POST-CREEL INCIDENT</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>HANDLER: </span>DR. MARTIN BRENNER</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>DESIGNATION: </span>001 - FIRST TEST SUBJECT</div>
            <div style={{ marginBottom: '8px' }}><span style={{ color: dimColor }}>CONTAINMENT: </span>SOTERIA IMPLANT (NECK)</div>
            <div style={{ fontSize: '12px', color: dimColor, borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              Dr. Brenner recognized subject's abilities as foundation for
              Project Indigo. Implanted Soteria device to suppress powers.
              Subject served as genetic template for subsequent test
              subjects (002-018). Worked as orderly within facility to
              maintain cover - used position to observe other subjects.
            </div>
          </div>
        </div>

        {/* Soteria Device */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #660066', background: 'rgba(102,0,102,0.1)' }}>
          <div style={{ color: '#660066', marginBottom: '8px', fontSize: '13px' }}>
            === SOTERIA CONTAINMENT DEVICE ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>TYPE: </span>
              Subcutaneous implant, cervical location
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>FUNCTION: </span>
              Neural inhibitor - suppresses psychokinetic manifestation.
              Subject retains awareness of abilities but cannot activate.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>REMOVAL PROTOCOL: </span>
              Requires Level 5 clearance. Only removable via external
              telekinetic force or surgical intervention.
            </div>
            <div style={{ color: '#ff3300' }}>
              ⚠ WARNING: Under NO circumstances should Soteria device be
              removed. Subject has expressed desire to "liberate" himself.
              Device is only reliable containment method.
            </div>
          </div>
        </div>

        {/* Psychological Profile */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)' }}>
          <div style={{ color: '#ff6600', marginBottom: '8px', fontSize: '13px' }}>
            === PSYCHOLOGICAL PROFILE ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>DIAGNOSIS: </span>
              Antisocial personality disorder. Narcissistic traits.
              Complete absence of empathy. God complex.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>PHILOSOPHY: </span>
              Subject views humanity as "a plague" requiring elimination.
              Believes himself superior being destined to reshape reality.
              Expresses contempt for "order" and societal structures.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>MANIPULATION: </span>
              Highly intelligent. Capable of long-term strategic planning.
              Can present charming facade when advantageous. Has shown
              interest in younger subjects - potential grooming behavior.
            </div>
            <div style={{ color: '#ff3300' }}>
              BRENNER NOTE: "Henry is patient. He will wait decades for
              an opportunity. Never underestimate his capacity for
              deception."
            </div>
          </div>
        </div>

        {/* The Massacre - 1979 */}
        <div style={{ marginBottom: '12px', padding: '10px', border: '2px solid #ff0000', background: 'rgba(255,0,0,0.15)' }}>
          <div style={{ color: '#ff0000', marginBottom: '8px', fontSize: '13px', animation: 'blink 1s infinite' }}>
            === INCIDENT REPORT: THE MASSACRE (09/08/1979) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              Subject manipulated SUBJECT 011 (age 8) into removing Soteria
              implant using her telekinetic abilities. Subject had cultivated
              relationship with 011 over months - positioned himself as ally.
            </div>
            <div style={{ marginBottom: '6px', color: '#ff3300' }}>
              <span style={{ color: dimColor }}>CASUALTIES: </span>
              17 test subjects (002-018) killed. Multiple staff fatalities.
              Method: Telekinetic destruction - eyes and skulls crushed.
              Bodies arranged in Rainbow Room.
            </div>
            <div style={{ marginBottom: '6px', color: baseColor }}>
              <span style={{ color: dimColor }}>CONFRONTATION: </span>
              Subject attempted to recruit 011 to his ideology. When she
              refused and resisted, she demonstrated previously unseen
              power levels. 011 overpowered 001.
            </div>
            <div style={{ color: '#ff3300' }}>
              RESULT: 011's psychic assault created dimensional breach.
              Subject 001 was expelled through breach into alternate
              dimension. Current status: UNKNOWN.
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div style={{ padding: '10px', border: '2px solid #ff0000', background: 'rgba(255,0,0,0.15)' }}>
          <div style={{ color: '#ff0000', marginBottom: '8px', fontSize: '13px', animation: 'blink 0.5s infinite' }}>
            === CURRENT STATUS (CLASSIFIED - BRENNER EYES ONLY) ===
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div style={{ marginBottom: '6px' }}>
              Subject 001 was not destroyed. Remote viewing by 011 has
              detected presence in alternate dimension. Subject appears
              to have undergone significant physical transformation.
            </div>
            <div style={{ marginBottom: '6px' }}>
              Subject may have merged with or been altered by extradimensional
              environment. New designation proposed: VECNA. Biological
              status uncertain. Psychological profile: unchanged.
            </div>
            <div style={{ color: baseColor }}>
              THREAT ASSESSMENT: CATASTROPHIC. If subject 001 finds method
              to return to our dimension, casualties would be immeasurable.
              Subject's hatred for humanity combined with enhanced abilities
              represents extinction-level threat. GATE MUST REMAIN CLOSED.
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: dimColor, textAlign: 'center' }}>
            "HE IS PATIENT. HE WILL WAIT. AND WHEN HE RETURNS, GOD HELP US ALL." - DR. BRENNER
          </div>
        </div>
      </div>
    </div>
  );

  const renderMax = () => (
    <div style={{ color: baseColor, fontSize: isMobile ? '11px' : '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: `2px solid #ff6633`,
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(255,102,51,0.08)',
      }}>
        {!isMobile && (
          <div style={{
            fontSize: '16px',
            marginBottom: '15px',
            color: '#ff6633',
            textAlign: 'center',
            textShadow: '0 0 10px rgba(255,102,51,0.5)',
            letterSpacing: '2px',
          }}>
            ╔══════════════════════════════════════════╗<br/>
            ║ &nbsp;&nbsp;DOE SURVEILLANCE FILE: MAXINE MAYFIELD&nbsp;&nbsp; ║<br/>
            ║ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CLASSIFICATION: MONITORED&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ║<br/>
            ╚══════════════════════════════════════════╝
          </div>
        )}
        {isMobile && (
          <div style={{ color: '#ff6633', fontSize: '11px', textAlign: 'center', marginBottom: '8px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '6px' }}>
            ◢ DOE FILE: MAXINE MAYFIELD ◣<br/>
            <span style={{ color: dimColor }}>STATUS: MONITORED</span>
          </div>
        )}

        <div style={{ fontSize: isMobile ? '9px' : '12px', color: dimColor, textAlign: 'center', marginBottom: isMobile ? '8px' : '12px' }}>
          {isMobile ? 'PRIORITY: ELEVATED' : 'FILE UPDATED: 22-NOV-83 | STATUS: ACTIVE SURVEILLANCE | PRIORITY: ELEVATED'}
        </div>

        <div style={{ display: 'flex', gap: isMobile ? '10px' : '15px', marginBottom: isMobile ? '10px' : '15px' }}>
          {/* Photo placeholder */}
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: `1px solid #ff6633`,
            background: '#1a0d05',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src="/max.jpeg"
              alt="Max Mayfield"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            {/* Scanline overlay */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>

          <div style={{ flex: 1, fontSize: isMobile ? '10px' : '13px' }}>
            <div style={{ marginBottom: isMobile ? '4px' : '8px' }}>
              <span style={{ color: dimColor }}>NAME:</span>{' '}
              <span style={{ color: '#ff6633' }}>{isMobile ? 'MAX MAYFIELD' : 'MAXINE "MAX" MAYFIELD'}</span>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>DOB:</span> 1971 | AGE: 12
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>RESIDENCE:</span> {isMobile ? 'HAWKINS, IN' : '4819 CHERRY LN, HAWKINS IN'}
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>ALIAS:</span> <span style={{ color: '#ff6633' }}>"MADMAX"</span>
            </div>
            <div style={{ fontSize: isMobile ? '9px' : '12px', color: dimColor, marginTop: '6px', borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              THREAT: <span style={{ color: '#ff6633' }}>ELEVATED</span> | VECNA TARGET
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#ff6633', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ FAMILY
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div>• MOTHER: SUSAN MAYFIELD</div>
            <div>• STEPFATHER: NEIL HARGROVE</div>
            <div>• STEPBROTHER: <span style={{ color: '#ff3300' }}>BILLY HARGROVE - DECEASED</span></div>
            <div style={{ marginTop: '6px', color: '#ff6600', padding: isMobile ? '4px' : '6px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)', fontSize: isMobile ? '8px' : '12px' }}>
              Billy killed at Starcourt. Max witnessed. Severe trauma.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: baseColor, marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ PROFILE
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div>• ATHLETIC: Skateboarding, arcade gaming</div>
            <div>• ACADEMICS: Above average</div>
            <div>• TEMPERAMENT: Independent, protective</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#ffcc00', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ ASSOCIATES
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.5' }}>
            <div>• <span style={{ color: '#ffcc00' }}>LUCAS SINCLAIR</span> - Romantic</div>
            <div>• THE PARTY - Core member</div>
            <div>• SUBJECT 011 - Ally</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#ff3300', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ INCIDENTS
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div>• <span style={{ color: '#ff6600' }}>NOV-84</span> - First demodog contact</div>
            <div>• <span style={{ color: '#ff3300' }}>JUL-85</span> - Starcourt, brother's death</div>
            <div>• <span style={{ color: '#ff0000', animation: 'blink 1s infinite' }}>MAR-86</span> - Vecna targeting</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#ff0000', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px', animation: 'blink 1.5s infinite' }}>
            ■ VECNA INCIDENT
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6', color: '#ff6633', padding: isMobile ? '6px' : '8px', border: '1px solid #ff0000', background: 'rgba(255,0,0,0.1)' }}>
            <div>PRIMARY TARGET: Survivor's guilt exploited</div>
            <div style={{ marginTop: '6px' }}>COUNTERMEASURE:</div>
            <div>• "Running Up That Hill" - Kate Bush</div>
            <div>• Music disrupts Vecna's psychic hold</div>
            <div style={{ marginTop: '6px', color: '#ff0000' }}>
              STATUS: COMATOSE. PROGNOSIS: UNKNOWN.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#ff6633', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ SURVEILLANCE LOG
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div>OCT-84 | Relocated from CA. Observation begun.</div>
            <div>NOV-84 | Party integration. Entity exposure.</div>
            <div>JUL-85 | Starcourt. Brother sacrifice witnessed.</div>
            <div style={{ color: '#ff0000' }}>MAR-86 | Vecna contact. Comatose.</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#ff0000', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ ASSESSMENT
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div style={{ color: baseColor }}>
              Trauma response patterns. Guilt exploited by Vecna. Deep capacity for loyalty despite tough exterior.
            </div>
            <div style={{ marginTop: isMobile ? '6px' : '8px', color: '#ff6633', fontSize: isMobile ? '8px' : '12px' }}>
              "She ran toward danger, not away. That's strength."
              <span style={{ color: dimColor }}> - Field Assessment</span>
            </div>
          </div>
          <div style={{ marginTop: isMobile ? '6px' : '8px', fontSize: isMobile ? '9px' : '14px', color: dimColor, textAlign: 'center' }}>
            "MADMAX" | STATUS: COMATOSE / VECNA CASUALTY
          </div>
        </div>
      </div>
    </div>
  );

  const renderMurray = () => (
    <div style={{ color: baseColor, fontSize: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: `2px solid #cc9900`,
        padding: '15px',
        background: 'rgba(204,153,0,0.08)',
      }}>
        <div style={{
          fontSize: '16px',
          marginBottom: '15px',
          color: '#cc9900',
          textAlign: 'center',
          textShadow: '0 0 10px rgba(204,153,0,0.5)',
          letterSpacing: '2px',
        }}>
          ╔══════════════════════════════════════════╗<br/>
          ║ &nbsp;&nbsp;&nbsp;DOE SURVEILLANCE FILE: MURRAY BAUMAN&nbsp;&nbsp;&nbsp; ║<br/>
          ║ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CLASSIFICATION: HIGH PRIORITY&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ║<br/>
          ╚══════════════════════════════════════════╝
        </div>

        <div style={{ fontSize: '12px', color: dimColor, textAlign: 'center', marginBottom: '12px' }}>
          FILE UPDATED: 15-DEC-83 | STATUS: ACTIVE THREAT | PRIORITY: MAXIMUM
        </div>

        <div style={{ display: 'flex', gap: isMobile ? '10px' : '15px', marginBottom: isMobile ? '10px' : '15px' }}>
          {/* Photo placeholder */}
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: `1px solid #cc9900`,
            background: '#1a1505',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src="/murray.jpeg"
              alt="Murray Bauman"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            {/* Scanline overlay */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>

          <div style={{ flex: 1, fontSize: '13px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: dimColor }}>SUBJECT NAME:</span>{' '}
              <span style={{ color: '#cc9900' }}>MURRAY BAUMAN</span>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>DOB:</span> 1946 | AGE: 37
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>RESIDENCE:</span> RURAL PROPERTY, SESSER, ILLINOIS
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>OCCUPATION:</span> PRIVATE INVESTIGATOR (FORMER JOURNALIST)
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>FORMER EMPLOYER:</span> CHICAGO SUN-TIMES
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>LANGUAGES:</span> ENGLISH, <span style={{ color: '#ff3300' }}>RUSSIAN (FLUENT)</span>
            </div>
            <div style={{ fontSize: '12px', color: dimColor, marginTop: '6px', borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              THREAT LEVEL: <span style={{ color: '#ff3300' }}>MAXIMUM</span> | ACTIVE EXPOSURE RISK
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px' }}>
          <div style={{ color: '#ff3300', marginBottom: '8px', fontSize: '13px' }}>
            ■ THREAT ASSESSMENT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ff6600', padding: '8px', border: '1px solid #ff3300', background: 'rgba(255,51,0,0.1)' }}>
            SUBJECT BAUMAN REPRESENTS HIGHEST-PRIORITY EXPOSURE THREAT TO DOE OPERATIONS.
            FORMER INVESTIGATIVE JOURNALIST WITH DOCUMENTED HISTORY OF PURSUING CLASSIFIED
            GOVERNMENT PROGRAMS. POSSESSES TECHNICAL RESOURCES, INTELLIGENCE CONTACTS,
            AND SUFFICIENT PARANOIA TO EVADE STANDARD SURVEILLANCE PROTOCOLS.
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#cc9900', marginBottom: '8px', fontSize: '13px' }}>
            ■ PROFESSIONAL HISTORY
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>• CHICAGO SUN-TIMES (1972-1981) - INVESTIGATIVE REPORTER</div>
            <div>• SPECIALTY: GOVERNMENT CORRUPTION, INTELLIGENCE COMMUNITY</div>
            <div>• TERMINATION: "ERRATIC BEHAVIOR" - ACTUALLY PURSUING HNL LEADS</div>
            <div>• CURRENT: PRIVATE INVESTIGATOR - MAINTAINS EXTENSIVE CONTACT NETWORK</div>
            <div style={{ marginTop: '6px', color: '#ffcc00' }}>
              NOTE: Subject's "paranoid" reputation was cultivated by DOE disinformation
              campaign. His core theories regarding HNL are substantially accurate.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            ■ RESIDENCE / SECURITY ASSESSMENT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>• FORTIFIED BUNKER-STYLE RESIDENCE</div>
            <div>• MULTIPLE DEADBOLT LOCKS, REINFORCED DOORS</div>
            <div>• PERIMETER ALARM SYSTEMS</div>
            <div>• SURVEILLANCE DETECTION ROUTES PRACTICED</div>
            <div>• EXTENSIVE DOCUMENT STORAGE - HARD COPIES PREFERRED</div>
            <div>• HAM RADIO EQUIPMENT, SCANNER ARRAYS</div>
            <div style={{ color: '#ff6600', marginTop: '6px' }}>
              ASSESSMENT: Penetration of subject's residence would require significant
              resources. Subject practices counter-surveillance daily.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ffcc00', marginBottom: '8px', fontSize: '13px' }}>
            ■ KNOWN CONTACTS
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            <div>• <span style={{ color: '#ff3300' }}>NANCY WHEELER</span> - COLLABORATED ON HNL EXPOSURE</div>
            <div>• <span style={{ color: '#ff3300' }}>JONATHAN BYERS</span> - COLLABORATED ON HNL EXPOSURE</div>
            <div>• JOYCE BYERS - ASSISTED IN HOPPER RESCUE OPERATION</div>
            <div>• JIM HOPPER - ALLIED FOLLOWING RUSSIAN FACILITY INFILTRATION</div>
            <div>• DMITRI "ENZO" ANTONOV - RUSSIAN DEFECTOR CONTACT</div>
            <div style={{ fontSize: '12px', color: dimColor, borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              BAUMAN SERVED AS CRITICAL ASSET IN KAMCHATKA EXTRACTION. HIS RUSSIAN
              LANGUAGE SKILLS AND TACTICAL PARANOIA PROVED OPERATIONALLY ESSENTIAL.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ff6600', marginBottom: '8px', fontSize: '13px' }}>
            ■ INCIDENT INVOLVEMENT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>• <span style={{ color: '#ff3300' }}>BARBARA HOLLAND INVESTIGATION (1983)</span> - HIRED BY HOLLANDS</div>
            <div>• HNL TAPE LEAK TO PRESS - FACILITATED BY WHEELER/BYERS</div>
            <div>• "CHEMICAL LEAK" COVER STORY DEPLOYMENT - COLLABORATED</div>
            <div>• <span style={{ color: '#ff3300' }}>STARCOURT/RUSSIAN OPERATION (1985)</span> - KEY INTELLIGENCE ASSET</div>
            <div>• <span style={{ color: '#ff6600' }}>KAMCHATKA INFILTRATION (1986)</span> - EXTRACTION TEAM MEMBER</div>
            <div>• FLAMETHROWER DEPLOYMENT - DEMOGORGON ELIMINATION (CONFIRMED)</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#cc9900', marginBottom: '8px', fontSize: '13px' }}>
            ■ PSYCHOLOGICAL PROFILE
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>• PERSONALITY TYPE: PARANOID (JUSTIFIED), SARDONIC, PERCEPTIVE</div>
            <div>• DEFENSE MECHANISM: AGGRESSIVE SKEPTICISM, VERBAL DEFLECTION</div>
            <div>• SOCIAL SKILLS: ABRASIVE BUT EFFECTIVE - SURPRISINGLY EMPATHETIC</div>
            <div>• RELATIONSHIP INSIGHT: UNCANNY ABILITY TO READ INTERPERSONAL DYNAMICS</div>
            <div style={{ marginTop: '6px', color: '#ffcc00' }}>
              "He sees what others refuse to see. That's why they call him crazy.
              That's why he's usually right." - Assessment Note
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#cc9900', marginBottom: '8px', fontSize: '13px' }}>
            ■ DOE SURVEILLANCE LOG
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div>15-NOV-83 | Hired by Holland family. Investigation opened immediately.</div>
            <div>28-NOV-83 | Contact with Wheeler/Byers. Provided recording equipment.</div>
            <div>02-DEC-83 | CRITICAL: HNL exposure tape created. Media contacts activated.</div>
            <div>04-DEC-83 | Cover story negotiated. "Chemical leak" narrative accepted.</div>
            <div>04-JUL-85 | Infiltrated Russian operation beneath Starcourt Mall.</div>
            <div>12-FEB-86 | Departed for Russia with Byers. EXTRACTION MISSION.</div>
            <div>22-MAR-86 | Returned with Hopper. Demogorgon kills confirmed (flamethrower).</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ff0000', marginBottom: '8px', fontSize: '13px' }}>
            ■ CONTAINMENT RECOMMENDATION
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ color: '#ff6600', padding: '8px', border: '1px solid #ff3300', background: 'rgba(255,51,0,0.1)' }}>
              STANDARD CONTAINMENT NOT RECOMMENDED. Subject's death or disappearance
              would trigger pre-arranged dead man's switch - documents distributed to
              multiple media outlets and foreign intelligence services. CURRENT STRATEGY:
              Maintain cover story integrity. Monitor but do not engage. Subject has
              demonstrated willingness to cooperate when mutual interests align.
            </div>
            <div style={{ marginTop: '8px', color: baseColor }}>
              "The truth has a funny way of coming out, and when it does, you better be
              standing on the right side of it." - Bauman, recorded 1983
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: dimColor, textAlign: 'center' }}>
            DESIGNATION: "THE CONSPIRACY NUT" | ASSESSMENT: TOO DANGEROUS TO SILENCE
          </div>
        </div>
      </div>
    </div>
  );

  const renderBilly = () => (
    <div style={{ color: baseColor, fontSize: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: `2px solid #cc0000`,
        padding: '15px',
        background: 'rgba(204,0,0,0.08)',
      }}>
        <div style={{
          fontSize: '16px',
          marginBottom: '15px',
          color: '#cc0000',
          textAlign: 'center',
          textShadow: '0 0 10px rgba(204,0,0,0.5)',
          letterSpacing: '2px',
        }}>
          ╔══════════════════════════════════════════╗<br/>
          ║ &nbsp;&nbsp;DOE SURVEILLANCE FILE: WILLIAM HARGROVE&nbsp; ║<br/>
          ║ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CLASSIFICATION: COMPROMISED&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ║<br/>
          ╚══════════════════════════════════════════╝
        </div>

        <div style={{ fontSize: '12px', color: '#ff3300', textAlign: 'center', marginBottom: '12px', animation: 'blink 2s infinite' }}>
          FILE CLOSED: 04-JUL-85 | STATUS: DECEASED | MIND FLAYER HOST - TERMINATED
        </div>

        <div style={{ display: 'flex', gap: isMobile ? '10px' : '15px', marginBottom: isMobile ? '10px' : '15px' }}>
          {/* Photo placeholder */}
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: `1px solid #cc0000`,
            background: '#1a0505',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src="/billy.jpeg"
              alt="Billy Hargrove"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            {/* Scanline overlay */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>

          <div style={{ flex: 1, fontSize: '13px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: dimColor }}>SUBJECT NAME:</span>{' '}
              <span style={{ color: '#cc0000' }}>WILLIAM "BILLY" HARGROVE</span>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>DOB:</span> 1967 | AGE AT DEATH: 18
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>RESIDENCE:</span> 4819 CHERRY LN, HAWKINS IN
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>PREVIOUS:</span> SAN DIEGO, CALIFORNIA
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>EDUCATION:</span> HAWKINS HIGH SCHOOL - SENIOR
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>EMPLOYMENT:</span> LIFEGUARD - HAWKINS COMMUNITY POOL
            </div>
            <div style={{ fontSize: '12px', color: dimColor, marginTop: '6px', borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              FINAL STATUS: <span style={{ color: '#ff0000' }}>DECEASED</span> | MIND FLAYER HOST / SACRIFICE
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px' }}>
          <div style={{ color: '#cc0000', marginBottom: '8px', fontSize: '13px' }}>
            ■ FAMILY BACKGROUND
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>• FATHER: NEIL HARGROVE - <span style={{ color: '#ff6600' }}>DOCUMENTED DOMESTIC ABUSER</span></div>
            <div>• MOTHER: ████████ HARGROVE - LEFT FAMILY (SUBJECT AGE 10)</div>
            <div>• STEPMOTHER: SUSAN MAYFIELD (NÉE ████████)</div>
            <div>• STEPSISTER: MAXINE "MAX" MAYFIELD</div>
            <div style={{ marginTop: '6px', color: '#ff6600', padding: '6px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)' }}>
              PSYCHOLOGICAL NOTE: Subject's aggressive behavior directly linked to
              paternal abuse. Father documented using physical violence and verbal
              degradation. Mother's abandonment created deep attachment issues.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            ■ BEHAVIORAL PROFILE (PRE-INFECTION)
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>• PERSONALITY: AGGRESSIVE, NARCISSISTIC, CONTROLLING</div>
            <div>• SOCIAL BEHAVIOR: DOMINANT, INTIMIDATING, CHARISMATIC</div>
            <div>• ROMANTIC PATTERNS: PREDATORY - TARGETED OLDER WOMEN</div>
            <div>• VIOLENCE INDICATORS: HIGH - PHYSICAL ALTERCATIONS DOCUMENTED</div>
            <div>• RELATIONSHIP WITH STEPSISTER: HOSTILE, THREATENING</div>
            <div style={{ marginTop: '6px', color: '#ffcc00' }}>
              ASSESSMENT: Classic cycle-of-abuse victim becoming perpetrator.
              Subject's cruelty masks profound insecurity and self-loathing.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ff0000', marginBottom: '8px', fontSize: '13px' }}>
            ■ MIND FLAYER INFECTION EVENT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ff6633', padding: '8px', border: '1px solid #ff0000', background: 'rgba(255,0,0,0.1)' }}>
            <div>DATE: 28-JUN-85 | LOCATION: BRIMBORN STEEL WORKS</div>
            <div style={{ marginTop: '6px' }}>SEQUENCE OF EVENTS:</div>
            <div>• Subject vehicle malfunction near abandoned steel works</div>
            <div>• Contact with SHADOW entity fragment from Upside Down</div>
            <div>• Infection via physical integration - entity entered through wounds</div>
            <div>• Subject became PRIMARY HOST for Mind Flayer proxy form</div>
            <div style={{ marginTop: '6px' }}>CAPABILITIES WHILE INFECTED:</div>
            <div>• Enhanced strength beyond normal human parameters</div>
            <div>• Resistance to physical trauma</div>
            <div>• Hive-mind connection to other infected hosts ("The Flayed")</div>
            <div>• Used to recruit additional hosts throughout Hawkins</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ffcc00', marginBottom: '8px', fontSize: '13px' }}>
            ■ THE FLAYED - RECRUITED HOSTS
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            <div>• HEATHER HOLLOWAY - LIFEGUARD (FIRST VICTIM)</div>
            <div>• TOM HOLLOWAY - HEATHER'S FATHER (HAWKINS POST EDITOR)</div>
            <div>• JANET HOLLOWAY - HEATHER'S MOTHER</div>
            <div>• BRUCE LOWE - HAWKINS POST JOURNALIST</div>
            <div>• ADDITIONAL VICTIMS: 30+ HAWKINS RESIDENTS</div>
            <div style={{ fontSize: '12px', color: dimColor, borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              ALL FLAYED HOSTS WERE BIOMASS-CONVERTED TO CONSTRUCT PROXY CREATURE.
              NO SURVIVORS AMONG INFECTED POPULATION EXCEPT PRIMARY HOST.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ff3300', marginBottom: '8px', fontSize: '13px' }}>
            ■ STARCOURT INCIDENT - FINAL MOMENTS
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>DATE: 04-JUL-85 | LOCATION: STARCOURT MALL</div>
            <div style={{ marginTop: '6px' }}>
              During confrontation with Subject 011 (ELEVEN), the Mind Flayer
              proxy creature attempted to kill the target. Subject HARGROVE,
              despite full infection, demonstrated momentary resistance to
              hive-mind control.
            </div>
            <div style={{ marginTop: '6px', color: '#ffcc00', padding: '6px', border: '1px solid #ffcc00', background: 'rgba(255,204,0,0.1)' }}>
              CRITICAL OBSERVATION: Subject 011 triggered memory recall in HARGROVE
              by referencing his mother and California beach memories. This created
              sufficient cognitive disruption to allow host consciousness to resurface.
            </div>
            <div style={{ marginTop: '6px', color: '#ff0000' }}>
              RESULT: Subject physically restrained Mind Flayer proxy, allowing
              gate closure. Proxy creature killed subject via impalement.
              Death classified as HEROIC SACRIFICE.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#cc0000', marginBottom: '8px', fontSize: '13px' }}>
            ■ DOE SURVEILLANCE LOG
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div>22-OCT-84 | Subject relocated from California with family.</div>
            <div>05-NOV-84 | Altercation with Steve Harrington. Lost confrontation.</div>
            <div>01-JUN-85 | Employment began at Hawkins Community Pool.</div>
            <div>28-JUN-85 | INFECTION EVENT - Brimborn Steel Works.</div>
            <div>29-JUN-85 | First host recruitment (Heather Holloway).</div>
            <div>01-JUL-85 | Mass recruitment phase initiated.</div>
            <div style={{ color: '#ff0000' }}>04-JUL-85 | STARCOURT INCIDENT. Subject deceased. Gate closed.</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            ■ POST-MORTEM ASSESSMENT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ color: baseColor }}>
              Subject HARGROVE represents unique case study in Mind Flayer host
              behavior. Despite complete infection, residual human consciousness
              was able to reassert control during critical moment. This suggests
              emotional anchors may provide resistance to psychic domination.
            </div>
            <div style={{ marginTop: '8px', color: '#cc0000' }}>
              "In the end, he wasn't the monster his father made him. He chose
              to be something else. He chose to save her."
              <span style={{ color: dimColor }}> - Incident Report Addendum</span>
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: dimColor, textAlign: 'center' }}>
            DESIGNATION: "THE FLAYER HOST" | FINAL STATUS: REDEEMED / DECEASED
          </div>
        </div>
      </div>
    </div>
  );

  const renderRobin = () => (
    <div style={{ color: baseColor, fontSize: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: `2px solid #6699cc`,
        padding: '15px',
        background: 'rgba(102,153,204,0.08)',
      }}>
        <div style={{
          fontSize: '16px',
          marginBottom: '15px',
          color: '#6699cc',
          textAlign: 'center',
          textShadow: '0 0 10px rgba(102,153,204,0.5)',
          letterSpacing: '2px',
        }}>
          ╔══════════════════════════════════════════╗<br/>
          ║ &nbsp;&nbsp;&nbsp;DOE SURVEILLANCE FILE: ROBIN BUCKLEY&nbsp;&nbsp;&nbsp; ║<br/>
          ║ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CLASSIFICATION: MONITORED&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ║<br/>
          ╚══════════════════════════════════════════╝
        </div>

        <div style={{ fontSize: '12px', color: dimColor, textAlign: 'center', marginBottom: '12px' }}>
          FILE UPDATED: 18-DEC-85 | STATUS: ACTIVE SURVEILLANCE | PRIORITY: MODERATE
        </div>

        <div style={{ display: 'flex', gap: isMobile ? '10px' : '15px', marginBottom: isMobile ? '10px' : '15px' }}>
          {/* Photo placeholder */}
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: `1px solid #6699cc`,
            background: '#0a0f15',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src="/robin.jpeg"
              alt="Robin Buckley"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            {/* Scanline overlay */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>

          <div style={{ flex: 1, fontSize: '13px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: dimColor }}>SUBJECT NAME:</span>{' '}
              <span style={{ color: '#6699cc' }}>ROBIN BUCKLEY</span>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>DOB:</span> 1968 | AGE: 17
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>RESIDENCE:</span> HAWKINS, INDIANA
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>EDUCATION:</span> HAWKINS HIGH SCHOOL - SENIOR
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>EMPLOYMENT:</span> FAMILY VIDEO (FORMERLY SCOOPS AHOY)
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>LANGUAGES:</span> ENGLISH, SPANISH, FRENCH, <span style={{ color: '#ff6600' }}>RUSSIAN</span>
            </div>
            <div style={{ fontSize: '12px', color: dimColor, marginTop: '6px', borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              THREAT LEVEL: <span style={{ color: '#ffcc00' }}>MODERATE</span> | INTELLIGENCE ASSET POTENTIAL
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px' }}>
          <div style={{ color: '#6699cc', marginBottom: '8px', fontSize: '13px' }}>
            ■ ACADEMIC PROFILE
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>• GPA: 3.9 (NEAR TOP OF CLASS)</div>
            <div>• LANGUAGE APTITUDE: EXCEPTIONAL - SELF-TAUGHT RUSSIAN</div>
            <div>• EXTRACURRICULARS: BAND (MULTIPLE INSTRUMENTS)</div>
            <div>• NOTABLE SKILLS: CODE-BREAKING, PATTERN RECOGNITION</div>
            <div>• COLLEGE PROSPECTS: EXCELLENT - LIKELY SCHOLARSHIP CANDIDATE</div>
            <div style={{ marginTop: '6px', color: '#ffcc00', padding: '6px', border: '1px solid #ffcc00', background: 'rgba(255,204,0,0.1)' }}>
              INTELLIGENCE ASSESSMENT: Subject demonstrates aptitude suitable
              for cryptanalysis or intelligence work. Language acquisition
              skills are exceptional. Consider for future recruitment.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            ■ PERSONALITY PROFILE
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>• TEMPERAMENT: SARDONIC, WITTY, OBSERVANT</div>
            <div>• SOCIAL STANDING: OUTSIDER - SELF-DESCRIBED "BAND NERD"</div>
            <div>• DEFENSE MECHANISM: HUMOR, DEFLECTION, SARCASM</div>
            <div>• LOYALTY INDEX: EXTREMELY HIGH ONCE TRUST ESTABLISHED</div>
            <div>• STRESS RESPONSE: VERBAL PROCESSING, RAPID ADAPTATION</div>
            <div style={{ marginTop: '6px', color: dimColor }}>
              Subject maintains carefully constructed social walls. Initial
              presentation as aloof masks deep desire for connection. Once
              bonded, demonstrates fierce loyalty to chosen companions.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ffcc00', marginBottom: '8px', fontSize: '13px' }}>
            ■ KNOWN ASSOCIATES
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            <div>• <span style={{ color: '#ffcc00' }}>STEVE HARRINGTON</span> - PRIMARY CONTACT / BEST FRIEND</div>
            <div>• DUSTIN HENDERSON - ALLIED THROUGH HARRINGTON</div>
            <div>• NANCY WHEELER - COLLABORATIVE CONTACT (CREEL INVESTIGATION)</div>
            <div>• VICKIE - ROMANTIC INTEREST (BAND)</div>
            <div style={{ fontSize: '12px', color: dimColor, borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              HARRINGTON PARTNERSHIP: Unlikely friendship formed during Starcourt
              incident. Subject and Harrington demonstrated exceptional teamwork
              under duress. Bond remains strong post-incident.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ff6600', marginBottom: '8px', fontSize: '13px' }}>
            ■ STARCOURT INCIDENT INVOLVEMENT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>• Decoded Russian transmission intercepted at Scoops Ahoy</div>
            <div>• Infiltrated Russian underground facility beneath Starcourt Mall</div>
            <div>• <span style={{ color: '#ff3300' }}>CAPTURED BY SOVIET OPERATIVES</span></div>
            <div>• Subjected to truth serum interrogation (sodium pentothal variant)</div>
            <div>• Escaped custody with Harrington, Henderson, Byers</div>
            <div>• Provided critical intelligence regarding Russian gate operation</div>
            <div style={{ marginTop: '6px', color: '#ff6600', padding: '6px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)' }}>
              INTERROGATION NOTES: Despite chemical interrogation, subject
              revealed no actionable intelligence regarding HNL operations.
              (Subject had no prior HNL knowledge at time of capture.)
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ff3300', marginBottom: '8px', fontSize: '13px' }}>
            ■ VECNA INVESTIGATION (1986)
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>• Participated in Victor Creel research at Pennhurst Asylum</div>
            <div>• Accessed classified patient records (unauthorized)</div>
            <div>• Collaborated with Wheeler on Henry Creel investigation</div>
            <div>• Present during Creel House assault operation</div>
            <div>• SURVIVED multiple encounters with Vecna-controlled entities</div>
            <div style={{ marginTop: '6px', color: dimColor }}>
              Subject has demonstrated remarkable composure during supernatural
              encounters. Maintains analytical approach even under extreme stress.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#6699cc', marginBottom: '8px', fontSize: '13px' }}>
            ■ DOE SURVEILLANCE LOG
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div>01-JUN-85 | Employment at Scoops Ahoy. Paired with Harrington.</div>
            <div>28-JUN-85 | Decoded encrypted Russian transmission.</div>
            <div>04-JUL-85 | STARCOURT INCIDENT - Captured, interrogated, escaped.</div>
            <div>15-JUL-85 | Debriefed. Cover story accepted.</div>
            <div>01-SEP-85 | Transfer to Family Video with Harrington.</div>
            <div>21-MAR-86 | Creel House investigation initiated.</div>
            <div>26-MAR-86 | Present at Vecna confrontation. Survived.</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#6699cc', marginBottom: '8px', fontSize: '13px' }}>
            ■ CLASSIFIED - PERSONAL NOTATION
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ color: baseColor }}>
              Subject disclosed personal information to Harrington during
              Starcourt captivity (effects of truth serum). Content relates
              to personal identity matters outside DOE operational concern.
            </div>
            <div style={{ marginTop: '6px', color: dimColor, fontStyle: 'italic' }}>
              [CONTENT REDACTED - NOT RELEVANT TO NATIONAL SECURITY]
            </div>
            <div style={{ marginTop: '6px', color: '#6699cc' }}>
              ADDENDUM: Harrington's response to disclosure was supportive.
              Bond between subjects strengthened significantly. Neither has
              disclosed information to other parties.
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: dimColor, textAlign: 'center' }}>
            DESIGNATION: "THE TRANSLATOR" | STATUS: VALUABLE INTELLIGENCE ASSET
          </div>
        </div>
      </div>
    </div>
  );

  const renderBrenner = () => (
    <div style={{ color: baseColor, fontSize: isMobile ? '11px' : '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: `2px solid ${baseColor}`,
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(255,176,0,0.05)',
      }}>
        {!isMobile && (
          <div style={{
            fontSize: '16px',
            marginBottom: '15px',
            color: baseColor,
            textAlign: 'center',
            textShadow: '0 0 10px rgba(255,176,0,0.5)',
            letterSpacing: '2px',
          }}>
            ╔══════════════════════════════════════════╗<br/>
            ║ &nbsp;&nbsp;&nbsp;&nbsp;DIRECTOR PERSONNEL FILE&nbsp;&nbsp;&nbsp;&nbsp; ║<br/>
            ║ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DR. MARTIN BRENNER&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ║<br/>
            ║ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CLEARANCE: LEVEL 5 - OMEGA&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ║<br/>
            ╚══════════════════════════════════════════╝
          </div>
        )}
        {isMobile && (
          <div style={{ color: baseColor, fontSize: '11px', textAlign: 'center', marginBottom: '8px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '6px' }}>
            ◢ DIRECTOR FILE: DR. MARTIN BRENNER ◣<br/>
            <span style={{ color: dimColor }}>CLEARANCE: OMEGA</span>
          </div>
        )}

        <div style={{ fontSize: isMobile ? '9px' : '12px', color: '#4a8', textAlign: 'center', marginBottom: isMobile ? '8px' : '12px' }}>
          {isMobile ? 'FULL ACCESS GRANTED' : 'WELCOME, DR. BRENNER | FULL SYSTEM ACCESS GRANTED | ALL RECORDS AVAILABLE'}
        </div>

        <div style={{ display: 'flex', gap: isMobile ? '10px' : '15px', marginBottom: isMobile ? '10px' : '15px' }}>
          {/* Photo placeholder */}
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: `1px solid ${baseColor}`,
            background: '#1a1505',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src="/papa.jpeg"
              alt="Dr. Martin Brenner"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            {/* Scanline overlay */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>

          <div style={{ flex: 1, fontSize: isMobile ? '10px' : '13px' }}>
            <div style={{ marginBottom: isMobile ? '4px' : '8px' }}>
              <span style={{ color: dimColor }}>NAME:</span>{' '}
              <span style={{ color: baseColor }}>DR. MARTIN BRENNER</span>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>POSITION:</span> {isMobile ? 'DIRECTOR' : 'DIRECTOR, HAWKINS NATIONAL LABORATORY'}
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>DEPARTMENT:</span> {isMobile ? 'DOE' : 'U.S. DEPARTMENT OF ENERGY'}
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>CLEARANCE:</span> <span style={{ color: '#4a8' }}>OMEGA</span>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>PROJECT:</span> INDIGO / MKULTRA
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>TENURE:</span> 1959 - PRESENT
            </div>
            <div style={{ fontSize: isMobile ? '9px' : '12px', color: dimColor, marginTop: '6px', borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              STATUS: <span style={{ color: '#4a8' }}>ACTIVE</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: baseColor, marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ CREDENTIALS & EDUCATION
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div>• Ph.D. COGNITIVE NEUROSCIENCE - HARVARD UNIVERSITY, 1955</div>
            <div>• M.D. PSYCHIATRY - JOHNS HOPKINS UNIVERSITY, 1952</div>
            <div>• B.S. BIOCHEMISTRY - YALE UNIVERSITY, 1948</div>
            <div>• POST-DOCTORAL RESEARCH - CLASSIFIED (OSS/CIA PROGRAMS)</div>
            <div style={{ marginTop: '6px', color: '#ffcc00' }}>
              RECRUITMENT: Identified by Project ARTICHOKE directors as exceptional
              candidate for expanded consciousness research initiatives.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: baseColor, marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ DIRECTORIAL ACHIEVEMENTS
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div>• ESTABLISHED Hawkins National Laboratory (1959)</div>
            <div>• DEVELOPED Enhanced Human Potential Program (Project INDIGO)</div>
            <div>• ACHIEVED first documented psychokinetic manifestation (1971)</div>
            <div>• PIONEERED sensory deprivation enhancement protocols</div>
            <div>• CULTIVATED 11 viable test subjects with measurable abilities</div>
            <div>• <span style={{ color: '#ffcc00' }}>BREAKTHROUGH: First interdimensional contact (1979)</span></div>
            <div style={{ marginTop: '6px', padding: '6px', border: '1px solid #4a8', background: 'rgba(74,136,68,0.1)', color: '#4a8' }}>
              COMMENDATION: "Dr. Brenner's work has expanded the boundaries of human
              understanding. His dedication to the program is unparalleled."
              <span style={{ color: dimColor }}> - DOE Internal Review, 1982</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: baseColor, marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ METHODOLOGY NOTES
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6', fontStyle: 'italic', color: dimColor }}>
            <div>"The children respond best to consistent structure. They require
            a paternal figure - someone they can trust implicitly. I have found
            that the title 'Papa' creates the necessary psychological bond for
            optimal cooperation and development of abilities."</div>
            <div style={{ marginTop: '8px' }}>
            "Emotional attachment, properly directed, becomes our greatest tool.
            The subjects must believe they are loved. They must believe they are
            special. They must believe there is no world outside these walls
            that would accept them."</div>
            <div style={{ marginTop: '8px' }}>
            "Pain is merely another stimulus. The children learn to associate
            discomfort with failure, and comfort with success. This conditioning
            produces remarkable acceleration in ability manifestation."</div>
            <div style={{ textAlign: 'right', marginTop: '6px', color: baseColor }}>
              - Personal Research Notes, Dr. M. Brenner
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#ffcc00', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ SUBJECT DEVELOPMENT RECORD
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.5' }}>
            <div>• SUBJECTS 001-007: Foundational research. Various outcomes.</div>
            <div>• SUBJECT 008: Promising. Escaped custody. Search ongoing.</div>
            <div>• SUBJECTS 009-010: Moderate success. Currently contained.</div>
            <div>• <span style={{ color: baseColor }}>SUBJECT 011:</span> <span style={{ color: '#ffcc00' }}>EXCEPTIONAL SUCCESS</span></div>
            <div style={{ fontSize: '12px', color: dimColor, borderTop: `1px solid ${borderColor}`, paddingTop: '6px', marginTop: '6px' }}>
              Subject 011 represents the culmination of decades of research.
              Abilities exceed all projections. Personal bond with director
              ensures loyalty and cooperation. The child trusts completely.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#ff6600', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ INCIDENT LOG
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div>06-SEP-79 | Subject 001 incident. Casualties: 17.</div>
            <div>12-MAR-81 | Subject 008 escape. Perimeter breach. Unrecovered.</div>
            <div style={{ color: '#ff3300' }}>06-NOV-83 | Subject 011 - uncontrolled gateway manifestation.</div>
            <div style={{ color: '#ff3300' }}>06-NOV-83 | Entity incursion. Facility breach. Subject escaped.</div>
            <div style={{ marginTop: '6px', color: '#ff6600', padding: '6px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)' }}>
              PERSONAL NOTE: Eleven's escape was... unexpected. The child's
              emotional development exceeded parameters. External influences
              corrupted the bond. Recovery is essential. She will return to me.
              They always do.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: baseColor, marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ CURRENT STATUS
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div style={{ color: baseColor }}>
              Operations temporarily suspended pending facility reconstruction. Director Brenner continues oversight from secure location.
            </div>
            <div style={{ marginTop: isMobile ? '6px' : '8px', color: '#ffcc00' }}>
              PRIORITY OBJECTIVES:
            </div>
            <div>1. Recovery of Subject 011</div>
            <div>2. Gateway stabilization</div>
            <div>3. Continuation of enhanced human program</div>
            <div>4. Information containment</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: baseColor, marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ PERSONAL PHILOSOPHY
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div style={{ fontStyle: 'italic', color: dimColor, padding: '8px', border: `1px solid ${borderColor}`, background: 'rgba(255,176,0,0.05)' }}>
              "I am often asked if I feel guilt for my methods. The question
              reveals a fundamental misunderstanding. Guilt is for those who
              doubt their purpose. I have never doubted. Every child who passed
              through my care was given meaning. They were elevated from ordinary
              existence into something extraordinary. What parent would not want
              that for their children?"
              <div style={{ marginTop: '8px' }}>
              "They call me 'Papa' because that is what I am to them. I am the
              only family they have ever needed. I am the only family they will
              ever need. The outside world would fear them, reject them, destroy
              them. I alone recognize their value. I alone love them for what
              they truly are."
              </div>
              <div style={{ marginTop: '8px' }}>
              "History will vindicate my work. The small minds of this era cannot
              comprehend what we are building. But in time, they will understand.
              They will all understand."
              </div>
              <div style={{ textAlign: 'right', marginTop: '6px', color: baseColor }}>
                - Interview Transcript, 1981
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: isMobile ? '10px' : '15px', textAlign: 'center', padding: isMobile ? '8px' : '10px', border: `1px solid ${baseColor}`, background: 'rgba(255,176,0,0.08)' }}>
          <div style={{ fontSize: isMobile ? '10px' : '14px', color: baseColor, marginBottom: '4px' }}>
            "THE CHILDREN ARE THE FUTURE. I AM SIMPLY THE SCULPTOR."
          </div>
          <div style={{ fontSize: isMobile ? '8px' : '12px', color: dimColor }}>
            {isMobile ? 'WELCOME HOME, PAPA' : 'SYSTEM ADMINISTRATOR | FULL ACCESS AUTHORIZED | WELCOME HOME, PAPA'}
          </div>
        </div>
      </div>
    </div>
  );

  const renderErica = () => (
    <div style={{ color: baseColor, fontSize: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: `2px solid #ff66cc`,
        padding: '15px',
        background: 'rgba(255,102,204,0.08)',
      }}>
        <div style={{
          fontSize: '16px',
          marginBottom: '15px',
          color: '#ff66cc',
          textAlign: 'center',
          textShadow: '0 0 10px rgba(255,102,204,0.5)',
          letterSpacing: '2px',
        }}>
          ╔══════════════════════════════════════════╗<br/>
          ║ &nbsp;&nbsp;&nbsp;DOE SURVEILLANCE FILE: ERICA SINCLAIR&nbsp;&nbsp;&nbsp; ║<br/>
          ║ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CLASSIFICATION: MONITORED&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ║<br/>
          ╚══════════════════════════════════════════╝
        </div>

        <div style={{ fontSize: '12px', color: dimColor, textAlign: 'center', marginBottom: '12px' }}>
          FILE UPDATED: 08-JUL-85 | STATUS: ACTIVE SURVEILLANCE | PRIORITY: ELEVATED
        </div>

        <div style={{ display: 'flex', gap: isMobile ? '10px' : '15px', marginBottom: isMobile ? '10px' : '15px' }}>
          {/* Photo placeholder */}
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: `1px solid #ff66cc`,
            background: '#1a0a15',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src="/erica.jpeg"
              alt="Erica Sinclair"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            {/* Scanline overlay */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>

          <div style={{ flex: 1, fontSize: '13px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: dimColor }}>SUBJECT NAME:</span>{' '}
              <span style={{ color: '#ff66cc' }}>ERICA SINCLAIR</span>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>DOB:</span> 1974 | AGE: 10
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>RESIDENCE:</span> HAWKINS, INDIANA
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>EDUCATION:</span> HAWKINS ELEMENTARY - 4TH GRADE
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>SIBLING:</span> LUCAS SINCLAIR (BROTHER)
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>NOTABLE:</span> <span style={{ color: '#ff66cc' }}>EXCEPTIONALLY HIGH IQ</span>
            </div>
            <div style={{ fontSize: '12px', color: dimColor, marginTop: '6px', borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              THREAT LEVEL: <span style={{ color: '#ff66cc' }}>MODERATE</span> | SECURITY BREACH PARTICIPANT
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px' }}>
          <div style={{ color: '#ff66cc', marginBottom: '8px', fontSize: '13px' }}>
            ■ FAMILY BACKGROUND
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>• FATHER: CHARLES SINCLAIR - EMPLOYED, HAWKINS</div>
            <div>• MOTHER: SUE SINCLAIR - EMPLOYED, HAWKINS</div>
            <div>• BROTHER: <span style={{ color: '#ffcc00' }}>LUCAS SINCLAIR</span> - SEE FILE: PARTY MEMBER</div>
            <div style={{ marginTop: '6px', color: '#ffcc00' }}>
              FAMILY NOTE: Sinclair family represents stable, middle-class household.
              No prior government involvement. Brother's connection to Subject 011
              created exposure risk for entire family unit.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            ■ PSYCHOLOGICAL PROFILE
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>• INTELLIGENCE: EXCEPTIONAL - TESTS IN 99TH PERCENTILE</div>
            <div>• PERSONALITY: ASSERTIVE, CONFIDENT, ENTREPRENEURIAL</div>
            <div>• VERBAL SKILLS: ADVANCED - SOPHISTICATED VOCABULARY</div>
            <div>• NEGOTIATION: DEMONSTRATED APTITUDE FOR DEAL-MAKING</div>
            <div>• TEMPERAMENT: FEARLESS, SARCASTIC, UNINTIMIDATED BY AUTHORITY</div>
            <div style={{ marginTop: '6px', color: '#ff66cc', padding: '6px', border: '1px solid #ff66cc', background: 'rgba(255,102,204,0.1)' }}>
              ASSESSMENT: Subject demonstrates intellectual capabilities far
              exceeding age group. Shows no deference to authority figures.
              Responds to incentive-based motivation (capitalism references noted).
              Quote recorded: "You can't spell America without Erica."
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ff3300', marginBottom: '8px', fontSize: '13px' }}>
            ■ STARCOURT INCIDENT INVOLVEMENT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>• Recruited by Henderson/Harrington for air duct infiltration</div>
            <div>• <span style={{ color: '#ffcc00' }}>SUCCESSFULLY BREACHED RUSSIAN FACILITY</span></div>
            <div>• Navigated ventilation system to access secure areas</div>
            <div>• Obtained classified Russian documents and materials</div>
            <div>• <span style={{ color: '#ff3300' }}>CAPTURED BY SOVIET OPERATIVES</span></div>
            <div>• Escaped captivity with Harrington, Buckley, Henderson</div>
            <div>• Demonstrated combat capability - provided cover fire during extraction</div>
            <div style={{ marginTop: '6px', color: '#ff6600', padding: '6px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)' }}>
              NOTE: 10-YEAR-OLD CIVILIAN SUCCESSFULLY INFILTRATED CLASSIFIED
              SOVIET INSTALLATION. SECURITY PROTOCOLS REQUIRE IMMEDIATE REVIEW.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ffcc00', marginBottom: '8px', fontSize: '13px' }}>
            ■ KNOWN ASSOCIATES
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            <div>• LUCAS SINCLAIR - BROTHER / PRIMARY PARTY CONNECTION</div>
            <div>• DUSTIN HENDERSON - RECRUITED SUBJECT FOR OPERATION</div>
            <div>• STEVE HARRINGTON - ALLIED DURING STARCOURT</div>
            <div>• ROBIN BUCKLEY - ALLIED DURING STARCOURT</div>
            <div>• "THE PARTY" - NOW CONSIDERED JUNIOR MEMBER</div>
            <div style={{ fontSize: '12px', color: dimColor, borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              Post-Starcourt, subject has been fully integrated into "The Party"
              network. Initially reluctant participant, now active member in
              subsequent supernatural incidents.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ff66cc', marginBottom: '8px', fontSize: '13px' }}>
            ■ DOE SURVEILLANCE LOG
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div>28-JUN-85 | First contact with Henderson at Scoops Ahoy. "Free samples."</div>
            <div>04-JUL-85 | Recruited for ventilation infiltration. Negotiated payment.</div>
            <div>04-JUL-85 | SUCCESSFULLY BREACHED RUSSIAN FACILITY.</div>
            <div>04-JUL-85 | Captured. Escaped. Survived Starcourt incident.</div>
            <div>15-JUL-85 | Debriefed with cover story. Subject uncooperative, demanding.</div>
            <div>21-MAR-86 | Confirmed participation in Vecna investigation.</div>
            <div>26-MAR-86 | Present at Creel House assault. Survived.</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            ■ AGENT ASSESSMENT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ color: baseColor }}>
              Subject SINCLAIR, E. presents unique challenge. Intellectual capabilities
              make traditional manipulation ineffective. Attempts at intimidation
              result in mockery. Subject demanded compensation for debriefing
              participation and threatened "lawyer involvement" despite age.
            </div>
            <div style={{ marginTop: '8px', color: '#ff66cc' }}>
              "Look, I did your little mission. I crawled through your nasty vents.
              I got chased by Russians. The least you can do is provide adequate
              refreshments. This is America."
              <span style={{ color: dimColor }}> - Subject, during debrief</span>
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: dimColor, textAlign: 'center' }}>
            DESIGNATION: "THE CAPITALIST" | STATUS: RELUCTANT ASSET
          </div>
        </div>
      </div>
    </div>
  );

  const renderArgyle = () => (
    <div style={{ color: baseColor, fontSize: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{
        border: `2px solid #66cc66`,
        padding: '15px',
        background: 'rgba(102,204,102,0.08)',
      }}>
        <div style={{
          fontSize: '16px',
          marginBottom: '15px',
          color: '#66cc66',
          textAlign: 'center',
          textShadow: '0 0 10px rgba(102,204,102,0.5)',
          letterSpacing: '2px',
        }}>
          ╔══════════════════════════════════════════╗<br/>
          ║ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DOE SURVEILLANCE FILE: ARGYLE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ║<br/>
          ║ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CLASSIFICATION: PERIPHERAL&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ║<br/>
          ╚══════════════════════════════════════════╝
        </div>

        <div style={{ fontSize: '12px', color: dimColor, textAlign: 'center', marginBottom: '12px' }}>
          FILE CREATED: 28-MAR-86 | STATUS: MONITORING | PRIORITY: LOW
        </div>

        <div style={{ display: 'flex', gap: isMobile ? '10px' : '15px', marginBottom: isMobile ? '10px' : '15px' }}>
          {/* Photo placeholder */}
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: `1px solid #66cc66`,
            background: '#0a1a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src="/argyle.jpeg"
              alt="Argyle"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            {/* Scanline overlay */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
            }} />
          </div>

          <div style={{ flex: 1, fontSize: '13px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: dimColor }}>SUBJECT NAME:</span>{' '}
              <span style={{ color: '#66cc66' }}>ARGYLE (SURNAME UNKNOWN)</span>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>DOB:</span> ~1966 | AGE: ~19
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>RESIDENCE:</span> LENORA HILLS, CALIFORNIA
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>EMPLOYMENT:</span> SURFER BOY PIZZA - DELIVERY DRIVER
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>VEHICLE:</span> SURFER BOY PIZZA VAN (CRITICAL ASSET)
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: dimColor }}>KNOWN HABITS:</span> <span style={{ color: '#66cc66' }}>RECREATIONAL SUBSTANCES</span>
            </div>
            <div style={{ fontSize: '12px', color: dimColor, marginTop: '6px', borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              THREAT LEVEL: <span style={{ color: '#4a8' }}>MINIMAL</span> | ACCIDENTAL INVOLVEMENT
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px' }}>
          <div style={{ color: '#66cc66', marginBottom: '8px', fontSize: '13px' }}>
            ■ BACKGROUND
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>• ORIGIN: LENORA HILLS, CALIFORNIA</div>
            <div>• EDUCATION: LENORA HILLS HIGH SCHOOL (STATUS UNCLEAR)</div>
            <div>• OCCUPATION: PIZZA DELIVERY - SURFER BOY PIZZA FRANCHISE</div>
            <div>• SOCIAL CIRCLE: JONATHAN BYERS (PRIMARY CONTACT)</div>
            <div style={{ marginTop: '6px', color: '#ffcc00' }}>
              NOTE: Subject appears to have no awareness of classified operations.
              Involvement purely circumstantial through friendship with Byers.
              No indication of prior supernatural exposure.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            ■ PSYCHOLOGICAL PROFILE
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>• TEMPERAMENT: RELAXED, AMIABLE, NON-CONFRONTATIONAL</div>
            <div>• COGNITIVE STATE: FREQUENTLY IMPAIRED (SEE HABITS)</div>
            <div>• STRESS RESPONSE: PANIC FOLLOWED BY ACCEPTANCE</div>
            <div>• LOYALTY: HIGH - REMAINED WITH GROUP DESPITE DANGER</div>
            <div>• PHILOSOPHICAL: PRONE TO TANGENTIAL OBSERVATIONS</div>
            <div style={{ marginTop: '6px', color: dimColor }}>
              Subject exhibits remarkable adaptability. Despite witnessing
              events that would traumatize most individuals, subject maintained
              relatively stable (if chemically altered) demeanor throughout.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ff6600', marginBottom: '8px', fontSize: '13px' }}>
            ■ INCIDENT INVOLVEMENT - LENORA/NEVADA EVENTS
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>• Present during military raid on Byers residence</div>
            <div>• <span style={{ color: '#ffcc00' }}>PROVIDED ESCAPE VEHICLE</span> (Surfer Boy Pizza van)</div>
            <div>• Transported group across multiple state lines</div>
            <div>• Assisted in locating sensory deprivation equipment (pizza dough freezer)</div>
            <div>• <span style={{ color: '#ff3300' }}>WITNESSED ELEVEN'S ABILITIES FIRSTHAND</span></div>
            <div>• Participated in improvised sensory deprivation tank construction</div>
            <div style={{ marginTop: '6px', color: '#ff6600', padding: '6px', border: '1px solid #ff6600', background: 'rgba(255,102,0,0.1)' }}>
              CRITICAL: Subject's vehicle and pizza supply were instrumental in
              group's evasion of federal authorities. Without his resources,
              capture would have been likely.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ffcc00', marginBottom: '8px', fontSize: '13px' }}>
            ■ KNOWN ASSOCIATES
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            <div>• <span style={{ color: '#ffcc00' }}>JONATHAN BYERS</span> - CLOSE FRIEND / CO-WORKER</div>
            <div>• JOYCE BYERS - MET DURING INCIDENT</div>
            <div>• SUBJECT 011 "ELEVEN" - WITNESSED ABILITIES</div>
            <div>• WILL BYERS - FRIEND THROUGH JONATHAN</div>
            <div>• MIKE WHEELER - MET DURING INCIDENT</div>
            <div style={{ fontSize: '12px', color: dimColor, borderTop: `1px solid ${borderColor}`, paddingTop: '6px' }}>
              Subject demonstrated no hesitation in aiding fugitives from federal
              authorities. When questioned about motivation, responded: "Bro,
              it's Jonathan. You don't bail on your brochachos."
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#66cc66', marginBottom: '8px', fontSize: '13px' }}>
            ■ NOTABLE QUOTES (FIELD RECORDINGS)
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', fontStyle: 'italic', color: dimColor }}>
            <div>"Try before you deny, brochachos."</div>
            <div style={{ marginTop: '6px' }}>"Purple palm tree delight, my friend. It's a real mind-opener."</div>
            <div style={{ marginTop: '6px' }}>"Dude, I'm just the pizza guy. I didn't sign up for... whatever this is."</div>
            <div style={{ marginTop: '6px' }}>"Is this... is this like a 'Men in Black' situation? Are you gonna flash me?"</div>
            <div style={{ marginTop: '6px' }}>"I've seen some crazy stuff, man. Like, CRAZY crazy. But you know what?
            Love is the answer. Love and really good pizza."</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#66cc66', marginBottom: '8px', fontSize: '13px' }}>
            ■ DOE SURVEILLANCE LOG
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div>22-MAR-86 | Identified as Byers associate. California surveillance initiated.</div>
            <div>24-MAR-86 | Present at Byers residence during federal operation.</div>
            <div>24-MAR-86 | PROVIDED ESCAPE VEHICLE. Evaded federal pursuit.</div>
            <div>25-MAR-86 | Crossed state line into Nevada with fugitive group.</div>
            <div>26-MAR-86 | Located at Surfer Boy Pizza - assisted with... pizza-related requirements.</div>
            <div>27-MAR-86 | Subject witnessed classified psychic activity. Memory status: INTACT.</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            ■ CONTAINMENT ASSESSMENT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ color: baseColor }}>
              Subject's substance use history makes him an unreliable witness.
              Any attempt to disclose classified information would likely be
              dismissed as drug-induced hallucination. Additionally, subject
              appears genuinely unbothered by supernatural events, potentially
              due to pre-existing altered perception of reality.
            </div>
            <div style={{ marginTop: '8px', color: '#66cc66' }}>
              RECOMMENDATION: No action required. Subject's lifestyle and
              credibility issues provide natural cover. Continue passive
              monitoring only.
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: dimColor, textAlign: 'center' }}>
            DESIGNATION: "THE PIZZA GUY" | STATUS: HARMLESS / UNEXPECTEDLY USEFUL
          </div>
        </div>
      </div>
    </div>
  );

  const renderChrissy = () => (
    <div style={{ color: '#cc66cc', fontSize: isMobile ? '11px' : '14px' }}>
      <div style={{
        border: '2px solid #cc66cc',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(204,102,204,0.05)',
        position: 'relative',
      }}>
        {/* Death indicator overlay */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '4px 12px',
          background: '#330022',
          border: '1px solid #ff0066',
          color: '#ff0066',
          fontSize: '11px',
          animation: 'blink 2s infinite',
        }}>
          ✝ DECEASED - VECNA VICTIM #1
        </div>

        {!isMobile && (
          <pre style={{ color: '#cc66cc', marginBottom: '15px', fontSize: '12px', lineHeight: '1.2' }}>
{`╔═══════════════════════════════════════════════════════════╗
║   DOE SURVEILLANCE FILE: CHRISSY CUNNINGHAM               ║
║   STATUS: DECEASED | CAUSE: UNEXPLAINED PHENOMENON        ║
╚═══════════════════════════════════════════════════════════╝`}
          </pre>
        )}

        <div style={{ display: 'flex', gap: isMobile ? '8px' : '12px', marginBottom: isMobile ? '10px' : '12px' }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: '1px solid #cc66cc',
            background: '#1a0011',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src="/chrissy.jpeg"
              alt="Chrissy Cunningham"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(280deg)',
                mixBlendMode: 'screen',
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(0,0,0,0.8)',
              padding: '2px',
              fontSize: '8px',
              textAlign: 'center',
              color: '#ff0066',
            }}>
              21-MAR-86
            </div>
          </div>
          <div style={{ flex: 1, fontSize: isMobile ? '9px' : '12px' }}>
            <div style={{ color: '#cc66cc', fontSize: isMobile ? '11px' : '14px', marginBottom: isMobile ? '6px' : '8px' }}>
              <span style={{ color: '#cc66cc' }}>CHRISSY CUNNINGHAM</span>
            </div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>AGE: </span>17</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#ff0066' }}>DECEASED</span></div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>DEATH: </span>21-MAR-86 22:47 EST</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>LOCATION: </span>TRAILER PARK - UNIT 7</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SCHOOL: </span>HAWKINS HIGH SCHOOL</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>POSITION: </span>HEAD CHEERLEADER / HOMECOMING QUEEN</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>RELATIONSHIP: </span>JASON CARVER (BOYFRIEND)</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#cc66cc', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ FAMILY BACKGROUND
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.5' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>FATHER: </span>PHILLIP CUNNINGHAM</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>MOTHER: </span>LAURA CUNNINGHAM</div>
            <div style={{ fontSize: isMobile ? '9px' : '12px', color: '#ff9999', borderTop: `1px solid ${borderColor}`, paddingTop: '6px', marginTop: '6px' }}>
              ▶ FLAGGED: Evidence of severe emotional abuse from mother.<br/>
              ▶ Subject exhibited signs of eating disorder.<br/>
              ▶ Psychological pressure re: appearance and social status.<br/>
              ▶ Home environment classified as HOSTILE / PSYCHOLOGICALLY DAMAGING.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#cc66cc', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ PSYCHOLOGICAL PROFILE
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div><span style={{ color: '#ffcc00' }}>HIDDEN TRAUMA:</span> Severe - masked by social performance</div>
            <div><span style={{ color: '#ffcc00' }}>PUBLIC PERSONA:</span> Popular, friendly, "perfect girl" facade</div>
            <div><span style={{ color: '#ffcc00' }}>PRIVATE REALITY:</span> Depression, body image issues, fear</div>
            <div><span style={{ color: '#ffcc00' }}>COPING:</span> Sought pharmaceutical relief (*** FATAL ERROR ***)</div>
            <div style={{ color: dimColor, marginTop: '8px', fontStyle: 'italic' }}>
              Subject maintained flawless public image while internally suffering.
              Classic case of high-achiever syndrome with severe psychological cost.
              Vulnerability made her ideal target for Entity 001.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#ff0066', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ DEATH INCIDENT REPORT
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6', color: '#ff9999' }}>
            <div>21-MAR-86 22:30 | Subject located in trailer park seeking ████████████</div>
            <div>21-MAR-86 22:40 | Contact with MUNSON, EDWARD confirmed</div>
            <div>21-MAR-86 22:45 | ANOMALOUS EVENT INITIATED</div>
            <div>21-MAR-86 22:46 | Witness reports: subject entered trance state, levitated</div>
            <div>21-MAR-86 22:47 | DEATH: Catastrophic skeletal/cranial fractures</div>
            <div>21-MAR-86 22:47 | Eyes: ruptured. Limbs: inverted at joints.</div>
            <div style={{ color: '#ff0066', marginTop: '8px' }}>
              ▶ CAUSE OF DEATH: ENTITY 001 PSYCHIC ATTACK<br/>
              ▶ WITNESS: Edward Munson (now WANTED)<br/>
              ▶ COVER STORY: Homicide by Munson (Satanic Panic narrative deployed)
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#cc66cc', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ ENTITY 001 (VECNA) TARGETING ANALYSIS
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div style={{ color: '#ff9999' }}>
              Entity 001 selects victims based on psychological trauma and guilt.
              Subject Cunningham's unresolved maternal abuse and self-loathing
              created ideal psychic vulnerability. Entity exploited these memories
              to establish connection and ultimately terminate subject.
            </div>
            <div style={{ marginTop: '8px', color: dimColor }}>
              <div>▶ TRAUMA TYPE: Childhood abuse / body dysmorphia</div>
              <div>▶ EXPLOITATION METHOD: Memory intrusion / fear amplification</div>
              <div>▶ TIME TO KILL: Estimated 72-96 hours from first contact</div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: baseColor, marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ AFTERMATH
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div style={{ color: '#ffcc00' }}>
              Death triggered Hawkins satanic panic. Boyfriend JASON CARVER
              formed vigilante group targeting "Hellfire Club" members.
              Cover story successfully deflected from true cause of death.
            </div>
            <div style={{ marginTop: '8px', color: dimColor }}>
              Subject was first confirmed victim of Entity 001's renewed activity.
              Pattern established: trauma → psychic contact → execution.
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#ff0066', textAlign: 'center' }}>
            DESIGNATION: "VICTIM ZERO" | STATUS: DECEASED / CASE CLASSIFIED
          </div>
        </div>
      </div>
    </div>
  );

  const renderFred = () => (
    <div style={{ color: '#9966cc', fontSize: isMobile ? '11px' : '14px' }}>
      <div style={{
        border: '2px solid #9966cc',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(153,102,204,0.05)',
        position: 'relative',
      }}>
        {/* Death indicator overlay */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '4px 12px',
          background: '#220033',
          border: '1px solid #cc66ff',
          color: '#cc66ff',
          fontSize: '11px',
          animation: 'blink 2s infinite',
        }}>
          ✝ DECEASED - VECNA VICTIM #2
        </div>

        {!isMobile && (
          <pre style={{ color: '#9966cc', marginBottom: '15px', fontSize: '12px', lineHeight: '1.2' }}>
{`╔═══════════════════════════════════════════════════════════╗
║       DOE SURVEILLANCE FILE: FRED BENSON                  ║
║       STATUS: DECEASED | CAUSE: UNEXPLAINED PHENOMENON    ║
╚═══════════════════════════════════════════════════════════╝`}
          </pre>
        )}

        <div style={{ display: 'flex', gap: isMobile ? '8px' : '12px', marginBottom: isMobile ? '10px' : '12px' }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: '1px solid #9966cc',
            background: '#110022',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src="/fred.jpeg"
              alt="Fred Benson"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(250deg)',
                mixBlendMode: 'screen',
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(0,0,0,0.8)',
              padding: '2px',
              fontSize: '8px',
              textAlign: 'center',
              color: '#cc66ff',
            }}>
              22-MAR-86
            </div>
          </div>
          <div style={{ flex: 1, fontSize: isMobile ? '9px' : '12px' }}>
            <div style={{ color: '#9966cc', fontSize: isMobile ? '11px' : '14px', marginBottom: isMobile ? '6px' : '8px' }}>
              <span style={{ color: '#9966cc' }}>FRED BENSON</span>
            </div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>AGE: </span>18</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#cc66ff' }}>DECEASED</span></div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>DEATH: </span>22-MAR-86 15:23 EST</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>LOCATION: </span>TRAILER PARK VICINITY</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>OCCUPATION: </span>STUDENT / HAWKINS POST INTERN</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SUPERVISOR: </span>NANCY WHEELER (COLLEAGUE)</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#9966cc', marginBottom: '8px', fontSize: '13px' }}>
            ■ BACKGROUND
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            <div>Hawkins High School student employed as intern at The Hawkins Post.</div>
            <div>Worked alongside Nancy Wheeler investigating Cunningham death.</div>
            <div style={{ color: dimColor, marginTop: '6px' }}>
              Subject appeared unremarkable prior to Entity 001 targeting.
              Investigation revealed deeply hidden psychological trauma.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ff6666', marginBottom: '8px', fontSize: '13px' }}>
            ■ HIDDEN TRAUMA - CLASSIFIED
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ff9999' }}>
            <div style={{ marginBottom: '8px' }}>
              ▶ INCIDENT: Vehicular manslaughter (Hit and Run)<br/>
              ▶ DATE: ████████ (1 year prior)<br/>
              ▶ VICTIM: Unknown pedestrian<br/>
              ▶ STATUS: Unreported / covered up
            </div>
            <div style={{ color: dimColor }}>
              Subject was responsible for fatal hit-and-run accident.
              Fled scene. Victim died. Never reported incident.
              Carried extreme guilt - suppressed but unresolved.
              Entity 001 exploited this guilt to establish psychic connection.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#9966cc', marginBottom: '8px', fontSize: '13px' }}>
            ■ PSYCHOLOGICAL PROFILE
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div><span style={{ color: '#ffcc00' }}>TRAUMA:</span> Extreme guilt over vehicular manslaughter</div>
            <div><span style={{ color: '#ffcc00' }}>COPING:</span> Denial / suppression / avoidance</div>
            <div><span style={{ color: '#ffcc00' }}>SYMPTOMS:</span> Anxiety, fear of discovery, self-loathing</div>
            <div><span style={{ color: '#ffcc00' }}>MANIFESTATION:</span> Nightmares of victim (exploited by Entity)</div>
            <div style={{ color: dimColor, marginTop: '8px', fontStyle: 'italic' }}>
              Subject lived in constant fear of his secret being discovered.
              This unresolved guilt created vulnerability to psychic attack.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#cc66ff', marginBottom: '8px', fontSize: '13px' }}>
            ■ DEATH INCIDENT REPORT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#cc99ff' }}>
            <div>22-MAR-86 15:00 | Subject at trailer park with Wheeler (investigation)</div>
            <div>22-MAR-86 15:15 | Subject reported feeling unwell, experiencing visions</div>
            <div>22-MAR-86 15:18 | Subject wandered away from Wheeler</div>
            <div>22-MAR-86 15:20 | ANOMALOUS EVENT INITIATED - subject entered trance</div>
            <div>22-MAR-86 15:23 | DEATH: Identical to Cunningham (skeletal inversion)</div>
            <div style={{ color: '#cc66ff', marginTop: '8px' }}>
              ▶ CAUSE OF DEATH: ENTITY 001 PSYCHIC ATTACK<br/>
              ▶ WITNESS: Nancy Wheeler (partial)<br/>
              ▶ PATTERN CONFIRMED: Second victim in 24 hours
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#9966cc', marginBottom: '8px', fontSize: '13px' }}>
            ■ ENTITY 001 TARGETING ANALYSIS
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ color: '#cc99ff' }}>
              Subject's guilt over taking a life made him psychically accessible
              to Entity 001. The irony: Entity chose a killer to kill.
            </div>
            <div style={{ marginTop: '8px', color: dimColor }}>
              <div>▶ TRAUMA TYPE: Guilt / moral injury / fear of exposure</div>
              <div>▶ EXPLOITATION METHOD: Visions of victim, reliving the accident</div>
              <div>▶ TIME TO KILL: Estimated &lt;48 hours from first contact</div>
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#cc66ff', textAlign: 'center' }}>
            DESIGNATION: "VICTIM TWO" | STATUS: DECEASED / CASE CLASSIFIED
          </div>
        </div>
      </div>
    </div>
  );

  const renderPatrick = () => (
    <div style={{ color: '#cc6666', fontSize: '13px' }}>
      <div style={{
        border: '2px solid #cc6666',
        padding: '20px',
        background: 'rgba(204,102,102,0.05)',
        position: 'relative',
      }}>
        {/* Death indicator overlay */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '4px 12px',
          background: '#330011',
          border: '1px solid #ff6666',
          color: '#ff6666',
          fontSize: '11px',
          animation: 'blink 2s infinite',
        }}>
          ✝ DECEASED - VECNA VICTIM #3
        </div>

        <pre style={{ color: '#cc6666', marginBottom: '15px', fontSize: '12px', lineHeight: '1.2' }}>
{`╔═══════════════════════════════════════════════════════════╗
║       DOE SURVEILLANCE FILE: PATRICK MCKINNEY             ║
║       STATUS: DECEASED | CAUSE: UNEXPLAINED PHENOMENON    ║
╚═══════════════════════════════════════════════════════════╝`}
        </pre>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: '1px solid #cc6666',
            background: '#1a0808',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src="/patrick.jpeg"
              alt="Patrick McKinney"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(330deg)',
                mixBlendMode: 'screen',
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(0,0,0,0.8)',
              padding: '2px',
              fontSize: '8px',
              textAlign: 'center',
              color: '#ff6666',
            }}>
              24-MAR-86
            </div>
          </div>
          <div style={{ flex: 1, fontSize: '12px' }}>
            <div style={{ color: '#cc6666', fontSize: '16px', marginBottom: '8px' }}>
              <span style={{ color: '#cc6666' }}>PATRICK MCKINNEY</span>
            </div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>AGE: </span>17</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#ff6666' }}>DECEASED</span></div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>DEATH: </span>24-MAR-86 21:15 EST</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>LOCATION: </span>LOVER'S LAKE</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SCHOOL: </span>HAWKINS HIGH SCHOOL</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>POSITION: </span>BASKETBALL TEAM (TIGERS)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>ASSOCIATES: </span>JASON CARVER (TEAM CAPTAIN)</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#cc6666', marginBottom: '8px', fontSize: '13px' }}>
            ■ BACKGROUND
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            <div>Star player on Hawkins High basketball team.</div>
            <div>Close friend and teammate of Jason Carver.</div>
            <div>Participated in vigilante hunt for Edward Munson.</div>
            <div style={{ color: dimColor, marginTop: '6px' }}>
              Subject appeared to be well-adjusted athlete. Investigation
              revealed concealed domestic trauma rendering him vulnerable
              to Entity 001 targeting protocols.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ff6666', marginBottom: '8px', fontSize: '13px' }}>
            ■ HIDDEN TRAUMA - CLASSIFIED
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ff9999' }}>
            <div style={{ marginBottom: '8px' }}>
              ▶ ABUSE TYPE: Physical / Domestic<br/>
              ▶ PERPETRATOR: Father (████████ McKinney)<br/>
              ▶ DURATION: Ongoing since childhood<br/>
              ▶ STATUS: Unreported / Hidden
            </div>
            <div style={{ color: dimColor }}>
              Subject suffered severe physical abuse at hands of father.
              Concealed injuries, maintained public facade of normalcy.
              Athletic success served as escape mechanism.
              Deep-seated trauma made subject vulnerable to psychic predation.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#cc6666', marginBottom: '8px', fontSize: '13px' }}>
            ■ PSYCHOLOGICAL PROFILE
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div><span style={{ color: '#ffcc00' }}>TRAUMA:</span> Childhood abuse / violence / powerlessness</div>
            <div><span style={{ color: '#ffcc00' }}>COPING:</span> Athletic achievement / peer validation / denial</div>
            <div><span style={{ color: '#ffcc00' }}>SYMPTOMS:</span> Hypervigilance, fear of failure, hidden shame</div>
            <div><span style={{ color: '#ffcc00' }}>MANIFESTATION:</span> Flashbacks to abuse (Entity exploited)</div>
            <div style={{ color: dimColor, marginTop: '8px', fontStyle: 'italic' }}>
              Subject channeled trauma into athletic excellence.
              Outward success masked inner suffering. Classic trauma response.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ff6666', marginBottom: '8px', fontSize: '13px' }}>
            ■ DEATH INCIDENT REPORT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ff9999' }}>
            <div>24-MAR-86 20:45 | Subject with Carver hunting party at Lover's Lake</div>
            <div>24-MAR-86 21:00 | Located Munson in boat on lake</div>
            <div>24-MAR-86 21:10 | Subject began experiencing symptoms (headaches, visions)</div>
            <div>24-MAR-86 21:12 | ANOMALOUS EVENT INITIATED in water</div>
            <div>24-MAR-86 21:15 | DEATH: Levitation over water, skeletal inversion</div>
            <div style={{ color: '#ff6666', marginTop: '8px' }}>
              ▶ CAUSE OF DEATH: ENTITY 001 PSYCHIC ATTACK<br/>
              ▶ WITNESSES: Jason Carver, Edward Munson, others<br/>
              ▶ NOTE: First victim killed in front of multiple witnesses
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#cc6666', marginBottom: '8px', fontSize: '13px' }}>
            ■ AFTERMATH / WITNESS RESPONSE
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ color: '#ff9999' }}>
              Jason Carver witnessed death directly but attributed it to
              Munson's "satanic powers." Subject's death escalated vigilante
              violence and further reinforced satanic panic narrative.
            </div>
            <div style={{ marginTop: '8px', color: dimColor }}>
              <div>▶ Carver's mental state: DESTABILIZED</div>
              <div>▶ Vigilante activity: INTENSIFIED</div>
              <div>▶ Public narrative: "Satanic cult murder"</div>
              <div>▶ True cause: CLASSIFIED / ENTITY 001</div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#cc6666', marginBottom: '8px', fontSize: '13px' }}>
            ■ ENTITY 001 TARGETING ANALYSIS
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ color: '#ff9999' }}>
              Pattern confirmed across all three victims: childhood trauma,
              hidden pain, guilt or shame. Entity 001 feeds on suffering,
              exploits memories, amplifies fear until terminal psychic event.
            </div>
            <div style={{ marginTop: '8px', color: dimColor }}>
              <div>▶ TRAUMA TYPE: Abuse / violence / helplessness</div>
              <div>▶ EXPLOITATION METHOD: Visions of father, reliving beatings</div>
              <div>▶ TIME TO KILL: Estimated 48-72 hours from first contact</div>
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#ff6666', textAlign: 'center' }}>
            DESIGNATION: "VICTIM THREE" | STATUS: DECEASED / CASE CLASSIFIED
          </div>
        </div>
      </div>
    </div>
  );

  const renderKaren = () => (
    <div style={{ color: '#cc9999', fontSize: '13px' }}>
      <div style={{
        border: '2px solid #cc9999',
        padding: '20px',
        background: 'rgba(204,153,153,0.05)',
        position: 'relative',
      }}>
        <pre style={{ color: '#cc9999', marginBottom: '15px', fontSize: '12px', lineHeight: '1.2' }}>
{`╔═══════════════════════════════════════════════════════════╗
║         DOE SURVEILLANCE FILE: KAREN WHEELER              ║
║         STATUS: ACTIVE | PRIORITY: LOW                    ║
╚═══════════════════════════════════════════════════════════╝`}
        </pre>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: '1px solid #cc9999',
            background: '#1a1210',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src="/karen.jpeg"
              alt="Karen Wheeler"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
          </div>
          <div style={{ flex: 1, fontSize: '12px' }}>
            <div style={{ color: '#cc9999', fontSize: '16px', marginBottom: '8px' }}>
              <span style={{ color: '#cc9999' }}>KAREN WHEELER</span>
            </div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>AGE: </span>40</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>STATUS: </span>ACTIVE / MONITORED</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>OCCUPATION: </span>HOMEMAKER</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>RESIDENCE: </span>MAPLE STREET, HAWKINS</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SPOUSE: </span>TED WHEELER</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>CLEARANCE: </span>NONE</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#cc9999', marginBottom: '8px', fontSize: '13px' }}>
            ■ FAMILY UNIT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SPOUSE: </span>TED WHEELER (SEE FILE: TED)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>DAUGHTER: </span><span style={{ color: '#ff99cc' }}>NANCY WHEELER</span> (SEE FILE: NANCY)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SON: </span><span style={{ color: '#ffcc00' }}>MIKE WHEELER</span> (SEE FILE: MIKE)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>DAUGHTER: </span>HOLLY WHEELER (MINOR - NO FILE)</div>
            <div style={{ fontSize: '12px', color: dimColor, borderTop: `1px solid ${borderColor}`, paddingTop: '6px', marginTop: '6px' }}>
              Wheeler residence identified as primary meeting location for
              individuals connected to multiple Hawkins anomalies. Subject
              appears unaware of children's involvement in classified events.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#cc9999', marginBottom: '8px', fontSize: '13px' }}>
            ■ PSYCHOLOGICAL PROFILE
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div><span style={{ color: '#ffcc00' }}>PERSONALITY:</span> Nurturing, domestic, emotionally unfulfilled</div>
            <div><span style={{ color: '#ffcc00' }}>MARITAL STATUS:</span> Married - emotionally disconnected from spouse</div>
            <div><span style={{ color: '#ffcc00' }}>AWARENESS:</span> Low - maintains willful ignorance of family activities</div>
            <div><span style={{ color: '#ffcc00' }}>THREAT LEVEL:</span> Negligible</div>
            <div style={{ color: dimColor, marginTop: '8px', fontStyle: 'italic' }}>
              Subject exhibits signs of suburban ennui. Married young,
              devoted to family, yet appears to yearn for excitement
              beyond domestic routine. Emotionally neglected by spouse.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ff9966', marginBottom: '8px', fontSize: '13px' }}>
            ■ FLAGGED INCIDENT: HARGROVE CONTACT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ffcc99' }}>
            <div style={{ marginBottom: '8px' }}>
              ▶ SUBJECT: BILLY HARGROVE (SEE FILE: BILLY)<br/>
              ▶ NATURE: Inappropriate personal interest<br/>
              ▶ DATE: Summer 1985<br/>
              ▶ STATUS: Contact never actualized
            </div>
            <div style={{ color: dimColor }}>
              Subject displayed visible attraction to Hargrove, B. during pool
              encounters. Hargrove reciprocated with calculated flirtation.
              Relationship did not progress beyond suggestive exchanges.
              Subject appeared to experience internal conflict re: marital vows.
            </div>
            <div style={{ marginTop: '8px', color: '#ff9966' }}>
              NOTE: Hargrove subsequently compromised by Mind Flayer entity.
              Any continued contact could have resulted in subject's infection.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#cc9999', marginBottom: '8px', fontSize: '13px' }}>
            ■ INCIDENT AWARENESS ASSESSMENT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#66ff66' }}>1983 BYERS INCIDENT:</span> Minimal awareness. Accepted cover story.
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#66ff66' }}>1984 LAB CLOSURE:</span> No awareness. No questions asked.
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#ffcc00' }}>1985 MALL INCIDENT:</span> Accepted "fire" narrative. Did not investigate.
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#ffcc00' }}>1986 EARTHQUAKE:</span> Currently accepting geological explanation.
            </div>
            <div style={{ color: dimColor, marginTop: '8px' }}>
              Subject demonstrates remarkable capacity for denial. Multiple
              incidents involving her children have failed to trigger investigation.
              Psychological defense mechanism: "If I don't look, it's not real."
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#cc9999', marginBottom: '8px', fontSize: '13px' }}>
            ■ DOE SURVEILLANCE LOG
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div>06-NOV-83 | Son harboring fugitive (Subject 011). Mother unaware.</div>
            <div>04-JUL-85 | Near-contact with infected Hargrove. Lucky escape.</div>
            <div>04-JUL-85 | Children absent during Starcourt incident. No questions.</div>
            <div>22-MAR-86 | Daughter involved in Creel investigation. No parental inquiry.</div>
            <div>26-MAR-86 | Son missing during earthquake. Minimal panic observed.</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            ■ CONTAINMENT ASSESSMENT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ color: baseColor }}>
              Subject poses no threat to operational security. Natural tendency
              toward denial and avoidance makes her ideal as unwitting host
              household for monitored individuals. Recommend continued
              passive observation only.
            </div>
            <div style={{ marginTop: '8px', color: dimColor }}>
              Her children are deeply involved in classified events. She
              remains oblivious. This is... perhaps for the best.
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: dimColor, textAlign: 'center' }}>
            DESIGNATION: "THE SUBURBAN MOTHER" | STATUS: BLISSFULLY UNAWARE
          </div>
        </div>
      </div>
    </div>
  );

  const renderTed = () => (
    <div style={{ color: '#999966', fontSize: '13px' }}>
      <div style={{
        border: '2px solid #999966',
        padding: '20px',
        background: 'rgba(153,153,102,0.05)',
        position: 'relative',
      }}>
        {/* Sleeping indicator */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '4px 12px',
          background: '#1a1a11',
          border: '1px solid #999966',
          color: '#cccc99',
          fontSize: '11px',
        }}>
          STATUS: PROBABLY ASLEEP
        </div>

        <pre style={{ color: '#999966', marginBottom: '15px', fontSize: '12px', lineHeight: '1.2' }}>
{`╔═══════════════════════════════════════════════════════════╗
║          DOE SURVEILLANCE FILE: TED WHEELER               ║
║          STATUS: ACTIVE | PRIORITY: NEGLIGIBLE            ║
╚═══════════════════════════════════════════════════════════╝`}
        </pre>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: '1px solid #999966',
            background: '#12120a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src="/ted.jpeg"
              alt="Ted Wheeler"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(30deg)',
                mixBlendMode: 'screen',
              }}
            />
          </div>
          <div style={{ flex: 1, fontSize: '12px' }}>
            <div style={{ color: '#999966', fontSize: '16px', marginBottom: '8px' }}>
              <span style={{ color: '#999966' }}>TED WHEELER</span>
            </div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>AGE: </span>45</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>STATUS: </span>ACTIVE / UNMONITORED</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>OCCUPATION: </span>████████ (UNREMARKABLE)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>RESIDENCE: </span>MAPLE STREET, HAWKINS</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SPOUSE: </span>KAREN WHEELER</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>THREAT LEVEL: </span>NONE</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#999966', marginBottom: '8px', fontSize: '13px' }}>
            ■ FAMILY UNIT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SPOUSE: </span>KAREN WHEELER (SEE FILE: KAREN)</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>DAUGHTER: </span><span style={{ color: '#ff99cc' }}>NANCY WHEELER</span></div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SON: </span><span style={{ color: '#ffcc00' }}>MIKE WHEELER</span></div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>DAUGHTER: </span>HOLLY WHEELER</div>
            <div style={{ fontSize: '12px', color: dimColor, borderTop: `1px solid ${borderColor}`, paddingTop: '6px', marginTop: '6px' }}>
              Subject is father of two individuals heavily involved in
              Hawkins anomalies. Demonstrates zero awareness of their activities.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#999966', marginBottom: '8px', fontSize: '13px' }}>
            ■ PSYCHOLOGICAL PROFILE
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div><span style={{ color: '#ffcc00' }}>PERSONALITY:</span> Passive, disengaged, remarkably oblivious</div>
            <div><span style={{ color: '#ffcc00' }}>INTERESTS:</span> Television, newspaper, La-Z-Boy recliner, snacks</div>
            <div><span style={{ color: '#ffcc00' }}>AWARENESS:</span> Approaching zero</div>
            <div><span style={{ color: '#ffcc00' }}>PARENTAL INVOLVEMENT:</span> Minimal to nonexistent</div>
            <div style={{ color: dimColor, marginTop: '8px', fontStyle: 'italic' }}>
              Subject represents the archetypal disengaged father figure.
              Prioritizes personal comfort over family engagement. Children
              could be fighting interdimensional monsters in the next room
              and subject would not notice. This is not hyperbole.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#999966', marginBottom: '8px', fontSize: '13px' }}>
            ■ NOTABLE BEHAVIORAL PATTERNS
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '8px', color: '#cccc99' }}>
              <div>▶ Falls asleep in recliner: DAILY (multiple times)</div>
              <div>▶ Reads newspaper at dinner: CONSTANT</div>
              <div>▶ Notices children's activities: NEVER</div>
              <div>▶ Asks meaningful questions: RARE</div>
              <div>▶ Provides useful information: NONE ON RECORD</div>
            </div>
            <div style={{ color: dimColor }}>
              When government agents visited home seeking information about
              children's whereabouts, subject offered them KFC chicken.
              Demonstrated no suspicion. No follow-up questions. Continued eating.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#999966', marginBottom: '8px', fontSize: '13px' }}>
            ■ INCIDENT AWARENESS ASSESSMENT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#66ff66' }}>1983 BYERS INCIDENT:</span> "What Byers incident?"
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#66ff66' }}>SON HARBORING FUGITIVE:</span> Completely unaware
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#66ff66' }}>DAUGHTER INVESTIGATING MURDERS:</span> "She's probably at the library"
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#66ff66' }}>1985 STARCOURT:</span> "There was a fire at the mall?"
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#66ff66' }}>1986 EARTHQUAKE:</span> Slept through initial tremors
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#999966', marginBottom: '8px', fontSize: '13px' }}>
            ■ FIELD OBSERVATIONS
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', fontStyle: 'italic', color: dimColor }}>
            <div>"I don't know what you want me to say. I'm just a dad."</div>
            <div style={{ marginTop: '6px' }}>"Language!" (only recorded disciplinary action)</div>
            <div style={{ marginTop: '6px' }}>"What did I do?" (when accused of anything)</div>
            <div style={{ marginTop: '6px' }}>"Karen, where are the kids?" "They left three hours ago, Ted."</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            ■ INTELLIGENCE VALUE ASSESSMENT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ color: baseColor }}>
              Subject has no intelligence value. Interrogation would be
              fruitless as subject possesses no information about anything.
              He genuinely does not know what his children do. Ever.
            </div>
            <div style={{ marginTop: '8px', color: '#cccc99' }}>
              DOE ANALYST NOTE: We considered surveillance but concluded
              it would be a waste of resources. Subject's obliviousness is
              so complete it borders on supernatural. Recommend: ignore.
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: dimColor, textAlign: 'center' }}>
            DESIGNATION: "THE OBLIVIOUS FATHER" | STATUS: ASLEEP / EATING
          </div>
        </div>
      </div>
    </div>
  );

  const renderJason = () => (
    <div style={{ color: '#cc6633', fontSize: '13px' }}>
      <div style={{
        border: '2px solid #cc6633',
        padding: '20px',
        background: 'rgba(204,102,51,0.05)',
        position: 'relative',
      }}>
        {/* Status indicator */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '4px 12px',
          background: '#331100',
          border: '1px solid #ff6633',
          color: '#ff6633',
          fontSize: '11px',
          animation: 'blink 1.5s infinite',
        }}>
          ⚠ DECEASED - GATE PROXIMITY EVENT
        </div>

        <pre style={{ color: '#cc6633', marginBottom: '15px', fontSize: '12px', lineHeight: '1.2' }}>
{`╔═══════════════════════════════════════════════════════════╗
║         DOE SURVEILLANCE FILE: JASON CARVER               ║
║         STATUS: DECEASED | THREAT LEVEL: [REDACTED]       ║
╚═══════════════════════════════════════════════════════════╝`}
        </pre>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: '1px solid #cc6633',
            background: '#1a0d05',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src="/jason.jpeg"
              alt="Jason Carver"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(5deg)',
                mixBlendMode: 'screen',
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(0,0,0,0.8)',
              padding: '2px',
              fontSize: '8px',
              textAlign: 'center',
              color: '#ff6633',
            }}>
              26-MAR-86
            </div>
          </div>
          <div style={{ flex: 1, fontSize: '12px' }}>
            <div style={{ color: '#cc6633', fontSize: '16px', marginBottom: '8px' }}>
              <span style={{ color: '#cc6633' }}>JASON CARVER</span>
            </div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>AGE: </span>18</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#ff6633' }}>DECEASED</span></div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>DEATH: </span>26-MAR-86 21:35 EST</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>CAUSE: </span>DIMENSIONAL RIFT BISECTION</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>SCHOOL: </span>HAWKINS HIGH SCHOOL</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>POSITION: </span>BASKETBALL CAPTAIN / STAR PLAYER</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: dimColor }}>RELATIONSHIP: </span>CHRISSY CUNNINGHAM (GIRLFRIEND - DECEASED)</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#cc6633', marginBottom: '8px', fontSize: '13px' }}>
            ■ BACKGROUND
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            <div>Star athlete. Team captain. State championship winner.</div>
            <div>Popular, charismatic, natural leader among peers.</div>
            <div>Devout Christian. Strong moral convictions (self-perceived).</div>
            <div style={{ color: dimColor, marginTop: '6px' }}>
              Subject exhibited textbook "golden boy" profile prior to
              Cunningham incident. Subsequent psychological deterioration
              was rapid and severe.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#cc6633', marginBottom: '8px', fontSize: '13px' }}>
            ■ PSYCHOLOGICAL PROFILE
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div><span style={{ color: '#ffcc00' }}>PRE-INCIDENT:</span> Confident, driven, morally rigid, protective</div>
            <div><span style={{ color: '#ffcc00' }}>POST-INCIDENT:</span> Obsessive, paranoid, violent, delusional</div>
            <div><span style={{ color: '#ffcc00' }}>GRIEF RESPONSE:</span> Externalized - sought vengeance over processing</div>
            <div><span style={{ color: '#ffcc00' }}>FINAL STATE:</span> Complete psychological break from reality</div>
            <div style={{ color: dimColor, marginTop: '8px', fontStyle: 'italic' }}>
              Subject's worldview was black and white: good vs evil, saved vs damned.
              When confronted with inexplicable supernatural death of girlfriend,
              he rejected reality and constructed satanic conspiracy narrative.
              Easier to believe in devils than admit the universe is chaos.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ff6633', marginBottom: '8px', fontSize: '13px' }}>
            ■ CUNNINGHAM DEATH RESPONSE
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ffcc99' }}>
            <div style={{ marginBottom: '8px' }}>
              ▶ INITIAL REACTION: Denial, then rage<br/>
              ▶ TARGET IDENTIFIED: Edward Munson (Hellfire Club)<br/>
              ▶ NARRATIVE ADOPTED: Satanic ritual murder<br/>
              ▶ ACTION TAKEN: Formed vigilante hunting party
            </div>
            <div style={{ color: dimColor }}>
              Subject immediately blamed Munson despite lack of evidence.
              Leveraged Satanic Panic atmosphere to recruit followers.
              Transformed grief into crusade. Very dangerous combination.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#cc6633', marginBottom: '8px', fontSize: '13px' }}>
            ■ VIGILANTE ACTIVITIES
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '8px', color: '#ffcc99' }}>
              <div>22-MAR-86 | Assembled hunting party from basketball team</div>
              <div>23-MAR-86 | Assaulted known Hellfire Club members seeking info</div>
              <div>23-MAR-86 | Confronted band members, physically violent</div>
              <div>24-MAR-86 | Tracked Munson to Lover's Lake</div>
              <div>24-MAR-86 | WITNESSED MCKINNEY DEATH (see: PATRICK)</div>
              <div>26-MAR-86 | Town hall speech inciting mob violence</div>
              <div>26-MAR-86 | Armed assault on Creel House</div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ff3300', marginBottom: '8px', fontSize: '13px' }}>
            ■ LOVER'S LAKE INCIDENT - PSYCHOLOGICAL BREAK
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ff9999' }}>
            <div style={{ marginBottom: '8px' }}>
              Subject witnessed teammate Patrick McKinney killed by Entity 001.
              Death occurred mid-lake: levitation, skeletal inversion, identical
              to Cunningham and Benson deaths.
            </div>
            <div style={{ color: '#ff6633' }}>
              Subject's reaction: Rather than accept supernatural cause, doubled
              down on satanic narrative. Concluded Munson possessed demonic
              powers. Mental state deteriorated from grief to psychosis.
            </div>
            <div style={{ marginTop: '8px', color: dimColor }}>
              NOTE: Subject was feet away from Patrick during death. No
              rational person could witness this and maintain natural
              explanation. Subject was no longer rational.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ff3300', marginBottom: '8px', fontSize: '13px' }}>
            ■ FINAL INCIDENT - CREEL HOUSE
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ff9999' }}>
            <div>26-MAR-86 21:00 | Subject located Creel House (active operation site)</div>
            <div>26-MAR-86 21:15 | Armed entry with intent to kill Munson</div>
            <div>26-MAR-86 21:20 | Discovered SINCLAIR, LUCAS guarding MAYFIELD, MAX</div>
            <div>26-MAR-86 21:25 | Physical assault on Sinclair</div>
            <div>26-MAR-86 21:30 | <span style={{ color: '#ff3300' }}>DESTROYED AUDIO DEVICE (KATE BUSH TAPE)</span></div>
            <div>26-MAR-86 21:32 | Mayfield protective measure interrupted - VECNA ATTACK</div>
            <div>26-MAR-86 21:35 | DIMENSIONAL GATE OPENED BENEATH SUBJECT</div>
            <div>26-MAR-86 21:35 | SUBJECT BISECTED BY GATE FORMATION</div>
            <div style={{ color: '#ff3300', marginTop: '8px' }}>
              ▶ CAUSE OF DEATH: Torn apart by opening dimensional rift<br/>
              ▶ IMMEDIATE EFFECT: His actions directly enabled Vecna's attack on Max<br/>
              ▶ IRONY: Died by supernatural force he refused to believe existed
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#cc6633', marginBottom: '8px', fontSize: '13px' }}>
            ■ OPERATIONAL IMPACT ASSESSMENT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ color: '#ff6633', marginBottom: '8px' }}>
              Subject's interference at Creel House directly contributed to
              near-fatal attack on Mayfield, Max and opening of Gates across Hawkins.
            </div>
            <div style={{ color: dimColor }}>
              <div>▶ Destroyed protective countermeasure (music) during active rescue</div>
              <div>▶ Assault on Sinclair prevented defense of Mayfield</div>
              <div>▶ Entity 001 completed fourth kill (initially) due to interruption</div>
              <div>▶ Four Gates opened simultaneously, devastating Hawkins</div>
            </div>
            <div style={{ marginTop: '8px', color: '#ffcc00' }}>
              Had subject not interfered, Mayfield might not have been attacked.
              Gates might not have opened. Hawkins might not have been destroyed.
              Subject's blind vengeance had catastrophic consequences.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#cc6633', marginBottom: '8px', fontSize: '13px' }}>
            ■ DOE ANALYST NOTES
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', fontStyle: 'italic', color: dimColor }}>
            <div>
              Subject is a tragic case study in how grief, certainty, and
              religious fervor can combine into destructive force. He genuinely
              believed he was fighting evil. He was wrong about everything.
            </div>
            <div style={{ marginTop: '8px' }}>
              The real monster was invisible to him. He chose a human scapegoat
              because humans can be fought. Fought the wrong battle. Lost everything.
            </div>
            <div style={{ marginTop: '8px', color: '#ff9966' }}>
              Perhaps cruelest irony: Chrissy was in Eddie's trailer buying drugs.
              She had secrets Jason never knew. His perfect girlfriend, his
              perfect world - none of it was real. And he died never knowing.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            ■ CLASSIFICATION
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ color: baseColor }}>
              Subject simultaneously victim and perpetrator. Manipulated by
              circumstances beyond his comprehension. Actions caused immense
              harm. Death was violent but arguably... fitting.
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#ff6633', textAlign: 'center' }}>
            DESIGNATION: "THE CRUSADER" | STATUS: DECEASED / COLLATERAL
          </div>
        </div>
      </div>
    </div>
  );

  const renderAlexei = () => (
    <div style={{ color: '#00cccc', fontSize: isMobile ? '11px' : '14px' }}>
      <div style={{
        border: '2px solid #00cccc',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(0,204,204,0.05)',
        position: 'relative',
      }}>
        {/* Status indicator */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '4px 12px',
          background: '#001a1a',
          border: '1px solid #ff6666',
          color: '#ff6666',
          fontSize: isMobile ? '8px' : '11px',
        }}>
          ✝ DECEASED - KIA (STARCOURT)
        </div>

        {!isMobile && (
          <pre style={{ color: '#00cccc', marginBottom: '15px', fontSize: '12px', lineHeight: '1.2' }}>
{`╔═══════════════════════════════════════════════════════════╗
║     DOE INTELLIGENCE FILE: ALEXEI ████████████            ║
║     SOVIET DEFECTOR | STATUS: DECEASED                    ║
╚═══════════════════════════════════════════════════════════╝`}
          </pre>
        )}

        <div style={{ display: 'flex', gap: isMobile ? '8px' : '12px', marginBottom: isMobile ? '8px' : '12px' }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: '1px solid #00cccc',
            background: '#001a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src="/alexei.jpeg"
              alt="Alexei"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(150deg)',
                mixBlendMode: 'screen',
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(0,0,0,0.8)',
              padding: '2px',
              fontSize: '8px',
              textAlign: 'center',
              color: '#ff6666',
            }}>
              04-JUL-85
            </div>
          </div>
          <div style={{ flex: 1, fontSize: isMobile ? '10px' : '13px' }}>
            <div style={{ color: '#00cccc', fontSize: isMobile ? '13px' : '16px', marginBottom: isMobile ? '6px' : '8px' }}>
              <span style={{ color: '#00cccc' }}>ALEXEI</span> {!isMobile && <span style={{ color: dimColor, fontSize: '12px' }}>(SURNAME CLASSIFIED)</span>}
            </div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>ALIAS: </span>{isMobile ? 'SMIRNOFF' : '"SMIRNOFF" (US CONTACT DESIGNATION)'}</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>NATIONALITY: </span>SOVIET (USSR)</div>
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#ff6666' }}>DECEASED</span></div>
            {!isMobile && <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>DEATH: </span>04-JUL-85 ~21:00 EST</div>}
            <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>OCCUPATION: </span>{isMobile ? 'PHYSICIST' : 'PHYSICIST / ENGINEER'}</div>
            {!isMobile && <div style={{ marginBottom: '3px' }}><span style={{ color: dimColor }}>CLEARANCE: </span>SOVIET LEVEL 4 (EQUIVALENT)</div>}
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#00cccc', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ BACKGROUND
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div style={{ color: '#99ffff' }}>
              Soviet scientist assigned to clandestine operation beneath Starcourt
              Mall, Hawkins, Indiana. Specialist in dimensional physics and
              electromagnetic field manipulation. Key member of Soviet team
              attempting to reopen interdimensional Gate.
            </div>
            <div style={{ marginTop: '8px', color: dimColor }}>
              Subject possessed detailed knowledge of Soviet Gate technology,
              Key device configurations, and operational security protocols.
              Intelligence value: EXTREMELY HIGH.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#00cccc', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '10px' : '13px' }}>
            ■ DEFECTION CIRCUMSTANCES
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '8px', color: '#99ffff' }}>
              <div>03-JUL-85 | Captured by Chief Hopper and Joyce Byers</div>
              <div>03-JUL-85 | Initial interrogation (language barrier)</div>
              <div>03-JUL-85 | Transferred to Bauman residence for translation</div>
              <div>04-JUL-85 | Full debrief via Murray Bauman (Russian fluent)</div>
              <div>04-JUL-85 | Provided complete intelligence on Soviet operation</div>
            </div>
            <div style={{ color: dimColor }}>
              Subject was not ideologically motivated defector. Appeared genuinely
              frightened of Soviet handlers. Cooperated fully once safety assured.
              Displayed childlike enthusiasm for American consumer products.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ff6666', marginBottom: '8px', fontSize: '13px' }}>
            ■ INTELLIGENCE PROVIDED
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ffcc99' }}>
            <div style={{ marginBottom: '8px' }}>
              ▶ Soviet operation codenamed "КЛЮЧ" (KEY)<br/>
              ▶ Underground facility beneath Starcourt Mall<br/>
              ▶ Objective: Reopen interdimensional Gate<br/>
              ▶ "The Key" - massive electromagnetic device<br/>
              ▶ Requires sustained power from Hawkins grid<br/>
              ▶ Gate location: same as 1983 Hawkins Lab breach
            </div>
            <div style={{ color: '#ffcc00' }}>
              Subject explained Soviets learned of American Gate experiments
              and sought to replicate. Hawkins location chosen specifically
              because dimensional barrier already weakened by previous breach.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#00cccc', marginBottom: '8px', fontSize: '13px' }}>
            ■ PSYCHOLOGICAL PROFILE
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div><span style={{ color: '#ffcc00' }}>PERSONALITY:</span> Intelligent, curious, childlike wonder</div>
            <div><span style={{ color: '#ffcc00' }}>DEMEANOR:</span> Non-threatening, eager to please, easily delighted</div>
            <div><span style={{ color: '#ffcc00' }}>MOTIVATION:</span> Self-preservation initially, genuine affection later</div>
            <div><span style={{ color: '#ffcc00' }}>THREAT LEVEL:</span> None (post-defection)</div>
            <div style={{ color: dimColor, marginTop: '8px', fontStyle: 'italic' }}>
              Despite working on weapons program capable of ending civilization,
              subject displayed remarkable innocence. Appeared more interested
              in American cartoons and frozen beverages than geopolitics.
              A scientist, not a soldier.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#00cccc', marginBottom: '8px', fontSize: '13px' }}>
            ■ NOTABLE BEHAVIORAL OBSERVATIONS
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '8px', color: '#99ffff' }}>
              <div>▶ SLURPEE PREFERENCE: Cherry (NOT strawberry - very specific)</div>
              <div>▶ TELEVISION: Obsessed with "Looney Tunes" / Woody Woodpecker</div>
              <div>▶ CARNIVAL GAMES: Displayed genuine joy at Fun Fair</div>
              <div>▶ Won large stuffed animal (Woody Woodpecker)</div>
              <div>▶ Laughed freely - possibly first time in years</div>
            </div>
            <div style={{ color: dimColor }}>
              Murray Bauman noted: "He's like a kid who's never been allowed
              to play. Give him a cherry Slurpee and he's your best friend."
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#ff3300', marginBottom: '8px', fontSize: '13px' }}>
            ■ DEATH INCIDENT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ff9999' }}>
            <div>04-JUL-85 ~20:30 | Subject at Hawkins Fun Fair with Bauman</div>
            <div>04-JUL-85 ~20:45 | Won carnival game, appeared genuinely happy</div>
            <div>04-JUL-85 ~21:00 | Soviet operative "GRIGORI" located subject</div>
            <div>04-JUL-85 ~21:00 | Subject shot in chest at close range</div>
            <div>04-JUL-85 ~21:01 | DECEASED - died in Bauman's arms</div>
            <div style={{ color: '#ff3300', marginTop: '8px' }}>
              ▶ CAUSE OF DEATH: Gunshot wound (Soviet assassination)<br/>
              ▶ KILLER: Grigori (Soviet operative - later KIA by Hopper)<br/>
              ▶ LOCATION: Hawkins Fun Fair - Independence Day celebration<br/>
              ▶ IRONY: Killed on American Independence Day
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#00cccc', marginBottom: '8px', fontSize: '13px' }}>
            ■ RELATIONSHIPS
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>• <span style={{ color: '#ffcc00' }}>MURRAY BAUMAN</span> - Translator / Protector / Friend</div>
            <div>• CHIEF HOPPER - Captor → Reluctant ally</div>
            <div>• JOYCE BYERS - Initially hostile, later sympathetic</div>
            <div style={{ color: dimColor, marginTop: '8px' }}>
              Bauman and Alexei developed genuine rapport despite circumstances.
              Bauman was visibly devastated by Alexei's death. Called him
              "the only good thing to come out of this whole mess."
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: '#00cccc', marginBottom: '8px', fontSize: '13px' }}>
            ■ NOTABLE QUOTES (VIA TRANSLATION)
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6', fontStyle: 'italic', color: dimColor }}>
            <div>"It's cherry. I want cherry. Not strawberry. CHERRY."</div>
            <div style={{ marginTop: '6px' }}>"Woody... Woodpecker!" *laughs at television*</div>
            <div style={{ marginTop: '6px' }}>"America is... very loud. But the Slurpees are good."</div>
            <div style={{ marginTop: '6px' }}>"I am scientist. I just want to see what is on other side."</div>
            <div style={{ marginTop: '6px' }}>"I think... I like it here." (final recorded statement)</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ color: baseColor, marginBottom: '8px', fontSize: '13px' }}>
            ■ LEGACY ASSESSMENT
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ color: baseColor }}>
              Subject's intelligence was crucial to understanding and ultimately
              stopping Soviet operation. Without his cooperation, Gate would
              have fully opened with catastrophic consequences.
            </div>
            <div style={{ marginTop: '8px', color: '#99ffff' }}>
              He betrayed his country to help strangers. He died for it.
              He spent his last day happy, eating fair food and winning prizes.
              Perhaps that's the best anyone can hope for.
            </div>
            <div style={{ marginTop: '8px', color: dimColor }}>
              Cherry Slurpee consumption at 7-Eleven Hawkins location increased
              47% following incident. Coincidence unclear.
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#00cccc', textAlign: 'center' }}>
            DESIGNATION: "SMIRNOFF" | STATUS: DECEASED / HERO
          </div>
        </div>
      </div>
    </div>
  );

  const renderDemogorgon = () => (
    <div style={{ color: '#ff3300', fontSize: isMobile ? '11px' : '13px' }}>
      <div style={{
        border: '2px solid #ff3300',
        padding: isMobile ? '12px' : '20px',
        background: 'rgba(255,51,0,0.05)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Blood splatter effect */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(ellipse at 30% 20%, rgba(139,0,0,0.3) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(139,0,0,0.2) 0%, transparent 40%)',
          pointerEvents: 'none',
        }} />

        {/* Threat indicator */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '4px 12px',
          background: '#1a0000',
          border: '1px solid #ff3300',
          color: '#ff3300',
          fontSize: '11px',
          animation: 'blink 0.8s infinite',
          zIndex: 5,
        }}>
          ⚠ CONTAINMENT BREACH
        </div>

        {!isMobile && (
          <pre style={{ color: '#ff3300', marginBottom: '15px', fontSize: '12px', lineHeight: '1.2', position: 'relative', zIndex: 2 }}>
{`╔═══════════════════════════════════════════════════════════╗
║     DOE CLASSIFIED FILE: EXTRADIMENSIONAL PREDATOR        ║
║     CODENAME: "DEMOGORGON" | STATUS: NEUTRALIZED          ║
╚═══════════════════════════════════════════════════════════╝`}
          </pre>
        )}
        {isMobile && (
          <div style={{ color: '#ff3300', marginBottom: '10px', fontSize: '11px', position: 'relative', zIndex: 2, textAlign: 'center', fontWeight: 'bold' }}>
            ◢ PREDATOR: "DEMOGORGON" ◣
          </div>
        )}

        {!isMobile && (
          <pre style={{
            fontSize: '8px',
            lineHeight: '1',
            display: 'block',
            textAlign: 'center',
            color: '#ff3300',
            textShadow: '0 0 10px #ff3300',
            marginBottom: '20px',
            position: 'relative',
            zIndex: 2,
          }}>
{`                    ▄▄▄████▄▄▄
                ▄██▀▀       ▀▀██▄
              ▄█▀   ▄▄███▄▄   ▀█▄
            ▄█▀  ▄██▀▀▀▀▀▀██▄  ▀█▄
           ██  ▄█▀ ▄▀▀▀▀▄ ▀█▄  ██
          ██  ██  █ ▄██▄ █  ██  ██
         ██  ██   █ ████ █   ██  ██
         █▌  █▌   ▀▄▀▀▀▄▀   ▐█  ▐█
         █▌  █▌    ▀████▀    ▐█  ▐█
         ██  ██   ▄██████▄   ██  ██
          ██  ██ ██▀▄▄▄▄▀██ ██  ██
           ██  ▀███▄▄▄▄███▀  ██
            ▀█▄   ▀▀▀▀▀▀   ▄█▀
              ▀█▄▄       ▄▄█▀
                 ▀▀█████▀▀`}
          </pre>
        )}

        <div style={{ display: 'flex', gap: isMobile ? '10px' : '20px', marginBottom: isMobile ? '10px' : '15px', position: 'relative', zIndex: 2 }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: '1px solid #ff3300',
            background: '#1a0000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src="/demogorgon.jpeg"
              alt="Demogorgon"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.7) contrast(1.3) hue-rotate(-10deg)',
                mixBlendMode: 'screen',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div style={{
              display: 'none',
              color: '#ff3300',
              fontSize: '8px',
              textAlign: 'center',
              padding: '10px',
            }}>
              [SPECIMEN<br/>DESTROYED]<br/><br/>
              <span style={{ animation: 'blink 1s infinite' }}>✕ ✕ ✕</span>
            </div>
          </div>
          <div style={{ flex: 1, fontSize: isMobile ? '10px' : '12px' }}>
            <div style={{ color: '#ff3300', fontSize: isMobile ? '13px' : '16px', marginBottom: isMobile ? '6px' : '8px' }}>
              <span style={{ color: '#ff6600' }}>THE DEMOGORGON</span> / <span style={{ color: dimColor }}>SPECIMEN 01</span>
            </div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>CLASSIFICATION: </span>EXTRADIMENSIONAL PREDATOR</div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>ORIGIN: </span>THE UPSIDE DOWN</div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>FIRST CONTACT: </span>06-NOV-1983</div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>HEIGHT: </span>APPROX. 7-8 FEET</div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#66ff66' }}>NEUTRALIZED (DEC 1983)</span></div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>THREAT LEVEL: </span><span style={{ color: '#ff3300' }}>EXTREME</span></div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px', position: 'relative', zIndex: 2 }}>
          <div style={{ color: '#ff6600', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ PHYSICAL CHARACTERISTICS
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6', color: dimColor }}>
            Humanoid bipedal creature. Most distinctive feature: head opens into five "petals"
            revealing circular mouth with multiple rows of teeth. No visible eyes or facial features.
            Skin appears grey/brown, almost decayed. Extremely strong and fast despite apparent decay.
            Can generate extreme temperatures - areas around attacks show frost damage.
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px', position: 'relative', zIndex: 2 }}>
          <div style={{ color: '#ff6600', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ HUNTING BEHAVIOR
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '8px', color: '#ff9999' }}>
              Creature attracted to BLOOD. Even microscopic amounts can draw it across dimensional barrier.
              Attacks are primarily nocturnal but not exclusively. Demonstrates ability to:
            </div>
            <div style={{ color: baseColor }}>
              • Create temporary portals between dimensions<br/>
              • Phase through walls/solid matter<br/>
              • Track prey across significant distances<br/>
              • Drag victims into the Upside Down<br/>
              • Store living prey in organic cocoons for later consumption
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px', position: 'relative', zIndex: 2 }}>
          <div style={{ color: '#ff6600', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ CONFIRMED VICTIMS (HAWKINS INCIDENT 1983)
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6', color: '#ff9999' }}>
            <div>• BYERS, WILL - Abducted 06-NOV-83 (RECOVERED ALIVE)</div>
            <div>• HOLLAND, BARBARA - Abducted 07-NOV-83 (DECEASED - body recovered)</div>
            <div>• SHEPARD, DALE - Researcher, Lab Sublevel 3 (DECEASED)</div>
            <div>• 6+ additional lab personnel (DECEASED)</div>
            <div style={{ color: dimColor, marginTop: '6px' }}>
              Note: Creature showed preference for adolescent prey - unknown if related to
              psychic sensitivity or other factors.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px', position: 'relative', zIndex: 2 }}>
          <div style={{ color: '#ff6600', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ NEUTRALIZATION EVENT
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6' }}>
            <div style={{ color: '#ffcc00', marginBottom: '8px' }}>
              Date: December 1983 | Location: Hawkins Middle School
            </div>
            <div style={{ color: dimColor }}>
              Subject 011 engaged creature in direct psychokinetic combat. Using extreme
              concentration of telekinetic force, 011 disintegrated the Demogorgon at the
              molecular level. Process caused 011 to temporarily phase into alternate dimension.
            </div>
            <div style={{ marginTop: '8px', color: '#ff3300' }}>
              Both Subject 011 and Demogorgon vanished. 011 later confirmed alive in Upside Down.
              Creature presumed permanently destroyed.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px', position: 'relative', zIndex: 2 }}>
          <div style={{ color: '#ff6600', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ ADDITIONAL SPECIMENS
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6', color: dimColor }}>
            <div style={{ marginBottom: '6px' }}>
              Original specimen destroyed, but Upside Down contains MULTIPLE Demogorgons.
              They appear to be a species, not a unique entity.
            </div>
            <div style={{ color: '#ff9999' }}>
              • 1984: Adolescent specimen ("D'Artagnan/Dart") raised from slug stage<br/>
              • 1984: Pack of Demogorgons encountered in tunnels<br/>
              • 1985: Specimen(s) held at Kamchatka Soviet facility<br/>
              • All specimens linked to Mind Flayer hive mind
            </div>
          </div>
        </div>

        <div style={{
          marginTop: isMobile ? '12px' : '15px',
          padding: isMobile ? '8px' : '12px',
          border: '1px solid #ff3300',
          background: 'rgba(255,51,0,0.1)',
          position: 'relative',
          zIndex: 2,
        }}>
          <div style={{ color: '#ff3300', fontSize: isMobile ? '10px' : '12px', textAlign: 'center' }}>
            ▓▓▓ ENCOUNTER PROTOCOL ▓▓▓
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '11px', color: '#ffcc00', marginTop: '8px', lineHeight: '1.6' }}>
            1. DO NOT ENGAGE - Retreat immediately<br/>
            2. Avoid any open wounds - creature tracks blood<br/>
            3. Fire is effective deterrent but not lethal<br/>
            4. Maintain visual contact - can phase through walls<br/>
            5. Alert Subject 011 if available - only confirmed counter
          </div>
        </div>
      </div>
    </div>
  );

  const renderMindflayer = () => (
    <div style={{ color: '#6633ff', fontSize: isMobile ? '11px' : '13px' }}>
      <div style={{
        border: '2px solid #6633ff',
        padding: isMobile ? '12px' : '20px',
        background: 'rgba(102,51,255,0.05)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Shadow particles effect */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.6) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Threat indicator */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '4px 12px',
          background: '#1a0033',
          border: '1px solid #ff3300',
          color: '#ff3300',
          fontSize: '11px',
          animation: 'blink 0.5s infinite',
          zIndex: 5,
        }}>
          ⚠ EXTINCTION-LEVEL THREAT
        </div>

        {!isMobile && (
          <pre style={{ color: '#6633ff', marginBottom: '15px', fontSize: '12px', lineHeight: '1.2', position: 'relative', zIndex: 2 }}>
{`╔═══════════════════════════════════════════════════════════╗
║     DOE CLASSIFIED FILE: EXTRADIMENSIONAL ENTITY 002      ║
║     CODENAME: "THE MIND FLAYER" | STATUS: ACTIVE          ║
╚═══════════════════════════════════════════════════════════╝`}
          </pre>
        )}
        {isMobile && (
          <div style={{ color: '#6633ff', marginBottom: '10px', fontSize: '11px', position: 'relative', zIndex: 2, textAlign: 'center', fontWeight: 'bold' }}>
            ◢ ENTITY 002: "THE MIND FLAYER" ◣
          </div>
        )}

        {!isMobile && (
          <pre style={{
            fontSize: '7px',
            lineHeight: '1',
            display: 'block',
            textAlign: 'center',
            color: '#6633ff',
            textShadow: '0 0 10px #6633ff',
            marginBottom: '20px',
            position: 'relative',
            zIndex: 2,
          }}>
{`                              ▓▓▓▓▓▓▓▓
                        ▓▓▓▓▓▓░░░░░░▓▓▓▓▓▓
                   ▓▓▓▓░░░░░░░░░░░░░░░░░░▓▓▓▓
              ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓
         ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓
    ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓
  ▓▓░░░░░░▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓░░░░░░▓▓
 ▓░░░░░▓▓▓▓▓▓▓▓░░░░░░░░░░▓▓▓▓▓▓░░░░░░░░▓▓▓▓▓▓▓▓░░░░░░░▓
▓░░░░▓▓▓      ▓▓░░░░░░▓▓▓    ▓▓▓▓░░░░▓▓      ▓▓▓░░░░░▓
▓░░▓▓          ▓░░░░▓▓          ▓░░░░▓          ▓▓░░▓
▓░▓             ▓░░▓             ▓░░▓             ▓░▓`}
          </pre>
        )}

        <div style={{ display: 'flex', gap: isMobile ? '10px' : '20px', marginBottom: isMobile ? '10px' : '15px', position: 'relative', zIndex: 2 }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: '1px solid #6633ff',
            background: '#0a0020',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              color: '#6633ff',
              fontSize: '10px',
              textAlign: 'center',
              padding: '10px',
            }}>
              [VISUAL DATA<br/>CORRUPTED]<br/><br/>
              <span style={{ color: '#ff3300', animation: 'blink 1s infinite' }}>
                ▓▓▓▓▓▓<br/>▓▓▓▓▓▓
              </span>
            </div>
          </div>
          <div style={{ flex: 1, fontSize: isMobile ? '10px' : '12px' }}>
            <div style={{ color: '#6633ff', fontSize: isMobile ? '13px' : '16px', marginBottom: isMobile ? '6px' : '8px' }}>
              <span style={{ color: '#ff3300' }}>THE MIND FLAYER</span>
            </div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>CLASSIFICATION: </span>EXTRADIMENSIONAL ENTITY</div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>ORIGIN: </span>UPSIDE DOWN DIMENSION</div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#ff3300' }}>ACTIVE / WATCHING</span></div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>SIZE: </span>MASSIVE (EST. MILES ACROSS)</div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>THREAT LEVEL: </span><span style={{ color: '#ff3300', animation: 'blink 0.5s infinite' }}>EXTINCTION</span></div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>CONTAINMENT: </span><span style={{ color: '#ff3300' }}>IMPOSSIBLE</span></div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px', position: 'relative', zIndex: 2 }}>
          <div style={{ color: '#6633ff', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ ENTITY NATURE
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6' }}>
            <div style={{ color: '#cc99ff' }}>
              The Mind Flayer is a vast, spider-like shadow entity that exists within
              the Upside Down dimension. It appears to be the apex predator of that
              realm - possibly the only true intelligence native to that dimension.
            </div>
            <div style={{ marginTop: isMobile ? '6px' : '8px', color: dimColor }}>
              Entity exhibits characteristics of a hive mind, controlling all
              creatures within the Upside Down. Demogorgons, Demodogs, and other
              entities appear to be extensions of its will rather than
              independent organisms.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px', position: 'relative', zIndex: 2 }}>
          <div style={{ color: '#ff3300', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ RELATIONSHIP WITH ENTITY 001 (VECNA)
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6', color: '#ff9999' }}>
            <div style={{ marginBottom: isMobile ? '6px' : '8px' }}>
              ▶ CRITICAL INTELLIGENCE UPDATE:<br/>
              The Mind Flayer may not be the ultimate threat we believed.
            </div>
            <div style={{ color: '#ffcc00' }}>
              Evidence suggests Entity 001 (Henry Creel / Vecna) discovered
              the Mind Flayer upon entering the Upside Down and SHAPED it
              into its current spider-like form. The relationship appears
              symbiotic - Vecna provides direction, Mind Flayer provides power.
            </div>
            <div style={{ marginTop: isMobile ? '6px' : '8px', color: dimColor }}>
              The Mind Flayer's spider form mirrors Vecna's childhood drawings.
              This is not coincidence. Vecna didn't just find a monster.
              He may have CREATED one. Or awakened something that was waiting.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px', position: 'relative', zIndex: 2 }}>
          <div style={{ color: '#6633ff', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ DOCUMENTED CAPABILITIES
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '6px' : '10px' }}>
              <div>
                <div style={{ color: '#ffcc00' }}>HIVE MIND CONTROL</div>
                <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '11px' }}>Commands all Upside Down creatures</div>
              </div>
              <div>
                <div style={{ color: '#ffcc00' }}>HOST POSSESSION</div>
                <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '11px' }}>Can inhabit human bodies</div>
              </div>
              <div>
                <div style={{ color: '#ffcc00' }}>BIOLOGICAL INTEGRATION</div>
                <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '11px' }}>Absorbs organic matter into itself</div>
              </div>
              <div>
                <div style={{ color: '#ffcc00' }}>PSYCHIC AWARENESS</div>
                <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '11px' }}>Senses across dimensions</div>
              </div>
              <div>
                <div style={{ color: '#ffcc00' }}>FLESH CONSTRUCTION</div>
                <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '11px' }}>Builds physical forms from hosts</div>
              </div>
              <div>
                <div style={{ color: '#ffcc00' }}>MEMORY ACCESS</div>
                <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '11px' }}>Reads minds of possessed</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px', position: 'relative', zIndex: 2 }}>
          <div style={{ color: '#6633ff', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ INCIDENT HISTORY
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: isMobile ? '8px' : '10px', paddingBottom: isMobile ? '8px' : '10px', borderBottom: `1px dashed ${borderColor}` }}>
              <div style={{ color: '#ffcc00' }}>1984 - FIRST CONTACT (WILL BYERS)</div>
              <div style={{ color: dimColor }}>
                Subject Byers made psychic contact with entity during Upside Down
                exposure. Entity implanted "virus" that allowed it to see through
                Byers, spy on our dimension. Used Byers to learn weaknesses.
              </div>
            </div>
            <div style={{ marginBottom: isMobile ? '8px' : '10px', paddingBottom: isMobile ? '8px' : '10px', borderBottom: `1px dashed ${borderColor}` }}>
              <div style={{ color: '#ffcc00' }}>1984 - TUNNEL NETWORK</div>
              <div style={{ color: dimColor }}>
                Entity began expanding Upside Down influence through underground
                tunnel system spreading from Gate site. Vines carried corruption.
                Destruction of tunnels caused entity significant pain.
              </div>
            </div>
            <div style={{ marginBottom: isMobile ? '8px' : '10px', paddingBottom: isMobile ? '8px' : '10px', borderBottom: `1px dashed ${borderColor}` }}>
              <div style={{ color: '#ff3300' }}>1985 - THE FLAYED INCIDENT</div>
              <div style={{ color: '#ff9999' }}>
                Entity learned from 1984 defeat. New strategy: possess multiple
                humans simultaneously ("The Flayed"). Converted dozens of Hawkins
                residents. Used them to gather chemicals, then MELTED THEIR BODIES
                to construct physical proxy form.
              </div>
              <div style={{ marginTop: '6px', color: dimColor }}>
                Proxy form: 30+ feet tall, composed of melted human tissue.
                Engaged targets at Starcourt Mall. Destroyed when Gate closed.
              </div>
            </div>
            <div>
              <div style={{ color: '#ffcc00' }}>1986 - CURRENT STATUS</div>
              <div style={{ color: dimColor }}>
                Entity remains in Upside Down. New Gates have opened.
                Relationship with Vecna suggests coordinated attack imminent.
                Entity is patient. Entity is waiting.
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px', position: 'relative', zIndex: 2 }}>
          <div style={{ color: '#6633ff', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ KNOWN VULNERABILITIES
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#66ff66' }}>HEAT:</span> Entity exhibits extreme aversion to high temperatures.
              Possessed hosts can be expelled through heat exposure.
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#66ff66' }}>GATE CLOSURE:</span> Severing connection to Upside Down
              destroys physical manifestations in our dimension.
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#ffcc00' }}>LIMITATION:</span> Cannot manifest fully without Gate.
              Requires proxy bodies or possessed hosts to act in our world.
            </div>
            <div style={{ color: '#ff3300' }}>
              WARNING: These are not true weaknesses. Entity adapts. Entity learns.
              What worked before may not work again.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px', position: 'relative', zIndex: 2 }}>
          <div style={{ color: '#6633ff', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ KNOWN HOSTS / FLAYED
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6', color: '#cc99ff' }}>
            <div>• BYERS, WILL - 1984 (Partial possession, expelled)</div>
            <div>• HARGROVE, BILLY - 1985 (Primary host, DECEASED)</div>
            <div>• HEATHER HOLLOWAY - 1985 (Flayed, DECEASED)</div>
            <div>• TOM HOLLOWAY - 1985 (Flayed, DECEASED)</div>
            <div>• BRUCE LOWE - 1985 (Flayed, DECEASED)</div>
            <div>• MRS. DRISCOLL - 1985 (Flayed, survived due to age?)</div>
            <div style={{ color: dimColor, marginTop: '6px' }}>
              + Approximately 30 additional Hawkins residents (consumed into proxy form)
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px', position: 'relative', zIndex: 2 }}>
          <div style={{ color: '#6633ff', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ BEHAVIORAL ANALYSIS
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6', fontStyle: 'italic', color: dimColor }}>
            <div>
              "It's not just a monster. It thinks. It plans. It holds grudges.
              When Will closed his mind to it, it didn't forget. It came back
              for him. For all of us. It's patient in a way that suggests
              intelligence beyond human comprehension."
            </div>
            <div style={{ marginTop: isMobile ? '6px' : '8px', color: '#cc99ff' }}>
              - Field notes, Dr. Sam Owens
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px', position: 'relative', zIndex: 2 }}>
          <div style={{ color: baseColor, marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ THREAT ASSESSMENT
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6' }}>
            <div style={{ color: '#ff3300' }}>
              The Mind Flayer represents an extinction-level threat to humanity.
              It does not negotiate. It does not sleep. It does not forget.
              Its only goal appears to be the complete consumption of our dimension.
            </div>
            <div style={{ marginTop: isMobile ? '6px' : '8px', color: '#ffcc00' }}>
              Current Gates provide potential entry points. Vecna coordinates
              from within. We are not fighting one enemy. We are fighting a
              symbiotic nightmare with human intelligence and infinite patience.
            </div>
            <div style={{ marginTop: isMobile ? '6px' : '8px', color: dimColor }}>
              Recommended action: Close all Gates. Permanently.
              Contingency if Gates cannot be closed: [DATA EXPUNGED]
            </div>
          </div>
          <div style={{ marginTop: isMobile ? '6px' : '8px', fontSize: isMobile ? '12px' : '14px', color: '#ff3300', textAlign: 'center' }}>
            DESIGNATION: "THE SHADOW" | STATUS: WATCHING / WAITING
          </div>
        </div>
      </div>
    </div>
  );

  const renderVecna = () => (
    <div style={{ color: '#00ff88', fontSize: isMobile ? '11px' : '13px' }}>
      <div style={{
        border: '2px solid #00ff88',
        padding: isMobile ? '12px' : '20px',
        background: 'rgba(0,255,136,0.05)',
        position: 'relative',
      }}>
        {/* Threat indicator */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '4px 12px',
          background: '#001a0d',
          border: '1px solid #ff3300',
          color: '#ff3300',
          fontSize: '11px',
          animation: 'blink 0.8s infinite',
        }}>
          ⚠ MAXIMUM THREAT - ENTITY 001
        </div>

        {!isMobile && (
          <pre style={{ color: '#00ff88', marginBottom: '15px', fontSize: '12px', lineHeight: '1.2' }}>
{`╔═══════════════════════════════════════════════════════════╗
║     DOE CLASSIFIED FILE: ENTITY 001 / SUBJECT 001         ║
║     CODENAME: "VECNA" | STATUS: ACTIVE / HOSTILE          ║
╚═══════════════════════════════════════════════════════════╝`}
          </pre>
        )}
        {isMobile && (
          <div style={{ color: '#00ff88', marginBottom: '10px', fontSize: '11px', textAlign: 'center', fontWeight: 'bold' }}>
            ◢ ENTITY 001: "VECNA" ◣
          </div>
        )}

        {/* Clock imagery */}
        {!isMobile && (
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <pre style={{ fontSize: '10px', lineHeight: '1', display: 'inline-block', color: '#00ff88', textShadow: '0 0 10px #00ff88' }}>
{`        ╔═══════════════╗
      ╔═╝   ┌───────┐   ╚═╗
     ║    12│       │      ║
    ║   9   │   │   │   3   ║
     ║      │   ●───│      ║
      ╚═╗   │   6   │   ╔═╝
        ╚═══════════════╝`}
            </pre>
            <div style={{ color: '#ff3300', fontSize: '10px', marginTop: '5px' }}>
              THE CLOCK ALWAYS CHIMES AT THE END
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: isMobile ? '10px' : '20px', marginBottom: isMobile ? '10px' : '15px' }}>
          <div style={{
            width: isMobile ? '70px' : '100px',
            height: isMobile ? '90px' : '130px',
            border: '1px solid #00ff88',
            background: '#001a0d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src="/vecna.jpeg"
              alt="Entity 001"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(100%) saturate(300%) brightness(0.8) contrast(1.2) hue-rotate(90deg)',
                mixBlendMode: 'screen',
              }}
            />
          </div>
          <div style={{ flex: 1, fontSize: isMobile ? '10px' : '12px' }}>
            <div style={{ color: '#00ff88', fontSize: isMobile ? '13px' : '16px', marginBottom: isMobile ? '6px' : '8px' }}>
              <span style={{ color: '#ff3300' }}>VECNA</span> / <span style={{ color: '#ffcc00' }}>HENRY CREEL</span> / <span style={{ color: '#00ff88' }}>ONE</span>
            </div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>BIRTH NAME: </span>HENRY CREEL</div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>LAB DESIGNATION: </span>001 / "ONE"</div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>FORM: </span>VECNA (TRANSFORMED)</div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>DOB: </span>1947 (AGE 39 AT TRANSFORMATION)</div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#ff3300' }}>ACTIVE / INTERDIMENSIONAL</span></div>
            <div style={{ marginBottom: isMobile ? '3px' : '4px' }}><span style={{ color: dimColor }}>THREAT: </span><span style={{ color: '#ff3300', animation: 'blink 0.5s infinite' }}>BEYOND CLASSIFICATION</span></div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#00ff88', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ IDENTITY TIMELINE
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: isMobile ? '6px' : '8px', paddingBottom: isMobile ? '6px' : '8px', borderBottom: `1px dashed ${borderColor}` }}>
              <div style={{ color: '#ffcc00' }}>PHASE 1: HENRY CREEL (1947-1959)</div>
              <div style={{ color: dimColor }}>
                Born with innate psychic abilities. Discovered powers as child.
                Killed mother and sister in 1959, framed father Victor Creel
                who was institutionalized for murders. Faked own coma.
              </div>
            </div>
            <div style={{ marginBottom: isMobile ? '6px' : '8px', paddingBottom: isMobile ? '6px' : '8px', borderBottom: `1px dashed ${borderColor}` }}>
              <div style={{ color: '#00ff88' }}>PHASE 2: SUBJECT 001 (1959-1979)</div>
              <div style={{ color: dimColor }}>
                Recovered by Dr. Brenner. First test subject in psychic weapons
                program. Implanted with "Soteria" device to suppress abilities.
                Worked as orderly while plotting escape. Mentored Subject 011.
              </div>
            </div>
            <div>
              <div style={{ color: '#ff3300' }}>PHASE 3: VECNA (1979-PRESENT)</div>
              <div style={{ color: dimColor }}>
                Removed Soteria with Eleven's help. Massacred lab personnel.
                Banished to Upside Down by Eleven. Transformed into current
                monstrous form. Shaped Mind Flayer. Planning dimensional invasion.
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#ff3300', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ THE CREEL HOUSE MASSACRE (1959)
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6', color: '#ff9999' }}>
            <div style={{ marginBottom: isMobile ? '6px' : '8px' }}>
              Subject's first documented kills. Used psychic abilities to
              murder mother Virginia Creel and sister Alice Creel. Created
              elaborate hallucinations for father Victor (black widows, etc.)
              to establish insanity defense.
            </div>
            <div style={{ color: dimColor }}>
              Victor Creel remains institutionalized at Pennhurst Asylum.
              Has never stopped claiming demonic possession. He was closer
              to the truth than anyone believed.
            </div>
            <div style={{ marginTop: isMobile ? '6px' : '8px', color: '#ffcc00' }}>
              MOTIVE (from recovered notes): "They were ordinary. Banal.
              Crawling ants pretending their little lives mattered. I showed
              them what true power looks like."
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#00ff88', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ DOCUMENTED ABILITIES
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '6px' : '10px' }}>
              <div>
                <div style={{ color: '#ffcc00' }}>PSYCHOKINESIS</div>
                <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '11px' }}>Extreme telekinetic force</div>
              </div>
              <div>
                <div style={{ color: '#ffcc00' }}>TELEPATHY</div>
                <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '11px' }}>Memory intrusion / reading</div>
              </div>
              <div>
                <div style={{ color: '#ffcc00' }}>THE CURSE</div>
                <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '11px' }}>Psychic death projection</div>
              </div>
              <div>
                <div style={{ color: '#ffcc00' }}>GATE CREATION</div>
                <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '11px' }}>Opens dimensional rifts via kills</div>
              </div>
              <div>
                <div style={{ color: '#ffcc00' }}>BIOLOGICAL MANIPULATION</div>
                <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '11px' }}>Skeletal/tissue restructuring</div>
              </div>
              <div>
                <div style={{ color: '#ffcc00' }}>TEMPORAL PERCEPTION</div>
                <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '11px' }}>Experiences time differently</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#ff3300', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ KILLING METHODOLOGY - "VECNA'S CURSE"
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6', color: '#ff9999' }}>
            <div style={{ marginBottom: isMobile ? '6px' : '8px' }}>
              Entity targets victims with unresolved psychological trauma.
              Establishes psychic connection by exploiting guilt, shame, or grief.
              Process follows consistent pattern:
            </div>
            <div style={{ marginBottom: isMobile ? '6px' : '8px', color: '#ffcc00' }}>
              <div>STAGE 1: Headaches, nosebleeds, disturbing visions</div>
              <div>STAGE 2: Waking nightmares, hearing grandfather clock</div>
              <div>STAGE 3: Full hallucinations, loss of time</div>
              <div>STAGE 4: Physical manifestation of clock, trance state</div>
              <div>STAGE 5: Transportation to psychic realm, confrontation</div>
              <div>STAGE 6: TERMINATION - skeletal inversion, eye rupture</div>
            </div>
            <div style={{ color: dimColor }}>
              Time from first symptoms to death: 24-72 hours.
              Each kill opens new Gate in location of death.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#00ff88', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ CONFIRMED VICTIMS (1986)
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6', color: '#cc99ff' }}>
            <div>• CUNNINGHAM, CHRISSY - 21-MAR-86 (Gate 1 - Eddie's Trailer)</div>
            <div>• BENSON, FRED - 22-MAR-86 (Gate 2 - Trailer Park)</div>
            <div>• MCKINNEY, PATRICK - 24-MAR-86 (Gate 3 - Lover's Lake)</div>
            <div>• MAYFIELD, MAX - 26-MAR-86 (Gate 4 - Creel House) <span style={{ color: '#ffcc00' }}>[RESUSCITATED]</span></div>
            <div style={{ color: dimColor, marginTop: '6px' }}>
              + Lab massacre victims (1979): Estimated 20+ personnel
            </div>
            <div style={{ color: dimColor }}>
              + Creel family (1959): Virginia Creel, Alice Creel
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#00ff88', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ RELATIONSHIP WITH SUBJECT 011
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6' }}>
            <div style={{ color: '#cc99ff' }}>
              Entity served as mentor to Subject 011 during her lab imprisonment.
              Presented himself as friendly orderly, taught her to access memories,
              encouraged her to embrace her power. Used her to remove his Soteria
              implant, enabling his massacre.
            </div>
            <div style={{ marginTop: isMobile ? '6px' : '8px', color: '#ffcc00' }}>
              Subject 011 was the only being to ever defeat Entity 001 in
              psychic combat. She banished him to the Upside Down, inadvertently
              creating the first Gate. Their connection remains.
            </div>
            <div style={{ marginTop: isMobile ? '6px' : '8px', color: dimColor }}>
              Entity appears obsessed with 011. Views her as both nemesis and
              potential equal. May be attempting to corrupt or recruit her.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#00ff88', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ RELATIONSHIP WITH MIND FLAYER
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6' }}>
            <div style={{ color: '#6633ff' }}>
              Upon arrival in Upside Down, Entity discovered formless dark
              particles. Using his psychic abilities, he SHAPED these particles
              into the spider-like Mind Flayer - a form from his childhood drawings.
            </div>
            <div style={{ marginTop: isMobile ? '6px' : '8px', color: dimColor }}>
              The Mind Flayer is not the master. Entity 001 is. The Shadow
              serves as his army, his extension, his weapon. When we fought
              the Mind Flayer, we were fighting Vecna's will.
            </div>
            <div style={{ marginTop: isMobile ? '6px' : '8px', color: '#ff3300' }}>
              This changes everything we thought we knew.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#00ff88', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ KNOWN VULNERABILITIES
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#66ff66' }}>MUSIC:</span> Victims can be protected by music that holds
              emotional significance. Creates "lifeline" back to reality.
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#66ff66' }}>PHYSICAL DAMAGE:</span> While killing, Entity's physical form
              in Upside Down is vulnerable. Coordinated attack possible.
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#66ff66' }}>ELEVEN:</span> Subject 011 has defeated Entity before.
              May be only one capable of permanent neutralization.
            </div>
            <div style={{ color: '#ff3300' }}>
              WARNING: Entity learns. Adapts. What worked before may not again.
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#00ff88', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ IDEOLOGY / MOTIVATION
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6', fontStyle: 'italic', color: dimColor }}>
            <div>
              "You think you're heroes. You think you're saving the world. But you're
              just ants, scurrying around a picnic blanket, not seeing the boot above you."
            </div>
            <div style={{ marginTop: isMobile ? '6px' : '8px' }}>
              "Humans build their little structures. Their rules. Their order. I am the
              predator that reminds them they are still prey. I am natural selection.
              I am evolution. I am what comes next."
            </div>
            <div style={{ marginTop: isMobile ? '6px' : '8px', color: '#ff3300' }}>
              "It is over, Eleven. You have freed me."
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: '#ff3300', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ DR. BRENNER'S FINAL NOTES
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6', color: '#ffcc00' }}>
            <div>
              "He was the first. The beginning of everything. I thought I could
              control him, shape him. I was wrong. What we created... what I created...
              it wasn't a weapon. It was a door. And now it's open."
            </div>
            <div style={{ marginTop: isMobile ? '6px' : '8px', color: dimColor }}>
              "Henry wasn't born evil. But he was born... different. And we made him
              into what he is. Every test. Every punishment. Every time we treated
              him like a thing instead of a child. We created Vecna. God help us all."
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '8px' : '10px', marginTop: isMobile ? '8px' : '10px' }}>
          <div style={{ color: baseColor, marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '13px' }}>
            ■ CURRENT THREAT ASSESSMENT
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: '1.6' }}>
            <div style={{ color: '#ff3300' }}>
              Entity 001 represents existential threat to humanity. Four Gates
              now open. Hawkins partially merged with Upside Down. Entity preparing
              final invasion. Has been planning for years. We are out of time.
            </div>
            <div style={{ marginTop: isMobile ? '6px' : '8px', color: '#ffcc00' }}>
              Our only hope is Subject 011. But she is not enough alone.
              She needed a team before. She needs one now.
            </div>
            <div style={{ marginTop: isMobile ? '6px' : '8px', color: dimColor }}>
              He is patient. He is intelligent. He hates humanity.
              And he has home field advantage.
            </div>
          </div>
          <div style={{ marginTop: isMobile ? '6px' : '8px', fontSize: isMobile ? '12px' : '14px', color: '#ff3300', textAlign: 'center' }}>
            DESIGNATION: "THE FIRST" | STATUS: ASCENDANT
          </div>
        </div>
      </div>
    </div>
  );

  // === NEW DEEP EASTER EGGS ===

  const renderRainbowRoom = () => (
    <div style={{ color: '#ff69b4', fontSize: isMobile ? '11px' : '14px' }}>
      <div style={{
        border: '2px solid #ff69b4',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(255,105,180,0.05)',
      }}>
        <div style={{ fontSize: isMobile ? '12px' : '14px', marginBottom: isMobile ? '10px' : '15px', textAlign: 'center' }}>
          ◢ THE RAINBOW ROOM - SUBLEVEL 4 ◣
        </div>

        {!isMobile && (
          <pre style={{ fontSize: '6px', lineHeight: '1', marginBottom: '15px', textAlign: 'center' }}>
{`
     ╔══════════════════════════════════════════════════════════════╗
     ║    [R]  [O]  [Y]  [G]  [B]  [I]  [V]  [-]  [R]  [O]  [Y]    ║
     ║  ┌────────────────────────────────────────────────────────┐  ║
     ║  │                                                        │  ║
     ║  │     ████  PLAY AREA  ████      ████  TESTING  ████    │  ║
     ║  │                                                        │  ║
     ║  │     [ TOY1 ]   [ TOY2 ]   [ TOY3 ]   [ TOY4 ]   [TOY5] │  ║
     ║  │                                                        │  ║
     ║  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │  ║
     ║  │  │ SUBJECT  │  │ SUBJECT  │  │ SUBJECT  │   [MIRROR]  │  ║
     ║  │  │   003    │  │   006    │  │   011    │      ▓▓     │  ║
     ║  │  └──────────┘  └──────────┘  └──────────┘             │  ║
     ║  │                                                        │  ║
     ║  └────────────────────────────────────────────────────────┘  ║
     ╚══════════════════════════════════════════════════════════════╝
`}
          </pre>
        )}

        <div style={{ marginBottom: isMobile ? '8px' : '12px' }}>
          <div style={{ color: '#ff69b4', marginBottom: isMobile ? '4px' : '6px', fontSize: isMobile ? '11px' : '14px' }}>FACILITY PURPOSE:</div>
          <div style={{ color: baseColor, fontSize: isMobile ? '10px' : '13px', lineHeight: '1.6' }}>
            Primary conditioning environment for child subjects. Designed to appear non-threatening
            while facilitating psychic ability development and obedience training. All toys and
            activities serve dual purpose as assessment tools.
          </div>
        </div>

        <div style={{ marginBottom: isMobile ? '8px' : '12px' }}>
          <div style={{ color: '#ff69b4', marginBottom: isMobile ? '4px' : '6px', fontSize: isMobile ? '11px' : '14px' }}>CONDITIONING PROTOCOLS:</div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', color: baseColor, lineHeight: '1.5' }}>
            • REWARD/PUNISHMENT CYCLES - Chocolate pudding vs. isolation chamber<br />
            • SENSORY DEPRIVATION TANK - "The Bath" - 8-hour sessions standard<br />
            • INTER-SUBJECT COMPETITION - Controlled conflicts to enhance aggression<br />
            • PARENT FIGURE BONDING - "Papa" designation for Dr. Brenner
          </div>
        </div>

        <div style={{
          padding: isMobile ? '8px' : '10px',
          border: '1px solid #ff3300',
          background: 'rgba(255,51,0,0.1)',
          marginTop: isMobile ? '8px' : '12px',
        }}>
          <div style={{ color: '#ff3300', fontSize: isMobile ? '11px' : '13px', marginBottom: isMobile ? '4px' : '6px' }}>
            INCIDENT REPORT - 09-SEP-79
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#ffcc00', lineHeight: '1.5' }}>
            Subject 011 witnessed Subject 001 (Henry) eliminate all other subjects in Rainbow Room.
            Six casualties. Subject 001 subsequently ████████ by 011 and relocated to ████████.
            Room sanitized. All records of Subjects 002-010 classified LEVEL 5.
          </div>
        </div>
      </div>
    </div>
  );

  const renderExperimentLog = () => (
    <div style={{ color: baseColor, fontSize: isMobile ? '11px' : '13px' }}>
      <div style={{
        border: '1px solid #ff6600',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: isMobile ? '11px' : '13px', marginBottom: isMobile ? '10px' : '15px', color: '#ff6600', textAlign: 'center' }}>
          ◢ PROJECT INDIGO - EXPERIMENT LOGS ◣
        </div>

        <div style={{ fontFamily: 'inherit', fontSize: isMobile ? '10px' : '13px', lineHeight: '1.7' }}>
          <div style={{ borderBottom: `1px solid ${borderColor}`, paddingBottom: isMobile ? '8px' : '10px', marginBottom: isMobile ? '8px' : '10px' }}>
            <span style={{ color: '#ff6600' }}>LOG 001 - 03-FEB-71</span><br />
            First successful remote viewing session. Subject 001 (Terry Ives, pregnant)
            accurately described contents of sealed room 3 floors below. Dr. Brenner
            immediately authorized expanded protocol.
          </div>

          <div style={{ borderBottom: `1px solid ${borderColor}`, paddingBottom: isMobile ? '8px' : '10px', marginBottom: isMobile ? '8px' : '10px' }}>
            <span style={{ color: '#ff6600' }}>LOG 047 - 15-MAY-72</span><br />
            LSD-25 dosage increased to 450μg. Subject showed enhanced psionic response but
            experienced severe psychological trauma. Pregnancy continued despite ████████.
            Fetus showing abnormal development markers.
          </div>

          <div style={{ borderBottom: `1px solid ${borderColor}`, paddingBottom: isMobile ? '8px' : '10px', marginBottom: isMobile ? '8px' : '10px' }}>
            <span style={{ color: '#ff6600' }}>LOG 112 - 08-SEP-72</span><br />
            Infant extracted via emergency C-section. Mother (Terry Ives) suffered complete
            psychotic break. Infant designated SUBJECT 011. Shows unprecedented potential.
            Mother to be institutionalized. Cover story: stillbirth.
          </div>

          <div style={{ borderBottom: `1px solid ${borderColor}`, paddingBottom: isMobile ? '8px' : '10px', marginBottom: isMobile ? '8px' : '10px' }}>
            <span style={{ color: '#ff6600' }}>LOG 156 - 22-JUN-75</span><br />
            Subject 011 (age 3) successfully crushed aluminum can using telekinesis.
            First documented TK event outside of Soviet program. Brenner ecstatic.
            CIA liaison demanding demonstration for Joint Chiefs.
          </div>

          <div style={{ color: '#ff3300' }}>
            <span style={{ color: '#ff3300' }}>LOG 241 - 06-NOV-83</span><br />
            Subject 011 made contact with entity in alternate dimension during
            remote viewing session targeting Soviet asset. Entity hostile.
            GATE OPENED. CONTAINMENT FAILED. GOD HELP US ALL.
          </div>
        </div>
      </div>
    </div>
  );

  const renderTerryIves = () => (
    <div style={{ color: '#aa88ff', fontSize: isMobile ? '11px' : '14px' }}>
      <div style={{
        border: '2px solid #aa88ff',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(170,136,255,0.05)',
      }}>
        <div style={{ fontSize: isMobile ? '12px' : '14px', marginBottom: isMobile ? '10px' : '15px', textAlign: 'center', color: '#aa88ff' }}>
          ◢ SUBJECT FILE: TERESA "TERRY" IVES ◣
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '8px' : '15px', marginBottom: isMobile ? '10px' : '15px', fontSize: isMobile ? '10px' : '14px' }}>
          <div>
            <span style={{ color: dimColor }}>DOB: </span>02-MAR-48<br />
            <span style={{ color: dimColor }}>STATUS: </span><span style={{ color: '#ffcc00' }}>INSTITUTIONALIZED</span><br />
            <span style={{ color: dimColor }}>LOCATION: </span>PENNHURST STATE HOSPITAL
          </div>
          <div>
            <span style={{ color: dimColor }}>PROJECT: </span>MKULTRA/INDIGO<br />
            <span style={{ color: dimColor }}>CLEARANCE: </span>REVOKED<br />
            <span style={{ color: dimColor }}>THREAT: </span>NEUTRALIZED
          </div>
        </div>

        <div style={{
          padding: isMobile ? '8px' : '12px',
          border: '1px solid #aa88ff',
          marginBottom: isMobile ? '10px' : '15px',
          background: 'rgba(170,136,255,0.1)',
        }}>
          <div style={{ color: '#aa88ff', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '14px' }}>REPEATING PHRASES:</div>
          <div style={{ color: '#ffcc00', fontStyle: 'italic', fontSize: isMobile ? '10px' : '12px', lineHeight: '1.8' }}>
            "Breathe... Sunflower... Rainbow... Three to the right, four to the left...
            450... Jane..."
          </div>
        </div>

        <div style={{ marginBottom: isMobile ? '8px' : '12px' }}>
          <div style={{ color: '#aa88ff', marginBottom: isMobile ? '4px' : '6px', fontSize: isMobile ? '11px' : '14px' }}>PSYCHIATRIC EVALUATION:</div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', color: baseColor, lineHeight: '1.6' }}>
            Patient exhibits catatonic episodes interspersed with moments of apparent lucidity.
            Repeatedly attempts to communicate "rainbow" and "jane" - believed to be
            trauma-induced confabulation regarding miscarried pregnancy (cover story).
            Recommended: Continue electroconvulsive therapy. Increase Thorazine dosage.
          </div>
        </div>

        <div style={{
          padding: isMobile ? '8px' : '12px',
          border: '1px solid #ff3300',
          background: 'rgba(255,51,0,0.1)',
        }}>
          <div style={{ color: '#ff3300', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '14px' }}>SECURITY NOTE:</div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', color: '#ffcc00', lineHeight: '1.5' }}>
            Subject breached facility perimeter on 09-OCT-83. Armed with handgun.
            Demanded return of "my daughter Jane." Neutralized via electroshock.
            Current mental state: permanently compromised. No longer a security risk.
            Sister (Becky Ives) continues inquiries - monitor and discourage.
          </div>
        </div>
      </div>
    </div>
  );

  const renderGateOrigin = () => (
    <div style={{ color: '#ff3300', fontSize: isMobile ? '11px' : '14px' }}>
      <div style={{
        border: '2px solid #ff3300',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(255,51,0,0.08)',
      }}>
        <div style={{
          fontSize: isMobile ? '12px' : '14px',
          marginBottom: isMobile ? '10px' : '15px',
          textAlign: 'center',
          color: '#ff3300',
          animation: 'blink 2s infinite',
        }}>
          ▓▓▓ THE GATE - ORIGIN EVENT ▓▓▓
        </div>

        {!isMobile && (
          <pre style={{ fontSize: '7px', lineHeight: '1', marginBottom: '15px', textAlign: 'center', color: '#ff3300' }}>
{`
               ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
           ▓▓▓░░░░░░░░░░░░░░░░░░░░░░▓▓▓
        ▓▓░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░▓▓
      ▓▓░░░░▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒░░░░▓▓
     ▓░░░░▒▒▓▓████████████████▓▓▒▒░░░░▓
    ▓░░░▒▒▓██████ DIMENSION ██████▓▒▒░░░▓
   ▓░░░▒▓████████  BREACH  ████████▓▒░░░▓
    ▓░░░▒▒▓██████████████████████▓▒▒░░░▓
     ▓░░░░▒▒▓▓████████████████▓▓▒▒░░░░▓
      ▓▓░░░░▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒░░░░▓▓
        ▓▓░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░▓▓
           ▓▓▓░░░░░░░░░░░░░░░░░░░░░░▓▓▓
               ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
`}
          </pre>
        )}

        <div style={{ marginBottom: isMobile ? '10px' : '15px' }}>
          <div style={{ color: '#ff6600', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '14px' }}>INCIDENT SUMMARY - 06-NOV-1983:</div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', color: baseColor, lineHeight: '1.6' }}>
            At 19:42 EST, Subject 011 was conducting routine remote viewing exercise targeting
            Soviet military installation (Operation SNOWBLIND). Upon contact with target,
            subject reported "something else" in the void. Against protocol, Brenner ordered
            continued exploration.
          </div>
        </div>

        <div style={{ marginBottom: isMobile ? '10px' : '15px' }}>
          <div style={{ color: '#ff6600', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '14px' }}>CONTACT EVENT:</div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', color: baseColor, lineHeight: '1.6' }}>
            Subject 011 encountered hostile entity (later designated DEMOGORGON). Physical
            contact established in psychic space. Entity followed connection back to our
            dimension. Containment wall in Sublevel 3 compromised. Temporal-spatial rift
            formed. Gate diameter: 2.3 meters. EXPANDING.
          </div>
        </div>

        <div style={{
          padding: isMobile ? '8px' : '12px',
          border: '1px solid #ff3300',
          background: 'rgba(255,51,0,0.15)',
        }}>
          <div style={{ color: '#ff3300', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '14px' }}>IMMEDIATE AFTERMATH:</div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', color: '#ffcc00', lineHeight: '1.5' }}>
            • 6 personnel casualties within first hour<br />
            • Subject 011 escaped facility during chaos<br />
            • Local civilian (Will Byers, age 12) taken by entity<br />
            • Cover story deployed: chemical leak, area quarantined<br />
            • DOD and CIA notified. Full blackout ordered.<br />
            • Dr. Brenner assuming direct control of containment efforts
          </div>
        </div>
      </div>
    </div>
  );

  const renderRussians = () => (
    <div style={{ color: '#cc0000', fontSize: isMobile ? '11px' : '14px' }}>
      <div style={{
        border: '2px solid #cc0000',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(204,0,0,0.05)',
      }}>
        <div style={{ fontSize: isMobile ? '12px' : '14px', marginBottom: isMobile ? '10px' : '15px', textAlign: 'center', color: '#cc0000' }}>
          ◢ OPERATION: RED GATE ◣
        </div>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '10px' : '15px', color: '#ffcc00', fontSize: isMobile ? '10px' : '12px' }}>
          SOVIET INTERDIMENSIONAL RESEARCH PROGRAM
        </div>

        <div style={{ marginBottom: isMobile ? '10px' : '15px' }}>
          <div style={{ color: '#cc0000', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '14px' }}>INTELLIGENCE SUMMARY:</div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', color: baseColor, lineHeight: '1.6' }}>
            Soviet scientists have been aware of "The Upside Down" since American gate breach
            in 1983. After Hawkins facility destruction (1984), Soviets obtained dimensional
            coordinates through unknown means (suspected mole in DOE).
          </div>
        </div>

        <div style={{ marginBottom: isMobile ? '10px' : '15px' }}>
          <div style={{ color: '#cc0000', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '14px' }}>KAMCHATKA FACILITY:</div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', color: baseColor, lineHeight: '1.6' }}>
            • Location: 56.2°N, 161.4°E - Underground complex<br />
            • Objective: Open stable gate without American subjects<br />
            • Personnel: 400+ scientists, 200+ military<br />
            • Status: KEY OPERATIONAL (intercepted 1985)<br />
            • Codename: "Ключ" (The Key)
          </div>
        </div>

        <div style={{
          padding: isMobile ? '8px' : '12px',
          border: '1px solid #cc0000',
          background: 'rgba(204,0,0,0.1)',
          marginBottom: isMobile ? '10px' : '15px',
        }}>
          <div style={{ color: '#cc0000', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '14px' }}>INTERCEPTED TRANSMISSION:</div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', color: '#ffcc00', fontFamily: 'inherit', lineHeight: '1.5' }}>
            "The American's gate is closed but the wound remains. We will reopen it.
            Not in Hawkins. Here. Under Starcourt. Under their noses. The machine is ready.
            When we open the gate, the Mind Flayer will finish what it started."
          </div>
        </div>

        <div style={{ color: dimColor, fontSize: isMobile ? '10px' : '12px', textAlign: 'center' }}>
          STARCOURT MALL, HAWKINS - SURVEILLANCE PRIORITY: MAXIMUM
        </div>
      </div>
    </div>
  );

  const renderCreelHouse = () => (
    <div style={{ color: '#00aa88', fontSize: isMobile ? '11px' : '14px' }}>
      <div style={{
        border: '2px solid #00aa88',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(0,170,136,0.05)',
      }}>
        <div style={{ fontSize: isMobile ? '12px' : '14px', marginBottom: isMobile ? '10px' : '15px', textAlign: 'center', color: '#00aa88' }}>
          ◢ CREEL HOUSE - INCIDENT FILE ◣
        </div>

        {!isMobile && (
          <pre style={{ fontSize: '6px', lineHeight: '1', marginBottom: '15px', textAlign: 'center', color: '#00aa88' }}>
{`
                    ▲
                   ╱ ╲
                  ╱   ╲
                 ╱     ╲
                ╱   ▓   ╲
               ╱    █    ╲
              ╱     █     ╲
             ╱      █      ╲
            ╔═══════█═══════╗
            ║ ▓▓  ▓▓█▓▓  ▓▓ ║
            ║ ██  ██│██  ██ ║
            ║ ██  ██│██  ██ ║
            ╠═══════█═══════╣
            ║ ██  ██│██  ██ ║
            ║ ██  ██│██  ██ ║
            ╚═══════╧═══════╝
               CONDEMNED
`}
          </pre>
        )}

        <div style={{ marginBottom: isMobile ? '10px' : '15px' }}>
          <div style={{ color: '#00aa88', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '14px' }}>CASE #: 1959-HC-001</div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', color: baseColor, lineHeight: '1.6' }}>
            <span style={{ color: dimColor }}>DATE: </span>September 1959<br />
            <span style={{ color: dimColor }}>VICTIMS: </span>Virginia Creel (wife), Alice Creel (daughter)<br />
            <span style={{ color: dimColor }}>SUSPECT: </span>Victor Creel (husband/father)<br />
            <span style={{ color: dimColor }}>SURVIVOR: </span>Henry Creel (son, age 12)
          </div>
        </div>

        <div style={{
          padding: isMobile ? '8px' : '12px',
          border: '1px solid #00aa88',
          background: 'rgba(0,170,136,0.1)',
          marginBottom: isMobile ? '10px' : '15px',
        }}>
          <div style={{ color: '#00aa88', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '14px' }}>OFFICIAL POLICE REPORT:</div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', color: baseColor, lineHeight: '1.5' }}>
            Victor Creel found in catatonic state. Wife and daughter deceased.
            Cause of death: Unknown. Eyes severely damaged. No signs of forced entry.
            Victor claims "demon" responsible. Diagnosed with acute psychosis.
            Committed to Pennhurst Asylum. Case closed.
          </div>
        </div>

        <div style={{
          padding: isMobile ? '8px' : '12px',
          border: '1px solid #ff3300',
          background: 'rgba(255,51,0,0.1)',
        }}>
          <div style={{ color: '#ff3300', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '14px' }}>CLASSIFIED ADDENDUM (DOE):</div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', color: '#ffcc00', lineHeight: '1.5' }}>
            Henry Creel survived and was recruited into Project INDIGO as Subject 001.
            Demonstrated unprecedented psychic abilities. True perpetrator of 1959 murders.
            Victor Creel innocent. Remains institutionalized for cover purposes.
            Henry relocated to Hawkins Lab. Orderly "friendly" designated as handler.
            <br /><br />
            Current status: SUBJECT 001 = VECNA. May God help us all.
          </div>
        </div>
      </div>
    </div>
  );

  const renderPiggyback = () => (
    <div style={{ color: '#ff00ff', fontSize: isMobile ? '11px' : '14px' }}>
      <div style={{
        border: '2px solid #ff00ff',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(255,0,255,0.05)',
      }}>
        <div style={{ fontSize: isMobile ? '12px' : '14px', marginBottom: isMobile ? '10px' : '15px', textAlign: 'center', color: '#ff00ff' }}>
          ◢ OPERATION PIGGYBACK - CLASSIFIED ◣
        </div>

        <div style={{ marginBottom: isMobile ? '10px' : '15px' }}>
          <div style={{ color: '#ff00ff', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '14px' }}>MISSION BRIEFING:</div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', color: baseColor, lineHeight: '1.6' }}>
            Objective: Neutralize Vecna (Subject 001) using coordinated assault.
            Subject 011 will "piggyback" on Subject Mayfield's consciousness to enter
            Vecna's psychic domain while ground team attacks physical body in Upside Down.
          </div>
        </div>

        <div style={{
          padding: isMobile ? '8px' : '12px',
          border: '1px solid #ff00ff',
          background: 'rgba(255,0,255,0.1)',
          marginBottom: isMobile ? '10px' : '15px',
        }}>
          <div style={{ color: '#ff00ff', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '14px' }}>TEAM ASSIGNMENTS:</div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', color: baseColor, lineHeight: '1.6' }}>
            <span style={{ color: '#ffcc00' }}>PSYCHIC:</span> El (011), Max (host)<br />
            <span style={{ color: '#ffcc00' }}>UPSIDE DOWN:</span> Nancy, Steve, Robin, Eddie<br />
            <span style={{ color: '#ffcc00' }}>CREEL HOUSE:</span> Lucas, Erica<br />
            <span style={{ color: '#ffcc00' }}>RUSSIA:</span> Hopper, Joyce, Murray
          </div>
        </div>

        <div style={{
          padding: isMobile ? '8px' : '12px',
          border: '1px solid #ff3300',
          background: 'rgba(255,51,0,0.1)',
        }}>
          <div style={{ color: '#ff3300', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '14px' }}>MISSION OUTCOME:</div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', color: '#ffcc00', lineHeight: '1.5' }}>
            PARTIAL SUCCESS. Vecna wounded but not destroyed. Four gates opened
            simultaneously. Massive seismic event in Hawkins. 22+ civilian casualties.
            Eddie Munson KIA. Max Mayfield critical - clinically dead for
            1+ minute before resuscitation. Cover story: Earthquake.
            <br /><br />
            <span style={{ color: '#ff3300' }}>WARNING: VECNA STILL ACTIVE. FINAL CONFRONTATION IMMINENT.</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMaxTape = () => (
    <div style={{ color: '#ff6699', fontSize: isMobile ? '11px' : '14px' }}>
      <div style={{
        border: '2px solid #ff6699',
        padding: isMobile ? '10px' : '15px',
        background: 'rgba(255,102,153,0.05)',
      }}>
        <div style={{ fontSize: isMobile ? '12px' : '14px', marginBottom: isMobile ? '10px' : '15px', textAlign: 'center', color: '#ff6699' }}>
          ◢ SUBJECT: MAXINE MAYFIELD - VECNA PROTOCOL ◣
        </div>

        {!isMobile && (
          <pre style={{ fontSize: '14px', lineHeight: '1.2', marginBottom: '15px', textAlign: 'center', color: '#ff6699' }}>
{`
      ╔═════════════════════════════════════╗
      ║  ┌───────────────────────────────┐  ║
      ║  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  ║
      ║  │  ▓ KATE BUSH - RUNNING UP... ▓  │  ║
      ║  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  ║
      ║  │  ◄◄    ►    ■    ►►    ○    │  ║
      ║  └───────────────────────────────┘  ║
      ║              SONY WALKMAN            ║
      ╚═════════════════════════════════════╝
`}
          </pre>
        )}

        <div style={{
          padding: isMobile ? '8px' : '12px',
          border: '1px solid #ff6699',
          background: 'rgba(255,102,153,0.1)',
          marginBottom: isMobile ? '10px' : '15px',
        }}>
          <div style={{ color: '#ff6699', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '14px' }}>DR. OWENS' RESEARCH NOTES:</div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', color: baseColor, lineHeight: '1.6' }}>
            Subject Mayfield exhibited resistance to Vecna's psychic attack when exposed to
            high-emotional-significance audio stimulus. Theory: Strong emotional memories
            create "anchor" to physical reality, preventing full consciousness transfer
            to Vecna's mental domain.
          </div>
        </div>

        <div style={{ marginBottom: isMobile ? '10px' : '15px' }}>
          <div style={{ color: '#ff6699', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '14px' }}>SONG ANALYSIS - "RUNNING UP THAT HILL":</div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', color: baseColor, lineHeight: '1.6' }}>
            Subject reports song associated with memories of her brother Billy and
            skateboarding in California - a time before trauma. The emotional resonance
            appears to strengthen psychic barriers against Vecna's intrusion.
            <br /><br />
            <span style={{ color: '#ffcc00', fontStyle: 'italic' }}>
              "If I only could, I'd make a deal with God..."
            </span>
          </div>
        </div>

        <div style={{
          padding: isMobile ? '8px' : '12px',
          border: '1px solid #ff3300',
          background: 'rgba(255,51,0,0.1)',
        }}>
          <div style={{ color: '#ff3300', marginBottom: isMobile ? '6px' : '8px', fontSize: isMobile ? '11px' : '14px' }}>CURRENT STATUS:</div>
          <div style={{ fontSize: isMobile ? '10px' : '13px', color: '#ffcc00', lineHeight: '1.5' }}>
            Subject in coma following Operation Piggyback. Clinically dead for 67 seconds.
            Revived by Subject 011's intervention. Extensive injuries: bilateral arm/leg
            fractures, retinal damage, spinal trauma. Prognosis: Unknown.
            <br /><br />
            Note: Subject 011 reports "Max is still in there. I can feel her."
            {!isMobile && ' Recommend continued monitoring and preparation for potential Vecna return.'}
          </div>
        </div>
      </div>
    </div>
  );

  const renderScanning = () => (
    <div style={{ color: baseColor, fontSize: '13px', textAlign: 'center' }}>
      <div style={{
        border: `1px solid ${baseColor}`,
        padding: '40px 20px',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: '18px', marginBottom: '20px', animation: 'blink 0.5s infinite' }}>
          ◢ DIMENSIONAL SCAN IN PROGRESS ◣
        </div>

        <pre style={{ fontSize: '13px', lineHeight: '1.2', marginBottom: '20px', color: dimColor }}>
{`
     ╔═══════════════════════════════════════╗
     ║                                       ║
     ║   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ║
     ║   ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░   ║
     ║   ░░▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒░░   ║
     ║   ░░▒▒▓▓████████████████▓▓▒▒░░   ║
     ║   ░░▒▒▓▓██  SCANNING  ██▓▓▒▒░░   ║
     ║   ░░▒▒▓▓████████████████▓▓▒▒░░   ║
     ║   ░░▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒░░   ║
     ║   ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░   ║
     ║   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ║
     ║                                       ║
     ╚═══════════════════════════════════════╝
`}
        </pre>

        <div style={{ color: dimColor, fontSize: '14px' }}>
          QUERYING SEISMIC DATABASE...<br />
          ANALYZING ATMOSPHERIC CONDITIONS...<br />
          CALCULATING DIMENSIONAL RISK...
        </div>
      </div>
    </div>
  );

  // Shared risk color function
  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL': return '#ff0000';
      case 'HIGH': return '#ff3300';
      case 'ELEVATED': return '#ff6600';
      case 'MODERATE': return '#ffcc00';
      default: return '#4a8';
    }
  };

  const renderInfo = () => (
    <div style={{ color: baseColor, fontSize: isMobile ? '10px' : '12px' }}>
      <div style={{
        border: `1px solid ${borderColor}`,
        padding: isMobile ? '8px' : '12px',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{ borderBottom: `1px solid ${borderColor}`, paddingBottom: isMobile ? '4px' : '8px', marginBottom: isMobile ? '8px' : '12px', fontSize: isMobile ? '11px' : '14px', letterSpacing: isMobile ? '0.5px' : '1px', textAlign: 'center' }}>
          {isMobile ? '◢ PROJECT INFO ◣' : '◢ PROJECT DOCUMENTATION ◣'}
        </div>

        {/* Developer */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '6px' : '10px', border: `1px solid #4a8`, background: 'rgba(74,136,68,0.1)' }}>
          <div style={{ color: '#4a8', fontSize: isMobile ? '9px' : '12px', marginBottom: isMobile ? '6px' : '8px' }}>▓ DEVELOPER</div>
          <div style={{ display: 'flex', gap: isMobile ? '8px' : '15px', alignItems: 'flex-start' }}>
            <div style={{
              width: isMobile ? '50px' : '80px',
              height: isMobile ? '50px' : '80px',
              border: '1px solid #4a8',
              background: '#0a1a0a',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              <img
                src="/kevin.jpeg"
                alt="Kevin Klein"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'sepia(100%) saturate(300%) brightness(0.9) contrast(1.1) hue-rotate(70deg)',
                  mixBlendMode: 'screen',
                }}
              />
            </div>
            <div style={{ flex: 1, fontSize: isMobile ? '10px' : '14px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '4px' }}>Built by <span style={{ color: baseColor }}>Kevin Klein</span></div>
              <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '13px', marginBottom: isMobile ? '6px' : '10px' }}>
                Analytics Engineer • Data Visualization • Creative Development
              </div>
              <div style={{ display: 'flex', gap: isMobile ? '6px' : '10px', flexWrap: 'wrap' }}>
                <a
                  href="https://www.linkedin.com/in/kevinkleinads"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: isMobile ? '4px' : '6px',
                    padding: isMobile ? '4px 8px' : '6px 12px',
                    background: '#0a4a8a',
                    border: '1px solid #0077b5',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontSize: isMobile ? '10px' : '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#0077b5';
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(0,119,181,0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#0a4a8a';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>in</span>
                </a>
                <a
                  href="mailto:kevin@amrylin.com"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: isMobile ? '4px' : '6px',
                    padding: isMobile ? '4px 8px' : '6px 12px',
                    background: '#1a3a1a',
                    border: '1px solid #4a8',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontSize: isMobile ? '10px' : '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#2a5a2a';
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(74,136,68,0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#1a3a1a';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize: isMobile ? '12px' : '14px' }}>@</span>
                  <span>kevin@amrylin.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px' }}>
          <div style={{ color: '#ffcc00', fontSize: isMobile ? '9px' : '12px', marginBottom: isMobile ? '4px' : '6px' }}>▓ ABOUT</div>
          <div style={{ fontSize: isMobile ? '9px' : '14px', lineHeight: '1.6', color: dimColor }}>
            This terminal is a hybrid project serving as both an <span style={{ color: baseColor }}>analytics engineering portfolio piece</span> and a <span style={{ color: baseColor }}>Stranger Things fan experience</span>. It demonstrates real-time data integration, metric calculation, and creative data visualization—all wrapped in an authentic 1983 DOE terminal aesthetic.
          </div>
        </div>

        {/* Data Sources */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '6px' : '10px', border: `1px solid ${borderColor}` }}>
          <div style={{ color: '#ffcc00', fontSize: isMobile ? '9px' : '12px', marginBottom: isMobile ? '4px' : '8px' }}>▓ LIVE DATA SOURCES</div>
          <div style={{ fontSize: isMobile ? '9px' : '14px', lineHeight: isMobile ? '1.6' : '1.8' }}>
            <div><span style={{ color: dimColor }}>SEISMIC:</span> <span style={{ color: '#4a8' }}>USGS Earthquake API</span> — Real-time global seismic events</div>
            <div><span style={{ color: dimColor }}>ATMOSPHERIC:</span> <span style={{ color: '#4a8' }}>Open-Meteo API</span> — Live weather & atmospheric conditions</div>
            <div><span style={{ color: dimColor }}>HOT ZONES:</span> <span style={{ color: '#4a8' }}>Aggregated seismic + weather data</span> — 7-day rolling analysis</div>
          </div>
        </div>

        {/* Metric Creation */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '6px' : '10px', border: `1px solid ${borderColor}` }}>
          <div style={{ color: '#ffcc00', fontSize: isMobile ? '9px' : '12px', marginBottom: isMobile ? '4px' : '8px' }}>▓ DIMENSIONAL INSTABILITY INDEX</div>
          <div style={{ fontSize: isMobile ? '9px' : '14px', lineHeight: '1.6', color: dimColor }}>
            The "risk score" combines multiple real data points into a single metric:
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '13px', marginTop: isMobile ? '4px' : '8px', lineHeight: isMobile ? '1.6' : '1.8' }}>
            <div><span style={{ color: '#ff6600' }}>+15-25</span> Major seismic events (M5.0+)</div>
            <div><span style={{ color: '#ff6600' }}>+8-15</span> Significant seismic activity (M4.0+)</div>
            <div><span style={{ color: '#ff6600' }}>+5-10</span> Atmospheric anomalies (storms, temp extremes)</div>
            <div><span style={{ color: '#ff6600' }}>+3-8</span> Electromagnetic factors (wind, pressure)</div>
            <div><span style={{ color: '#ff6600' }}>+1-5</span> Temporal factors (night, recent activity)</div>
          </div>
        </div>

        {/* Tech Stack */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '6px' : '10px', border: `1px solid ${borderColor}` }}>
          <div style={{ color: '#ffcc00', fontSize: isMobile ? '9px' : '12px', marginBottom: isMobile ? '4px' : '8px' }}>▓ TECHNICAL STACK</div>
          <div style={{ fontSize: isMobile ? '9px' : '14px', lineHeight: isMobile ? '1.6' : '1.8' }}>
            <div><span style={{ color: dimColor }}>FRONTEND:</span> React 18 + Vite</div>
            <div><span style={{ color: dimColor }}>STYLING:</span> Inline CSS (self-contained components)</div>
            <div><span style={{ color: dimColor }}>FONTS:</span> VT323 (Google Fonts)</div>
            <div><span style={{ color: dimColor }}>DATA:</span> Real-time API polling with custom hooks</div>
          </div>
        </div>

        {/* Content Credits */}
        <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: isMobile ? '6px' : '10px', border: `1px solid ${borderColor}` }}>
          <div style={{ color: '#ffcc00', fontSize: isMobile ? '9px' : '12px', marginBottom: isMobile ? '4px' : '8px' }}>▓ CONTENT REFERENCES</div>
          <div style={{ fontSize: isMobile ? '9px' : '14px', lineHeight: isMobile ? '1.6' : '1.8' }}>
            <div style={{ color: dimColor, marginBottom: '6px' }}>
              Character bios, lore details, and Stranger Things universe information sourced from:
            </div>
            <a
              href="https://strangerthings.fandom.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#4a8',
                textDecoration: 'none',
              }}
            >
              Stranger Things Wiki (Fandom)
            </a>
            <div style={{ color: dimColor, fontSize: isMobile ? '8px' : '12px', marginTop: '6px' }}>
              This is a fan project and is not affiliated with Netflix or the Duffer Brothers.
            </div>
          </div>
        </div>

        {/* Hint Section */}
        <div style={{ marginTop: isMobile ? '8px' : '12px', padding: isMobile ? '6px' : '10px', border: `1px dashed ${borderColor}`, textAlign: 'center' }}>
          <div style={{ color: baseColor, fontSize: isMobile ? '9px' : '13px', marginBottom: '4px' }}>
            ▸ UNLOCK MORE CONTENT VIA <span style={{ color: '#ffcc00' }}>[F9] COMMAND</span>
          </div>
          <div style={{ color: dimColor, fontSize: isMobile ? '8px' : '12px' }}>
            Try my favorite character: <span style={{ color: '#ff6600' }}>MAX</span>
          </div>
        </div>

        <div style={{ marginTop: isMobile ? '6px' : '10px', textAlign: 'center', color: dimColor, fontSize: isMobile ? '8px' : '12px' }}>
          All "classified" content is fictional. Easter eggs await the curious.
        </div>
      </div>
    </div>
  );

  const renderHotZones = () => {
    const formatTimeAgo = (date) => {
      const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
      if (mins < 60) return `${mins}m ago`;
      if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
      return `${Math.floor(mins / 1440)}d ago`;
    };

    const selectedZone = globalHotZones[selectedHotZoneIndex];

    // Render detail view for selected hot zone
    if (showHotZoneDetail && selectedZone) {
      const riskColor = getRiskColor(selectedZone.level);
      const seismicFactors = selectedZone.factors?.filter(f =>
        ['SEISMIC ACTIVITY', 'MAJOR BREACH', 'SIGNIFICANT EVENT', 'MODERATE EVENT', 'RECENT ACTIVITY'].includes(f.name)
      ) || [];
      const atmosFactors = selectedZone.factors?.filter(f =>
        ['ELECTROMAGNETIC STORM', 'PRECIPITATION ANOMALY', 'THERMAL ANOMALY', 'COLD FRONT', 'PRESSURE DISTORTION', 'VORTEX ACTIVITY', 'WIND ANOMALY', 'SKY OBSCURED', 'DARKNESS FACTOR'].includes(f.name)
      ) || [];

      return (
        <div style={{ color: baseColor, fontSize: '13px' }}>
          <div style={{
            border: `1px solid ${riskColor}`,
            padding: '8px',
            background: 'rgba(0,0,0,0.3)',
            marginBottom: '8px',
          }}>
            {isMobile && (
              <button
                onClick={() => setShowHotZoneDetail(false)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${borderColor}`,
                  color: baseColor,
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                ◀ BACK TO LIST
              </button>
            )}
            <div style={{
              fontSize: '14px',
              marginBottom: '8px',
              textAlign: 'center',
              color: riskColor,
              textShadow: `0 0 8px ${riskColor}`,
            }}>
              ◢ INTERDIMENSIONAL RISK ASSESSMENT ◣
            </div>

            {/* Real-time dimensional flux sparkline */}
            {(() => {
              const baseRisk = selectedZone.score;
              const variance = 10; // +/- variance around base risk
              return (
                <div style={{
                  padding: '6px',
                  marginBottom: '8px',
                  border: `1px solid ${borderColor}`,
                  background: 'rgba(0,0,0,0.2)',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                  }}>
                    <span style={{ color: dimColor, fontSize: '7px' }}>DIMENSIONAL FLUX MONITOR</span>
                    {(() => {
                      const currentVal = baseRisk + (hotZoneSparkline[hotZoneSparkline.length - 1] - 0.5) * variance * 2;
                      return (
                        <span style={{
                          color: currentVal > 60 ? '#ff3300' : currentVal > 40 ? baseColor : '#4a8',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}>
                          {currentVal.toFixed(1)}%
                        </span>
                      );
                    })()}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    height: '20px',
                    gap: '1px',
                    overflow: 'hidden',
                    width: '100%',
                  }}>
                    {hotZoneSparkline.map((normalizedVal, i) => {
                      const val = baseRisk + (normalizedVal - 0.5) * variance * 2;
                      const height = Math.max(2, (val / 100) * 20);
                      const isRecent = i >= hotZoneSparkline.length - 3;
                      const color = val > 70 ? '#ff0000' :
                                    val > 55 ? '#ff3300' :
                                    val > 40 ? '#ff6600' :
                                    val > 25 ? baseColor : '#4a8';
                      return (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            height: `${height}px`,
                            background: color,
                            opacity: isRecent ? 1 : 0.6 + (i / hotZoneSparkline.length) * 0.4,
                            boxShadow: isRecent && val > 50 ? `0 0 4px ${color}` : 'none',
                            transition: 'height 0.1s ease',
                          }}
                        />
                      );
                    })}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '3px',
                    fontSize: '6px',
                    color: dimColor,
                  }}>
                    <span>-6s</span>
                    <span>LIVE</span>
                    <span>NOW</span>
                  </div>
                </div>
              );
            })()}

            {/* Location Info */}
            <div style={{ marginBottom: '8px', padding: '6px', border: `1px solid ${borderColor}` }}>
              <div style={{ color: dimColor, fontSize: '14px', marginBottom: '2px' }}>HOT ZONE #{selectedHotZoneIndex + 1}</div>
              <div style={{ fontSize: '12px' }}>
                {selectedZone.region.toUpperCase()}
              </div>
              <div style={{ color: dimColor, fontSize: '14px', marginTop: '2px' }}>
                COORDINATES: {selectedZone.lat.toFixed(4)}°N, {selectedZone.lon.toFixed(4)}°E
              </div>
            </div>

            {/* Risk Score */}
            <div style={{
              textAlign: 'center',
              padding: '10px',
              border: `1px solid ${riskColor}`,
              background: `rgba(${selectedZone.level === 'CRITICAL' ? '255,0,0' : selectedZone.level === 'HIGH' ? '255,51,0' : '255,176,0'},0.1)`,
              marginBottom: '8px',
            }}>
              <div style={{ color: dimColor, fontSize: '14px', marginBottom: '2px' }}>DIMENSIONAL INSTABILITY INDEX</div>
              <div style={{
                fontSize: '28px',
                color: riskColor,
                textShadow: `0 0 15px ${riskColor}`,
                fontWeight: 'bold',
              }}>
                {selectedZone.score}
              </div>
              <div style={{
                fontSize: '12px',
                color: riskColor,
                marginTop: '4px',
                animation: selectedZone.level === 'CRITICAL' ? 'blink 0.5s infinite' : 'none',
              }}>
                THREAT LEVEL: {selectedZone.level}
              </div>

              {/* Risk bar */}
              <div style={{
                marginTop: '8px',
                height: '6px',
                background: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${selectedZone.score}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, #4a8 0%, #ffcc00 50%, #ff3300 80%, #ff0000 100%)`,
                  backgroundSize: '100px 100%',
                }} />
              </div>
            </div>

            {/* Risk Factors */}
            {selectedZone.factors && selectedZone.factors.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ color: dimColor, fontSize: '14px', marginBottom: '6px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '3px' }}>
                  CONTRIBUTING FACTORS
                </div>
                {selectedZone.factors.map((factor, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '12px' }}>
                    <span style={{ color: factor.value >= 15 ? '#ff6600' : baseColor }}>
                      {factor.name}
                    </span>
                    <span style={{ color: dimColor }}>+{factor.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Current Conditions */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
              <div style={{ padding: '6px', border: `1px solid ${borderColor}` }}>
                <div style={{ color: dimColor, fontSize: '7px', marginBottom: '2px' }}>ATMOSPHERIC</div>
                <div style={{ fontSize: '12px' }}>
                  TEMP: {selectedZone.weather?.temperature_2m?.toFixed(1) || '—'}°C<br />
                  WIND: {selectedZone.weather?.wind_speed_10m?.toFixed(0) || '—'} km/h<br />
                  FACTORS: {atmosFactors.length > 0 ? atmosFactors.length + ' DETECTED' : 'STABLE'}
                </div>
              </div>
              <div style={{ padding: '6px', border: `1px solid ${borderColor}` }}>
                <div style={{ color: dimColor, fontSize: '7px', marginBottom: '2px' }}>SEISMIC (7 DAYS)</div>
                <div style={{ fontSize: '12px' }}>
                  EVENTS: {selectedZone.quakeCount}<br />
                  MAX MAG: {selectedZone.maxMagnitude.toFixed(1)}<br />
                  STATUS: {selectedZone.quakeCount > 10 ? 'HIGHLY ACTIVE' : selectedZone.quakeCount > 5 ? 'ACTIVE' : 'STABLE'}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ marginBottom: '8px', padding: '6px', border: `1px solid ${borderColor}` }}>
              <div style={{ color: dimColor, fontSize: '7px', marginBottom: '2px' }}>RECENT ACTIVITY</div>
              <div style={{ fontSize: '12px' }}>
                LATEST EVENT: {formatTimeAgo(selectedZone.recentTime)}<br />
                DEPTH RANGE: {selectedZone.avgDepth ? selectedZone.avgDepth.toFixed(1) + ' km (avg)' : 'UNKNOWN'}
              </div>
            </div>

            {/* Recommendation */}
            <div style={{
              padding: '6px',
              border: `1px solid ${riskColor}`,
              background: `rgba(${selectedZone.level === 'CRITICAL' ? '255,0,0' : '255,176,0'},0.1)`,
              textAlign: 'center',
              fontSize: '12px',
            }}>
              <div style={{ color: riskColor, marginBottom: '3px' }}>RECOMMENDATION</div>
              <div style={{ color: baseColor }}>
                {selectedZone.level === 'CRITICAL' ? 'IMMEDIATE EVACUATION ADVISED. DIMENSIONAL BREACH IMMINENT.' :
                 selectedZone.level === 'HIGH' ? 'EXERCISE EXTREME CAUTION. MONITOR FOR ANOMALIES.' :
                 selectedZone.level === 'ELEVATED' ? 'HEIGHTENED AWARENESS RECOMMENDED. REPORT UNUSUAL ACTIVITY.' :
                 selectedZone.level === 'MODERATE' ? 'STANDARD PRECAUTIONS. MAINTAIN SITUATIONAL AWARENESS.' :
                 'MINIMAL RISK. CONTINUE NORMAL OPERATIONS.'}
              </div>
            </div>

            {isMobile ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <button
                  onClick={() => setSelectedHotZoneIndex(prev => Math.max(0, prev - 1))}
                  disabled={selectedHotZoneIndex === 0}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${selectedHotZoneIndex === 0 ? bgColor : borderColor}`,
                    color: selectedHotZoneIndex === 0 ? bgColor : baseColor,
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    cursor: selectedHotZoneIndex === 0 ? 'default' : 'pointer',
                  }}
                >
                  ◀ PREV
                </button>
                <button
                  onClick={() => setShowHotZoneDetail(false)}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${borderColor}`,
                    color: baseColor,
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  ✕ BACK
                </button>
                <button
                  onClick={() => setSelectedHotZoneIndex(prev => Math.min(globalHotZones.length - 1, prev + 1))}
                  disabled={selectedHotZoneIndex === globalHotZones.length - 1}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${selectedHotZoneIndex === globalHotZones.length - 1 ? bgColor : borderColor}`,
                    color: selectedHotZoneIndex === globalHotZones.length - 1 ? bgColor : baseColor,
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    cursor: selectedHotZoneIndex === globalHotZones.length - 1 ? 'default' : 'pointer',
                  }}
                >
                  NEXT ▶
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '8px', color: dimColor, fontSize: '14px' }}>
                [ESC] BACK TO LIST   [↑/↓] PREV/NEXT ZONE
              </div>
            )}
          </div>
        </div>
      );
    }

    // Render list view
    return (
      <div style={{ color: baseColor, fontSize: '13px' }}>
        {/* Main hot zones panel */}
        <div style={{
          border: `1px solid ${borderColor}`,
          padding: '8px',
          background: 'rgba(0,0,0,0.3)',
          marginBottom: '8px',
        }}>
          <div style={{
            borderBottom: `1px solid ${borderColor}`,
            paddingBottom: '6px',
            marginBottom: '8px',
            fontSize: isMobile ? '11px' : '14px',
            letterSpacing: isMobile ? '0.5px' : '1px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>{isMobile ? '◢ HOT ZONES' : '◢ GLOBAL INSTABILITY HOT ZONES'}</span>
            <span style={{ fontSize: isMobile ? '10px' : '14px', color: hotZonesLoading ? dimColor : '#4a8' }}>
              {hotZonesLoading ? '○ UPDATING...' : (isMobile ? '● LIVE' : '● LIVE USGS FEED')}
            </span>
          </div>

          {/* Explanatory copy */}
          <div style={{
            color: dimColor,
            fontSize: isMobile ? '9px' : '12px',
            marginBottom: '8px',
            lineHeight: '1.4',
          }}>
            Regions with highest probability of interdimensional breach events based on seismic activity and atmospheric anomalies.
          </div>

          {/* Real-time dimensional instability sparkline */}
          {(() => {
            // Use highest risk score from hot zones for global view
            const baseRisk = globalHotZones.length > 0
              ? Math.max(...globalHotZones.slice(0, 5).map(z => z.score))
              : 50;
            const variance = 15; // +/- variance around base risk
            return (
              <div style={{
                padding: '8px',
                marginBottom: '8px',
                border: `1px solid ${borderColor}`,
                background: 'rgba(0,0,0,0.2)',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}>
                  <span style={{ color: dimColor, fontSize: isMobile ? '10px' : '14px' }}>{isMobile ? 'DIMENSIONAL FLUX' : 'GLOBAL DIMENSIONAL FLUX'}</span>
                  {(() => {
                    const currentVal = baseRisk + (hotZoneSparkline[hotZoneSparkline.length - 1] - 0.5) * variance * 2;
                    return (
                      <span style={{
                        color: currentVal > 60 ? '#ff3300' : currentVal > 40 ? baseColor : '#4a8',
                        fontSize: '13px',
                        fontWeight: 'bold',
                      }}>
                        {currentVal.toFixed(1)}%
                      </span>
                    );
                  })()}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  height: '24px',
                  gap: '1px',
                  overflow: 'hidden',
                  width: '100%',
                }}>
                  {hotZoneSparkline.map((normalizedVal, i) => {
                    const val = baseRisk + (normalizedVal - 0.5) * variance * 2;
                    const height = Math.max(2, (val / 100) * 24);
                    const isRecent = i >= hotZoneSparkline.length - 3;
                    const color = val > 70 ? '#ff0000' :
                                  val > 55 ? '#ff3300' :
                                  val > 40 ? '#ff6600' :
                                  val > 25 ? baseColor : '#4a8';
                    return (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          height: `${height}px`,
                          background: color,
                          opacity: isRecent ? 1 : 0.6 + (i / hotZoneSparkline.length) * 0.4,
                          boxShadow: isRecent && val > 50 ? `0 0 4px ${color}` : 'none',
                          transition: 'height 0.1s ease',
                        }}
                      />
                    );
                  })}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '4px',
                  fontSize: '7px',
                  color: dimColor,
                }}>
                  <span>-6s</span>
                  <span>REAL-TIME MONITORING</span>
                  <span>NOW</span>
                </div>
              </div>
            );
          })()}

          {hotZonesLoading && globalHotZones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 10px', color: dimColor }}>
              <div style={{ fontSize: '14px', marginBottom: '6px' }}>ACQUIRING GLOBAL SEISMIC DATA...</div>
              <div style={{ fontSize: '12px' }}>
                SCANNING TECTONIC PLATE BOUNDARIES<br />
                ANALYZING DIMENSIONAL BREACH POINTS
              </div>
            </div>
          ) : (
            <>
              {/* Hot zones table */}
              <div style={{ overflowX: 'auto', maxHeight: isMobile ? '220px' : '280px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? '10px' : '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${borderColor}`, color: dimColor }}>
                      <th style={{ padding: isMobile ? '4px 2px' : '8px 5px', textAlign: 'left' }}>{isMobile ? '#' : 'RANK'}</th>
                      <th style={{ padding: isMobile ? '4px 2px' : '8px 5px', textAlign: 'left' }}>REGION</th>
                      <th style={{ padding: isMobile ? '4px 2px' : '8px 5px', textAlign: 'center' }}>RISK</th>
                      <th style={{ padding: isMobile ? '4px 2px' : '8px 5px', textAlign: 'center' }}>{isMobile ? 'LVL' : 'LEVEL'}</th>
                      <th style={{ padding: isMobile ? '4px 2px' : '8px 5px', textAlign: 'center' }}>{isMobile ? 'SEI' : 'SEISMIC'}</th>
                      {!isMobile && <th style={{ padding: '8px 5px', textAlign: 'right' }}>LATEST</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {globalHotZones.slice(0, 12).map((zone, i) => {
                      const riskColor = getRiskColor(zone.level);
                      const isSelected = i === selectedHotZoneIndex;

                      return (
                        <tr
                          key={zone.id}
                          onClick={() => { setSelectedHotZoneIndex(i); setShowHotZoneDetail(true); }}
                          style={{
                            borderBottom: `1px solid ${bgColor}`,
                            background: isSelected ? 'rgba(255,176,0,0.15)' : 'transparent',
                            cursor: 'pointer',
                          }}
                        >
                          <td style={{ padding: isMobile ? '4px 2px' : '8px 5px', color: isSelected ? baseColor : (i < 3 ? riskColor : dimColor) }}>
                            {isSelected ? '▶' : (i < 3 ? '▲' : '○')} {String(i + 1).padStart(2, '0')}
                          </td>
                          <td style={{ padding: isMobile ? '4px 2px' : '8px 5px', color: isSelected ? baseColor : dimColor, maxWidth: isMobile ? '80px' : 'none' }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isMobile ? 'nowrap' : 'normal' }}>
                              {isMobile ? zone.region.toUpperCase().substring(0, 12) + (zone.region.length > 12 ? '...' : '') : zone.region.toUpperCase()}
                            </div>
                            {!isMobile && (
                              <div style={{ fontSize: '12px', color: dimColor }}>
                                {zone.weather ? `${zone.weather.temperature_2m?.toFixed(0)}°C` : '—'} | {zone.lat.toFixed(1)}°, {zone.lon.toFixed(1)}°
                              </div>
                            )}
                          </td>
                          <td style={{
                            padding: isMobile ? '4px 2px' : '8px 5px',
                            textAlign: 'center',
                            color: riskColor,
                            fontWeight: 'bold',
                            textShadow: zone.score >= 60 ? `0 0 8px ${riskColor}` : 'none',
                          }}>
                            {zone.score}
                          </td>
                          <td style={{
                            padding: isMobile ? '4px 2px' : '8px 5px',
                            textAlign: 'center',
                            color: riskColor,
                            fontSize: isMobile ? '9px' : '13px',
                          }}>
                            {isMobile ? zone.level.substring(0, 4) : zone.level}
                          </td>
                          <td style={{ padding: isMobile ? '4px 2px' : '8px 5px', textAlign: 'center' }}>
                            <div style={{ color: zone.quakeCount > 10 ? '#ff6600' : zone.quakeCount > 5 ? baseColor : dimColor, fontSize: isMobile ? '9px' : 'inherit' }}>
                              {zone.quakeCount} {isMobile ? 'E' : 'EVT'}
                            </div>
                            <div style={{ fontSize: isMobile ? '8px' : '12px', color: zone.maxMagnitude >= 5 ? '#ff3300' : dimColor }}>
                              M{zone.maxMagnitude.toFixed(1)}
                            </div>
                          </td>
                          {!isMobile && (
                            <td style={{ padding: '8px 5px', textAlign: 'right', color: dimColor, fontSize: '13px' }}>
                              {formatTimeAgo(zone.recentTime)}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Stats summary */}
              <div style={{
                marginTop: '15px',
                padding: '10px',
                border: `1px solid ${borderColor}`,
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px',
                fontSize: '13px',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ff0000', fontSize: '16px' }}>
                    {globalHotZones.filter(z => z.level === 'CRITICAL').length}
                  </div>
                  <div style={{ color: dimColor }}>CRITICAL</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ff3300', fontSize: '16px' }}>
                    {globalHotZones.filter(z => z.level === 'HIGH').length}
                  </div>
                  <div style={{ color: dimColor }}>HIGH</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ff6600', fontSize: '16px' }}>
                    {globalHotZones.filter(z => z.level === 'ELEVATED').length}
                  </div>
                  <div style={{ color: dimColor }}>ELEVATED</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#4a8', fontSize: '16px' }}>
                    {globalHotZones.filter(z => z.level === 'LOW' || z.level === 'MODERATE').length}
                  </div>
                  <div style={{ color: dimColor }}>STABLE</div>
                </div>
              </div>

              <div style={{ color: dimColor, fontSize: '13px', marginTop: '15px', textAlign: 'center' }}>
                [↑/↓] SELECT   [ENTER] VIEW DETAILS
              </div>
            </>
          )}
        </div>

        {/* Footer info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: dimColor,
          fontSize: '13px',
        }}>
          <span>
            SOURCES: USGS SEISMIC + OPEN-METEO ATMOSPHERIC | 7-DAY WINDOW
          </span>
          <span>
            {hotZonesLastUpdate && `UPDATED: ${hotZonesLastUpdate.toLocaleTimeString()}`}
          </span>
        </div>
      </div>
    );
  };

  const renderScanResult = () => {
    if (!scanResult) return renderScanning();

    const riskColor = getRiskColor(scanResult.risk.level);

    return (
      <div style={{ color: baseColor, fontSize: '12px' }}>
        <div style={{
          border: `2px solid ${riskColor}`,
          padding: '15px',
          background: 'rgba(0,0,0,0.3)',
          marginBottom: '15px',
        }}>
          <div style={{
            fontSize: '16px',
            marginBottom: '15px',
            textAlign: 'center',
            color: riskColor,
            textShadow: `0 0 10px ${riskColor}`,
          }}>
            ◢ INTERDIMENSIONAL RISK ASSESSMENT ◣
          </div>

          {/* Real-time dimensional flux sparkline */}
          {(() => {
            const baseRisk = scanResult.risk.score;
            const variance = 12; // +/- variance around base risk
            return (
              <div style={{
                padding: '10px',
                marginBottom: '15px',
                border: `1px solid ${borderColor}`,
                background: 'rgba(0,0,0,0.2)',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}>
                  <span style={{ color: dimColor, fontSize: '13px' }}>DIMENSIONAL FLUX MONITOR</span>
                  {(() => {
                    const currentVal = baseRisk + (hotZoneSparkline[hotZoneSparkline.length - 1] - 0.5) * variance * 2;
                    return (
                      <span style={{
                        color: currentVal > 60 ? '#ff3300' : currentVal > 40 ? baseColor : '#4a8',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}>
                        {currentVal.toFixed(1)}%
                      </span>
                    );
                  })()}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  height: '30px',
                  gap: '1px',
                  overflow: 'hidden',
                  width: '100%',
                }}>
                  {hotZoneSparkline.map((normalizedVal, i) => {
                    const val = baseRisk + (normalizedVal - 0.5) * variance * 2;
                    const height = Math.max(2, (val / 100) * 30);
                    const isRecent = i >= hotZoneSparkline.length - 3;
                    const color = val > 70 ? '#ff0000' :
                                  val > 55 ? '#ff3300' :
                                  val > 40 ? '#ff6600' :
                                  val > 25 ? baseColor : '#4a8';
                    return (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          height: `${height}px`,
                          background: color,
                          opacity: isRecent ? 1 : 0.6 + (i / hotZoneSparkline.length) * 0.4,
                          boxShadow: isRecent && val > 50 ? `0 0 4px ${color}` : 'none',
                          transition: 'height 0.1s ease',
                        }}
                      />
                    );
                  })}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '4px',
                  fontSize: '14px',
                  color: dimColor,
                }}>
                  <span>-6s</span>
                  <span>REAL-TIME MONITORING</span>
                  <span>NOW</span>
                </div>
              </div>
            );
          })()}

          {/* Location Info */}
          <div style={{ marginBottom: '15px', padding: '10px', border: `1px solid ${borderColor}` }}>
            <div style={{ color: dimColor, fontSize: '13px', marginBottom: '5px' }}>TARGET LOCATION</div>
            <div style={{ fontSize: '16px' }}>
              {scanResult.location.name.toUpperCase()}, {scanResult.location.admin?.toUpperCase() || scanResult.location.country.toUpperCase()}
            </div>
            <div style={{ color: dimColor, fontSize: '13px', marginTop: '5px' }}>
              COORDINATES: {scanResult.location.lat.toFixed(4)}°N, {scanResult.location.lon.toFixed(4)}°W
            </div>
          </div>

          {/* Risk Score */}
          <div style={{
            textAlign: 'center',
            padding: '20px',
            border: `2px solid ${riskColor}`,
            background: `rgba(${scanResult.risk.level === 'CRITICAL' ? '255,0,0' : scanResult.risk.level === 'HIGH' ? '255,51,0' : '255,176,0'},0.1)`,
            marginBottom: '15px',
          }}>
            <div style={{ color: dimColor, fontSize: '13px', marginBottom: '5px' }}>DIMENSIONAL INSTABILITY INDEX</div>
            <div style={{
              fontSize: '48px',
              color: riskColor,
              textShadow: `0 0 20px ${riskColor}`,
              fontWeight: 'bold',
            }}>
              {scanResult.risk.score}
            </div>
            <div style={{
              fontSize: '18px',
              color: riskColor,
              marginTop: '10px',
              animation: scanResult.risk.level === 'CRITICAL' ? 'blink 0.5s infinite' : 'none',
            }}>
              THREAT LEVEL: {scanResult.risk.level}
            </div>

            {/* Risk bar */}
            <div style={{
              marginTop: '15px',
              height: '10px',
              background: bgColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '5px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${scanResult.risk.score}%`,
                height: '100%',
                background: `linear-gradient(90deg, #4a8 0%, #ffcc00 50%, #ff3300 80%, #ff0000 100%)`,
                backgroundSize: '100px 100%',
              }} />
            </div>
          </div>

          {/* Risk Factors */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ color: dimColor, fontSize: '13px', marginBottom: '10px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '5px' }}>
              CONTRIBUTING FACTORS
            </div>
            {scanResult.risk.factors.map((factor, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
                <span style={{ color: factor.value >= 15 ? '#ff6600' : baseColor }}>
                  {factor.name}
                </span>
                <span style={{ color: dimColor }}>+{factor.value}</span>
              </div>
            ))}
          </div>

          {/* Current Conditions */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '6px' : '10px', marginBottom: isMobile ? '10px' : '15px' }}>
            <div style={{ padding: '10px', border: `1px solid ${borderColor}` }}>
              <div style={{ color: dimColor, fontSize: '12px', marginBottom: '5px' }}>ATMOSPHERIC</div>
              <div style={{ fontSize: '14px' }}>
                TEMP: {scanResult.weather.temperature.toFixed(1)}°C<br />
                HUMIDITY: {scanResult.weather.humidity}%<br />
                PRESSURE: {scanResult.weather.pressure.toFixed(0)} hPa
              </div>
            </div>
            <div style={{ padding: '10px', border: `1px solid ${borderColor}` }}>
              <div style={{ color: dimColor, fontSize: '12px', marginBottom: '5px' }}>SEISMIC (7 DAYS)</div>
              <div style={{ fontSize: '14px' }}>
                EVENTS: {scanResult.seismic.quakeCount}<br />
                MAX MAG: {scanResult.seismic.maxMagnitude.toFixed(1)}<br />
                STATUS: {scanResult.seismic.quakeCount > 5 ? 'ACTIVE' : 'STABLE'}
              </div>
            </div>
          </div>

          {/* Nearby Anomalies */}
          {scanResult.nearbyAnomalies.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ color: '#ff6600', fontSize: '13px', marginBottom: '10px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '5px' }}>
                ▓ NEARBY DIMENSIONAL ANOMALIES ▓
              </div>
              {scanResult.nearbyAnomalies.slice(0, 3).map((anomaly, i) => (
                <div key={i} style={{
                  padding: '8px',
                  marginBottom: '5px',
                  border: `1px solid ${anomaly.magnitude >= 4 ? '#ff3300' : '#ffcc00'}`,
                  background: 'rgba(255,176,0,0.05)',
                  fontSize: '13px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: anomaly.magnitude >= 4 ? '#ff3300' : '#ffcc00' }}>
                      {anomaly.type} (M{anomaly.magnitude.toFixed(1)})
                    </span>
                    <span style={{ color: dimColor }}>{anomaly.distance.toFixed(0)} km</span>
                  </div>
                  <div style={{ color: dimColor, marginTop: '3px' }}>{anomaly.place}</div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendation */}
          <div style={{
            padding: '10px',
            border: `1px solid ${riskColor}`,
            background: `rgba(${scanResult.risk.level === 'CRITICAL' ? '255,0,0' : '255,176,0'},0.1)`,
            textAlign: 'center',
            fontSize: '14px',
          }}>
            <div style={{ color: riskColor, marginBottom: '5px' }}>RECOMMENDATION</div>
            <div style={{ color: baseColor }}>
              {scanResult.risk.level === 'CRITICAL' ? 'IMMEDIATE EVACUATION ADVISED. DIMENSIONAL BREACH IMMINENT.' :
               scanResult.risk.level === 'HIGH' ? 'EXERCISE EXTREME CAUTION. MONITOR FOR ANOMALIES.' :
               scanResult.risk.level === 'ELEVATED' ? 'HEIGHTENED AWARENESS RECOMMENDED. REPORT UNUSUAL ACTIVITY.' :
               scanResult.risk.level === 'MODERATE' ? 'STANDARD PRECAUTIONS. MAINTAIN SITUATIONAL AWARENESS.' :
               'MINIMAL RISK. CONTINUE NORMAL OPERATIONS.'}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '15px', color: dimColor, fontSize: '12px' }}>
            SCAN TIMESTAMP: {scanResult.timestamp.toISOString().replace('T', ' ').slice(0, 19)}
            <br />
            [F9] NEW SCAN | [F1] DASHBOARD | RESET TO CLEAR
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={contentRef} style={containerStyle}>
      <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet" />
      <style>{scrollbarCSS}</style>

      <div style={screenStyle}>
        {/* Scanlines */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
          pointerEvents: 'none', borderRadius: '20px',
        }} />

        {/* Screen glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '120%', height: '120%',
          background: `radial-gradient(ellipse at center, rgba(${easterEggState === 'UPSIDE_DOWN' ? '255,51,0' : '255,176,0'},0.03) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {/* Vignette effect - darkened edges */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
          borderRadius: '20px',
          zIndex: 10,
        }} />

        {/* VHS tracking distortion */}
        {vhsTracking > 0 && (
          <div style={vhsTrackingStyle} />
        )}

        {/* Barrel distortion simulation - curved edge shadows */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          boxShadow: 'inset 0 0 60px 20px rgba(0,0,0,0.3), inset 0 0 120px 60px rgba(0,0,0,0.1)',
          borderRadius: '20px',
          pointerEvents: 'none',
          zIndex: 5,
        }} />

        {/* Zoomable Content Wrapper - Scrollable container */}
        <div
          ref={scrollContainerRef}
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
            transformOrigin: 'top center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            userSelect: isDragging ? 'none' : 'auto',
            flex: 1,
            overflow: isMobile ? 'hidden' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Header - Sticky */}
          <div style={{
            color: baseColor,
            textAlign: 'center',
            paddingBottom: isMobile ? '4px' : '8px',
            textShadow: `0 0 8px rgba(${easterEggState === 'UPSIDE_DOWN' ? '255,51,0' : '255,176,0'},0.5)`,
            fontSize: isMobile ? '11px' : '13px',
            letterSpacing: isMobile ? '0.5px' : '1px',
            transform: easterEggState === 'UPSIDE_DOWN' ? 'scaleY(-1)' : 'none',
            background: bgColor,
            position: 'sticky',
            top: 0,
            zIndex: 15,
            borderBottom: `1px solid ${borderColor}`,
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            <div style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 'bold', letterSpacing: isMobile ? '0.5px' : '1px' }}>
              {easterEggState === 'UPSIDE_DOWN' ? 'Y̷̛̖R̶̰̾O̵̳͝T̴̰̑A̴R̵̛͓O̶B̶̮͠Ą̵̛L̴̡̎ ̴̧͝L̵̰̔Ą̷̔N̴̬͘O̸̹̕I̷̱͝T̸̖̄A̶̰N̸̨̛ ̸̱̈S̷̰͝N̴̜̈́I̷K̸̨̈W̸̝̌Ȃ̶̱H̸̫̿' : (isMobile ? 'HAWKINS NATIONAL LAB' : 'HAWKINS NATIONAL LABORATORY')}
            </div>
            <div style={{ fontSize: isMobile ? '10px' : '12px', color: easterEggState === 'UPSIDE_DOWN' ? '#aa2200' : '#cc8800' }}>
              {isMobile ? 'U.S. DOE — CLASSIFIED' : 'U.S. DEPARTMENT OF ENERGY — CLASSIFIED'}
            </div>
            <div style={{ fontSize: isMobile ? '9px' : '13px', marginTop: '2px', color: dimColor }}>
              [{currentView}] {isMobile ? 'MONITORING v2.3.1' : 'DIMENSIONAL STABILITY MONITORING SYSTEM v2.3.1'}
            </div>
          </div>

        {/* Main Content */}
        <div style={{
          transform: easterEggState === 'UPSIDE_DOWN' ? 'scaleY(-1)' : 'none',
          flex: 1,
          padding: isMobile ? '4px 6px' : '8px 0',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          minHeight: 0,
        }}>
          {easterEggState === 'ELEVEN' ? renderEleven() :
           easterEggState === 'BARB' ? renderBarb() :
           easterEggState === 'KONAMI' ? renderKonami() :
           easterEggState === 'HOPPER' ? renderHopper() :
           easterEggState === 'BYERS' ? renderByers() :
           easterEggState === 'JOYCE' ? renderJoyce() :
           easterEggState === 'BOB' ? renderBob() :
           easterEggState === 'JONATHAN' ? renderJonathan() :
           easterEggState === 'DUSTIN' ? renderDustin() :
           easterEggState === 'LUCAS' ? renderLucas() :
           easterEggState === 'MIKE' ? renderMike() :
           easterEggState === 'STEVE' ? renderSteve() :
           easterEggState === 'NANCY' ? renderNancy() :
           easterEggState === 'EDDIE' ? renderEddie() :
           easterEggState === 'HENRY' ? renderHenry() :
           easterEggState === 'MAX' ? renderMax() :
           easterEggState === 'MURRAY' ? renderMurray() :
           easterEggState === 'BILLY' ? renderBilly() :
           easterEggState === 'ROBIN' ? renderRobin() :
           easterEggState === 'BRENNER' ? renderBrenner() :
           easterEggState === 'ERICA' ? renderErica() :
           easterEggState === 'ARGYLE' ? renderArgyle() :
           easterEggState === 'CHRISSY' ? renderChrissy() :
           easterEggState === 'FRED' ? renderFred() :
           easterEggState === 'PATRICK' ? renderPatrick() :
           easterEggState === 'KAREN' ? renderKaren() :
           easterEggState === 'TED' ? renderTed() :
           easterEggState === 'JASON' ? renderJason() :
           easterEggState === 'ALEXEI' ? renderAlexei() :
           easterEggState === 'DEMOGORGON' ? renderDemogorgon() :
           easterEggState === 'MINDFLAYER' ? renderMindflayer() :
           easterEggState === 'VECNA' ? renderVecna() :
           easterEggState === 'SCANNING' ? renderScanning() :
           easterEggState === 'SCAN_RESULT' ? renderScanResult() :
           easterEggState === 'RAINBOW_ROOM' ? renderRainbowRoom() :
           easterEggState === 'EXPERIMENT_LOG' ? renderExperimentLog() :
           easterEggState === 'TERRY_IVES' ? renderTerryIves() :
           easterEggState === 'THE_GATE_ORIGIN' ? renderGateOrigin() :
           easterEggState === 'RUSSIANS' ? renderRussians() :
           easterEggState === 'CREEL_HOUSE' ? renderCreelHouse() :
           easterEggState === 'PIGGYBACK' ? renderPiggyback() :
           easterEggState === 'MAX_TAPE' ? renderMaxTape() :
           currentView === 'DASHBOARD' ? renderDashboard() :
           currentView === 'HOTZONES' ? renderHotZones() :
           currentView === 'SUBJECTS' ? renderSubjects() :
           currentView === 'SECTORS' ? renderSectors() :
           currentView === 'GATE' ? renderGate() :
           currentView === 'INFO' ? renderInfo() :
           renderDashboard()}
        </div>

        {/* Bottom Bar - Sticky (Footer + Navigation) */}
        <div style={{
          background: bgColor,
          position: 'sticky',
          bottom: 0,
          zIndex: 50,
          borderTop: `1px solid ${borderColor}`,
          paddingTop: '6px',
          flexShrink: 0,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}>
          {/* Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: dimColor,
            fontSize: isMobile ? '9px' : '14px',
            paddingBottom: '4px',
            transform: easterEggState === 'UPSIDE_DOWN' ? 'scaleY(-1)' : 'none',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', gap: isMobile ? '4px' : '8px', flexWrap: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span>{isMobile ? 'T7 | SL3 | TOP SECRET' : 'TERMINAL 7 | SUBLEVEL 3 | CLEARANCE: TOP SECRET'}</span>
              {discoveredEasterEggs.size > 0 && !isMobile && (
                <span style={{
                  color: discoveredEasterEggs.size === TOTAL_EASTER_EGGS ? '#5c5' : '#aa8800',
                  opacity: 0.7,
                }}>
                  | {discoveredEasterEggs.size}/{TOTAL_EASTER_EGGS} FILES ACCESSED
                </span>
              )}
            </div>
            <div style={{ flexShrink: 0 }}>{formatTime(time)}</div>
          </div>

          {/* Navigation Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: isMobile ? '3px' : '6px',
            flexWrap: 'wrap',
            paddingBottom: '4px',
            transform: easterEggState === 'UPSIDE_DOWN' ? 'scaleY(-1)' : 'none',
            width: '100%',
            boxSizing: 'border-box',
          }}>
          {[
            { key: 'F1', label: isMobile ? 'HOME' : 'DASHBOARD', view: 'DASHBOARD' },
            { key: 'F2', label: isMobile ? 'ZONES' : 'HOT ZONES', view: 'HOTZONES' },
            { key: 'F3', label: isMobile ? 'SUBJ' : 'SUBJECTS', view: 'SUBJECTS' },
            { key: 'F5', label: isMobile ? 'SECT' : 'SECTORS', view: 'SECTORS' },
            { key: 'F7', label: 'GATE', view: 'GATE' },
            { key: 'F8', label: 'INFO', view: 'INFO' },
            { key: 'F9', label: isMobile ? 'CMD' : 'COMMAND', action: 'command' },
            { key: '◎', label: 'SCAN', action: 'scan', highlight: true },
          ].map((item) => {
            const isActive = item.view && currentView === item.view && !easterEggState;
            return (
              <button
                key={item.label}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (item.action === 'command') {
                    setShowCommand(true);
                    trackEvent('command_input_opened', { method: 'nav_button' });
                  } else if (item.action === 'scan') {
                    setShowScanInput(true);
                    trackEvent('scan_input_opened', { method: 'nav_button' });
                  } else if (item.view) {
                    setCurrentView(item.view);
                    setEasterEggState(null);
                    clearScan();
                    trackEvent('view_change', { view: item.view, method: 'nav_button' });
                  }
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  if (item.action === 'command') {
                    setShowCommand(true);
                    trackEvent('command_input_opened', { method: 'nav_button' });
                  } else if (item.action === 'scan') {
                    setShowScanInput(true);
                    trackEvent('scan_input_opened', { method: 'nav_button' });
                  } else if (item.view) {
                    setCurrentView(item.view);
                    setEasterEggState(null);
                    clearScan();
                    trackEvent('view_change', { view: item.view, method: 'nav_button' });
                  }
                }}
                style={{
                  background: isActive ? 'rgba(255,176,0,0.3)' : 'rgba(255,176,0,0.08)',
                  border: `1px solid ${item.highlight ? '#5c5' : isActive ? baseColor : '#806000'}`,
                  color: item.highlight ? '#5c5' : isActive ? baseColor : '#c90',
                  padding: isMobile ? '8px 6px' : '4px 8px',
                  fontSize: isMobile ? '10px' : '14px',
                  fontFamily: '"VT323", monospace',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.1s',
                  textShadow: isActive ? `0 0 8px ${baseColor}` : 'none',
                  minHeight: isMobile ? '32px' : 'auto',
                  flex: isMobile ? '1 1 calc(25% - 3px)' : '0 0 auto',
                  maxWidth: isMobile ? 'calc(25% - 3px)' : 'none',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = item.highlight ? 'rgba(85,204,85,0.2)' : 'rgba(255,176,0,0.25)';
                  e.target.style.color = item.highlight ? '#5c5' : baseColor;
                  e.target.style.borderColor = item.highlight ? '#5c5' : baseColor;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = isActive ? 'rgba(255,176,0,0.3)' : 'rgba(255,176,0,0.08)';
                  e.target.style.color = item.highlight ? '#5c5' : isActive ? baseColor : '#c90';
                  e.target.style.borderColor = item.highlight ? '#5c5' : isActive ? baseColor : '#806000';
                }}
              >
                {isMobile ? item.label : `[${item.key}] ${item.label}`}
              </button>
            );
          })}
          </div>
        </div>{/* End Bottom Bar */}
        </div>{/* End Zoomable Content Wrapper */}

        {/* Zoom Controls - Outside zoom wrapper to stay fixed (hidden on mobile) */}
        {!isMobile && <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
          zIndex: 20,
        }}>
          {zoomLevel > 1 && (
            <button
              onClick={() => setZoomLevel(prev => Math.max(MIN_ZOOM, Math.round((prev - ZOOM_STEP) * 10) / 10))}
              style={{
                background: 'rgba(255,176,0,0.1)',
                border: `1px solid ${borderColor}`,
                color: dimColor,
                padding: '2px 6px',
                fontSize: '12px',
                fontFamily: '"VT323", monospace',
                cursor: 'pointer',
                lineHeight: 1,
              }}
              title="Zoom Out [-]"
            >
              −
            </button>
          )}
          <span style={{
            color: zoomLevel > 1 ? baseColor : dimColor,
            fontSize: '12px',
            minWidth: '35px',
            textAlign: 'center',
          }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel(prev => Math.min(MAX_ZOOM, Math.round((prev + ZOOM_STEP) * 10) / 10))}
            disabled={zoomLevel >= MAX_ZOOM}
            style={{
              background: 'rgba(255,176,0,0.1)',
              border: `1px solid ${borderColor}`,
              color: zoomLevel >= MAX_ZOOM ? '#444' : dimColor,
              padding: '2px 6px',
              fontSize: '12px',
              fontFamily: '"VT323", monospace',
              cursor: zoomLevel >= MAX_ZOOM ? 'not-allowed' : 'pointer',
              lineHeight: 1,
            }}
            title="Zoom In [+] / Pinch to zoom"
          >
            +
          </button>
          {zoomLevel > 1 && (
            <button
              onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
              style={{
                background: 'rgba(255,176,0,0.1)',
                border: `1px solid ${borderColor}`,
                color: dimColor,
                padding: '2px 6px',
                fontSize: '12px',
                fontFamily: '"VT323", monospace',
                cursor: 'pointer',
                lineHeight: 1,
              }}
              title="Reset Zoom [0]"
            >
              RST
            </button>
          )}
        </div>}

        {/* Command Input Modal */}
        {showCommand && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.85)',
              zIndex: 99,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: isMobile ? '10px' : '20px',
              boxSizing: 'border-box',
            }}
            onClick={() => { setShowCommand(false); setCommandBuffer(''); setCommandError(false); }}
          >
            <div
              style={{
                background: '#0a0802',
                border: `2px solid ${commandError ? '#ff4444' : baseColor}`,
                padding: isMobile ? '10px' : '20px',
                zIndex: 100,
                width: isMobile ? '100%' : 'auto',
                minWidth: isMobile ? 'auto' : '300px',
                maxWidth: isMobile ? '100%' : '90vw',
                cursor: 'default',
                boxSizing: 'border-box',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ color: dimColor, marginBottom: isMobile ? '6px' : '10px', fontSize: isMobile ? '10px' : '12px' }}>
                ENTER COMMAND:
              </div>
              <div style={{
                color: commandError ? '#ff4444' : baseColor,
                fontSize: isMobile ? '12px' : '18px',
                padding: isMobile ? '6px' : '10px',
                background: bgColor,
                border: `1px solid ${commandError ? '#ff4444' : borderColor}`,
                position: 'relative',
              }}>
                {'>'} {commandBuffer}<span style={{ animation: 'blink 0.5s infinite' }}>█</span>
                {/* Hidden input to trigger mobile keyboard */}
                <input
                  ref={commandInputRef}
                  type="text"
                  value={commandBuffer}
                  onChange={(e) => {
                    setCommandBuffer(e.target.value.toUpperCase().slice(0, 20));
                    setCommandError(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const success = processCommand(commandBuffer);
                      if (success) {
                        setCommandBuffer('');
                        setShowCommand(false);
                        setCommandError(false);
                      } else {
                        setCommandError(true);
                      }
                    } else if (e.key === 'Escape') {
                      setShowCommand(false);
                      setCommandBuffer('');
                      setCommandError(false);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    fontSize: '16px', // Prevents iOS zoom
                    caretColor: 'transparent',
                  }}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                />
              </div>
              {commandError && (
                <div style={{
                  color: '#ff4444',
                  fontSize: isMobile ? '9px' : '12px',
                  marginTop: '6px',
                  textAlign: 'center',
                  animation: 'blink 1s infinite',
                }}>
                  ▓▓▓ COMMAND NOT RECOGNIZED ▓▓▓
                </div>
              )}
              <div style={{ color: dimColor, fontSize: isMobile ? '8px' : '11px', marginTop: isMobile ? '8px' : '12px', borderTop: `1px solid ${borderColor}`, paddingTop: isMobile ? '6px' : '8px' }}>
                <div style={{ marginBottom: '4px', color: isMobile ? '#cc9900' : '#997700' }}>TRY: ELEVEN • DEMOGORGON • BARB</div>
                <div style={{ color: isMobile ? '#998800' : '#555500' }}>TYPE "RESET" TO CLEAR VISUAL EFFECTS</div>
              </div>
              {isMobile && (
                <button
                  onClick={() => {
                    const success = processCommand(commandBuffer);
                    if (success) {
                      setCommandBuffer('');
                      setShowCommand(false);
                      setCommandError(false);
                    } else {
                      setCommandError(true);
                    }
                  }}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '12px',
                    background: 'rgba(255,176,0,0.2)',
                    border: `2px solid ${baseColor}`,
                    color: baseColor,
                    fontSize: '14px',
                    fontFamily: '"VT323", monospace',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}
                >
                  SUBMIT COMMAND
                </button>
              )}
              <div style={{ color: dimColor, fontSize: isMobile ? '9px' : '13px', marginTop: isMobile ? '6px' : '10px' }}>
                {isMobile ? '[TAP OUTSIDE TO CANCEL]' : '[ENTER] SUBMIT   [ESC/CLICK OUTSIDE] CANCEL'}
              </div>
            </div>
          </div>
        )}

        {/* Scan Input Modal */}
        {showScanInput && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.85)',
              zIndex: 99,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: isMobile ? '10px' : '20px',
              boxSizing: 'border-box',
            }}
            onClick={() => { setShowScanInput(false); setScanInputBuffer(''); }}
          >
            <div
              style={{
                background: '#0a0802',
                border: '2px solid #4a8',
                padding: isMobile ? '10px' : '20px',
                zIndex: 100,
                width: isMobile ? '100%' : 'auto',
                minWidth: isMobile ? 'auto' : '350px',
                maxWidth: isMobile ? '100%' : '90vw',
                boxShadow: '0 0 30px rgba(74,136,68,0.3)',
                cursor: 'default',
                boxSizing: 'border-box',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ color: '#4a8', marginBottom: '4px', fontSize: isMobile ? '11px' : '14px', fontWeight: 'bold' }}>
                ◎ DIMENSIONAL RISK SCANNER
              </div>
              <div style={{ color: '#385', marginBottom: isMobile ? '8px' : '15px', fontSize: isMobile ? '9px' : '13px' }}>
                {isMobile ? 'ANALYZE INSTABILITY BY LOCATION' : 'ANALYZE INTERDIMENSIONAL INSTABILITY BY LOCATION'}
              </div>
              <div style={{ color: '#4a8', marginBottom: '6px', fontSize: isMobile ? '10px' : '14px' }}>
                {isMobile ? 'ENTER LOCATION:' : 'ENTER LOCATION (CITY, ZIP, OR COORDINATES):'}
              </div>
              <div style={{
                color: '#4a8',
                fontSize: isMobile ? '11px' : '16px',
                padding: isMobile ? '6px' : '10px',
                background: '#0a120a',
                border: '1px solid #385',
                letterSpacing: isMobile ? '0.5px' : '1px',
                position: 'relative',
              }}>
                {'>'} {scanInputBuffer}<span style={{ animation: 'blink 0.5s infinite' }}>█</span>
                {/* Hidden input to trigger mobile keyboard */}
                <input
                  ref={scanInputRef}
                  type="text"
                  value={scanInputBuffer}
                  onChange={(e) => {
                    setScanInputBuffer(e.target.value.slice(0, 50));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && scanInputBuffer.trim()) {
                      const location = scanInputBuffer.trim();
                      setShowScanInput(false);
                      setScanInputBuffer('');
                      setEasterEggState('SCANNING');
                      trackEvent('location_scan', { location: location, method: 'mobile_input' });
                      scanLocation(location);
                    } else if (e.key === 'Escape') {
                      setShowScanInput(false);
                      setScanInputBuffer('');
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    fontSize: '16px', // Prevents iOS zoom
                    caretColor: 'transparent',
                  }}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              {isMobile && (
                <button
                  onClick={() => {
                    if (scanInputBuffer.trim()) {
                      const location = scanInputBuffer.trim();
                      setShowScanInput(false);
                      setScanInputBuffer('');
                      setEasterEggState('SCANNING');
                      trackEvent('location_scan', { location: location, method: 'mobile_button' });
                      scanLocation(location);
                    }
                  }}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '12px',
                    background: 'rgba(68,170,136,0.2)',
                    border: '2px solid #4a8',
                    color: '#4a8',
                    fontSize: '14px',
                    fontFamily: '"VT323", monospace',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}
                >
                  INITIATE SCAN
                </button>
              )}
              <div style={{ color: '#385', fontSize: isMobile ? '9px' : '12px', marginTop: isMobile ? '6px' : '12px', lineHeight: '1.5' }}>
                {isMobile ? (
                  <>EXAMPLES: "HAWKINS, IN" • "90210"<br/>[TAP OUTSIDE TO ABORT]</>
                ) : (
                  <>EXAMPLES: "HAWKINS, INDIANA" • "90210" • "TOKYO"<br/>[ENTER] INITIATE SCAN   [ESC/CLICK OUTSIDE] ABORT</>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACCESS GRANTED Overlay */}
        {showAccessGranted && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            animation: 'accessGrantedFade 2.5s ease-out',
          }}>
            <div style={{
              color: '#00ff00',
              fontSize: '13px',
              letterSpacing: '3px',
              marginBottom: '20px',
              opacity: 0.7,
              animation: 'typeIn 0.5s steps(20)',
            }}>
              SECURITY CLEARANCE VERIFIED
            </div>
            <div style={{
              color: '#00ff00',
              fontSize: '28px',
              fontWeight: 'bold',
              letterSpacing: '8px',
              textShadow: '0 0 20px #00ff00, 0 0 40px #00ff00, 0 0 60px #00ff00',
              animation: 'accessPulse 0.5s ease-out',
            }}>
              ▓▓▓ ACCESS GRANTED ▓▓▓
            </div>
            <div style={{
              color: '#00aa00',
              fontSize: '12px',
              marginTop: '20px',
              letterSpacing: '2px',
              animation: 'typeIn 0.8s steps(30) 0.5s both',
            }}>
              CLASSIFIED FILE UNLOCKED
            </div>
            <div style={{
              color: '#008800',
              fontSize: '13px',
              marginTop: '30px',
              padding: '10px 20px',
              border: '1px solid #004400',
              background: 'rgba(0,255,0,0.05)',
              animation: 'fadeIn 0.5s ease-out 1s both',
            }}>
              LOADING: {pendingEasterEgg?.replace(/_/g, ' ')}...
            </div>
            <div style={{
              position: 'absolute',
              bottom: '40px',
              color: '#004400',
              fontSize: '12px',
              letterSpacing: '1px',
            }}>
              {discoveredEasterEggs.size}/{TOTAL_EASTER_EGGS} CLASSIFIED FILES ACCESSED
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
          25%, 75% { opacity: 0.98; }
        }
        @keyframes vhsNoise {
          0% { background-position: 0 0; }
          100% { background-position: 0 100%; }
        }
        @keyframes phosphorFade {
          0% { opacity: 1; text-shadow: 0 0 8px currentColor; }
          100% { opacity: 0.6; text-shadow: 0 0 2px currentColor; }
        }
        @keyframes screenWarp {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.001); }
        }
        @keyframes rgbSplit {
          0%, 100% { text-shadow: -1px 0 red, 1px 0 cyan; }
          50% { text-shadow: 1px 0 red, -1px 0 cyan; }
        }
        @keyframes accessGrantedFade {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes accessPulse {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes typeIn {
          from { width: 0; overflow: hidden; white-space: nowrap; }
          to { width: 100%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Sound effects */}
      <audio ref={clockAudioRef} src="/sounds/clock.mp3" preload="auto" />
      <audio ref={glitchAudioRef} src="/sounds/glitch.mp3" preload="auto" />
      <audio ref={demogorgonAudioRef} src="/sounds/demogorgon.mp3" preload="auto" />
    </div>
  );
};

export default HawkinsTerminal;