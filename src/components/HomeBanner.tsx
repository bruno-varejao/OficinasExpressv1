import { useState, useEffect } from 'react'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'

interface Banner {
  id: string
  imageUrl: string
  title: string
  subtitle: string
  order: number
  active: boolean
  type: 'carousel' | 'fixed'
}

export function HomeBanner() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBanners()
  }, [])

  // Auto-advance carousel
  useEffect(() => {
    if (banners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 5000) // Change every 5 seconds

    return () => clearInterval(interval)
  }, [banners.length])

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/public/banners`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setBanners(data.banners || [])
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  if (loading) {
    return (
      <div className="w-full mb-12">
        <div className="relative w-full h-[400px] bg-gradient-to-r from-blue-100 to-orange-100 rounded-2xl overflow-hidden animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }

  if (banners.length === 0) {
    return null // Don't show anything if no banners
  }

  // Check if we have a fixed banner (should only display fixed OR carousel, not both)
  const fixedBanner = banners.find(b => b.type === 'fixed')
  const carouselBanners = banners.filter(b => b.type === 'carousel')
  
  // If there's a fixed banner, show only that one (full width, no side margins)
  if (fixedBanner) {
    return (
      <div className="w-screen relative left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] mb-12">
        <div className="relative w-full h-[400px] bg-gradient-to-r from-blue-50 to-orange-50 overflow-hidden shadow-2xl">
          <ImageWithFallback
            src={fixedBanner.imageUrl}
            alt={fixedBanner.title || 'Banner'}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          
          {/* Text Content */}
          {(fixedBanner.title || fixedBanner.subtitle) && (
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white max-w-6xl mx-auto">
              {fixedBanner.title && (
                <h2 className="text-4xl md:text-5xl mb-3 drop-shadow-lg">
                  {fixedBanner.title}
                </h2>
              )}
              {fixedBanner.subtitle && (
                <p className="text-xl md:text-2xl text-white/90 drop-shadow-lg">
                  {fixedBanner.subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // Otherwise, show carousel banners with normal margins
  if (carouselBanners.length === 0) {
    return null
  }

  return (
    <div className="w-full mb-12">
      <div className="relative w-full h-[400px] bg-gradient-to-r from-blue-50 to-orange-50 rounded-2xl overflow-hidden shadow-2xl group">
        {/* Banner Images */}
        {carouselBanners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <ImageWithFallback
              src={banner.imageUrl}
              alt={banner.title || 'Banner'}
              className="w-full h-full object-cover"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            
            {/* Text Content */}
            {(banner.title || banner.subtitle) && (
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                {banner.title && (
                  <h2 className="text-4xl md:text-5xl mb-3 drop-shadow-lg">
                    {banner.title}
                  </h2>
                )}
                {banner.subtitle && (
                  <p className="text-xl md:text-2xl text-white/90 drop-shadow-lg">
                    {banner.subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Navigation Arrows - Only show if more than 1 banner */}
        {carouselBanners.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-12 w-12 shadow-lg"
            >
              <ChevronLeft className="h-6 w-6 text-gray-800" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-12 w-12 shadow-lg"
            >
              <ChevronRight className="h-6 w-6 text-gray-800" />
            </Button>
          </>
        )}

        {/* Dots Indicator - Only show if more than 1 banner */}
        {carouselBanners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {carouselBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-white w-8'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}