# Interlingual Connections on the Web

A static web application for visualizing interlingual connections and link patterns across the web.

## Migration from PHP to Static Site

This project has been migrated from a PHP/MySQL backend to a fully static JavaScript-based site. All data is now served from JSON files and processed client-side.

### Key Changes:
- **index.php** → **index.html**: Main page is now static HTML
- **PHP endpoints removed**: All PHP files (getChartData.php, getLangs.php, getMapData.php, getTable.php) replaced with JavaScript
- **dataProcessor.js**: New JavaScript module handles all data processing previously done in PHP
- **Static JSON data**: 
  - `geodata.json`: Contains all language connection data
  - `languages.json`: Contains language list for autocomplete

### How to Run:
1. Open `index.html` in a web browser
2. For best results, serve the files through a local web server to avoid CORS issues:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if http-server is installed)
   npx http-server
   ```
3. Navigate to `http://localhost:8000` in your browser

### Features:
- **Orb Visualization**: Circular graph showing language connections
- **Data Table**: Raw connection data display
- **Language Filtering**: Interactive language selection with autocomplete

### Original Authors:
- Joseph Birkner
- Tillmann Dönicke

Students of B. Sc. Natural Language Processing  
Institute for Natural Language Processing (IMS)  
University of Stuttgart
