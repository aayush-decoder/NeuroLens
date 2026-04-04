import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFileStore } from '@/store/fileStore';
import { useTelemetry } from '@/hooks/reader/useTelemetry';
import { useScrollVelocity } from '@/hooks/reader/useScrollVelocity';
import { useEyeStrain } from '@/hooks/reader/useEyeStrain';
import { saveSessionState, loadSessionState } from '@/engines/persistenceEngine';
import Paragraph from '@/components/Reader/Paragraph';
import ZeroChromeLayer from '@/components/Reader/ZeroChromeLayer';
import ConceptGraph from '@/components/Review/ConceptGraph';

interface ReaderPageProps {
  fileId: string;
}

export default function ReaderPage({ fileId }: ReaderPageProps) {
  const router = useRouter();
  const file = useFileStore(s => s.files.find(f => f.id === fileId));
  const updateFile = useFileStore(s => s.updateFile);
  const [cognatesEnabled, setCognatesEnabled] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const paragraphs = useMemo(() => file?.content.split('\n\n').filter(Boolean) || [], [file]);

  const { onParagraphEnter, onHesitation, onScroll, frictionMap, struggledTerms, getSessionData } = useTelemetry(fileId || '');
  const { velocity, isScrolling, handleScroll } = useScrollVelocity();
  const { lineHeight, fontWeight, sepiaIntensity } = useEyeStrain();

  // Scroll persistence
  useEffect(() => {
    if (!fileId) return;
    const saved = loadSessionState(fileId);
    if (saved?.scrollDepth) {
      requestAnimationFrame(() => {
        window.scrollTo(0, saved.scrollDepth * document.documentElement.scrollHeight);
      });
    }
  }, [fileId]);

  // Attach scroll listener
  useEffect(() => {
    const onScrollHandler = () => {
      handleScroll();
      onScroll(velocity);

      // Save scroll depth
      if (fileId) {
        const depth = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1);
        saveSessionState({
          fileId,
          scrollDepth: depth,
          sessionStartTime: Date.now(),
          elapsedMs: 0,
          adaptations: [],
          eyeStrainLevel: 0,
        });
        updateFile(fileId, { scrollDepth: depth });
      }
    };

    window.addEventListener('scroll', onScrollHandler, { passive: true });
    return () => window.removeEventListener('scroll', onScrollHandler);
  }, [handleScroll, onScroll, velocity, fileId, updateFile]);

  const progress = useMemo(() => {
    if (typeof window === 'undefined') return 0;
    return window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1);
  }, [isScrolling]);

  const handleEndSession = useCallback(() => {
    setShowReview(true);
  }, []);

  if (!file) {
    router.push('/dashboard');
    return null;
  }

  if (showReview) {
    const sessionData = getSessionData();
    return (
      <ConceptGraph
        terms={sessionData.struggledTerms}
        paragraphs={sessionData.paragraphs}
        fileName={file.name}
        onBack={() => router.push('/dashboard')}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen transition-colors duration-1000"
      style={{
        backgroundColor: sepiaIntensity > 0
          ? `hsl(36, 40%, ${95 - sepiaIntensity * 10}%)`
          : undefined,
      }}
    >
      <ZeroChromeLayer
        fileName={file.name}
        progress={progress}
        onBack={() => router.push('/dashboard')}
        onToggleCognates={() => setCognatesEnabled(!cognatesEnabled)}
        onEndSession={handleEndSession}
        cognatesEnabled={cognatesEnabled}
        isScrolling={isScrolling}
      />

      <div className="pt-20 pb-40">
        {paragraphs.map((text, i) => (
          <Paragraph
            key={i}
            text={text}
            index={i}
            frictionScore={frictionMap.get(i) || 0}
            onEnter={onParagraphEnter}
            onHesitation={onHesitation}
            showCognates={cognatesEnabled}
            lineHeight={lineHeight}
            fontWeight={fontWeight}
          />
        ))}
      </div>
    </div>
  );
}
