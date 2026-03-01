"use client";

import { ProductLineEditForm } from "@/components/product-line-edit-form/product-line-edit-form";

export function CarouselEditForm({
  initialConfig,
  contentId,
  onSave,
  onClose,
}) {
  return (
    <ProductLineEditForm
      initialConfig={initialConfig}
      contentId={contentId}
      onSave={onSave}
      onClose={onClose}
      showTitle={true}
      defaultTitle="Running shoes"
      saveSuccessMessage="Carousel updated"
      noContentMessage="Cannot save: no carousel content found. Create a Product Carousel in Amplience with delivery key home/carousel first."
    />
  );
}
