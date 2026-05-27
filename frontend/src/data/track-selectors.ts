export const selectorCategories = [
    {
        slug: "domain-drills",
        label: "01",
        name: "Domain drills",
        path: "/by-domain",
        description: "One blueprint domain at a time, from fundamentals through automation.",
        meta: "domain view",
    },
    {
        slug: "section-drills",
        label: "02",
        name: "Section drills",
        path: "/by-section",
        description: "A tighter slice of the blueprint when one section needs attention.",
        meta: "section view",
    },
    {
        slug: "topic-drills",
        label: "03",
        name: "Topic drills",
        path: "/by-topic",
        description: "Focused topic sets for concepts that cut across sections.",
        meta: "topic view",
    },
    {
        slug: "skill-sets",
        label: "04",
        name: "Skill sets",
        path: "/skill",
        description: "Curated practice for repeatable exam moves and fast recognition.",
        meta: "skill view",
    },
    {
        slug: "mixed-reviews",
        label: "05",
        name: "Mixed reviews",
        path: "/review",
        description: "Blueprint-weighted review sets when no single domain is locked in.",
        meta: "review view",
    },
    {
        slug: "exams",
        label: "06",
        name: "Practice exams",
        path: "/exam",
        description: "Timed forms for pacing, endurance, and readiness checks.",
        meta: "exam view",
    },
] as const;

export const trackSelectors = {
    ccna: {
        slug: "ccna",
        name: "CCNA",
        exam: "200-301",
        switchName: "CCNA",
        switchMeta: "200-301",
        summaryName: "CCNA 200-301",
        summary: "The implementing-and-administering blueprint, 6 domains.",
        title: "ccna",
        tag: "six ways in.",
        description:
            "Pick how you want to practice. Every category pulls from the same CCNA bank; only the slicing changes.",
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
        exam: "350-401",
        switchName: "CCNP",
        switchMeta: "ENCOR 350-401",
        summaryName: "CCNP ENCOR 350-401",
        summary: "The enterprise core blueprint, 6 domains.",
        title: "ccnp",
        tag: "encor, six ways in.",
        description:
            "Choose the ENCOR practice path that matches the session: domain review, topic work, skills, or timed exams.",
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
