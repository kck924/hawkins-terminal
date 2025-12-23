# Hawkins Terminal - Dimensional Stability Monitoring System

## Project Overview
A Stranger Things-themed advanced data visualization project styled as a 1983 Department of Energy terminal from Hawkins National Laboratory. Features CRT monitor aesthetics, real-time data monitoring, and hidden easter eggs.

## Tech Stack
- React 18+ with hooks
- Vite for bundling
- No component library - custom styled components with inline styles
- Google Fonts (VT323 for terminal aesthetic)

## Design Principles

### Visual Aesthetic
- **Amber monochrome CRT** - Primary color `#ffb000`, dim `#805800`, background `#1a1205`
- **Scanlines** - CSS repeating-linear-gradient overlay
- **Screen effects** - Flicker, glow, barrel distortion feel
- **Typography** - VT323 font, ALL CAPS headers, fixed-width everything
- **UI elements** - ASCII box drawing characters (`╔══╗`), redacted text (`████████`), blinking cursors

### Period Accuracy (1983)
- Timestamps format: `DD-MMM-83 HH:MM:SS`
- Function key navigation (`[F1] DASHBOARD`)
- Terminal designation footer (`TERMINAL 7 | SUBLEVEL 3`)
- DOE/classified government facility branding

## Current Features

### Views (F-key navigation)
1. **Dashboard (F1)** - Seismic activity monitor + atmospheric readings
2. **Subjects (F3)** - Test subject files with redacted data, arrow key navigation
3. **Sectors (F5)** - ASCII facility map + sector status table
4. **Gate (F7)** - Interdimensional gateway monitor with real-time stability

### Easter Eggs (F9 command input)
| Command | Effect |
|---------|--------|
| `ELEVEN` / `011` | Unlocks Subject 011's full classified file |
| `DEMOGORGON` | Containment breach - chaos mode |
| `UPSIDE DOWN` | Inverts colors and flips UI |
| `BARB` | Missing persons report |
| `PAPA` / `BRENNER` | Dr. Brenner's file |
| `MKULTRA` | CIA subcontract details |
| `RESET` | Clear easter egg states |
| Konami Code | ↑↑↓↓←→←→BA - arcade throwback |

## Planned Features / TODOs

### Data Integration
- [ ] USGS Earthquake API for real seismic data
- [ ] NOAA atmospheric/weather data
- [ ] Present historical 1983 data or real-time with "classified monitoring" framing

### Enhanced Visuals
- [ ] More pronounced CRT barrel distortion (CSS/SVG filter)
- [ ] Phosphor trail effect on changing text
- [ ] Screen burn-in on static elements
- [ ] VHS tracking glitch effects during easter eggs

### Audio
- [ ] CRT hum ambient sound
- [ ] Keyboard click sounds on input
- [ ] Alert klaxon for CRITICAL states
- [ ] Distorted audio during Demogorgon breach
- [ ] Use Web Audio API or Tone.js

### Interactivity
- [ ] More keyboard shortcuts
- [ ] Clickable sector map that drills into detail views
- [ ] Printable "incident reports"
- [ ] Login screen with fake authentication

### Additional Easter Eggs
- [ ] `HOPPER` - Chief's case notes
- [ ] `BYERS` - Missing person file for Will
- [ ] `MINDFLAYER` - Season 2 entity reference
- [ ] Type specific phrases to trigger events
- [ ] Idle timeout triggers creepy events

## File Structure
```
hawkins-terminal/
├── src/
│   ├── components/
│   │   ├── HawkinsTerminal.jsx    # Main terminal component
│   │   ├── views/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Subjects.jsx
│   │   │   ├── Sectors.jsx
│   │   │   └── Gate.jsx
│   │   ├── effects/
│   │   │   ├── Scanlines.jsx
│   │   │   ├── ScreenFlicker.jsx
│   │   │   └── GlitchEffect.jsx
│   │   └── ui/
│   │       ├── CommandInput.jsx
│   │       ├── Header.jsx
│   │       └── Footer.jsx
│   ├── hooks/
│   │   ├── useSeismicData.js      # Real or simulated seismic feed
│   │   ├── useAtmospheric.js      # Weather/atmospheric data
│   │   ├── useEasterEggs.js       # Easter egg state management
│   │   └── useKeyboardNav.js      # F-key and command handling
│   ├── data/
│   │   ├── subjects.js            # Test subject records
│   │   ├── sectors.js             # Facility sector data
│   │   └── logMessages.js         # System log templates
│   ├── styles/
│   │   └── crt.css                # CRT effects, animations
│   ├── utils/
│   │   └── formatting.js          # Date formatting, ASCII helpers
│   ├── App.jsx
│   └── main.jsx
├── public/
│   └── sounds/                    # Audio assets (future)
├── CLAUDE.md
├── README.md
├── package.json
└── vite.config.js
```

## Code Style Notes
- Inline styles are intentional for self-contained component (portfolio piece)
- Can refactor to CSS modules or styled-components if scaling up
- Keep effects performant - avoid layout thrashing on flicker/glitch
- All text content should feel period-appropriate and ominous

## API References (for data integration)
- USGS Earthquake API: https://earthquake.usgs.gov/fdsnws/event/1/
- NOAA Climate Data: https://www.ncdc.noaa.gov/cdo-web/webservices/v2

## Running the Project
```bash
npm install
npm run dev
```

## Key Commands for Development
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run preview` - Preview production build