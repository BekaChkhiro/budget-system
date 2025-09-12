import { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// This is the sitemap configuration for the application
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/transactions`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/reports`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/reset-password`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ]

  // Add dynamic routes from the database here in a real application
  // This is a placeholder for demonstration
  // const projects = await fetchProjectsForSitemap()
  // const projectRoutes = projects.map((project) => ({
  //   url: `${baseUrl}/projects/${project.id}`,
  //   lastModified: project.updatedAt,
  //   changeFrequency: 'weekly',
  //   priority: 0.8,
  // }))

  // return [...routes, ...projectRoutes]
  
  return routes
}

// Example function to fetch projects for the sitemap
// This is a placeholder and should be implemented based on your data fetching logic
// async function fetchProjectsForSitemap() {
//   // Implementation depends on your data fetching method
//   return []
// }
