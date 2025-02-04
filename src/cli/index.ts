#!/usr/bin/env node
import { exec } from "child_process";
import { program } from "commander";
import fs from "fs/promises";
import path from "path";
import readline from "readline";
import { promisify } from "util";
import { AIModel } from "../services/base/BaseService.js";
import { processGenerationAndUpdateFiles } from "./codeExplorer.js";

const URL =
  process.env.API_BASE_URL || "https://figma-extension-be-x3mb.onrender.com/ai";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> =>
  new Promise((resolve) => rl.question(query, resolve));

const execAsync = promisify(exec);

async function showWelcomeScreen() {
  console.clear();
  console.log(
    "\x1b[36m%s\x1b[0m",
    `
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║            🎨 Welcome to Design to Code               ║
║         Transform Your Designs into Reality           ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
`,
  );
}

async function validateReactProject() {
  try {
    const currentDir = process.cwd();

    // Check if package.json exists and contains React
    let isReactProject = false;
    try {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(currentDir, "package.json"), "utf-8"),
      );
      isReactProject = !!(
        packageJson.dependencies?.react || packageJson.devDependencies?.react
      );
    } catch {
      return { valid: false, error: "No package.json found or invalid format" };
    }

    if (!isReactProject) {
      return { valid: false, error: "React is not installed in this project" };
    }

    // Check if App.tsx exists and contains React imports
    try {
      const appTsxContent = await fs.readFile(
        path.join(currentDir, "src", "App.tsx"),
        "utf-8",
      );
      const hasReactImport = appTsxContent.includes("import");

      if (!hasReactImport) {
        return {
          valid: false,
          error:
            "App.tsx doesn't appear to be a React component or doesn't contain any import statements",
        };
      }
    } catch (error) {
      console.log(error);
      return { valid: false, error: "src/App.tsx not found" };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Unexpected error: ${error}` };
  }
}

async function cloneTemplate(directory: string, generationId: string) {
  try {
    // Create directory if it doesn't exist
    await fs.mkdir(directory, { recursive: true });

    // Clone the repository
    const { stdout, stderr } = await execAsync(
      `git clone https://github.com/khoivudevz/turbo-setup-react-ts-tailwind.git ${directory}`,
    );

    if (stderr && !stderr.includes("Cloning into")) {
      throw new Error(stderr);
    }

    console.log("📦 Installing dependencies...");
    await execAsync(`cd ${directory} && npm install`);

    console.log("\n✨ Project setup complete!");
    console.log("\nNext steps:");
    console.log("  1. cd", directory);
    console.log("  2. npm run dev");
    console.log("\n🎨 Happy coding!\n");

    const answer = await question(
      "Do you want to continue generating your first design? (Y/n): ",
    );

    if (answer.toLowerCase() === "y" || answer === "") {
      process.chdir(directory);
      await processGenerationAndUpdateFiles(generationId);
    }
  } catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "\n Thanks for using Design to Code!");
    process.exit(1);
  }
}

async function checkProjectStructure(generationId: string) {
  try {
    const validation = await validateReactProject();

    if (!validation.valid) {
      await showWelcomeScreen();
      console.log(
        "\x1b[33m%s\x1b[0m",
        "✨ Let's set up your design-to-code workspace!\n",
      );
      console.log("Current directory isn't properly set up:");
      console.log(`  ❌ ${validation.error}`);
      console.log(
        "\nWe'll help you get started with a fresh template that includes:",
      );
      console.log("  ✅ React + TypeScript configuration");
      console.log("  ✅ Design-to-code components");
      console.log("  ✅ Pre-configured development environment\n");

      const answer = await question(
        "Would you like to create a new project here? (Y/n): ",
      );

      if (answer.toLowerCase() === "y" || answer === "") {
        console.log("\n🎨 Creating your design workspace...");
        console.log(
          "\x1b[32m%s\x1b[0m",
          "\n🚀 Cloning template: https://github.com/khoivudevz/turbo-setup-react-ts-tailwind\n",
        );

        const projectName = await question(
          "Enter project name (default: design-to-code): ",
        );
        const directory = projectName.trim() || "design-to-code";

        try {
          await cloneTemplate(directory, generationId);
          process.exit(0);
        } catch (error) {
          console.error("\x1b[31m%s\x1b[0m", "\n❌ Setup failed:", error);
          process.exit(1);
        }
      } else {
        console.log("\n❌ Setup cancelled");
        process.exit(1);
      }
    }
  } catch (error) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      "❌ Error validating project structure:",
      error,
    );
    process.exit(1);
  } finally {
    rl.close();
  }
}

program
  .name("code-explorer-cli")
  .description("CLI to update code files from generation ID")
  .version("1.0.0");

program
  .command("generate")
  .description("Update files from generation ID")
  .argument("<generationId>", "Generation ID to process")
  .option("--api-url <url>", "API base URL")
  .action(async (generationId: string, options) => {
    if (options.apiUrl) {
      process.env.API_BASE_URL = options.apiUrl;
    }

    try {
      await checkProjectStructure(generationId);

      console.log("\n📦 Starting update process...");
      console.log(`🔑 Generation ID: ${generationId}`);

      await processGenerationAndUpdateFiles(
        generationId,
        options.model as AIModel,
      );
    } catch (error) {
      console.error("\x1b[31m%s\x1b[0m", "\n❌ Failed to update files:", error);
      process.exit(1);
    }
  });

program.parse();
