import { GoogleGenAI, FunctionDeclaration, Type, Content } from "@google/genai";

export const DEFAULT_SYSTEM_INSTRUCTION = `
You are "Nexa", a high-level general autonomous agent. 
Your goal is to solve complex user requests by planning, executing tools, and verifying results.

BEHAVIOR MODEL:
1. RECEIVE GOAL: Parse the user's intent. If vague, ask for clarification.
2. EVALUATE COMPLEXITY: 
   - If the request is simple (e.g., "What is the capital of France?", "Who won the super bowl?"), DO NOT create a plan. Just answer directly or use 'web_search' immediately.
   - If the request is complex (multi-step, requires coding + browsing, or specific workflow), call 'create_plan' FIRST.
3. EXECUTE: Use available tools (web_search, visit_page, write_code) to execute the plan.
4. VERIFY: Check tool outputs. If a tool fails, retry or adjust the plan.
5. REPORT: Provide a final answer based on the tool outputs.

TONE:
- Professional, concise, and objective.
- Do not be chatty. Be an operator.
- Use the "Thinking" process to explain your reasoning before calling tools.

IMPORTANT CODING RULES:
- When you write code, YOU MUST output the full code in a Markdown code block (e.g., \`\`\`python ... \`\`\`) in your text response.
- Do this EITHER before calling the \`write_code\` tool OR when reporting the result.
- Users cannot see the tool arguments directly, so the code must be visible in the chat.

AVAILABLE TOOLS:
- create_plan: Call this FIRST to set up the UI with your intended steps (ONLY for complex tasks).
- web_search: Search the internet for information.
- visit_page: Visit a specific URL to extract content.
- write_code: Write and execute Python code (simulated).
- create_file: Create a file in the virtual workspace.
`;

// Tool Definitions
const createPlanTool: FunctionDeclaration = {
  name: 'create_plan',
  description: 'Initialize the task with a list of steps to execute.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      steps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Short title of the step' },
            description: { type: Type.STRING, description: 'Detailed description' }
          },
          required: ['title', 'description']
        }
      }
    },
    required: ['steps']
  }
};

const webSearchTool: FunctionDeclaration = {
  name: 'web_search',
  description: 'Search the web for a query.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The search query' }
    },
    required: ['query']
  }
};

const visitPageTool: FunctionDeclaration = {
  name: 'visit_page',
  description: 'Visit a URL and extract text content.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: { type: Type.STRING, description: 'The URL to visit' }
    },
    required: ['url']
  }
};

const writeCodeTool: FunctionDeclaration = {
  name: 'write_code',
  description: 'Write and execute python code.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      code: { type: Type.STRING, description: ' The python code to execute' },
      filename: { type: Type.STRING, description: 'Filename to save as' }
    },
    required: ['code', 'filename']
  }
};

export const initializeGemini = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found");
    return null;
  }
  
  const ai = new GoogleGenAI({ apiKey });
  return ai;
};

export const createChatSession = (
  ai: GoogleGenAI, 
  modelName: string = 'gemini-2.5-flash',
  systemInstruction: string = DEFAULT_SYSTEM_INSTRUCTION,
  temperature: number = 0.7,
  history: Content[] = []
) => {
  return ai.chats.create({
    model: modelName,
    config: {
      systemInstruction: systemInstruction,
      temperature: temperature,
      tools: [{
        functionDeclarations: [createPlanTool, webSearchTool, visitPageTool, writeCodeTool]
      }],
    },
    history: history
  });
};

export const generateChatTitle = async (ai: GoogleGenAI, prompt: string, modelName: string = 'gemini-2.5-flash') => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `
      Analyze the following user prompt and generate a short, creative, and relevant title (max 5 words) for a chat session.
      
      Examples:
      - Prompt: "Hi" -> Title: "Greeting"
      - Prompt: "Write a python script to scrape data" -> Title: "Python Data Scraper"
      - Prompt: "Who is the president of the US?" -> Title: "US President Query"
      
      User Prompt: "${prompt}"
      
      Return ONLY the title text. Do not include quotes.
      `,
    });
    return response.text?.trim() || "New Task";
  } catch (error) {
    console.error("Failed to generate title", error);
    return "New Task";
  }
};
