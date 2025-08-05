#!/bin/bash

# Setup git pre-commit hook to export TTS cache

cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Export TTS cache before commit
echo "📦 Checking TTS cache..."

# Check if app is running on localhost:5173
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Dev server detected, exporting cache..."
    
    # Create export script
    cat > /tmp/export-cache.js << 'SCRIPT'
    // Export cache
    const cachePrefix = 'tts_cache_';
    const cacheIndexKey = 'tts_cache_index';
    const cache = {};
    
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(cachePrefix)) {
            cache[key] = localStorage.getItem(key);
        }
    });
    
    const index = localStorage.getItem(cacheIndexKey);
    if (index) cache[cacheIndexKey] = index;
    
    const exportData = {
        version: 1,
        exportDate: new Date().toISOString(),
        entries: Object.keys(cache).length,
        cache: cache
    };
    
    // Save to file using Node.js
    const fs = require('fs');
    fs.writeFileSync('public/tts-cache-preload.json', JSON.stringify(exportData, null, 2));
    console.log('Exported ' + Object.keys(cache).length + ' entries');
SCRIPT
    
    # Run export in your browser console
    echo ""
    echo "👉 MANUAL STEP REQUIRED:"
    echo "   1. Open browser console at http://localhost:5173"
    echo "   2. Run this command:"
    echo ""
    echo "   copy(localStorage)"
    echo ""
    echo "   3. Save the output to public/tts-cache-preload.json"
    echo "   4. Run: git add public/tts-cache-preload.json"
    echo ""
    read -p "Press Enter when done..."
    
else
    echo "⏭️  Dev server not running, skipping cache export"
fi
EOF

chmod +x .git/hooks/pre-commit
echo "✅ Git hook installed!"