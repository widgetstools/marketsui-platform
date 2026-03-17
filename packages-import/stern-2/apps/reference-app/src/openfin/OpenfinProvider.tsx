import { useState, useEffect, useRef, useCallback } from 'react';
import { init } from '@openfin/workspace-platform';
import {
  buildUrl,
  initializeBaseUrlFromManifest,
  THEME_PALETTES,
  createMenuItem,
  DockConfigurator,
  type DockMenuItem,
} from '@stern/openfin-platform';
import { dataProviderConfigService } from '@stern/widgets';
import * as dock from './openfinDock.js';

/**
 * Default menu items seeded from the widget routes registry.
 */
function getDefaultMenuItems(): DockMenuItem[] {
  return [
    createMenuItem({
      id: 'orders-blotter',
      caption: 'Orders Blotter',
      url: '/blotter/orders',
      openMode: 'view',
      order: 0,
    }),
    createMenuItem({
      id: 'fills-blotter',
      caption: 'Fills Blotter',
      url: '/blotter/fills',
      openMode: 'view',
      order: 1,
    }),
    createMenuItem({
      id: 'positions-blotter',
      caption: 'Positions Blotter',
      url: '/blotter/positions',
      openMode: 'view',
      order: 2,
    }),
  ];
}

/**
 * OpenfinProvider — platform provider component loaded at /platform/provider.
 * Initializes the workspace platform, registers the dock, and shows a configurator UI.
 */
export default function OpenfinProvider() {
  const isInitialized = useRef(false);
  const [status, setStatus] = useState<'initializing' | 'ready' | 'error' | 'no-openfin'>('initializing');
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  const [menuItems, setMenuItems] = useState<DockMenuItem[]>(getDefaultMenuItems);

  useEffect(() => {
    let analyticsErrorHandler: ((event: PromiseRejectionEvent) => void) | null = null;

    if (typeof window !== 'undefined' && window.fin && !isInitialized.current) {
      isInitialized.current = true;

      const doInit = async () => {
        analyticsErrorHandler = await initializePlatform();
      };
      doInit();
    } else if (typeof window !== 'undefined' && !window.fin) {
      setStatus('no-openfin');
      setStatusMessage('Not in OpenFin environment — showing configurator in preview mode');
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

      // Read apiUrl from manifest customData and configure services
      try {
        const app = await fin.Application.getCurrent();
        const manifest = await app.getManifest() as any;
        const apiUrl = manifest?.platform?.defaultWindowOptions?.customData?.platformContext?.apiUrl;
        if (apiUrl) {
          dataProviderConfigService.configure({ apiUrl });
          console.log('[Provider] Configured apiUrl from manifest:', apiUrl);
        }
      } catch {
        console.warn('[Provider] Could not read apiUrl from manifest, using default');
      }

      const icon = buildUrl('/star.svg');
      const pngIcon = buildUrl('/star.png');

      setStatusMessage('Initializing workspace platform...');

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
            overrideCallback: async (WorkspacePlatformProvider) => {
              class SternPlatformProvider extends WorkspacePlatformProvider {
                async quit(...args: Parameters<InstanceType<typeof WorkspacePlatformProvider>['quit']>) {
                  // Only honour a quit request that originated from the dock's
                  // explicit quit action — ignore quits triggered automatically
                  // when the last editor window is closed.
                  if (!dock.isQuitting()) return;
                  return super.quit(...args);
                }
              }
              return new SternPlatformProvider();
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

      setStatusMessage('Waiting for platform API...');

      // Wait for platform-api-ready
      try {
        const platform = fin.Platform.getCurrentSync();

        platform.once('platform-api-ready', async () => {
          try {
            // Small delay for workspace APIs to fully initialize
            await new Promise((resolve) => setTimeout(resolve, 500));

            setStatusMessage('Registering dock...');

            const items = getDefaultMenuItems();

            // Register dock
            if (dock.isDockAvailable()) {
              try {
                await dock.register({
                  id: 'stern-reference-platform',
                  title: 'Stern Reference Platform',
                  icon: pngIcon,
                  menuItems: items,
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

            // Hide provider window (user can re-show via Tools > Toggle Provider Window)
            const providerWindow = fin.Window.getCurrentSync();
            await providerWindow.hide();

            // Handle close — hide the dock editor window rather than quitting.
            // A full quit only happens when dock.isQuitting() is true (triggered
            // by the explicit Quit action in the dock).
            providerWindow.on('close-requested', async () => {
              if (dock.isQuitting()) {
                await providerWindow.close(true);
                return;
              }

              // User clicked the X on the Dock Editor — just hide it.
              try {
                await providerWindow.hide();
              } catch { /* ignore */ }
            });

            setMenuItems(items);
            setStatus('ready');
            setStatusMessage('Ready');
          } catch (error) {
            console.error('[Provider] Failed to register workspace components', error);
            setStatus('error');
            setStatusMessage('Error registering dock');
          }
        });
      } catch (platformError) {
        console.error('[Provider] Failed to get platform', platformError);
      }

      setStatusMessage('Platform initialized');
      return analyticsErrorHandler;
    } catch (error) {
      console.error('[Provider] Failed to initialize platform', error);
      setStatus('error');
      setStatusMessage('Initialization failed');
      return () => {};
    }
  }

  const handleItemsChange = useCallback((items: DockMenuItem[]) => {
    setMenuItems(items);
  }, []);

  // Show configurator when ready or in browser preview mode
  if (status === 'ready' || status === 'no-openfin') {
    return (
      <div className="h-screen w-screen flex flex-col bg-background text-foreground">
        {/* Minimal status bar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card text-xs text-muted-foreground">
          <span>Stern Reference Platform</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {status === 'no-openfin' ? 'Preview Mode' : 'Connected'}
          </span>
        </div>

        {/* Dock Configurator */}
        <div className="flex-1 overflow-hidden">
          <DockConfigurator
            initialItems={menuItems}
            onItemsChange={handleItemsChange}
            onApply={(items) => dock.updateConfig({ menuItems: items })}
          />
        </div>
      </div>
    );
  }

  // Loading / error state
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        {status === 'error' ? (
          <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-destructive text-lg">!</span>
          </div>
        ) : (
          <div className="h-12 w-12 mx-auto mb-4 rounded-full border-[3px] border-muted border-t-primary animate-spin" />
        )}
        <h1 className="text-lg font-semibold mb-1">Stern Reference Platform</h1>
        <p className="text-sm text-muted-foreground">{statusMessage}</p>
      </div>
    </div>
  );
}
