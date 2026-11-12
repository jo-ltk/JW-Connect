import { useEffect } from 'react';

/**
 * Turns on the JW Connect visual layer (src/global/jwc.css) while a JW Connect
 * screen is mounted. Other Organized screens keep their own theme.
 */
const useJwcShell = (screen: 'home' | 'schedule') => {
  useEffect(() => {
    const classes = ['jwc-shell', `jwc-${screen}`];
    document.body.classList.add(...classes);

    return () => {
      document.body.classList.remove(...classes);
    };
  }, [screen]);
};

export default useJwcShell;
