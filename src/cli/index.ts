#!/usr/bin/env node
import { program } from "commander";
import { AIModel } from "../services/base/BaseService.js";
import { processGenerationAndUpdateFiles } from "./codeExplorer.js";

// Allow setting API URL via environment variable
process.env.API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080";

program
  .name("code-explorer-cli")
  .description("CLI to update code files from generation ID")
  .version("1.0.0");

program
  .command("generate")
  .description("Update files from generation ID")
  .argument("<generationId>", "Generation ID to process")
  .option("-m, --model <model>", "AI model to use")
  .option("--api-url <url>", "API base URL")
  .action(async (generationId: string, options) => {
    if (options.apiUrl) {
      process.env.API_BASE_URL = options.apiUrl;
    }

    try {
      console.log(`Starting update process...`);
      console.log(`Generation ID: ${generationId}`);
      console.log(`Model: ${options.model || "gemini"}`);

      await processGenerationAndUpdateFiles(
        generationId,
        options.model as AIModel,
      );
    } catch (error) {
      console.error("Failed to update files:", error);
      process.exit(1);
    }
  });

program.parse();
