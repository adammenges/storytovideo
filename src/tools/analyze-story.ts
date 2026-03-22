import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { StoryAnalysis, UserProvidedAssets } from "../types";

// Zod schema for story analysis (without shots)
const sceneSchema = z.object({
  sceneNumber: z.number(),
  title: z.string(),
  narrativeSummary: z.string(),
  charactersPresent: z.array(z.string()),
  location: z.string(),
  estimatedDurationSeconds: z.number(),
});

const storyAnalysisSchema = z.object({
  title: z.string(),
  artStyle: z.string(),
  characters: z.array(z.object({
    name: z.string(),
    physicalDescription: z.string(),
    personality: z.string(),
    ageRange: z.string(),
  })),
  locations: z.array(z.object({
    name: z.string(),
    visualDescription: z.string(),
  })),
  objects: z.array(z.object({
    name: z.string(),
    visualDescription: z.string(),
  })),
  scenes: z.array(sceneSchema),
});

/**
 * Analyzes a story to extract characters, locations, art style, and scenes.
 * Uses Claude Opus 4.6 with structured output.
 */
export async function analyzeStory(storyText: string, userProvidedAssets?: UserProvidedAssets): Promise<StoryAnalysis> {
  const userCharacterNames = Object.keys(userProvidedAssets?.characters ?? {});
  const userObjectNames = Object.keys(userProvidedAssets?.objects ?? {});

  let userAssetBlock = "";
  if (userCharacterNames.length > 0) {
    userAssetBlock += `\n\nUSER-PROVIDED CHARACTERS (reference photos supplied — use these EXACT names, do NOT rename them):
${userCharacterNames.map(n => `- "${n}"`).join("\n")}
These characters have real reference photos. Keep their names exactly as listed. Still provide physical descriptions based on what the story says about them.`;
  }
  if (userObjectNames.length > 0) {
    userAssetBlock += `\n\nUSER-PROVIDED OBJECTS (reference photos supplied — use these EXACT names):
${userObjectNames.map(n => `- "${n}"`).join("\n")}
These are real objects/products with reference photos. Include them in the objects list with visual descriptions based on what the story says about them. Make sure scenes that feature these objects list them appropriately.`;
  }

  const prompt = `Analyze the following story and extract:
1. Title
2. Visual art style (describe the visual aesthetic)
3. Characters (name, detailed physical description, personality, age range)
4. Locations (name, visual description with architecture, lighting, colors, atmosphere)
5. Objects (name, visual description — products, props, or key items featured in the story)
6. Scenes (numbered, with title, narrative summary, characters present, location, estimated duration)

For each character, provide vivid physical descriptions that will help generate consistent reference images.
IMPORTANT: If any character in the story is a real person or celebrity, you MUST rename them to an original fictional name that reflects their personality or role in the story. For example, a tech visionary named "Elon Musk" might become "Nova Sparks", a cooking show host named "Gordon Ramsay" might become "Blaze Thornton". NEVER use real people's names — always invent creative fictional names. Also ensure physical descriptions are completely original and do not resemble any real person.
For each location, describe the visual mood, lighting, and key objects.
For objects, describe the visual appearance of key items, products, or props that appear in the story. Only include objects that are visually significant to the narrative.
Estimate scene duration based on action density and dialogue length.
Unless the story explicitly specifies an art style, default to "photorealistic" for the visual art style.${userAssetBlock}

Story:
${storyText}`;

  try {
    const { object } = await generateObject({
      model: anthropic("claude-opus-4-6"),
      schema: storyAnalysisSchema,
      prompt,
    } as any);

    const result = object as any;
    // Add empty shots arrays (filled by shot planner later)
    if (result.scenes) {
      result.scenes = result.scenes.map((s: any) => ({ ...s, shots: [] }));
    }
    // Ensure objects array exists
    if (!result.objects) {
      result.objects = [];
    }
    return result as StoryAnalysis;
  } catch (error) {
    console.error("Error in analyzeStory:", error);
    throw error;
  }
}

/**
 * Vercel AI SDK tool definition for analyzeStory.
 * Claude calls this to analyze the story.
 */
export const analyzeStoryTool = {
  description: "Analyze a story to extract characters, locations, art style, and scenes",
  parameters: z.object({
    storyText: z.string(),
  }),
};

