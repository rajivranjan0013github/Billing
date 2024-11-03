import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    // Initial check
    setMatches(media.matches);

    // Define the event listener
    const listener = (event) => setMatches(event.matches);

    // Add the event listener
    media.addEventListener('change', listener);

    // Clean up function
    return () => media.removeEventListener('change', listener);
  }, [query]); // Only re-run if the query changes

  return matches;
}
