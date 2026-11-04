/* Datos compartidos por todos los artículos de blog/posts/.
   - Layout y URL: /blog/<nombre-del-archivo>/
   - Borradores (published: false, o el antiguo draft: true): en producción tienen su URL para revisarlos
     (con noindex), pero NO aparecen en el listado del blog ni en el sitemap. */
export default {
  layout: "post.njk",
  eleventyComputed: {
    draft: (data) => data.published === false || data.draft === true,
    permalink: (data) => `/blog/${data.page.fileSlug}/`,
    eleventyExcludeFromCollections: (data) => Boolean(data.draft && data.site.isProduction),
    jsonLd: (data) => ({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: data.title,
      description: data.description,
      datePublished: data.page.date,
      author: { "@type": "Person", name: data.author || "IntegroLabs" },
      publisher: { "@type": "Organization", name: "IntegroLabs", logo: { "@type": "ImageObject", url: "https://www.integrolabs.lat/assets/logo-integrolabs.png" } },
      mainEntityOfPage: `https://www.integrolabs.lat/blog/${data.page.fileSlug}/`,
      ...(data.image ? { image: data.image.startsWith("http") ? data.image : `https://www.integrolabs.lat${data.image}` } : {}),
    }),
  },
};
