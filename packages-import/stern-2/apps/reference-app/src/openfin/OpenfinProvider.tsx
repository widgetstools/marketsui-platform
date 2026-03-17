import { useState, useEffect, useRef } from 'react';
import { init } from '@openfin/workspace-platform';
import type { WorkspacePlatformOverrideCallback } from '@openfin/workspace-platform';
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

function getDefaultMenuItems(): DockMenuItem[] {
  return [
    createMenuItem({ id: 'orders-blotter',    caption: 'Orders Blotter',    url: '/blotter/orders',    openMode: 'view', order: 0 }),
    createMenuItem({ id: 'fills-blotter',     caption: 'Fills Blotter',     url: '/blotter/fills',     openMode: 'view', order: 1 }),
    createMenuItem({ id: 'positions-blotter', caption: 'Positions Blotter', url: '/blotter/positions', openMode: 'view', order: 2 }),
  ];
}

/**
 * OpenfinProvider — platform provider loaded at /platform/provider.
 *
 * The provider window stays hidden at all times in OpenFin.
 * The Dock Editor is a separate fin.Window at /dock-editor that communicates
 * with this provider via IAB:
 *   stern:dock-editor:request-config → provider responds with current menu items
 *   stern:dock-editor:apply          → provider applies updated menu items to dock
 */
export default function OpenfinProvider() {
  const isInitialized = useRef(false);
  const [status, setStatus] = useState<'initializing' | 'ready' | 'error' | 'no-openfin'>('initializing');
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  const [menuItems, setMenuItems] = useState<DockMenuItem[]>(getDefaultMenuItems);
  // Ref keeps IAB handlers from capturing stale state.
  const menuItemsRef = useRef<DockMenuItem[]>(menuItems);
  useEffect(() => { menuItemsRef.current = menuItems; }, [menuItems]);

  useEffect(() => {
    let analyticsErrorHandler: ((event: PromiseRejectionEvent) => void) | null = null;

    if (typeof window !== 'undefined' && window.fin && !isInitialized.current) {
      isInitialized.current = true;
      const doInit = async () => { analyticsErrorHandler = await initializePlatform(); };
      doInit();
    } else if (typeof window !== 'undefined' && !window.fin) {
      setStatus('no-openfin');
      setStatusMessage('Not in OpenFin environment — preview mode');
    }

    return () => {
      if (analyticsErrorHandler) {
        window.removeEventListener('unhandledrejection', analyticsErrorHandler);
      }
    };
  }, []);

  async function initializePlatform(): Promise<(event: PromiseRejectionEvent) => void> {
    try {
      const analyticsErrorHandler = (event: PromiseRejectionEvent) => {
        if (
          event.reason?.message?.includes('system topic payload') ||
          event.reason?.message?.includes('registerUsage')
        ) {
          event.preventDefault();
        }
      };
      window.addEventListener('unhandledrejection', analyticsErrorHandler);

      await initializeBaseUrlFromManifest();

      try {
        const app = await fin.Application.getCurrent();
        const manifest = await app.getManifest() as any;
        const apiUrl = manifest?.platform?.defaultWindowOptions?.customData?.platformContext?.apiUrl;
        if (apiUrl) {
          dataProviderConfigService.configure({ apiUrl });
        }
      } catch { /* ignore — apiUrl defaults will be used */ }

      const icon    = buildUrl('/star.svg');
      const pngIcon = buildUrl('/star.png');

      setStatusMessage('Initializing workspace platform...');

      try {
        // ---------------------------------------------------------------
        // overrideCallback must be at the TOP LEVEL of init() per the
        // OpenFin workspace-starter reference implementation.
        //
        // closeWindow: close the window directly without cascading into
        //   the "last window → auto-quit" logic, so editor windows can
        //   be closed without tearing down the platform.
        //
        // quit: suppress auto-quit that originates from closeWindow;
        //   allow all explicit quit requests (dock "Close Platform",
        //   our custom quit action, etc.).
        // ---------------------------------------------------------------
        let closingWindowCount = 0;
        const overrideCallback: WorkspacePlatformOverrideCallback = async (WorkspacePlatformProvider) => {
          class SternPlatformProvider extends WorkspacePlatformProvider {
            async closeWindow(
              ...args: Parameters<InstanceType<typeof WorkspacePlatformProvider>['closeWindow']>
            ) {
              closingWindowCount++;
              try {
                return await super.closeWindow(...args);
              } finally {
                closingWindowCount--;
              }
            }

            async quit(
              ...args: Parameters<InstanceType<typeof WorkspacePlatformProvider>['quit']>
            ) {
              if (closingWindowCount > 0) {
                // Triggered by the workspace platform auto-quitting after the last
                // browser window closed — suppress so the dock stays alive.
                return;
              }
              // Explicit quit (dock "Close Platform", our quit action, etc.)
              dock.setQuitting();
              return super.quit(...args);
            }
          }
          return new SternPlatformProvider();
        };

        await init({
          browser: {
            defaultWindowOptions: {
              icon,
              workspacePlatform: { pages: [], favicon: icon },
            },
          },
          theme: [{
            label: 'Stern Theme',
            default: 'dark',
            palettes: THEME_PALETTES as any,
          }],
          customActions: dock.dockGetCustomActions(),
          overrideCallback,
        } as any);
      } catch (initError: unknown) {
        const error = initError as Error;
        if (error?.message?.includes('system topic payload')) {
          console.warn('[Provider] Analytics error during init (non-fatal)');
        } else {
          throw error;
        }
      }

      setStatusMessage('Waiting for platform API...');

      try {
        const platform = fin.Platform.getCurrentSync();

        platform.once('platform-api-ready', async () => {
          try {
            await new Promise((resolve) => setTimeout(resolve, 500));

            setStatusMessage('Registering dock...');

            const items = getDefaultMenuItems();

            if (dock.isDockAvailable()) {
              try {
                await dock.register({
                  id: 'stern-reference-platform',
                  title: 'Stern Reference Platform',
                  icon: pngIcon,
                  menuItems: items,
                });
              } catch (dockError: any) {
                if (dockError?.message?.includes('system topic payload')) {
                  console.warn('[Provider] Dock registered (analytics error suppressed)');
                } else {
                  throw dockError;
                }
              }

              await dock.show();
            }

            // ------------------------------------------------------------------
            // Keep the provider window permanently hidden. It is never shown
            // to the user directly — the Dock Editor is a separate fin.Window.
            // ------------------------------------------------------------------
            const providerWindow = fin.Window.getCurrentSync();
            await providerWindow.hide();

            // Per workspace-starter pattern: use .once() and always close when
            // close-requested fires. At this point dock.isQuitting() is true
            // because our quit() override sets it before calling super.quit().
            providerWindow.once('close-requested', async () => {
              try { await dock.deregister(); } catch { /* ignore */ }
              try { await providerWindow.close(true); } catch { /* ignore */ }
            });

            // ------------------------------------------------------------------
            // IAB: serve the Dock Editor window with the current menu items
            // and apply config changes it sends back.
            // ------------------------------------------------------------------
            await fin.InterApplicationBus.subscribe(
              { uuid: fin.me.uuid },
              'stern:dock-editor:request-config',
              async () => {
                await fin.InterApplicationBus.publish(
                  'stern:dock-editor:config',
                  { menuItems: menuItemsRef.current },
                );
              },
            );

            await fin.InterApplicationBus.subscribe(
              { uuid: fin.me.uuid },
              'stern:dock-editor:apply',
              async (_sender: unknown, data: { menuItems: DockMenuItem[] }) => {
                await dock.updateConfig({ menuItems: data.menuItems });
                setMenuItems(data.menuItems);
              },
            );

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

  // In OpenFin the provider window is always hidden — this UI is only
  // reached in browser preview mode (status === 'no-openfin').
  if (status === 'no-openfin') {
    return (
      <div className="h-screen w-screen flex flex-col bg-background text-foreground">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card text-xs text-muted-foreground">
          <span>Stern Reference Platform</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
            Preview Mode
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <DockConfigurator
            initialItems={menuItems}
            onApply={async () => {}}
          />
        </div>
      </div>
    );
  }

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
