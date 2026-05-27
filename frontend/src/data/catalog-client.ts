import type {
    CatalogCategoryListResponse,
    CatalogCategoryPreviewResponse,
    CatalogDrillListResponse,
} from "./catalog-types";

const API_BASE_URL =
    import.meta.env.PUBLIC_API_BASE_URL ?? "http://192.168.1.113:8080";

export function fetchCatalogCategories(trackSlug: string) {
    return catalogFetch<CatalogCategoryListResponse>(
        `/catalog/${encodeURIComponent(trackSlug)}/categories`,
    );
}

export function fetchCatalogCategoryPreview(
    trackSlug: string,
    categorySlug: string,
) {
    return catalogFetch<CatalogCategoryPreviewResponse>(
        `/catalog/${encodeURIComponent(trackSlug)}/categories/${encodeURIComponent(categorySlug)}/preview`,
    );
}

export function fetchCatalogDrills(trackSlug: string, categorySlug: string) {
    return catalogFetch<CatalogDrillListResponse>(
        `/catalog/${encodeURIComponent(trackSlug)}/categories/${encodeURIComponent(categorySlug)}/drills`,
    );
}

async function catalogFetch<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`);

    if (!response.ok) {
        throw new Error(`Catalog request failed: ${response.status}`);
    }

    return (await response.json()) as T;
}
