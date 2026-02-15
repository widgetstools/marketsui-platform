import { useState, useEffect, useRef } from 'react';
import { init } from '@openfin/workspace-platform';
import {
  buildUrl,
  initializeBaseUrlFromManifest,
  THEME_PALETTES,
} from '@stern/openfin-platform';
import * as dock from './openfinDock.js';

/**
 * OpenfinProvider — platform provider component loaded at /platform/provider.
 * Initializes the workspace platform, registers the dock, then hides itself.
 */
export default function OpenfinProvider() {
  const isInitialized = useRef(false);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    let analyticsErrorHandler: ((event: PromiseRejectionEvent) => void) | null = null;

    if (typeof window !== 'undefined' && window.fin && !isInitialized.current) {
      isInitialized.current = true;

      const doInit = async () => {
        analyticsErrorHandler = await initializePlatform();
      };
      doInit();
    } else if (typeof window !== 'undefined' && !window.fin) {
      // Browser mode — show status for development
      setStatus('Not in OpenFin environment');
    }

    return () => {
      if (analyticsErrorHandler) {
        window.removeEventListener('unhandledrejection', analyticsErrorHandler);
      }
    };
  }, []);

  async function initializePlatform(): Promise<(event: PromiseRejectionEvent) => void> {
    try {
      // Suppress OpenFin analytics errors
      const analyticsErrorHandler = (event: PromiseRejectionEvent) => {
        if (
          event.reason?.message?.includes('system topic payload') ||
          event.reason?.message?.includes('registerUsage')
        ) {
          event.preventDefault();
        }
      };
      window.addEventListener('unhandledrejection', analyticsErrorHandler);

      // Initialize base URL from manifest
      await initializeBaseUrlFromManifest();
      const icon = buildUrl('/star.svg');
      const pngIcon = buildUrl('/star.png');

      setStatus('Initializing workspace platform...');

      // Initialize OpenFin workspace platform
      try {
        await init({
          browser: {
            defaultWindowOptions: {
              icon,
              workspacePlatform: {
                pages: [],
                favicon: icon,
              },
            },
          },
          theme: [{
            label: 'Stern Theme',
            default: 'dark',
            palettes: THEME_PALETTES as any,
          }],
          customActions: dock.dockGetCustomActions(),
        });
      } catch (initError: unknown) {
        const error = initError as Error;
        if (error?.message?.includes('system topic payload')) {
          console.warn('[Provider] Analytics error during init (non-fatal)');
        } else {
          throw error;
        }
      }

      setStatus('Waiting for platform API...');

      // Wait for platform-api-ready
      try {
        const platform = fin.Platform.getCurrentSync();

        platform.once('platform-api-ready', async () => {
          try {
            // Small delay for workspace APIs to fully initialize
            await new Promise((resolve) => setTimeout(resolve, 500));

            setStatus('Registering dock...');

            // Hardcoded menu items for reference app widgets
            const menuItems = [
              {
                id: 'orders-blotter',
                caption: 'Orders Blotter',
                url: '/blotter/orders',
                openMode: 'view' as const,
                order: 0,
              },
              {
                id: 'fills-blotter',
                caption: 'Fills Blotter',
                url: '/blotter/fills',
                openMode: 'view' as const,
                order: 1,
              },
            ];

            // Register dock
            if (dock.isDockAvailable()) {
              try {
                await dock.register({
                  id: 'stern-reference-platform',
                  title: 'Stern Reference Platform',
                  icon: pngIcon,
                  menuItems,
                });
                console.log('[Provider] Dock registered');
              } catch (dockError: any) {
                if (dockError?.message?.includes('system topic payload')) {
                  console.warn('[Provider] Dock registered (analytics error suppressed)');
                } else {
                  throw dockError;
                }
              }

              await dock.show();
            }

            // Hide provider window
            const providerWindow = fin.Window.getCurrentSync();
            await providerWindow.hide();

            // Handle close button — hide unless quitting
            providerWindow.on('close-requested', async () => {
              if (dock.isQuitting()) {
                await providerWindow.close(true);
                return;
              }
              try {
                await providerWindow.hide();
              } catch (error) {
                console.error('[Provider] Error hiding window', error);
              }
            });

            setStatus('Ready');
          } catch (error) {
            console.error('[Provider] Failed to register workspace components', error);
            setStatus('Error registering dock');
          }
        });
      } catch (platformError) {
        console.error('[Provider] Failed to get platform', platformError);
      }

      setStatus('Platform initialized');
      return analyticsErrorHandler;
    } catch (error) {
      console.error('[Provider] Failed to initialize platform', error);
      setStatus('Initialization failed');
      return () => {};
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#1e1f23',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48,
          height: 48,
          border: '3px solid rgba(255,255,255,0.3)',
          borderTopColor: '#0A76D3',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }} />
        <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>Stern Reference Platform</h1>
        <p style={{ fontSize: 14, opacity: 0.7 }}>{status}</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
