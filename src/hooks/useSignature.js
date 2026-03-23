import { useState, useEffect } from 'react';
import axios from 'axios';

export function useSignature() {
  const [metadata, setMetadata] = useState({
    ip: '',
    userAgent: navigator.userAgent,
    timestamp: null,
    timeOnPage: 0,
    geo: null
  });

  // Track time on page
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      setMetadata(prev => ({ ...prev, timeOnPage: seconds }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch IP
  useEffect(() => {
    const fetchIP = async () => {
      try {
        const res = await axios.get('https://api.ipify.org?format=json');
        setMetadata(prev => ({ ...prev, ip: res.data.ip }));
      } catch (e) {
        console.error("Failed to fetch IP", e);
      }
    };
    fetchIP();
  }, []);

  const captureEvidence = () => {
    return {
      ...metadata,
      timestamp: new Date().toISOString(),
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      language: navigator.language
    };
  };

  return { metadata, captureEvidence };
}
