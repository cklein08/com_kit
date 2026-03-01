/**
 * Central registry of Amplience and AEM components for the component picker.
 * Used by DropZone, ComponentsPanel, and AmplienceWrapper schema mapping.
 */

import { ImageIcon, LayoutGrid } from "lucide-react";

export const PRODUCT_CAROUSEL_SCHEMA = "https://amplience.com/components/product-carousel";
export const TUTORIAL_BANNER_SCHEMA = "https://schema-examples.com/tutorial-banner";

/**
 * Amplience components available for drop zones.
 * @type {Array<{ schemaUri: string, label: string, icon: LucideIcon, contentTypeId?: string, createDefaultBody?: () => object }>}
 */
export const AMPLIENCE_COMPONENTS = [
  {
    schemaUri: TUTORIAL_BANNER_SCHEMA,
    label: "Banner",
    icon: ImageIcon,
    contentTypeId: "tutorial-banner",
    createDefaultBody: () => ({
      headline: { _meta: { schema: "https://schema-examples.com/text" }, text: "New banner" },
      background: { _meta: { schema: "https://schema-examples.com/image" } },
    }),
  },
  {
    schemaUri: PRODUCT_CAROUSEL_SCHEMA,
    label: "Carousel",
    icon: LayoutGrid,
    contentTypeId: "product-carousel",
    createDefaultBody: () => ({
      title: "Featured products",
      productLineType: "search",
      searchPhrase: "",
    }),
  },
];

/**
 * AEM block types (for reference / "Edit in AEM" links).
 * @type {Array<{ modelTitle: string, label: string, editorUrlBuilder?: (config: { env: string, path: string }) => string }>}
 */
export const AEM_BLOCK_TYPES = [
  { modelTitle: "Hero", label: "Hero / Banner" },
  { modelTitle: "ProductCollection", label: "Call to actions / Teasers" },
  { modelTitle: "CategoryGrid", label: "Categories" },
  { modelTitle: "ProductCollectionList", label: "Product List" },
];
