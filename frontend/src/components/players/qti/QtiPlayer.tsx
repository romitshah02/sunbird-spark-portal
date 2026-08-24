import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { qtiPlayerService, QtiPlayerService } from '../../../services/players/qti';
import type { QtiPlayerEvent, QtiPlayerMetadata } from '../../../services/players/qti/types';
import type { TelemetryContextProps } from '../../../services/players/telemetryContextBuilder';

interface QtiPlayerProps {
  metadata: QtiPlayerMetadata;
  mode?: string;
  cdata?: any[];
  contextRollup?: Record<string, string>;
  objectRollup?: Record<string, string>;
  onPlayerEvent?: (event: QtiPlayerEvent) => void;
  onTelemetryEvent?: (event: any) => void;
}

const QtiPlayer: React.FC<QtiPlayerProps> = ({
  metadata,
  mode = 'play',
  cdata,
  contextRollup,
  objectRollup,
  onPlayerEvent,
  onTelemetryEvent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerElementRef = useRef<HTMLElement | null>(null);

  const contextProps = useMemo<TelemetryContextProps>(
    () => ({
      mode,
      ...(cdata && { cdata }),
      ...(contextRollup && { contextRollup }),
      ...(objectRollup && { objectRollup }),
    }),
    [mode, cdata, contextRollup, objectRollup]
  );

  const handlePlayerEvent = useCallback(
    (event: QtiPlayerEvent) => {
      console.log('[QtiPlayer] Player event:', event);
      onPlayerEvent?.(event);
    },
    [onPlayerEvent]
  );

  const handleNavEvent = useCallback((event: any) => {
    console.log('[QtiPlayer] Nav event:', event);
  }, []);

  const handleTelemetryEvent = useCallback(
    (event: any) => {
      console.log('[QtiPlayer] Telemetry event:', event);
      onTelemetryEvent?.(event);
    },
    [onTelemetryEvent]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    let playerElement: HTMLElement | null = null;
    let cancelled = false;

    const initializePlayer = async () => {
      if (!metadata) {
        console.warn('[QtiPlayer] Metadata not available');
        return;
      }

      try {
        const config = await qtiPlayerService.createConfig(metadata, contextProps);

        if (cancelled) return;

        playerElement = qtiPlayerService.createElement(config);

        qtiPlayerService.attachEventListeners(
          playerElement,
          handlePlayerEvent,
          handleNavEvent,
          handleTelemetryEvent
        );

        if (containerRef.current) {
          containerRef.current.appendChild(playerElement);
          playerElementRef.current = playerElement;
          console.log('[QtiPlayer] Player initialized successfully');
        }
      } catch (error) {
        console.error('[QtiPlayer] Failed to initialize player:', error);
      }
    };

    initializePlayer();

    return () => {
      cancelled = true;
      if (playerElement) {
        qtiPlayerService.removeEventListeners(playerElement);
        playerElement.remove();
        playerElementRef.current = null;
      }
      QtiPlayerService.unloadStyles();
    };
  }, [metadata, contextProps, handlePlayerEvent, handleNavEvent, handleTelemetryEvent]);

  return <div className="content-player-embed" ref={containerRef} />;
};

export default QtiPlayer;