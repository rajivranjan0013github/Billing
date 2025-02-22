// ScrollRestoration.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollRestoration = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to left position whenever the route changes
    window.scrollTo({ left: 0, top: window.scrollY, behavior: 'smooth' });
  }, [location.key]);

  return null;
};

export default ScrollRestoration;
