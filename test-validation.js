// Testi-skripti FX-korjauksen validointia varten
const fetch = require('node-fetch');

async function testValidation() {
  try {
    console.log('🧪 Testing FX correction validation...\n');
    
    // Hae data API:sta
    const response = await fetch('http://localhost:3000/api/top-creators');
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.error('❌ No data received from API');
      return;
    }
    
    console.log(`✅ Received ${data.items.length} creator coins\n`);
    
    // Testaa ensimmäiset 3 tokenia
    const testTokens = data.items.slice(0, 3);
    
    testTokens.forEach((token, index) => {
      console.log(`📊 Token ${index + 1}: ${token.name} (@${token.creatorHandle})`);
      console.log(`   Address: ${token.address}`);
      console.log(`   Market Cap: $${token.marketCap.toLocaleString()}`);
      console.log(`   Price: $${token.price.toFixed(6)}`);
      console.log(`   24h Volume: $${token.volume24h.toLocaleString()}`);
      console.log(`   24h Change: ${((token.marketCapDelta24h / token.marketCap) * 100).toFixed(2)}%`);
      console.log(`   Holders: ${token.uniqueHolders.toLocaleString()}`);
      console.log('');
    });
    
    // Tarkista että arvot ovat järkeviä (ei ~0.86 kerrointa)
    const suspiciousTokens = testTokens.filter(token => {
      // Jos price on noin 0.0086, se voi olla merkki FX-ongelmasta
      return token.price > 0.008 && token.price < 0.009;
    });
    
    if (suspiciousTokens.length > 0) {
      console.log('⚠️  WARNING: Found tokens with suspicious price values (~0.0086)');
      suspiciousTokens.forEach(token => {
        console.log(`   - ${token.name}: $${token.price.toFixed(6)}`);
      });
      console.log('   This might indicate FX conversion issues!\n');
    } else {
      console.log('✅ No suspicious price values detected\n');
    }
    
    // Tarkista että market cap ja volume ovat järkeviä
    const validTokens = testTokens.filter(token => 
      token.marketCap > 1000 && 
      token.volume24h >= 0 && 
      token.price > 0
    );
    
    console.log(`✅ ${validTokens.length}/${testTokens.length} tokens have valid data ranges`);
    
    // Näytä esimerkki laskennasta
    if (testTokens[0]) {
      const token = testTokens[0];
      console.log('\n🔍 Sample calculation validation:');
      console.log(`   Market Cap: $${token.marketCap.toLocaleString()}`);
      console.log(`   Price: $${token.price.toFixed(6)}`);
      console.log(`   Derived Price (if totalSupply=1B): $${(token.marketCap / 1000000000).toFixed(6)}`);
      console.log(`   Price Ratio: ${(token.price / (token.marketCap / 1000000000)).toFixed(3)}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Suorita testi
testValidation();
