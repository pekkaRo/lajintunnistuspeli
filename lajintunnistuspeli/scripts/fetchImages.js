const fs = require('fs');
const path = require('path');

async function main() {
  const content = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.tsx'), 'utf8');
  const titles = [...new Set([...content.matchAll(/wikiTitle:\s*'([^']+)'/g)].map((m) => m[1]))];

  const results = [];
  for (const title of titles) {
    const result = await fetchDataForTitle(title);
    results.push(result);
    console.log('Fetched', title);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  fs.writeFileSync(path.join(__dirname, 'image-cache.json'), JSON.stringify(results, null, 2));
  console.log('Saved image-cache.json with', results.length, 'entries');
}

async function fetchDataForTitle(title) {
  const normalizedTitle = title.replace(/\s+/g, '_');
  const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(normalizedTitle)}`);
  if (!summaryRes.ok) {
    return { title, error: `summary status ${summaryRes.status}` };
  }

  const summary = await summaryRes.json();
  const data = {
    title,
    src: summary.originalimage?.source || null,
    thumb: summary.thumbnail?.source || summary.originalimage?.source || null,
    descriptionUrl: summary?.content_urls?.desktop?.page || summary?.content_urls?.mobile?.page || null,
    credit: null,
    license: null,
    licenseUrl: null,
    fileName: null
  };

  const sourceForFilename = summary.originalimage?.source || summary.thumbnail?.source;
  if (!sourceForFilename) {
    return data;
  }

  const fileName = decodeURIComponent(sourceForFilename.split('/').pop() || '');
  data.fileName = fileName;

  try {
    const commonsRes = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`
    );

    if (commonsRes.ok) {
      const commonsJson = await commonsRes.json();
      const filePages = commonsJson?.query?.pages || {};
      const filePage = Object.values(filePages)[0];
      const imageInfo = filePage?.imageinfo?.[0];

      if (imageInfo) {
        data.src = imageInfo.url || data.src;
        data.descriptionUrl = imageInfo.descriptionurl || data.descriptionUrl;

        const metadata = imageInfo.extmetadata || {};
        const stripHtml = (html) => html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : undefined;
        const artist = stripHtml(metadata.Artist?.value);
        const creditRaw = stripHtml(metadata.Credit?.value);

        data.credit = artist || creditRaw || null;
        data.license = metadata.LicenseShortName?.value || metadata.UsageTerms?.value || null;
        data.licenseUrl = metadata.LicenseUrl?.value || null;

        if (!data.licenseUrl && data.license && data.license.toLowerCase().includes('public domain')) {
          data.licenseUrl = 'https://creativecommons.org/publicdomain/mark/1.0/';
        }
      }
    } else {
      data.commonsError = `commons status ${commonsRes.status}`;
    }
  } catch (err) {
    data.commonsError = err.message;
  }

  return data;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
