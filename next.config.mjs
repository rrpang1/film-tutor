// Fully static: `next build` writes the whole app to out/.
// NEXT_PUBLIC_BASE_PATH is set by the GitHub Pages workflow (e.g. "/film-tutor").
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
export default {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};
