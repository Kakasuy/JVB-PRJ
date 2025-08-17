// Amadeus Hotel Amenities Constants
// Based on official Amadeus API documentation

export const AMADEUS_AMENITIES = {
  // Pool & Recreation
  SWIMMING_POOL: 'SWIMMING_POOL',
  SPA: 'SPA', 
  FITNESS_CENTER: 'FITNESS_CENTER',
  TENNIS: 'TENNIS',
  GOLF: 'GOLF',
  BEACH: 'BEACH',
  CASINO: 'CASINO',
  JACUZZI: 'JACUZZI',
  SAUNA: 'SAUNA',
  SOLARIUM: 'SOLARIUM',
  MASSAGE: 'MASSAGE',

  // Hotel Services
  RESTAURANT: 'RESTAURANT',
  BAR_OR_LOUNGE: 'BAR or LOUNGE',
  ROOM_SERVICE: 'ROOM_SERVICE',
  SERV_SPEC_MENU: 'SERV_SPEC_MENU',

  // Transportation & Parking
  PARKING: 'PARKING',
  VALET_PARKING: 'VALET_PARKING',
  GUARDED_PARKG: 'GUARDED_PARKG',
  AIRPORT_SHUTTLE: 'AIRPORT_SHUTTLE',

  // Business & Meeting
  BUSINESS_CENTER: 'BUSINESS_CENTER',
  MEETING_ROOMS: 'MEETING_ROOMS',

  // Room Amenities
  AIR_CONDITIONING: 'AIR_CONDITIONING',
  KITCHEN: 'KITCHEN',
  MINIBAR: 'MINIBAR',
  TELEVISION: 'TELEVISION',
  WI_FI_IN_ROOM: 'WI-FI_IN_ROOM',

  // Connectivity
  WIFI: 'WIFI',

  // Family & Pet Services
  PETS_ALLOWED: 'PETS_ALLOWED',
  KIDS_WELCOME: 'KIDS_WELCOME',
  NO_KID_ALLOWED: 'NO_KID_ALLOWED',
  BABY_SITTING: 'BABY-SITTING',
  ANIMAL_WATCHING: 'ANIMAL_WATCHING',

  // Accessibility & Special Services
  DISABLED_FACILITIES: 'DISABLED_FACILITIES',
  NO_PORN_FILMS: 'NO_PORN_FILMS',
} as const

export type AmadeusAmenity = typeof AMADEUS_AMENITIES[keyof typeof AMADEUS_AMENITIES]

// UI-friendly amenities grouping for better user experience
export const AMENITIES_GROUPS = {
  'Pool & Recreation': [
    {
      name: 'Swimming Pool',
      value: AMADEUS_AMENITIES.SWIMMING_POOL,
      description: 'Outdoor or indoor swimming pool',
      icon: '🏊'
    },
    {
      name: 'Spa',
      value: AMADEUS_AMENITIES.SPA,
      description: 'Full-service spa and wellness center',
      icon: '🧖'
    },
    {
      name: 'Fitness Center',
      value: AMADEUS_AMENITIES.FITNESS_CENTER,
      description: 'On-site gym and fitness facilities',
      icon: '💪'
    },
    {
      name: 'Jacuzzi',
      value: AMADEUS_AMENITIES.JACUZZI,
      description: 'Hot tub and jacuzzi facilities',
      icon: '🛁'
    },
    {
      name: 'Sauna',
      value: AMADEUS_AMENITIES.SAUNA,
      description: 'Traditional sauna facilities',
      icon: '🧖‍♀️'
    },
    {
      name: 'Tennis',
      value: AMADEUS_AMENITIES.TENNIS,
      description: 'Tennis court access',
      icon: '🎾'
    },
    {
      name: 'Golf',
      value: AMADEUS_AMENITIES.GOLF,
      description: 'Golf course or golf access',
      icon: '⛳'
    },
    {
      name: 'Beach Access',
      value: AMADEUS_AMENITIES.BEACH,
      description: 'Direct beach access or beachfront location',
      icon: '🏖️'
    },
    {
      name: 'Casino',
      value: AMADEUS_AMENITIES.CASINO,
      description: 'On-site casino facilities',
      icon: '🎰'
    }
  ],

  'Dining & Bar': [
    {
      name: 'Restaurant',
      value: AMADEUS_AMENITIES.RESTAURANT,
      description: 'On-site dining restaurant',
      icon: '🍽️'
    },
    {
      name: 'Bar or Lounge',
      value: AMADEUS_AMENITIES.BAR_OR_LOUNGE,
      description: 'Hotel bar or cocktail lounge',
      icon: '🍸'
    },
    {
      name: 'Room Service',
      value: AMADEUS_AMENITIES.ROOM_SERVICE,
      description: '24-hour or limited room service',
      icon: '🛎️'
    },
    {
      name: 'Special Menu',
      value: AMADEUS_AMENITIES.SERV_SPEC_MENU,
      description: 'Special dietary or custom menu options',
      icon: '📋'
    }
  ],

  'Transportation': [
    {
      name: 'Parking',
      value: AMADEUS_AMENITIES.PARKING,
      description: 'Self-parking available',
      icon: '🅿️'
    },
    {
      name: 'Valet Parking',
      value: AMADEUS_AMENITIES.VALET_PARKING,
      description: 'Valet parking service',
      icon: '🚗'
    },
    {
      name: 'Guarded Parking',
      value: AMADEUS_AMENITIES.GUARDED_PARKG,
      description: 'Secure guarded parking facility',
      icon: '🔒'
    },
    {
      name: 'Airport Shuttle',
      value: AMADEUS_AMENITIES.AIRPORT_SHUTTLE,
      description: 'Free or paid airport transportation',
      icon: '🚌'
    }
  ],

  'Business': [
    {
      name: 'Business Center',
      value: AMADEUS_AMENITIES.BUSINESS_CENTER,
      description: 'Business services and facilities',
      icon: '💼'
    },
    {
      name: 'Meeting Rooms',
      value: AMADEUS_AMENITIES.MEETING_ROOMS,
      description: 'Conference and meeting facilities',
      icon: '🏢'
    }
  ],

  'Room Features': [
    {
      name: 'Air Conditioning',
      value: AMADEUS_AMENITIES.AIR_CONDITIONING,
      description: 'Climate-controlled rooms',
      icon: '❄️'
    },
    {
      name: 'Kitchen',
      value: AMADEUS_AMENITIES.KITCHEN,
      description: 'In-room kitchen or kitchenette',
      icon: '🍳'
    },
    {
      name: 'Minibar',
      value: AMADEUS_AMENITIES.MINIBAR,
      description: 'In-room minibar and refreshments',
      icon: '🥤'
    },
    {
      name: 'Television',
      value: AMADEUS_AMENITIES.TELEVISION,
      description: 'In-room TV with cable/satellite',
      icon: '📺'
    },
    {
      name: 'In-Room Wi-Fi',
      value: AMADEUS_AMENITIES.WI_FI_IN_ROOM,
      description: 'High-speed internet in rooms',
      icon: '📶'
    }
  ],

  'Connectivity': [
    {
      name: 'Wi-Fi',
      value: AMADEUS_AMENITIES.WIFI,
      description: 'Wireless internet throughout property',
      icon: '📡'
    }
  ],

  'Family & Pets': [
    {
      name: 'Pets Allowed',
      value: AMADEUS_AMENITIES.PETS_ALLOWED,
      description: 'Pet-friendly accommodation',
      icon: '🐕'
    },
    {
      name: 'Kids Welcome',
      value: AMADEUS_AMENITIES.KIDS_WELCOME,
      description: 'Child-friendly facilities and services',
      icon: '👶'
    },
    {
      name: 'Baby Sitting',
      value: AMADEUS_AMENITIES.BABY_SITTING,
      description: 'Babysitting and childcare services',
      icon: '👶'
    },
    {
      name: 'Animal Watching',
      value: AMADEUS_AMENITIES.ANIMAL_WATCHING,
      description: 'Wildlife viewing opportunities',
      icon: '🦌'
    }
  ],

  'Accessibility': [
    {
      name: 'Disabled Facilities',
      value: AMADEUS_AMENITIES.DISABLED_FACILITIES,
      description: 'Wheelchair accessible facilities',
      icon: '♿'
    }
  ]
}

// Flattened list for easier iteration
export const ALL_AMENITIES_OPTIONS = Object.values(AMENITIES_GROUPS).flat()

// Most popular amenities for quick filters
export const POPULAR_AMENITIES = [
  AMADEUS_AMENITIES.WIFI,
  AMADEUS_AMENITIES.AIR_CONDITIONING,
  AMADEUS_AMENITIES.PARKING,
  AMADEUS_AMENITIES.SWIMMING_POOL,
  AMADEUS_AMENITIES.FITNESS_CENTER,
  AMADEUS_AMENITIES.RESTAURANT,
  AMADEUS_AMENITIES.ROOM_SERVICE,
  AMADEUS_AMENITIES.SPA
]

// Helper function to get amenity display info
export const getAmenityInfo = (amenityValue: string) => {
  return ALL_AMENITIES_OPTIONS.find(amenity => amenity.value === amenityValue)
}

// Helper function to convert UI selection to API parameter
export const formatAmenitiesForAPI = (selectedAmenities: string[]): string => {
  return selectedAmenities.join(',')
}