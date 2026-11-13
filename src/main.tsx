import React from 'react';
import { createRoot } from 'react-dom/client';
import AppRoot from './RootWrap';
import { getCSSPropertyValue } from '@utils/common';
import Sentry from '@services/sentry';
import { LANGUAGE_LIST } from './constants';

const getInitialColor = () => {
  const savedColor = localStorage.getItem('color');

  if (!savedColor) return 'blue';

  try {
    return JSON.parse(savedColor) as string;
  } catch {
    return savedColor;
  }
};

const getInitialDirection = () => {
  const savedLang = localStorage.getItem('ui_lang') || 'eng';
  const direction = LANGUAGE_LIST.find(
    (record) => record.threeLettersCode === savedLang
  )?.direction;

  return direction || 'ltr';
};

const direction = getInitialDirection();
document.documentElement.setAttribute('dir', direction);

// The app runs in light mode only.
const theme = 'light';
localStorage.setItem('theme', JSON.stringify(theme));
const color = getInitialColor();
const newTheme = `${color}-${theme}`;
document.documentElement.setAttribute('data-theme', newTheme);

const themeColor = getCSSPropertyValue('--accent-100');

document
  .querySelector("meta[name='theme-color']")
  .setAttribute('content', themeColor);

console.info(`Organized: version ${import.meta.env.PACKAGE_VERSION}`);

const container = document.getElementById('root');

const root = createRoot(container, {
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.warn('Uncaught error', error, errorInfo.componentStack);
  }),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
});

root.render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);
