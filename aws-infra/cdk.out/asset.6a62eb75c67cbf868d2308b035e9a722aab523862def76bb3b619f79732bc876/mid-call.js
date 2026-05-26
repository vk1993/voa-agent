"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const INTERIOR_RAG_CATALOG = {
    kitchen: {
        name: "Luxury Acrylic Gloss Modular Kitchen Layout",
        category: "Modular Kitchen",
        price: "3.5L to 4.5L starting package",
        objectionsResolved: [
            "Waterproofing concern: Uses BWR (Boiling Water Resistant) plywood with acrylic sheet laminations.",
            "Durability concern: Acrylic is highly scratch-resistant and doesn't yellow under direct light."
        ]
    },
    wardrobe: {
        name: "Premium Soft-Close Floor-to-Ceiling Sliding Wardrobes",
        category: "Storage",
        price: "1.2L per wardrobe unit",
        objectionsResolved: [
            "Space issue: Uses heavy-duty top-hanging sliding tracks to occupy zero floor workspace in 3BHK compact plans.",
            "Material quality: 18mm high-density fiberboard with premium veneer finishes."
        ]
    }
};
const handler = async (event) => {
    console.log("Receiving mid-call event payload:", JSON.stringify(event));
    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const intent = (body.intent || body.message?.intent || "").toLowerCase();
        // Default response if no RAG catalog matches
        let ragResult = {
            found: false,
            message: "No specific catalog records matched this prompt. Escalating to general sales support."
        };
        // Simple keyword mapping for modular kitchens or sliding wardrobes
        if (intent.includes("kitchen") || intent.includes("cook")) {
            ragResult = {
                found: true,
                ...INTERIOR_RAG_CATALOG.kitchen
            };
        }
        else if (intent.includes("wardrobe") || intent.includes("cupboard") || intent.includes("storage")) {
            ragResult = {
                found: true,
                ...INTERIOR_RAG_CATALOG.wardrobe
            };
        }
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: true,
                source: "VOXA-MidCallRAGEngine",
                data: ragResult,
            }),
        };
    }
    catch (error) {
        console.error("Mid-Call processing failed:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: false,
                error: error.message || "Internal server error occurred",
            }),
        };
    }
};
exports.handler = handler;
