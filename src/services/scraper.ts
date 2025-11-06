import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function scrapeAndProcessUrl(url: string) {
  try {
    console.log(`Scraping URL: ${url}`);

    const loader = new CheerioWebBaseLoader(url);
    const docs = await loader.load();

    console.log(`Loaded ${docs.length} documents`);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splitDocs = await textSplitter.splitDocuments(docs);

    console.log(`Split into ${splitDocs.length} chunks`);

    return {
      success: true,
      documents: splitDocs,
      metadata: {
        url,
        totalChunks: splitDocs.length,
        scrapedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Scraping error:", error);
    throw new Error(
      `Failed to scrape URL: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
