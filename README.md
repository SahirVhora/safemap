# 🌍 SafeMap — Global Domestic Violence Awareness Dashboard

SafeMap is a high-impact data visualization platform designed to surface trends, severity, and localized support systems for domestic violence globally. By combining WHO and World Bank data with synthetic regional analysis, it provides a granular view of risk and resources.

## 🌟 Key Features

### 🗺️ Geospatial Intelligence
- **Hexbin Heatmap:** Uses a custom hexagonal grid to represent data density and severity, preventing point-clustering and providing a clear visual "weight" to affected areas.
- **Dynamic Zoom & Pan:** Integrated D3.js projection allowing users to zoom from a global view down to specific regional clusters.
- **Interactive Info-Panel:** A deep-dive side panel that reveals specific regional metrics, severity badges, and localized issue breakdowns.

### 🛠️ Actionable Support
- **Localized Solutions:** Instead of generic advice, SafeMap provides country-specific resources (e.g., India, UK, USA) including:
  - Direct helplines and emergency numbers.
  - Local legal frameworks and filing processes (e.g., DV Act 2005 in India).
  - Recommended NGOs and support centers.
- **Data Export:** Ability to export filtered regional data to CSV for further research and reporting.

### ⚙️ Technical Architecture
- **Frontend:** Single-file SPA built with Vanilla JS, CSS3, and HTML5.
- **Visualization:** Powered by **D3.js** and **TopoJSON** for precise geographic mapping.
- **UI/UX:** "Intelligence Dashboard" aesthetic with a dark-mode palette, backdrop-filters (blur), and custom radial gradients for depth.
- **Performance:** Optimized rendering using `requestAnimationFrame` and efficient filtering logic.

## 🚀 Getting Started

Since SafeMap is a self-contained application, no installation is required:
1. Clone the repository.
2. Open `index.html` in any modern web browser.

## 📊 Data Sources
The dashboard utilizes a calibrated mix of:
- **WHO (World Health Organization):** Prevalence and global health statistics.
- **World Bank:** Socio-economic indicators and regional data.
- **Local Government Gazettes:** Specific legal and helpline information.

## 📂 Project Structure
```
safemap/
├── index.html    ← Complete Application (UI, Logic, and Styles)
└── favicon.svg   ← Brand Assets
```

---
*SafeMap is intended as an awareness and resource tool. In case of emergency, always contact your local authorities immediately.*
