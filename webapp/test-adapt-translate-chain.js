#!/usr/bin/env node

/**
 * Test script: Chain /api/adapt → /api/translate
 * 
 * Usage:
 *   node test-adapt-translate-chain.js
 *   node test-adapt-translate-chain.js hindi
 *   node test-adapt-translate-chain.js french
 */

const BASE_URL = "http://localhost:3000";

const inputText = `In a rapidly evolving technological landscape, organizations must continuously adapt to new challenges while maintaining efficiency and innovation. Artificial intelligence is transforming industries by enabling smarter decision-making, automating repetitive tasks, and enhancing user experiences. However, successful implementation requires careful planning, ethical considerations, and a deep understanding of both the technology and its potential impact on society. Teams that collaborate effectively and embrace learning are more likely to thrive in such dynamic environments.`;

const targetLanguage = process.argv[2] || "hindi";

console.log("🔄 Step 1: Calling /api/adapt...");
console.log("Input text length:", inputText.length);
console.log("");

// Step 1: Call /api/adapt
fetch(`${BASE_URL}/api/adapt`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: inputText,
    strugglingParagraphs: [0]
  })
})
  .then(res => {
    if (!res.ok) {
      throw new Error(`/api/adapt failed with status ${res.status}`);
    }
    return res.json();
  })
  .then(adaptData => {
    console.log("✅ Step 1 Complete: /api/adapt");
    console.log("Modified text length:", adaptData.modifiedText?.length || 0);
    console.log("");
    console.log("📝 Adapted text preview:");
    console.log(adaptData.modifiedText?.substring(0, 300) + "...");
    console.log("");
    console.log("─".repeat(80));
    console.log("");

    // Step 2: Call /api/translate with the adapted text
    console.log(`🔄 Step 2: Calling /api/translate (language: ${targetLanguage})...`);
    console.log("");

    return fetch(`${BASE_URL}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: adaptData.modifiedText,
        language: targetLanguage
      })
    });
  })
  .then(res => {
    if (!res.ok) {
      throw new Error(`/api/translate failed with status ${res.status}`);
    }
    return res.json();
  })
  .then(translateData => {
    console.log("✅ Step 2 Complete: /api/translate");
    console.log("Response:", JSON.stringify(translateData, null, 2));
    console.log("Language:", translateData.language);
    console.log("Translations applied:", translateData.translationsApplied);
    console.log("");
    console.log("─".repeat(80));
    console.log("");
    console.log("🎯 FINAL OUTPUT:");
    console.log("");
    console.log(translateData.translatedText);
    console.log("");
    console.log("─".repeat(80));
    console.log("");
    console.log("✨ Pipeline completed successfully!");
  })
  .catch(error => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });
