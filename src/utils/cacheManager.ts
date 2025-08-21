// Hotel Cache Management Utilities

export interface CacheInfo {
  cityCode: string
  count: number
  cachedAt: string
  expiresAt: string
  source: 'file-cache' | 'localStorage'
}

export class HotelCacheManager {
  // Get cache status for all cities
  static async getCacheStatus(): Promise<CacheInfo[]> {
    const cities = ['NYC', 'AMS', 'PAR', 'LON', 'BKK', 'BCN', 'ROM']
    const cacheInfos: CacheInfo[] = []

    for (const cityCode of cities) {
      try {
        const response = await fetch(`/api/hotel-cache?cityCode=${cityCode}&limit=16`)
        const result = await response.json()
        
        if (result.success && result.cached) {
          cacheInfos.push({
            cityCode,
            count: result.meta.count,
            cachedAt: result.meta.cachedAt,
            expiresAt: result.meta.expiresAt,
            source: 'file-cache'
          })
        }
      } catch (error) {
        console.warn(`Failed to check cache for ${cityCode}:`, error)
      }
    }

    return cacheInfos
  }

  // Clear cache for specific city
  static async clearCityCache(cityCode: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/hotel-cache?cityCode=${cityCode}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      return result.success
    } catch (error) {
      console.error(`Failed to clear cache for ${cityCode}:`, error)
      return false
    }
  }

  // Clear all cache
  static async clearAllCache(): Promise<boolean> {
    try {
      const response = await fetch('/api/hotel-cache?all=true', {
        method: 'DELETE'
      })
      
      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Failed to clear all cache:', error)
      return false
    }
  }

  // Preload cache for all cities (useful for dev setup)
  static async preloadAllCities(): Promise<void> {
    const cities = [
      { code: 'NYC', name: 'New York' },
      { code: 'AMS', name: 'Amsterdam' },
      { code: 'PAR', name: 'Paris' },
      { code: 'LON', name: 'London' },
      { code: 'BKK', name: 'Bangkok' },
      { code: 'BCN', name: 'Barcelona' },
      { code: 'ROM', name: 'Rome' }
    ]

    console.log('🚀 Starting cache preload for all cities...')

    for (const city of cities) {
      try {
        // Check if already cached
        const cacheResponse = await fetch(`/api/hotel-cache?cityCode=${city.code}&limit=16`)
        const cacheResult = await cacheResponse.json()
        
        if (cacheResult.success && cacheResult.cached) {
          console.log(`📋 ${city.name} already cached (${cacheResult.data.length} hotels)`)
          continue
        }

        // Fetch fresh data
        console.log(`🌐 Fetching ${city.name}...`)
        const apiResponse = await fetch(`/api/hotels-list?cityCode=${city.code}&limit=16`)
        const apiResult = await apiResponse.json()
        
        if (apiResult.success && apiResult.data) {
          // Save to cache
          await fetch('/api/hotel-cache', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              cityCode: city.code, 
              hotels: apiResult.data, 
              limit: 16 
            })
          })
          
          console.log(`✅ ${city.name} cached (${apiResult.data.length} hotels)`)
        }
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        console.error(`❌ Failed to preload ${city.name}:`, error)
      }
    }

    console.log('🎉 Cache preload completed!')
  }

  // Get cache statistics
  static async getCacheStats() {
    try {
      const cacheInfos = await this.getCacheStatus()
      const totalHotels = cacheInfos.reduce((sum, info) => sum + info.count, 0)
      const cachedCities = cacheInfos.length
      
      return {
        cachedCities,
        totalCities: 7,
        totalHotels,
        cacheHitRate: `${Math.round((cachedCities / 7) * 100)}%`,
        cities: cacheInfos
      }
    } catch (error) {
      console.error('Failed to get cache stats:', error)
      return null
    }
  }
}

// Dev helper functions
export const devCacheUtils = {
  // Quick cache status check
  status: () => HotelCacheManager.getCacheStats(),
  
  // Clear all and reload
  refresh: async () => {
    await HotelCacheManager.clearAllCache()
    await HotelCacheManager.preloadAllCities()
  },
  
  // Clear specific city
  clear: (cityCode: string) => HotelCacheManager.clearCityCache(cityCode),
  
  // Preload all
  preload: () => HotelCacheManager.preloadAllCities()
}

// Make available in browser console for dev
if (typeof window !== 'undefined') {
  (window as any).hotelCache = devCacheUtils
}