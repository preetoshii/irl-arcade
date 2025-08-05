import { useState, useEffect } from 'react';

function useScrollColorInterpolation(carouselRef, games, isNavigating) {
  const [interpolatedColor, setInterpolatedColor] = useState('255, 255, 255');

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || games.length === 0) return;

    const updateColor = () => {
      // Skip during navigation to prevent flash
      if (isNavigating && isNavigating.current) return;
      
      const slides = carousel.querySelectorAll('[data-game-id]');
      const carouselRect = carousel.getBoundingClientRect();
      const centerX = carouselRect.left + carouselRect.width / 2;
      
      let closestSlide = null;
      let secondClosestSlide = null;
      let minDistance = Infinity;
      let secondMinDistance = Infinity;
      
      // Find two closest slides to center
      slides.forEach((slide) => {
        const rect = slide.getBoundingClientRect();
        const slideCenter = rect.left + rect.width / 2;
        const distance = Math.abs(slideCenter - centerX);
        
        if (distance < minDistance) {
          secondClosestSlide = closestSlide;
          secondMinDistance = minDistance;
          closestSlide = { slide, distance };
          minDistance = distance;
        } else if (distance < secondMinDistance) {
          secondClosestSlide = { slide, distance };
          secondMinDistance = distance;
        }
      });
      
      // Calculate interpolated color
      if (closestSlide) {
        const gameId1 = closestSlide.slide.dataset.gameId;
        const game1 = games.find(g => g.id === gameId1);
        
        if (secondClosestSlide && game1) {
          const gameId2 = secondClosestSlide.slide.dataset.gameId;
          const game2 = games.find(g => g.id === gameId2);
          
          if (game2) {
            // Interpolate between two colors
            const totalDistance = closestSlide.distance + secondClosestSlide.distance;
            const factor = closestSlide.distance / totalDistance;
            
            const color1 = game1.color || '255, 255, 255';
            const color2 = game2.color || '255, 255, 255';
            
            const rgb1 = color1.split(',').map(v => parseInt(v.trim()));
            const rgb2 = color2.split(',').map(v => parseInt(v.trim()));
            
            const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * factor);
            const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * factor);
            const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * factor);
            
            setInterpolatedColor(`${r}, ${g}, ${b}`);
          } else if (game1) {
            setInterpolatedColor(game1.color || '255, 255, 255');
          }
        } else if (game1) {
          setInterpolatedColor(game1.color || '255, 255, 255');
        }
      }
    };

    carousel.addEventListener('scroll', updateColor);
    
    // Initial color update
    setTimeout(updateColor, 100);
    
    return () => {
      carousel.removeEventListener('scroll', updateColor);
    };
  }, [carouselRef, games, isNavigating]);

  return interpolatedColor;
}

export default useScrollColorInterpolation;