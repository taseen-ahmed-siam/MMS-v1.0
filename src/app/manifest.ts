import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Al-Noor Mosque",
    short_name: "Al-Noor",
    description: "A place of peace, prayer, and community",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF8F2",
    theme_color: "#064E3B",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
