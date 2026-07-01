import { apiFetch } from "./api-client";
import type {
    CatalogCategoryListResponse,
    CatalogCategoryPreviewResponse,
    CatalogDrillListResponse,
} from "./catalog-types";

export function fetchCatalogCategories(trackSlug: string) {
    return apiFetch<CatalogCategoryListResponse>(
        `/catalog/${encodeURIComponent(trackSlug)}/categories`,
    );
}

export function fetchCatalogCategoryPreview(
    trackSlug: string,
    categorySlug: string,
) {
    return apiFetch<CatalogCategoryPreviewResponse>(
        `/catalog/${encodeURIComponent(trackSlug)}/categories/${encodeURIComponent(categorySlug)}/preview`,
    );
}

export function fetchCatalogDrills(trackSlug: string, categorySlug: string) {
    return apiFetch<CatalogDrillListResponse>(
        `/catalog/${encodeURIComponent(trackSlug)}/categories/${encodeURIComponent(categorySlug)}/drills`,
    );
}
