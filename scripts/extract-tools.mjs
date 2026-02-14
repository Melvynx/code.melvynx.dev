import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import * as cheerio from "cheerio";

const SOURCE_DIR =
  process.argv[2] ||
  join(
    process.env.HOME,
    "Developer/experiments/ide/ai-coding-tools"
  );
const OUTPUT_DIR = join(process.cwd(), "content/tools");

const FILE_MAP = {
  "claudecode.html": { slug: "claude-code", version: "v1", order: 1 },
  "claudecode-v2.html": { slug: "claude-code", version: "v2", order: 2 },
  "cursor.html": { slug: "cursor", version: "v1", order: 3 },
  "codex.html": { slug: "codex", version: "cli", order: 4 },
  "codex-v1.html": { slug: "codex", version: "v1", order: 5 },
  "codex-v2.html": { slug: "codex", version: "v2", order: 6 },
  "droid.html": { slug: "droid", version: "v1", order: 7 },
  "antigravity.html": { slug: "antigravity", version: "v1", order: 8 },
};

function extractMetadata($) {
  const title = $("title").text().trim();
  const heroBadge = $(".hero-badge").first().text().trim();
  const heroTitle = $(".hero h1").first().text().trim();
  const heroDesc = $(".hero p").first().text().trim();

  const stats = [];
  $(".card-grid.card-grid-4 .card, .card-grid.card-grid-3 .card")
    .first()
    .parent()
    .find(".card")
    .each((_, el) => {
      const value =
        $(el).find(".metric").text().trim() ||
        $(el).find("div[style*='font-size: 32px']").text().trim();
      const label =
        $(el).find(".metric-label").text().trim() ||
        $(el).find("p").first().text().trim();
      if (value && label) {
        stats.push({ value, label });
      }
    });

  const metaTags = {};
  $(".callout .tag").each((_, el) => {
    const key = $(el).text().trim();
    const parent = $(el).parent();
    const fullText = parent.text().trim();
    const afterTag = fullText
      .split(key)
      .slice(1)
      .join(key)
      .split("·")[0]
      .trim();
    if (key && afterTag) {
      metaTags[key.toLowerCase()] = afterTag;
    }
  });

  return {
    title,
    organization: heroBadge,
    name: heroTitle,
    description: heroDesc,
    stats,
    metaTags,
  };
}

function extractTools($) {
  const tools = [];

  $("section#tools table, section#tooling table, section#core-tools table").each((_, table) => {
    $(table)
      .find("tbody tr, tr:not(:first-child)")
      .each((_, row) => {
        const cells = $(row).find("td");
        if (cells.length >= 2) {
          const name =
            $(cells[0]).find("strong, code").text().trim() ||
            $(cells[0]).text().trim();
          const description = $(cells[1]).text().trim();
          const type =
            cells.length >= 3
              ? $(cells[2]).find(".tag").text().trim() ||
                $(cells[2]).text().trim()
              : "";
          if (name && !name.includes("Tool")) {
            tools.push({ name, description, type });
          }
        }
      });
  });

  return tools;
}

function extractSections($) {
  const sections = [];

  $("section").each((_, section) => {
    const $section = $(section);
    const id = $section.attr("id") || "";
    const heading = $section.find("h2").first().text().trim();

    const subsections = [];
    $section.find("h3").each((_, h3) => {
      const subTitle = $(h3).text().trim();
      const content = [];
      let current = $(h3).next();
      while (current.length && !current.is("h3") && !current.is("h2")) {
        if (current.is("div.callout")) {
          content.push({
            type: "callout",
            variant:
              current
                .attr("class")
                ?.replace("callout", "")
                .replace("callout-", "")
                .trim() || "default",
            html: current.html()?.trim() || "",
          });
        } else if (current.is("div.table-wrap") || current.find("table").length) {
          const rows = [];
          const headers = [];
          current.find("th").each((_, th) => headers.push($(th).text().trim()));
          current.find("tbody tr, tr:not(:first-child)").each((_, tr) => {
            if ($(tr).find("th").length) return;
            const cells = [];
            $(tr)
              .find("td")
              .each((_, td) => cells.push($(td).text().trim()));
            if (cells.length) rows.push(cells);
          });
          if (headers.length || rows.length) {
            content.push({ type: "table", headers, rows });
          }
        } else if (current.is("div.card-grid")) {
          const cards = [];
          current.find(".card").each((_, card) => {
            const cardTitle =
              $(card).find("h4").text().trim() ||
              $(card).find("h5").text().trim();
            const cardDesc = $(card).find("p").text().trim();
            const cardIcon = $(card).find(".card-icon").text().trim();
            cards.push({
              title: cardTitle,
              description: cardDesc,
              icon: cardIcon,
            });
          });
          content.push({ type: "cards", cards });
        } else if (current.is("div.flow")) {
          const steps = [];
          current.find(".flow-step").each((_, step) => {
            const num = $(step).find(".flow-num").text().trim();
            const title = $(step).find("h5").text().trim();
            const desc = $(step).find("p").text().trim();
            steps.push({ num, title, description: desc });
          });
          content.push({ type: "flow", steps });
        } else if (current.is("p")) {
          content.push({ type: "text", html: current.html()?.trim() || "" });
        }
        current = current.next();
      }
      subsections.push({ title: subTitle, content });
    });

    const directContent = [];

    const firstCallout = $section.find("> .callout").first();
    if (firstCallout.length) {
      directContent.push({
        type: "callout",
        variant:
          firstCallout
            .attr("class")
            ?.replace("callout", "")
            .replace("callout-", "")
            .trim() || "default",
        html: firstCallout.html()?.trim() || "",
      });
    }

    const firstP = $section.find("> p").first();
    if (firstP.length) {
      directContent.push({
        type: "text",
        html: firstP.html()?.trim() || "",
      });
    }

    $section.find("> .card-grid").each((_, grid) => {
      const cards = [];
      $(grid)
        .find(".card")
        .each((_, card) => {
          const cardTitle =
            $(card).find("h4").text().trim() ||
            $(card).find("h5").text().trim();
          const cardDesc = $(card).find("p").text().trim();
          const cardIcon = $(card).find(".card-icon").text().trim();
          cards.push({
            title: cardTitle,
            description: cardDesc,
            icon: cardIcon,
          });
        });
      directContent.push({ type: "cards", cards });
    });

    $section.find("> .table-wrap, > table").each((_, table) => {
      const headers = [];
      const rows = [];
      $(table)
        .find("th")
        .each((_, th) => headers.push($(th).text().trim()));
      $(table)
        .find("tbody tr, tr:not(:first-child)")
        .each((_, tr) => {
          if ($(tr).find("th").length) return;
          const cells = [];
          $(tr)
            .find("td")
            .each((_, td) => cells.push($(td).text().trim()));
          if (cells.length) rows.push(cells);
        });
      if (headers.length || rows.length) {
        directContent.push({ type: "table", headers, rows });
      }
    });

    $section.find("> .flow").each((_, flow) => {
      const steps = [];
      $(flow)
        .find(".flow-step")
        .each((_, step) => {
          const num = $(step).find(".flow-num").text().trim();
          const title = $(step).find("h5").text().trim();
          const desc = $(step).find("p").text().trim();
          steps.push({ num, title, description: desc });
        });
      directContent.push({ type: "flow", steps });
    });

    $section.find("> .comparison").each((_, comp) => {
      const columns = [];
      $(comp)
        .find(".comparison-col")
        .each((_, col) => {
          const colTitle = $(col).find("h4").text().trim();
          const items = [];
          $(col)
            .find("li")
            .each((_, li) => items.push($(li).text().trim()));
          columns.push({ title: colTitle, items });
        });
      directContent.push({ type: "comparison", columns });
    });

    if (heading) {
      sections.push({
        id,
        title: heading,
        content: directContent,
        subsections,
      });
    }
  });

  return sections;
}

function extractSidebarNav($) {
  const links = [];
  $(".sidebar nav a").each((_, a) => {
    links.push({
      href: $(a).attr("href") || "",
      label: $(a).text().trim(),
      indent: $(a).hasClass("indent"),
    });
  });
  return links;
}

function processFile(filename, config) {
  const filepath = join(SOURCE_DIR, filename);
  const html = readFileSync(filepath, "utf-8");
  const $ = cheerio.load(html);

  const metadata = extractMetadata($);
  const tools = extractTools($);
  const sections = extractSections($);
  const sidebarNav = extractSidebarNav($);

  return {
    slug: config.slug,
    version: config.version,
    order: config.order,
    sourceFile: filename,
    metadata,
    tools,
    sections,
    sidebarNav,
  };
}

function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = readdirSync(SOURCE_DIR).filter((f) => f.endsWith(".html"));
  const allTools = {};

  for (const file of files) {
    const config = FILE_MAP[file];
    if (!config) {
      console.log(`Skipping unknown file: ${file}`);
      continue;
    }

    console.log(`Processing: ${file} → ${config.slug}/${config.version}`);
    const data = processFile(file, config);

    if (!allTools[config.slug]) {
      allTools[config.slug] = {
        slug: config.slug,
        name: data.metadata.name,
        organization: data.metadata.organization,
        versions: [],
      };
    } else if (config.version === "v1") {
      allTools[config.slug].name = data.metadata.name;
      allTools[config.slug].organization = data.metadata.organization;
    }

    allTools[config.slug].versions.push(data);
  }

  for (const [slug, tool] of Object.entries(allTools)) {
    tool.versions.sort((a, b) => a.order - b.order);

    const toolDir = join(OUTPUT_DIR, slug);
    mkdirSync(toolDir, { recursive: true });

    for (const version of tool.versions) {
      const versionFile = join(toolDir, `${version.version}.json`);
      writeFileSync(versionFile, JSON.stringify(version, null, 2));
      console.log(`  Wrote: ${versionFile}`);
    }
  }

  const index = Object.values(allTools).map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    organization: tool.organization,
    versions: tool.versions.map((v) => ({
      version: v.version,
      name: v.metadata.name,
      description: v.metadata.description,
      stats: v.metadata.stats,
      toolCount: v.tools.length,
    })),
  }));

  writeFileSync(
    join(OUTPUT_DIR, "index.json"),
    JSON.stringify(index, null, 2)
  );
  console.log(`\nWrote index.json with ${index.length} tools`);
  console.log("Done!");
}

main();
