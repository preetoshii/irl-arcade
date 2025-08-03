import { useState, useEffect } from 'react';

function useScrollColorInterpolation(carouselRef, games) {
  const [interpolatedColor, setInterpolatedColor] = useState('255, 255, 255');

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || games.length === 0) return;

    const updateColor = () => {
      // Get all game slides - look for direct children divs
      const slides = carousel.querySelectorAll(':scope > div');
      const carouselRect = carousel.getBoundingClientRect();
      const viewportCenterX = carouselRect.left + carouselRect.width / 2;
      
      let closestSlide = null;
      let secondClosestSlide = null;
      let minDistance = Infinity;
      let secondMinDistance = Infinity;
      
      // Find the two slides closest to center
      slides.forEach((slide, index) => {
        const rect = slide.getBoundingClientRect();
        const slideCenter = rect.left + rect.width / 2;
        const distance = Math.abs(slideCenter - viewportCenterX);
        
        if (distance < minDistance) {
          secondClosestSlide = closestSlide;
          secondMinDistance = minDistance;
          closestSlide = { slide, index, distance };
          minDistance = distance;
        } else if (distance < secondMinDistance) {
          secondClosestSlide = { slide, index, distance };
          secondMinDistance = distance;
        }
      });
      
      // If we have two slides, interpolate between them
      if (closestSlide && secondClosestSlide && games[closestSlide.index] && games[secondClosestSlide.index]) {
        const totalDistance = closestSlide.distance + secondClosestSlide.distance;
        const factor = closestSlide.distance / totalDistance;
        
        const color1 = games[closestSlide.index].color || '255, 255, 255';
        const color2 = games[secondClosestSlide.index].color || '255, 255, 255';
        
        // Parse colors
        const rgb1 = color1.split(',').map(v => parseInt(v.trim()));
        const rgb2 = color2.split(',').map(v => parseInt(v.trim()));
        
        // Interpolate
        const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * factor);
        const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * factor);
        const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * factor);
        
        setInterpolatedColor(`${r}, ${g}, ${b}`);
      } else if (closestSlide && games[closestSlide.index]) {
        // Just use the closest slide's color
        setInterpolatedColor(games[closestSlide.index].color || '255, 255, 255');
      }
    };

    // Update on scroll
    carousel.addEventListener('scroll', updateColor);
    
    // Initial update
    setTimeout(updateColor, 100); // Small delay to ensure DOM is ready
    
    return () => {
      carousel.removeEventListener('scroll', updateColor);
    };
  }, [carouselRef, games]);

  return interpolatedColor;
}

export default useScrollColorInterpolation;