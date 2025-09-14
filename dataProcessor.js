/**
 * Data processor module to replace PHP backend functionality
 * Processes geodata.json for various visualizations
 */

class DataProcessor {
    constructor() {
        this.geodata = null;
        this.languages = null;
    }

    /**
     * Initialize the data processor by loading necessary data
     */
    async init() {
        try {
            // Load geodata
            const geodataResponse = await fetch('geodata.json');
            this.geodata = await geodataResponse.json();
            
            // Load languages
            const langResponse = await fetch('languages.json');
            this.languages = await langResponse.json();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    /**
     * Hash color function - generates diverse, vibrant colors
     */
    hashColor(str) {
        if (!str || str.length === 0) return '#666666';
        
        // Use a simple hash function to generate more diverse colors
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash; // Convert to 32bit integer
        }
        
        // Convert hash to HSL for better color distribution
        const hue = Math.abs(hash % 360);
        const saturation = 65 + (Math.abs(hash >> 8) % 25); // 65-90% saturation
        const lightness = 45 + (Math.abs(hash >> 16) % 20);  // 45-65% lightness
        
        // Convert HSL to RGB
        const h = hue / 360;
        const s = saturation / 100;
        const l = lightness / 100;
        
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        // Convert to hex
        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    /**
     * Link matching logic (from langex.php)
     */
    linkMatch(langex, slang, tlang) {
        if (slang === 'u' || tlang === 'u') {
            return false;
        }
        
        const parts = langex.split(':');
        const langexBase = parts[0];
        const langexParts = langexBase.split('X');
        
        if (langexParts.length === 1) {
            if (langexParts[0] === '[all]') {
                return true;
            }
            
            const langs = langexParts[0].split(',');
            for (const lang of langs) {
                if (this.checkLang(langs, lang, slang, tlang)) {
                    return true;
                }
            }
        } else if (langexParts.length === 2) {
            if (langexParts[0] === '[all]') {
                const langs = langexParts[1].split(',');
                for (const lang of langs) {
                    if (this.checkLang(langs, lang, slang, tlang)) {
                        return false;
                    }
                }
                return true;
            }
        }
        
        return false;
    }

    /**
     * Check language helper
     */
    checkLang(langex, lang, slang, tlang) {
        const processLang = (l) => {
            if (l.startsWith('(') && l.endsWith(')')) {
                return l.substring(1, l.length - 1);
            }
            return l;
        };

        const matchesPattern = (pattern, value) => {
            const regex = pattern.replace(/\*/g, '.*');
            return new RegExp('^' + regex + '$').test(value);
        };

        if (lang.startsWith('(') && lang.endsWith(')')) {
            const cleanLang = processLang(lang);
            return matchesPattern(cleanLang, slang) || matchesPattern(cleanLang, tlang);
        } else {
            if (matchesPattern(lang, slang)) {
                for (const lang2 of langex) {
                    const cleanLang2 = processLang(lang2);
                    if (matchesPattern(cleanLang2, tlang)) {
                        return true;
                    }
                }
            } else if (matchesPattern(lang, tlang)) {
                for (const lang2 of langex) {
                    const cleanLang2 = processLang(lang2);
                    if (matchesPattern(cleanLang2, slang)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Link top function
     */
    linkTop(langex, data) {
        const parts = langex.split(':');
        if (parts.length === 1) {
            return data;
        }
        if (parts.length === 2) {
            const n = parseInt(parts[1]);
            if (n >= data.length) {
                return data;
            }
            return data.slice(0, n);
        }
        return [];
    }

    /**
     * Get chart data (replaces getChartData.php)
     */
    getChartData(ulangs) {
        // Ensure data is loaded
        if (!this.geodata) {
            console.error('Data not loaded yet!');
            return [];
        }
        
        const data = {};
        const incomes = {};
        const colors = {};
        
        // Process geodata
        for (const row of this.geodata) {
            const slang = row.slang;
            const tlang = row.tlang;
            
            if (slang === tlang || !this.linkMatch(ulangs, slang, tlang)) {
                continue;
            }
            
            const key1 = slang + '|' + tlang;
            const key2 = tlang + '|' + slang;
            
            if (data[key1]) {
                data[key1].num_ab += 1;
            } else if (data[key2]) {
                data[key2].num_ba += 1;
            } else {
                data[key1] = {
                    seg_a_id: slang,
                    seg_b_id: tlang,
                    num_ab: 1,
                    num_ba: 0
                };
                colors[slang] = this.hashColor(slang);
                colors[tlang] = this.hashColor(tlang);
            }
            
            // Count incomes
            const xtlang = data[key1] ? tlang : slang;
            incomes[xtlang] = (incomes[xtlang] || 0) + 1;
        }
        
        // Apply logarithm beautification
        for (const key in data) {
            data[key].num_ab = Math.round(Math.log(data[key].num_ab + 1) * 1000);
            data[key].num_ba = Math.round(Math.log(data[key].num_ba + 1) * 1000);
        }
        
        // Convert to array and sort
        let dataArray = Object.values(data);
        dataArray.sort((a, b) => 
            (b.num_ab + b.num_ba) - (a.num_ab + a.num_ba)
        );
        
        dataArray = this.linkTop(ulangs, dataArray);
        
        // Append colors
        dataArray.push(colors);
        
        return dataArray;
    }

    /**
     * Get table data (replaces getTable.php)
     */
    getTableHTML(ulangs) {
        // Ensure data is loaded
        if (!this.geodata) {
            console.error('Data not loaded yet!');
            return '<p>Loading...</p>';
        }
        
        const lmap = {};
        
        // Process geodata
        for (const row of this.geodata) {
            const sl = row.slang;
            const tl = row.tlang;
            
            if (sl === tl || !this.linkMatch(ulangs, sl, tl)) {
                continue;
            }
            
            const key = sl + '|' + tl;
            lmap[key] = (lmap[key] || 0) + 1;
        }
        
        // Convert to array format
        let dataArray = [];
        for (const key in lmap) {
            const [sl, tl] = key.split('|');
            dataArray.push({
                source: sl,
                target: tl,
                count: lmap[key],
                color: this.hashColor(tl)
            });
        }
        
        // Sort by count
        dataArray.sort((a, b) => b.count - a.count);
        dataArray = this.linkTop(ulangs, dataArray);
        
        // Generate HTML with styled table
        let html = '<table style="width: 100%; border-collapse: collapse; font-family: monospace;">';
        html += '<thead><tr style="border-bottom: 2px solid #333;">';
        html += '<th style="text-align: left; padding: 8px;">Source</th>';
        html += '<th style="text-align: left; padding: 8px;">Target</th>';
        html += '<th style="text-align: right; padding: 8px;">Count</th>';
        html += '</tr></thead><tbody>';
        
        for (const item of dataArray) {
            html += `<tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 6px 8px;">${item.source.toUpperCase()}</td>
                <td style="padding: 6px 8px;">${item.target.toUpperCase()}</td>
                <td style="padding: 6px 8px; text-align: right; font-weight: bold;"><span style="color:${item.color};">${item.count}</span></td>
            </tr>`;
        }
        html += '</tbody></table>';
        
        return html;
    }


    /**
     * Get filtered languages for autocomplete
     */
    getFilteredLanguages(query) {
        if (!query) {
            return this.languages;
        }
        
        const results = [];
        const q = query.toLowerCase();
        const isOperator = q.startsWith('+');
        const cleanQuery = isOperator ? q.substring(1) : q;
        
        // Handle wildcard search
        if (cleanQuery.includes('*')) {
            const pattern = cleanQuery.replace(/\*/g, '.*');
            const regex = new RegExp('^' + pattern + '$', 'i');
            
            const matches = [];
            for (const lang of this.languages) {
                if (lang.id === '[all]X') continue;
                if (regex.test(lang.name.toLowerCase())) {
                    matches.push({
                        id: isOperator ? `(${lang.id})` : lang.id,
                        name: lang.name
                    });
                }
            }
            
            if (matches.length > 0) {
                const ids = matches.map(m => m.id).join(',');
                results.push({
                    id: ids,
                    name: query
                });
                results.push(...matches);
            }
        } else {
            // Regular search
            for (const lang of this.languages) {
                const langName = lang.name.toLowerCase();
                const searchQuery = isOperator ? cleanQuery : q;
                
                if (langName.includes(searchQuery)) {
                    results.push({
                        id: isOperator ? `(${lang.id})` : lang.id,
                        name: lang.name
                    });
                }
            }
        }
        
        return results;
    }
}

// Create global instance
window.dataProcessor = new DataProcessor();
