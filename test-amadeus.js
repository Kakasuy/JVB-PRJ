// Test Amadeus API directly
const https = require('https');
const querystring = require('querystring');

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
      console.error('❌ OAuth failed:', error);
      return;
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ OAuth successful:', {
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in
    });

    // Step 2: Test flight search
    console.log('2. Testing flight search...');
    const flightResponse = await fetch(
      'https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=NYC&destinationLocationCode=LAX&departureDate=2025-08-15&adults=1&max=3',
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!flightResponse.ok) {
      const error = await flightResponse.text();
      console.error('❌ Flight search failed:', error);
      return;
    }

    const flightData = await flightResponse.json();
    console.log('✅ Flight search successful!');
    console.log('📊 Results:', {
      total_offers: flightData.data?.length || 0,
      currency: flightData.data?.[0]?.price?.currency,
      sample_price: flightData.data?.[0]?.price?.total,
      airline: flightData.data?.[0]?.itineraries?.[0]?.segments?.[0]?.carrierCode
    });

    // Step 3: Test hotel search
    console.log('3. Testing hotel search...');
    const hotelResponse = await fetch(
      'https://test.api.amadeus.com/v3/shopping/hotel-offers?cityCode=NYC&checkInDate=2025-08-15&checkOutDate=2025-08-17&adults=1&max=3',
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!hotelResponse.ok) {
      const error = await hotelResponse.text();
      console.error('❌ Hotel search failed:', error);
      return;
    }

    const hotelData = await hotelResponse.json();
    console.log('✅ Hotel search successful!');
    console.log('📊 Hotel Results:', {
      total_offers: hotelData.data?.length || 0,
      sample_hotel: hotelData.data?.[0]?.hotel?.name,
      sample_price: hotelData.data?.[0]?.offers?.[0]?.price?.total
    });

    console.log('\n🎉 All tests passed! Your Amadeus API is working correctly.');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testAmadeusAPI();