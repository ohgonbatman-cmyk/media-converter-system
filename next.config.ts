import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { nextRuntime, webpack }) => {
    // @cloudflare/next-on-pages requires `runtime = "edge"` on all routes.
    // However, webpack's Edge Runtime bundle generates `c.b = document.baseURI || self.location.href`
    // for chunk loading. During Next.js's "Collecting page data" build phase, this code executes
    // in a Node.js environment where `document` is undefined, causing ReferenceError.
    //
    // This plugin patches the compiled Edge Runtime output to add a typeof guard,
    // so the expression safely falls back to `self.location.href`.
    if (nextRuntime === "edge") {
      config.plugins.push({
        apply(compiler: any) {
          compiler.hooks.compilation.tap(
            "PatchEdgeDocumentBaseURI",
            (compilation: any) => {
              compilation.hooks.processAssets.tap(
                {
                  name: "PatchEdgeDocumentBaseURI",
                  stage:
                    webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
                },
                (assets: Record<string, any>) => {
                  for (const [name, source] of Object.entries(assets)) {
                    const content = source.source();
                    if (
                      typeof content === "string" &&
                      content.includes("document.baseURI")
                    ) {
                      const patched = content.replace(
                        /document\.baseURI\s*\|\|\s*self\.location\.href/g,
                        '(typeof document!=="undefined"&&document.baseURI||typeof self!=="undefined"&&self.location&&self.location.href||"")'
                      );
                      compilation.updateAsset(
                        name,
                        new webpack.sources.RawSource(patched)
                      );
                    }
                  }
                }
              );
            }
          );
        },
      });
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
