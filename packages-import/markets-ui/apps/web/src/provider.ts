import { connect, type WebLayoutSnapshot } from "@openfin/core-web";
import { BROKER_URL, LAYOUT_URL } from "./config.ts";

async function getDefaultLayout(): Promise<WebLayoutSnapshot> {
  const layoutResponse = await fetch(LAYOUT_URL);
  const layoutJson = (await layoutResponse.json()) as WebLayoutSnapshot;
  return layoutJson;
}

export async function init(): Promise<void> {
  const layoutSnapshot = await getDefaultLayout();

  if (layoutSnapshot === undefined) {
    console.error("Unable to load the default snapshot.");
    return;
  }

  const layoutContainer = document.querySelector<HTMLElement>("#layout_container");
  if (layoutContainer === null) {
    console.error(
      "Please ensure the document has an element with the following id #layout_container so that the web-layout can be applied.",
    );
    return;
  }

  const fin = await connect({
    connectionInheritance: "enabled",
    options: {
      brokerUrl: BROKER_URL,
      interopConfig: {
        providerId: "web-layout-basic",
        currentContextGroup: "green",
      },
    },
    platform: { layoutSnapshot },
  });

  await fin.Interop.init("web-layout-basic");
  await fin.Platform.Layout.init({
    container: layoutContainer,
  });
}
