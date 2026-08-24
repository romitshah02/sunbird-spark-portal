import type { QtiPlayerMetadata, QtiPlayerEvent } from './types';
import { buildTelemetryContext } from '../telemetryContextBuilder';
import type { TelemetryContextProps } from '../telemetryContextBuilder';

export class QtiPlayerService {
  private eventHandlers = new WeakMap<HTMLElement, { player: (event: Event) => void; nav: (event: Event) => void; telemetry: (event: Event) => void }>();
  private static stylesLoaded = false;
  private static scriptLoaded = false;
  private static scriptLoading?: Promise<void>;

  private loadScript(): Promise<void> {
    if (QtiPlayerService.scriptLoaded || customElements.get('qti3-test-runner')) {
      QtiPlayerService.scriptLoaded = true;
      return Promise.resolve();
    }
    /* c8 ignore next 12 */
    if (QtiPlayerService.scriptLoading) {
      return QtiPlayerService.scriptLoading;
    }
    QtiPlayerService.scriptLoading = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/assets/qti-player/qti3-test-runner.js';
      script.setAttribute('data-qti-player-script', 'true');
      script.onload = () => { QtiPlayerService.scriptLoaded = true; QtiPlayerService.scriptLoading = undefined; resolve(); };
      script.onerror = () => { QtiPlayerService.scriptLoading = undefined; reject(new Error('Failed to load qti3-test-runner script')); };
      document.body.appendChild(script);
    });
    return QtiPlayerService.scriptLoading;
  }

  /**
   * Build qti-player's RunnerConfig. Unlike QumlPlayerConfig's
   * {context, config, metadata} wrapper, qti-player's runner-config
   * attribute IS the RunnerConfig directly, with context as one of its
   * own top-level keys - so this returns a flat object, not a wrapper.
   */
  async createConfig(
    metadata: QtiPlayerMetadata,
    contextProps?: TelemetryContextProps
  ): Promise<QtiPlayerMetadata> {
    await this.loadScript();
    const context = await buildTelemetryContext(contextProps, { contentId: metadata.identifier });
    return { ...metadata, context };
  }

  private loadStyles(): void {
    const existingStyles = document.querySelector('[data-qti-player-styles="true"]');
    if (existingStyles || QtiPlayerService.stylesLoaded) {
      QtiPlayerService.stylesLoaded = true;
      return;
    }

    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = '/assets/qti-player/styles.css';
    styleLink.setAttribute('data-qti-player-styles', 'true');
    document.head.appendChild(styleLink);

    QtiPlayerService.stylesLoaded = true;
  }

  /**
   * Called when the player component unmounts to prevent style bleed
   * into other pages during SPA navigation.
   */
  static unloadStyles(): void {
    const styleLink = document.querySelector('[data-qti-player-styles="true"]');
    if (styleLink) {
      styleLink.remove();
    }
    QtiPlayerService.stylesLoaded = false;
  }

  createElement(config: QtiPlayerMetadata): HTMLElement {
    this.loadStyles();

    const element = document.createElement('qti3-test-runner');
    element.setAttribute('runner-config', JSON.stringify(config));
    element.setAttribute('data-player-id', config.identifier);

    return element;
  }

  attachEventListeners(
    element: HTMLElement,
    onPlayerEvent?: (event: QtiPlayerEvent) => void,
    onNavEvent?: (event: any) => void,
    onTelemetryEvent?: (event: any) => void
  ): void {
    this.removeEventListeners(element);

    const playerHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (onPlayerEvent) {
        onPlayerEvent({
          type: customEvent.detail?.type || 'unknown',
          data: customEvent.detail,
          playerId: element.getAttribute('data-player-id') || 'qti-player',
          timestamp: Date.now(),
        });
      }
    };

    const navHandler = (event: Event) => {
      onNavEvent?.((event as CustomEvent).detail);
    };

    const telemetryHandler = (event: Event) => {
      onTelemetryEvent?.((event as CustomEvent).detail);
    };

    element.addEventListener('playerEvent', playerHandler);
    element.addEventListener('navEvent', navHandler);
    element.addEventListener('telemetryEvent', telemetryHandler);

    this.eventHandlers.set(element, { player: playerHandler, nav: navHandler, telemetry: telemetryHandler });
  }

  removeEventListeners(element: HTMLElement): void {
    const handlers = this.eventHandlers.get(element);
    if (handlers) {
      element.removeEventListener('playerEvent', handlers.player);
      element.removeEventListener('navEvent', handlers.nav);
      element.removeEventListener('telemetryEvent', handlers.telemetry);
      this.eventHandlers.delete(element);
    }
  }
}

export const qtiPlayerService = new QtiPlayerService();