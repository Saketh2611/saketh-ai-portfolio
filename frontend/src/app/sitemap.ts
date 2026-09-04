import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  try {
    const [projects, experiences] = await Promise.all([
      api.getProjects(),
      api.getExperiences(),
    ]);

    return [
      ...staticRoutes,
      ...projects.map((project) => ({
        url: `${SITE_URL}/projects/${project.id}`,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
      ...experiences.map((experience) => ({
        url: `${SITE_URL}/experiences/${experience.id}`,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}