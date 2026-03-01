"use client";

import { HeroSection as Hero } from "@/components/hero-section/hero-section"
import { ProductCollection } from "@/components/product-collection/product-collection"
import { CategoryGrid } from "@/components/category-grid/category-grid"
import { ProductListPage as ProductCollectionList } from "@/components/product-list-page/product-list-page"
import { EditPencilWrapper } from "@/components/amplience/edit-pencil-wrapper"

export const componentMapping = {
  Hero,
  ProductCollection,
  CategoryGrid,
  ProductCollectionList
};

/** Block types that show the pencil edit button when ?vse= or ?cse= is in the URL */
const EDITABLE_BLOCK_TYPES = ["Hero", "ProductCollection", "CategoryGrid"];

/** Human-readable labels for the edit button */
const BLOCK_LABELS = {
  Hero: "banner",
  ProductCollection: "call to actions / teasers",
  CategoryGrid: "categories",
};

export const ModelManager = ({ content, config }) => {
  const type = content._model.title && content._model.title.replace(/ /g, '');
  const Component = componentMapping[type];

  if (typeof Component === 'undefined') {
    return <p>Neet to add {type} to ModelManager.</p>;
  }

  const isEditable = EDITABLE_BLOCK_TYPES.includes(content._model?.title || "");
  const label = BLOCK_LABELS[content._model?.title] || type;
  const aemPath = content?._path;
  const aemEditorUrl = config?.env && aemPath
    ? `${config.env.replace(/\/$/, "")}/editor.html${aemPath.startsWith("/") ? aemPath : `/${aemPath}`}`
    : null;

  const wrapped = (
    <Component content={content} config={config} />
  );

  if (isEditable && aemEditorUrl) {
    return (
      <EditPencilWrapper href={aemEditorUrl} label={label}>
        {wrapped}
      </EditPencilWrapper>
    );
  }

  return wrapped;
};
