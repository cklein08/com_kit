"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { capitalize } from "@/lib/utils";

const PRICE_LABELS = {
  "0-20": "$0 - $19.99",
  "20-50": "$20 - $49.99",
  "50-100": "$50 - $99.99",
  "100-500": "$100 - $499",
  "500+": "$500+",
};

function FacetSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="plp-facet-section">
      <button
        type="button"
        className="plp-facet-section-header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="plp-facet-section-title">{title}</span>
        {open ? (
          <ChevronUp className="plp-facet-section-icon" />
        ) : (
          <ChevronDown className="plp-facet-section-icon" />
        )}
      </button>
      {open && <div className="plp-facet-section-content">{children}</div>}
    </div>
  );
}

function FacetCheckbox({ id, label, count, checked, onChange }) {
  return (
    <label className="plp-facet-option">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange(!checked)}
        aria-label={`${label} (${count})`}
      />
      <span className="plp-facet-option-label">{label}</span>
      {count > 0 && <span className="plp-facet-option-count">({count})</span>}
    </label>
  );
}

export function PlpFacets({
  facets,
  selectedCategory,
  selectedColors,
  selectedSizes,
  selectedPriceRange,
  onCategoryChange,
  onColorChange,
  onSizeChange,
  onPriceRangeChange,
}) {
  const hasFacets = facets && (
    (facets.category?.length > 0) ||
    (facets.color?.length > 0) ||
    (facets.size?.length > 0) ||
    (facets.price?.some((p) => p.count > 0))
  );

  return (
    <aside className="plp-facets">
      {hasFacets && facets?.category?.length > 0 && (
        <FacetSection title="Category">
          <FacetCheckbox
            id="facet-cat-all"
            label="All Categories"
            count={facets.category.reduce((s, c) => s + c.count, 0)}
            checked={selectedCategory === "all"}
            onChange={() => onCategoryChange("all")}
          />
          {facets.category.map(({ value, count }) => (
            <FacetCheckbox
              key={value}
              id={`facet-cat-${value}`}
              label={capitalize(value)}
              count={count}
              checked={selectedCategory === value}
              onChange={(checked) => onCategoryChange(checked ? value : "all")}
            />
          ))}
        </FacetSection>
      )}

      {facets?.color?.length > 0 && (
        <FacetSection title="Shop by Color">
          {facets.color.map(({ value, count }) => (
            <FacetCheckbox
              key={value}
              id={`facet-color-${value}`}
              label={capitalize(value)}
              count={count}
              checked={selectedColors.includes(value)}
              onChange={(checked) =>
                onColorChange(
                  checked
                    ? [...selectedColors, value]
                    : selectedColors.filter((c) => c !== value)
                )
              }
            />
          ))}
        </FacetSection>
      )}

      {facets?.price?.length > 0 && (
        <FacetSection title="Shop by Price">
          {facets.price
            .filter((p) => p.count > 0)
            .map(({ from, to, count }) => {
              const key =
                to === Infinity ? "500+" : `${from}-${to}`;
              const label = PRICE_LABELS[key] || `$${from} - $${to}`;
              return (
                <FacetCheckbox
                  key={key}
                  id={`facet-price-${key}`}
                  label={label}
                  count={count}
                  checked={selectedPriceRange === key}
                  onChange={(checked) =>
                    onPriceRangeChange(checked ? key : null)
                  }
                />
              );
            })}
        </FacetSection>
      )}

      {facets?.size?.length > 0 && (
        <FacetSection title="Shop by Size">
          {facets.size.map(({ value, count }) => (
            <FacetCheckbox
              key={value}
              id={`facet-size-${value}`}
              label={value}
              count={count}
              checked={selectedSizes.includes(value)}
              onChange={(checked) =>
                onSizeChange(
                  checked
                    ? [...selectedSizes, value]
                    : selectedSizes.filter((s) => s !== value)
                )
              }
            />
          ))}
        </FacetSection>
      )}
    </aside>
  );
}
