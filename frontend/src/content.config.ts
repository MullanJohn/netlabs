import { defineCollection, z } from "astro:content";
import { labDocsLoader, labGuidesLoader, labsLoader } from "./labs/loader";

const labDocSchema = z.object({
    vendor: z.enum(["cisco", "arista"]),
    slug: z.string(),
    title: z.string(),
});

const labs = defineCollection({
    loader: labsLoader(),
    schema: z.object({
        vendor: z.enum(["cisco", "arista"]),
        slug: z.string(),
        number: z.number(),
        title: z.string(),
        labCode: z.string(),
        difficulty: z.enum(["Foundation", "Advanced", "Expert"]),
        estTime: z.string(),
        estMinutes: z.number(),
        topologySummary: z.string(),
        examMapping: z.string(),
        references: z.string(),
        exams: z.array(z.string()),
        topic: z.string(),
        deviceCount: z.number(),
        hasAnswer: z.boolean(),
        hasExtra: z.boolean(),
        zipUrl: z.string(),
        solutionsZipUrl: z.string().nullable(),
    }),
});

const labSolutions = defineCollection({
    loader: labDocsLoader("ANSWER.md"),
    schema: labDocSchema,
});

const labExtras = defineCollection({
    loader: labDocsLoader("EXTRA.md"),
    schema: labDocSchema,
});

const labGuides = defineCollection({
    loader: labGuidesLoader(),
    schema: z.object({ title: z.string() }),
});

export const collections = { labs, labSolutions, labExtras, labGuides };
