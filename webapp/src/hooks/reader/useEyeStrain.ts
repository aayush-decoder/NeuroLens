import { useState, useEffect, useCallback } from 'react';
import {
  createEyeStrainState,
  updateEyeStrainLevel,
  getLineHeight,
  getFontWeight,
  getSepiaIntensity,
  UPDATE_INTERVAL,
} from '@/engines/eyeStrainEngine';

export function useEyeStrain() {
  const [state, setState] = useState(createEyeStrainState());
  const [lineHeight, setLineHeight] = useState(1.8);
  const [fontWeight, setFontWeight] = useState(400);
  const [sepiaIntensity, setSepiaIntensity] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const updated = updateEyeStrainLevel(prev);
        setLineHeight(getLineHeight(updated.level));
        setFontWeight(getFontWeight(updated.level));
        setSepiaIntensity(getSepiaIntensity(updated.level));
        return updated;
      });
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const reset = useCallback(() => {
    setState(createEyeStrainState());
    setLineHeight(1.8);
    setFontWeight(400);
    setSepiaIntensity(0);
  }, []);

  return { lineHeight, fontWeight, sepiaIntensity, level: state.level, reset };
}
