// Simple Amadeus API test using built-in fetch
async function testAmadeusAPI() {
  try {
    console.log('🔄 Testing Amadeus API...');
    
    // Step 1: Get OAuth token
    console.log('1. Getting OAuth token...');
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

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('❌ OAuth failed:', tokenResponse.status, error);
      return;
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ OAuth successful!');
    console.log('Token info:', {
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in + ' seconds'
    });

    // Step 2: Test flight search
    console.log('\n2. Testing flight search NYC → LAX...');
    const flightUrl = 'https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=NYC&destinationLocationCode=LAX&departureDate=2025-08-15&adults=1&max=3';
    
    const flightResponse = await fetch(flightUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!flightResponse.ok) {
      const error = await flightResponse.text();
      console.error('❌ Flight search failed:', flightResponse.status, error);
      return;
    }

    const flightData = await flightResponse.json();
    console.log('✅ Flight search successful!');
    
    if (flightData.data && flightData.data.length > 0) {
      const firstFlight = flightData.data[0];
      console.log('📊 Flight Results:');
      console.log(`  Total offers: ${flightData.data.length}`);
      console.log(`  Price: ${firstFlight.price.total} ${firstFlight.price.currency}`);
      console.log(`  Airline: ${firstFlight.itineraries[0].segments[0].carrierCode}`);
      console.log(`  Flight: ${firstFlight.itineraries[0].segments[0].number}`);
    } else {
      console.log('No flight offers found');
    }

    // Step 3: Test hotel search
    console.log('\n3. Testing hotel search in NYC...');
    const hotelUrl = 'https://test.api.amadeus.com/v3/shopping/hotel-offers?cityCode=NYC&checkInDate=2025-08-15&checkOutDate=2025-08-17&adults=1&max=3';
    
    const hotelResponse = await fetch(hotelUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!hotelResponse.ok) {
      const error = await hotelResponse.text();
      console.error('❌ Hotel search failed:', hotelResponse.status, error);
      return;
    }

    const hotelData = await hotelResponse.json();
    console.log('✅ Hotel search successful!');
    
    if (hotelData.data && hotelData.data.length > 0) {
      const firstHotel = hotelData.data[0];
      console.log('📊 Hotel Results:');
      console.log(`  Total offers: ${hotelData.data.length}`);
      console.log(`  Hotel: ${firstHotel.hotel.name}`);
      console.log(`  Price: ${firstHotel.offers[0].price.total} ${firstHotel.offers[0].price.currency}`);
    } else {
      console.log('No hotel offers found');
    }

    console.log('\n🎉 All tests passed! Your Amadeus API is working correctly.');
    console.log('🚀 Ready to integrate with Chisfis template!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testAmadeusAPI();