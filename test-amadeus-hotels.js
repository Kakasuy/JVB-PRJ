// Test hotel search with correct API flow
async function testHotelSearch() {
  try {
    console.log('🔄 Testing Amadeus Hotel APIs...');
    
    // Step 1: Get OAuth token
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: 'mXHHGksXCXRnyXyDcjATFhJPA6xQVC7x',
        client_secret: '11qjGJG6YOGmQZlJ',
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('✅ OAuth successful!');

    // Step 2: Search for hotels by city first
    console.log('\n2. Searching hotels by city (NYC)...');
    const citySearchUrl = 'https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=NYC&radius=5&radiusUnit=KM&hotelSource=ALL';
    
    const citySearchResponse = await fetch(citySearchUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!citySearchResponse.ok) {
      const error = await citySearchResponse.text();
      console.error('❌ City search failed:', citySearchResponse.status, error);
      return;
    }

    const citySearchData = await citySearchResponse.json();
    console.log('✅ Hotel city search successful!');
    console.log(`Found ${citySearchData.data.length} hotels in NYC`);
    
    // Get first few hotel IDs
    const hotelIds = citySearchData.data.slice(0, 3).map(hotel => hotel.hotelId).join(',');
    console.log(`Sample hotel IDs: ${hotelIds}`);

    // Step 3: Get offers for specific hotels
    console.log('\n3. Getting hotel offers...');
    const offersUrl = `https://test.api.amadeus.com/v3/shopping/hotel-offers?hotelIds=${hotelIds}&checkInDate=2025-08-15&checkOutDate=2025-08-17&adults=1`;
    
    const offersResponse = await fetch(offersUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!offersResponse.ok) {
      const error = await offersResponse.text();
      console.error('❌ Hotel offers failed:', offersResponse.status, error);
      return;
    }

    const offersData = await offersResponse.json();
    console.log('✅ Hotel offers successful!');
    
    if (offersData.data && offersData.data.length > 0) {
      console.log('📊 Hotel Offers Results:');
      offersData.data.forEach((hotel, index) => {
        console.log(`  Hotel ${index + 1}:`);
        console.log(`    Name: ${hotel.hotel.name}`);
        console.log(`    City: ${hotel.hotel.cityCode}`);
        if (hotel.offers && hotel.offers.length > 0) {
          console.log(`    Price: ${hotel.offers[0].price.total} ${hotel.offers[0].price.currency}`);
          console.log(`    Room: ${hotel.offers[0].room.description?.text || 'N/A'}`);
        }
        console.log('');
      });
    } else {
      console.log('No hotel offers found');
    }

    console.log('🎉 Hotel API test completed successfully!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testHotelSearch();