import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateNotebookImage(title: string, category: string): Promise<string> {
  // Generate a creative prompt based on notebook type
  const basePrompt = getPromptForCategory(category, title);
  
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: basePrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    });

    return response.data[0].url || "";
  } catch (error) {
    console.error("Failed to generate image:", error);
    return getDefaultImageForCategory(category);
  }
}

function getPromptForCategory(category: string, title: string): string {
  const commonStyle = "minimalist, modern design, soft colors, abstract representation";
  
  switch (category.toLowerCase()) {
    case "math":
      return `Create a beautiful abstract representation of mathematics and ${title}, featuring geometric patterns, mathematical symbols, and formulas arranged in an artistic way. ${commonStyle}`;
    
    case "science":
      return `Create an artistic visualization of scientific concepts related to ${title}, with molecular structures, DNA helixes, or astronomical objects arranged in a modern composition. ${commonStyle}`;
    
    case "history":
      return `Create an artistic collage representing historical elements from ${title}, with subtle architectural elements, maps, and cultural symbols blended together. ${commonStyle}`;
    
    case "language":
      return `Create an abstract artistic representation of language and communication inspired by ${title}, with flowing text, typography, and communication symbols. ${commonStyle}`;
    
    case "blank":
    default:
      return `Create a modern, abstract artistic composition inspired by ${title}, with flowing shapes and subtle educational symbols. ${commonStyle}`;
  }
}

function getDefaultImageForCategory(category: string): string {
  // Fallback images if DALL-E generation fails
  const defaults: Record<string, string> = {
    math: "https://example.com/math-default.jpg",
    science: "https://example.com/science-default.jpg",
    history: "https://example.com/history-default.jpg",
    language: "https://example.com/language-default.jpg",
    blank: "https://example.com/blank-default.jpg",
  };

  return defaults[category.toLowerCase()] || defaults.blank;
} 