import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml",
};

const BASE_URL = "https://ramonrentbike.co.il";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Static pages
    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "weekly" },
      { loc: "/booking", priority: "0.9", changefreq: "weekly" },
      { loc: "/rider-info", priority: "0.7", changefreq: "monthly" },
      { loc: "/guest", priority: "0.6", changefreq: "monthly" },
      { loc: "/terms-liability", priority: "0.3", changefreq: "yearly" },
    ];

    // Fetch dynamic content from CMS to get last modified dates
    const { data: siteContent } = await supabase
      .from("site_content")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1);

    const lastModified = siteContent?.[0]?.updated_at 
      ? new Date(siteContent[0].updated_at).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    // Generate XML
    const urls = staticPages.map(page => `
  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

    return new Response(sitemap, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response("Error generating sitemap", { status: 500 });
  }
});
