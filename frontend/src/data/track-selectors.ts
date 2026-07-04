export const selectorCategories = [
    {
        slug: "domain-drills",
        label: "01",
        name: "Domain drills",
        path: "/by-domain",
        description: "One full domain per drill.",
        meta: "domain view",
    },
    {
        slug: "section-drills",
        label: "02",
        name: "Section drills",
        path: "/by-section",
        description: "One blueprint section per drill.",
        meta: "section view",
    },
    {
        slug: "topic-drills",
        label: "03",
        name: "Topic drills",
        path: "/by-topic",
        description: "Focused topics that cut across sections.",
        meta: "topic view",
    },
    {
        slug: "skill-sets",
        label: "04",
        name: "Skill sets",
        path: "/skill",
        description: "Repeatable exam moves, drilled for speed.",
        meta: "skill view",
    },
    {
        slug: "mixed-reviews",
        label: "05",
        name: "Mixed reviews",
        path: "/review",
        description: "Blueprint-weighted mixes from all six domains.",
        meta: "review view",
    },
    {
        slug: "exams",
        label: "06",
        name: "Practice exams",
        path: "/exam",
        description: "Timed forms for pacing and readiness.",
        meta: "exam view",
    },
] as const;

export const trackSelectors = {
    ccna: {
        slug: "ccna",
        name: "CCNA",
        switchName: "CCNA",
        switchMeta: "200-301",
        title: "ccna",
        description:
            "Each category slices the same question bank differently.",
        branch: "ccna/select",
        statusLabel: "ccna",
        domains: [
            { number: "1.0", name: "Network fundamentals", share: "20%", width: 80 },
            { number: "2.0", name: "Network access", share: "20%", width: 80 },
            { number: "3.0", name: "IP connectivity", share: "25%", width: 100 },
            { number: "4.0", name: "IP services", share: "10%", width: 40 },
            { number: "5.0", name: "Security fundamentals", share: "15%", width: 60 },
            { number: "6.0", name: "Automation and programmability", share: "10%", width: 40 },
        ],
    },
    "ccnp-encor": {
        slug: "ccnp-encor",
        name: "CCNP ENCOR",
        switchName: "CCNP",
        switchMeta: "ENCOR 350-401",
        title: "ccnp",
        description:
            "Each category slices the same question bank differently.",
        branch: "ccnp/select",
        statusLabel: "ccnp encor",
        domains: [
            { number: "1.0", name: "Architecture", share: "15%", width: 50 },
            { number: "2.0", name: "Virtualization", share: "10%", width: 33 },
            { number: "3.0", name: "Infrastructure", share: "30%", width: 100 },
            { number: "4.0", name: "Network assurance", share: "10%", width: 33 },
            { number: "5.0", name: "Security", share: "20%", width: 67 },
            { number: "6.0", name: "Automation", share: "15%", width: 50 },
        ],
    },
} as const;

export type TrackSelector = (typeof trackSelectors)[keyof typeof trackSelectors];
export type SelectorCategory = (typeof selectorCategories)[number];
