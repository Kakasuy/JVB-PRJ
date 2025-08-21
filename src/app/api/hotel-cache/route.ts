import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

const CACHE_DIR = path.join(process.cwd(), 'cache', 'hotels')
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
  }
}

// Generate cache file path
function getCacheFilePath(cityCode: string, limit: number): string {
  return path.join(CACHE_DIR, `${cityCode}-${limit}.json`)
}

// GET: Read cache
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cityCode = searchParams.get('cityCode')
    const limit = parseInt(searchParams.get('limit') || '16')

    if (!cityCode) {
      return NextResponse.json({ error: 'cityCode is required' }, { status: 400 })
    }

    ensureCacheDir()
    const cacheFilePath = getCacheFilePath(cityCode, limit)

    // Check if cache file exists
    if (!fs.existsSync(cacheFilePath)) {
      return NextResponse.json({ 
        success: false, 
        cached: false,
        message: 'No cache found' 
      })
    }

    // Read and parse cache
    const cacheContent = fs.readFileSync(cacheFilePath, 'utf8')
    const cacheData = JSON.parse(cacheContent)

    // Check if cache is expired
    if (Date.now() > cacheData.expiresAt) {
      fs.unlinkSync(cacheFilePath) // Delete expired cache
      return NextResponse.json({ 
        success: false, 
        cached: false,
        message: 'Cache expired' 
      })
    }

    console.log(`📋 Retrieved cached hotels for ${cityCode} (${cacheData.hotels.length} hotels)`)

    return NextResponse.json({
      success: true,
      cached: true,
      data: cacheData.hotels,
      meta: {
        cityCode,
        count: cacheData.hotels.length,
        cachedAt: new Date(cacheData.timestamp).toISOString(),
        expiresAt: new Date(cacheData.expiresAt).toISOString(),
        source: 'file-cache'
      }
    })

  } catch (error) {
    console.error('Cache read error:', error)
    return NextResponse.json({
      success: false,
      cached: false,
      error: 'Failed to read cache'
    }, { status: 500 })
  }
}

// POST: Write cache
export async function POST(request: NextRequest) {
  try {
    const { cityCode, limit, hotels } = await request.json()

    if (!cityCode || !hotels || !Array.isArray(hotels)) {
      return NextResponse.json({ 
        error: 'cityCode and hotels array are required' 
      }, { status: 400 })
    }

    ensureCacheDir()
    const cacheFilePath = getCacheFilePath(cityCode, limit || 16)

    const cacheData = {
      cityCode,
      hotels,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION,
      count: hotels.length
    }

    fs.writeFileSync(cacheFilePath, JSON.stringify(cacheData, null, 2))
    
    console.log(`💾 Cached ${hotels.length} hotels for ${cityCode} → ${cacheFilePath}`)

    return NextResponse.json({
      success: true,
      cached: true,
      message: `Cached ${hotels.length} hotels for ${cityCode}`,
      meta: {
        cityCode,
        count: hotels.length,
        cachedAt: new Date(cacheData.timestamp).toISOString(),
        expiresAt: new Date(cacheData.expiresAt).toISOString(),
        filePath: cacheFilePath.replace(process.cwd(), '.')
      }
    })

  } catch (error) {
    console.error('Cache write error:', error)
    return NextResponse.json({
      error: 'Failed to write cache'
    }, { status: 500 })
  }
}

// DELETE: Clear cache
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cityCode = searchParams.get('cityCode')
    const clearAll = searchParams.get('all') === 'true'

    if (clearAll) {
      // Clear all cache files
      if (fs.existsSync(CACHE_DIR)) {
        const files = fs.readdirSync(CACHE_DIR)
        files.forEach(file => {
          fs.unlinkSync(path.join(CACHE_DIR, file))
        })
        console.log(`🗑️ Cleared all hotel cache (${files.length} files)`)
        
        return NextResponse.json({
          success: true,
          message: `Cleared all hotel cache (${files.length} files)`
        })
      }
    } else if (cityCode) {
      // Clear specific city cache
      const files = fs.readdirSync(CACHE_DIR).filter(file => file.startsWith(cityCode))
      files.forEach(file => {
        fs.unlinkSync(path.join(CACHE_DIR, file))
      })
      console.log(`🗑️ Cleared cache for ${cityCode} (${files.length} files)`)
      
      return NextResponse.json({
        success: true,
        message: `Cleared cache for ${cityCode} (${files.length} files)`
      })
    }

    return NextResponse.json({ 
      error: 'cityCode or all=true parameter is required' 
    }, { status: 400 })

  } catch (error) {
    console.error('Cache delete error:', error)
    return NextResponse.json({
      error: 'Failed to delete cache'
    }, { status: 500 })
  }
}