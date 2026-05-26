import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

export interface ProductCatalogItem {
  sku: string;
  name: string;
  price: number;
  category: string;
  material: string;
  description: string;
}

export interface SearchConstraints {
  max_price?: number;
  material?: string;
  category?: string;
}

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || "voxa-catalog";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const PINECONE_NAMESPACE = "voxa-interiors";

// Initialize clients defensively to avoid build-time pre-render crashes
let pineconeIndex: any = null;
let openai: OpenAI | null = null;

try {
  if (PINECONE_API_KEY && PINECONE_INDEX_NAME) {
    const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
    pineconeIndex = pc.index(PINECONE_INDEX_NAME);
    console.log(`Pinecone client initialized for index: ${PINECONE_INDEX_NAME}`);
  } else {
    console.warn("Pinecone API Keys or Index names are missing from the env. Falling back to local catalog simulation.");
  }

  if (OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    console.log("OpenAI client initialized for embedding generation");
  } else {
    console.warn("OpenAI API Key is missing from the env. Falling back to local catalog simulation.");
  }
} catch (error) {
  console.error("Failed to initialize RAG clients:", error);
}

// ── Ingest Pipeline: Upsert Catalog ──
export async function upsertCatalog(products: ProductCatalogItem[]): Promise<{ success: boolean; count: number }> {
  console.log(`Starting ingestion pipeline for ${products.length} products`);

  if (!pineconeIndex || !openai) {
    console.warn("RAG credentials missing. Simulating database upsert.");
    return { success: true, count: products.length };
  }

  try {
    const vectors = [];

    for (const item of products) {
      // 1. Generate 1536-dim semantic embeddings using text-embedding-3-small
      console.log(`Generating embedding for: ${item.name} (${item.sku})`);
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: `${item.name}. Category: ${item.category}. Material: ${item.material}. Description: ${item.description}`,
        dimensions: 1536,
      });

      const values = embeddingResponse.data[0].embedding;

      // 2. Prepare structured Pinecone record with hard facts stored explicitly as metadata
      vectors.push({
        id: item.sku,
        values,
        metadata: {
          sku: item.sku,
          name: item.name,
          price: item.price, // Numeric float for filter comparison ($lte)
          category: item.category,
          material: item.material,
          description: item.description,
        },
      });
    }

    // 3. Upsert records to Pinecone under specific namespace
    console.log(`Upserting ${vectors.length} vectors to Pinecone namespace: ${PINECONE_NAMESPACE}`);
    await pineconeIndex.namespace(PINECONE_NAMESPACE).upsert(vectors);

    console.log("Ingestion completed successfully");
    return { success: true, count: products.length };
  } catch (error) {
    console.error("Upsert failed inside RAG pipeline:", error);
    throw error;
  }
}

// ── Hybrid Search Function: Query Catalog with Strict Metadata Filters ──
export async function queryCatalog(
  semanticQuery: string,
  constraints: SearchConstraints = {},
  topK: number = 3
): Promise<ProductCatalogItem[]> {
  console.log(`Querying catalog: "${semanticQuery}" with constraints:`, JSON.stringify(constraints));

  // local simulation fallback if API keys are not supplied during development
  if (!pineconeIndex || !openai) {
    console.log("Using local simulation fallback for catalog query.");
    return simulateLocalSearch(semanticQuery, constraints, topK);
  }

  try {
    // 1. Generate semantic search query embedding
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: semanticQuery,
      dimensions: 1536,
    });

    const queryVector = embeddingResponse.data[0].embedding;

    // 2. Implement Pinecone metadata pre-filtering
    // This physically prevents vector candidates outside the prospect's budget/material constraints
    const filter: Record<string, any> = {};

    if (constraints.max_price !== undefined && constraints.max_price > 0) {
      // Less than or equal to budget constraint
      filter.price = { $lte: constraints.max_price };
    }

    if (constraints.material) {
      // Exact material match
      filter.material = { $eq: constraints.material };
    }

    if (constraints.category) {
      // Exact category match
      filter.category = { $eq: constraints.category };
    }

    console.log("Applying Pinecone pre-filter statement:", JSON.stringify(filter));

    // 3. Query index namespace
    const queryResponse = await pineconeIndex.namespace(PINECONE_NAMESPACE).query({
      vector: queryVector,
      topK,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      includeMetadata: true,
    });

    const matches = queryResponse.matches || [];
    console.log(`Found ${matches.length} matching products from Pinecone`);

    // 4. Format and return matched items
    return matches.map((m: any) => {
      const meta = m.metadata || {};
      return {
        sku: meta.sku || m.id,
        name: meta.name || "",
        price: Number(meta.price || 0),
        category: meta.category || "",
        material: meta.material || "",
        description: meta.description || "",
      };
    });

  } catch (error) {
    console.error("Catalog hybrid query failed:", error);
    throw error;
  }
}

// ── Mock Local Search Simulation ──
// Used to provide a highly realistic interactive experience during local previews
function simulateLocalSearch(
  query: string,
  constraints: SearchConstraints,
  topK: number
): ProductCatalogItem[] {
  const MOCK_INVENTORY: ProductCatalogItem[] = [
    {
      sku: "SKU-KTCH-01",
      name: "Luxury Acrylic Gloss Modular Kitchen Layout",
      price: 380000,
      category: "kitchen",
      material: "acrylic",
      description: "Modern modular kitchen featuring custom BWR plywood structure, sliding drawers, and premium gloss acrylic sheet laminations."
    },
    {
      sku: "SKU-WRDB-02",
      name: "Premium Solid Teak Sliding Wardrobes",
      price: 180000,
      category: "wardrobe",
      material: "teak",
      description: "Floor-to-ceiling double sliding wardrobe utilizing high-grade teak veneers and soft-close slider rails."
    },
    {
      sku: "SKU-SOFA-03",
      name: "Modern Living Room Chesterfield Sofa Suite",
      price: 120000,
      category: "living_room",
      material: "fabric",
      description: "Aesthetic tufted chesterfield 3-seater sofa upholstered in stain-resistant velvet fabric."
    },
    {
      sku: "SKU-BED-04",
      name: "Compact Space-Saving Wall Bed & Desk",
      price: 90000,
      category: "bedroom",
      material: "veneer",
      description: "Compact bedroom package bundling a vertical wall-pull down double bed and study table with laminate finishes."
    }
  ];

  // Apply constraints
  return MOCK_INVENTORY.filter((item) => {
    if (constraints.max_price !== undefined && item.price > constraints.max_price) {
      return false;
    }
    if (constraints.material && item.material !== constraints.material) {
      return false;
    }
    if (constraints.category && item.category !== constraints.category) {
      return false;
    }
    
    // Simple semantic mapping check
    const queryLower = query.toLowerCase();
    return (
      item.name.toLowerCase().includes(queryLower) ||
      item.description.toLowerCase().includes(queryLower) ||
      item.category.toLowerCase().includes(queryLower)
    );
  }).slice(0, topK);
}
