import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  // The dev server writes to its own directory.
  //
  // A production build and a running dev server otherwise share `.next`, and
  // a build replaces that directory while the dev server is still reading it.
  // The browser then asks for a chunk that no longer exists, the component
  // that was waiting on it never finishes, and React reports a suspension
  // mismatch that has nothing to do with the code. Separate directories mean
  // `npm run build` cannot disturb the dev server.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  images: {
    // The deployed Worker transforms the images with Cloudflare's image
    // service (the `IMAGES` binding), so the original file is what the
    // browser receives only when there is nothing to gain from it.
    //
    // SVG is the demo artwork, and Cloudflare returns SVG unchanged — but it
    // has to be allowed through, or every demo image would be refused.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; frame-src 'none'; sandbox;",
    // The local Supabase runs on 127.0.0.1 and Next refuses to optimise an
    // image from a private address. The hosts that can be optimised at all
    // are still limited by `remotePatterns`, so this does not open the door
    // to any other address.
    dangerouslyAllowLocalIP: true,
    // Supabase Storage serves public preview images from the project host.
    remotePatterns: supabaseUrl
      ? [
          {
            // The local stack is http, a hosted project is https.
            protocol: new URL(supabaseUrl).protocol.replace(
              ":",
              "",
            ) as "http" | "https",
            hostname: new URL(supabaseUrl).hostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  experimental: {
    serverActions: {
      // The project brief can carry a reference file of up to 10 MB. The
      // limit covers the whole multipart body, so it is set above the file
      // limit to leave room for the part headers.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
