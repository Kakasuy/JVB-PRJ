// Test Amadeus API for image data
async function testAmadeusImages() {
  try {
    console.log('🖼️  Testing Amadeus API for Image Data...\n');
    
    // Get OAuth token
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: 'mXHHGksXCXRnyXyDcjATFhJPA6xQVC7x',
        client_secret: '11qjGJG6YOGmQZlJ',
      }),
    });
    const { access_token } = await tokenResponse.json();

    // 1. TEST HOTEL IMAGES
    console.log('='.repeat(50));
    console.log('🏨 HOTEL IMAGES TEST');
    console.log('='.repeat(50));
    
    const citySearchResponse = await fetch(
      'https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=NYC&radius=5&radiusUnit=KM&hotelSource=ALL',
      { headers: { 'Authorization': `Bearer ${access_token}` } }
    );
    const citySearchData = await citySearchResponse.json();
    const hotelIds = citySearchData.data.slice(0, 2).map(h => h.hotelId).join(',');
    
    const hotelResponse = await fetch(
      `https://test.api.amadeus.com/v3/shopping/hotel-offers?hotelIds=${hotelIds}&checkInDate=2025-08-15&checkOutDate=2025-08-17&adults=1`,
      { headers: { 'Authorization': `Bearer ${access_token}` } }
    );
    const hotelData = await hotelResponse.json();
    
    if (hotelData.data && hotelData.data.length > 0) {
      hotelData.data.forEach((hotel, index) => {
        console.log(`\n🏨 Hotel ${index + 1}: ${hotel.hotel.name}`);
        console.log('🖼️  Image Data:');
        
        // Check for images in hotel object
        if (hotel.hotel.media) {
          console.log(`   📸 Hotel has ${hotel.hotel.media.length} media items`);
          hotel.hotel.media.forEach((media, i) => {
            console.log(`   ${i + 1}. ${media.uri || media.url || 'No URL'} (${media.category || 'Unknown type'})`);
          });
        } else {
          console.log('   ❌ No media/images found in hotel object');
        }
        
        // Print full structure to see if images are elsewhere
        console.log('\n📋 Full hotel structure keys:', Object.keys(hotel.hotel));
        console.log('📋 Full response keys:', Object.keys(hotel));
      });
    }

    // 2. TEST TOURS/ACTIVITIES IMAGES
    console.log('\n\n' + '='.repeat(50));
    console.log('🎯 TOURS & ACTIVITIES IMAGES TEST');
    console.log('='.repeat(50));
    
    try {
      const activitiesResponse = await fetch(
        'https://test.api.amadeus.com/v1/shopping/activities?latitude=40.7128&longitude=-74.0060&radius=5',
        { headers: { 'Authorization': `Bearer ${access_token}` } }
      );
      
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        console.log('✅ Activities API accessible');
        
        if (activitiesData.data && activitiesData.data.length > 0) {
          activitiesData.data.slice(0, 2).forEach((activity, index) => {
            console.log(`\n🎯 Activity ${index + 1}: ${activity.name}`);
            console.log('🖼️  Image Data:');
            
            if (activity.pictures) {
              console.log(`   📸 Activity has ${activity.pictures.length} pictures`);
              activity.pictures.forEach((pic, i) => {
                console.log(`   ${i + 1}. ${pic}`);
              });
            } else {
              console.log('   ❌ No pictures found');
            }
            
            console.log('📋 Activity structure keys:', Object.keys(activity));
          });
        } else {
          console.log('❌ No activities data returned');
        }
      } else {
        const error = await activitiesResponse.text();
        console.log('❌ Activities API failed:', activitiesResponse.status, error);
      }
    } catch (error) {
      console.log('❌ Activities API not accessible:', error.message);
    }

    // 3. TEST CAR RENTAL IMAGES
    console.log('\n\n' + '='.repeat(50));
    console.log('🚗 CAR RENTAL IMAGES TEST');
    console.log('='.repeat(50));
    
    try {
      const carResponse = await fetch(
        'https://test.api.amadeus.com/v1/shopping/car-offers?pickup=NYC&dropoff=NYC&pickupDate=2025-08-15T10:00:00&dropoffDate=2025-08-17T10:00:00',
        { headers: { 'Authorization': `Bearer ${access_token}` } }
      );
      
      if (carResponse.ok) {
        const carData = await carResponse.json();
        console.log('✅ Car rental API accessible');
        
        if (carData.data && carData.data.length > 0) {
          carData.data.slice(0, 2).forEach((car, index) => {
            console.log(`\n🚗 Car ${index + 1}: ${car.vehicle.make} ${car.vehicle.model}`);
            console.log('🖼️  Image Data:');
            
            // Check for images in vehicle object
            if (car.vehicle.image) {
              console.log(`   📸 Car image: ${car.vehicle.image}`);
            } else if (car.vehicle.images) {
              console.log(`   📸 Car has ${car.vehicle.images.length} images`);
              car.vehicle.images.forEach((img, i) => {
                console.log(`   ${i + 1}. ${img}`);
              });
            } else {
              console.log('   ❌ No images found in vehicle object');
            }
            
            console.log('📋 Vehicle structure keys:', Object.keys(car.vehicle));
            console.log('📋 Full car structure keys:', Object.keys(car));
          });
        } else {
          console.log('❌ No car data returned');
        }
      } else {
        const error = await carResponse.text();
        console.log('❌ Car rental API failed:', carResponse.status, error);
      }
    } catch (error) {
      console.log('❌ Car rental API not accessible:', error.message);
    }

    // 4. TEST POINTS OF INTEREST
    console.log('\n\n' + '='.repeat(50));
    console.log('📍 POINTS OF INTEREST IMAGES TEST');
    console.log('='.repeat(50));
    
    try {
      const poiResponse = await fetch(
        'https://test.api.amadeus.com/v1/reference-data/locations/pois?latitude=40.7128&longitude=-74.0060&radius=2',
        { headers: { 'Authorization': `Bearer ${access_token}` } }
      );
      
      if (poiResponse.ok) {
        const poiData = await poiResponse.json();
        console.log('✅ Points of Interest API accessible');
        
        if (poiData.data && poiData.data.length > 0) {
          poiData.data.slice(0, 3).forEach((poi, index) => {
            console.log(`\n📍 POI ${index + 1}: ${poi.name}`);
            console.log('🖼️  Image Data:');
            
            if (poi.pictures) {
              console.log(`   📸 POI has ${poi.pictures.length} pictures`);
              poi.pictures.forEach((pic, i) => {
                console.log(`   ${i + 1}. ${pic}`);
              });
            } else {
              console.log('   ❌ No pictures found');
            }
            
            console.log('📋 POI structure keys:', Object.keys(poi));
          });
        } else {
          console.log('❌ No POI data returned');
        }
      } else {
        const error = await poiResponse.text();
        console.log('❌ POI API failed:', poiResponse.status, error);
      }
    } catch (error) {
      console.log('❌ POI API not accessible:', error.message);
    }

    console.log('\n\n📋 SUMMARY: Image availability in Amadeus APIs');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testAmadeusImages();