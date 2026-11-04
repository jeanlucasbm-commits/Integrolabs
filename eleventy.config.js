/* ==========================================================================
   Eleventy — genera el blog a partir de Markdown.

   Las páginas que ya existían (index.html, paginas-web.html, legal.html) NO se
   procesan: se copian tal cual al sitio final. Eleventy solo convierte en HTML
   los artículos de blog/posts/*.md, el índice del blog y el sitemap.
   ========================================================================== */

const SITE_URL = "https://www.integrolabs.lat";

export default function (eleventyConfig) {
  /* --- Archivos que se copian sin tocar --- */
  eleventyConfig.addPassthroughCopy("*.html");
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("robots.txt");

  /* --- Lo que Eleventy nunca debe leer como plantilla --- */
  eleventyConfig.ignores.add("README.md");
  eleventyConfig.ignores.add("node_modules/**");
  eleventyConfig.ignores.add("admin/**");

  /* --- Colección de artículos, del más reciente al más antiguo --- */
  eleventyConfig.addCollection("posts", (api) =>
    api
      .getFilteredByGlob("blog/posts/*.md")
      .filter((p) => !p.data.eleventyExcludeFromCollections)
      .sort((a, b) => b.date - a.date)
  );

  /* --- Filtros de fecha y URL --- */
  const fmtLong = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  eleventyConfig.addFilter("fechaLarga", (d) => fmtLong.format(new Date(d)));
  eleventyConfig.addFilter("fechaISO", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("absoluta", (path) => (path && path.startsWith("http") ? path : SITE_URL + (path || "/")));
  eleventyConfig.addFilter("minutosLectura", (content) => {
    const words = String(content || "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 220));
  });

  eleventyConfig.addGlobalData("site", {
    url: SITE_URL,
    name: "IntegroLabs",
    /* En producción los borradores no se publican; en previews y en local sí. */
    isProduction: process.env.VERCEL_ENV === "production",
  });

  return {
    dir: { input: ".", includes: "_includes", output: "_site" },
    templateFormats: ["md", "njk"],
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
}
