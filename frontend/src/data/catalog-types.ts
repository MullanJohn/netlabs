export type CatalogCategory = {
    slug: string;
};

export type CatalogDrill = {
    slug: string;
    name: string;
    description: string;
    href: string;
    quiz_slug: string | null;
    item_count: number | null;
};

export type CatalogCategoryListResponse = {
    categories: CatalogCategory[];
};

export type CatalogCategoryPreviewResponse = {
    category_slug: string;
    items: CatalogDrill[];
};

export type CatalogDrillListResponse = {
    category_slug: string;
    drills: CatalogDrill[];
};
