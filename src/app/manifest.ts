import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DELIVERSO",
    short_name: "DELIVERSO",
    description: "Un delicioso universo de sabores",
    start_url: "/",
    display: "standalone",
    background_color: "#fff6e9",
    theme_color: "#234166",
    icons: [
      {
        src: "/brand/logos/deliverso-logo-icon-color.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
