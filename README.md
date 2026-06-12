# SafeMap 🛡️

**Global Domestic Violence Awareness Dashboard** - an interactive, browser-based map that visualizes country- and region-level statistics on gender-based violence alongside verified local support resources.

**Live:** [https://sahirvhora.github.io/safemap/](https://sahirvhora.github.io/safemap/)

> SafeMap is an **awareness dashboard**, not emergency guidance. Anyone in immediate danger should contact local emergency services or a trusted local support organisation.

## Features

### Interactive Map
- **SVG world map** rendered with D3.js and TopoJSON - pan and zoom with on-screen controls
- **Hexagonal heatmap** - severity-rated hexagons placed at exact geographic coordinates, colored on a 3-tier risk scale (Low 1-3, Moderate 4-6, High 7-10)
- **100+ regional data points** across 18+ countries with sub-national breakdowns (states, provinces, regions)
- **Country info panel** - click any country for detailed statistics, issue-type breakdowns, and localized solutions

### Filters & Controls
- **Country & Region dropdowns** - drill down from global to a specific country or sub-national region
- **Gender toggle** - filter data by Women / All / Men
- **Year slider** - browse data from 2015 through 2024, or select "All" to see aggregate figures
- **Reset & CSV Export** - reset all filters or download the current filtered dataset as CSV

### Statistics Bar
Real-time aggregated stats for the active filter selection:
- Estimated affected population (WHO-calibrated)
- Most affected region
- Top issue type
- Average severity index
- Number of countries and regions in view

### Safety Resources
- **Country-specific helplines** - phone numbers, text lines, and online portals for 18+ countries (India, USA, UK, Brazil, South Africa, Pakistan, Bangladesh, Mexico, Nigeria, Afghanistan, Germany, France, Spain, Australia, China, Russia, Turkey, Kenya, Ethiopia, and more)
- **Issue-type guidance** - for each country: Physical Violence, Sexual Assault, Emotional Abuse, Economic Control, Stalking/Harassment, Child Marriage, Honour-based Violence, and Trafficking
- **Regional fallbacks** - countries without individual entries are mapped to regional resource groups (Sub-Saharan Africa, Middle East, Central Asia, South Asia, Southeast Asia, Latin America, Eastern Europe, Global)
- **Legal & NGO pathways** - FIR filing guidance, protection orders, shelter contacts, and trusted NGO referrals

### Safety Features
- **Quick Exit button** - one click redirects to Google; also triggered by the `ESC` key
- **No personal data stored** - entirely client-side, no cookies, no tracking, no analytics
- **Dark theme** - low-contrast, easy-on-the-eyes design for sensitive viewing contexts
- **Responsive** - works on desktop and mobile browsers

## Usage

### Quick Start
```
# Clone the repository
git clone https://github.com/SahirVhora/safemap.git
cd safemap

# Open directly in your browser
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

No build step, no dependencies to install, no server required - just open `index.html` in any modern browser.

### How It Works
1. The world map loads from a TopoJSON world atlas (fetched via CDN)
2. Regional data points are rendered as colored hexagons at their projected geographic coordinates
3. Use the top-bar filters to narrow by country, region, gender, or year
4. Click any country on the map to open the info panel with statistics and localized solutions
5. Use ⬇ CSV to export the currently filtered dataset

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `ESC` | Quick Exit - immediately redirects to google.com |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Map rendering | D3.js v7 + TopoJSON client |
| Visualization | SVG-based hexagonal heatmap, custom projection |
| Styling | CSS custom properties, Playfair Display + DM Sans (Google Fonts) |
| Data | Embedded JSON (region-level statistics, country solutions) |
| Deployment | GitHub Pages (static, client-side only) |

**No frameworks. No build tools. No backend.** A single `index.html`, `app.js`, and `styles.css` - the entire dashboard is ~100 KB of static files.

## Data Sources

See [DATA_SOURCES.md](DATA_SOURCES.md) for full source selection rules, resource validation cadence, and safety disclaimers.

### Principles
- Data is calibrated against WHO, UN Women, World Bank, and national statistics
- Country-level figures are **directional indicators**, not case-level truth
- Source context (name, year, geography, caveats) is shown wherever possible
- Support-service links should be validated quarterly

### Disclaimer
SafeMap is an awareness dashboard and should not be used as emergency guidance or imply legal advice. For authoritative guidance, consult local emergency services, government resources, or established support organisations.

## License

MIT - see [LICENSE](LICENSE).
