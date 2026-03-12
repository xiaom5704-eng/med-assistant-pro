/**
 * LLM Module for med-assistant-pro
 * Integrates Gemini 2.5 Flash for advanced medical analysis
 * Vercel Serverless compatible
 */

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const resolveApiUrl = () => {
  const apiKey = getApiKey();
  const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL || process.env.FORGE_API_URL || "";
  
  let url = "";
  if (forgeApiUrl && forgeApiUrl.trim().length > 0) {
    url = `${forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`;
  } else if (apiKey.startsWith("AIza")) {
    url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  } else {
    url = "https://api.openai.com/v1/chat/completions";
  }
  
  console.log(`[LLM] Resolved API URL: ${url}`);
  return url;
};

const assertApiKey = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY or BUILT_IN_FORGE_API_KEY is not configured");
  }
};

const getApiKey = () => {
  return process.env.BUILT_IN_FORGE_API_KEY || process.env.OPENAI_API_KEY || "";
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();
  const apiKey = getApiKey();
  console.log(`[LLM] Invoking LLM with API Key prefix: ${apiKey.substring(0, 8)}...`);

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const payload: Record<string, unknown> = {
    model: "gemini-2.0-flash",
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  payload.max_tokens = 4096; // 調整為更通用的 max_tokens

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as InvokeResult;
}

/**
 * Fallback function for when LLM is not available
 * Uses static knowledge base
 */
export function getFallbackAnalysis(medications: string[], ageGroup: string): Record<string, unknown> {
  const FALLBACK_DB: Record<string, any> = {
    aspirin: {
      cn: "阿斯匹靈",
      purpose: "退燒、止痛、抗發炎、預防血栓",
      ingredient: "Acetylsalicylic acid (乙醯水楊酸)",
      risk: "可能引起胃腸不適、出血傾向、過敏反應",
      infantRisk: "極高",
      dosage: "成人：500-1000mg，每4-6小時一次，每日不超過4000mg；兒童：需醫師指示",
      interactions: ["布洛芬", "華法林"],
    },
    ibuprofen: {
      cn: "布洛芬 (伊普)",
      purpose: "退燒、止痛、抗發炎",
      ingredient: "Ibuprofen (異丁基苯丙酸)",
      risk: "與阿斯匹靈併用會增加胃出血風險；長期使用可能影響腎功能",
      infantRisk: "中",
      dosage: "成人：200-400mg，每4-6小時一次，每日不超過1200mg；兒童：5-10mg/kg",
      interactions: ["阿斯匹靈", "華法林"],
    },
    acetaminophen: {
      cn: "乙醯胺酚 (普拿疼)",
      purpose: "退燒、緩解輕微疼痛",
      ingredient: "Paracetamol (對乙醯胺基酚)",
      risk: "過量使用會造成肝臟損傷；長期使用需監測肝功能",
      infantRisk: "低",
      dosage: "成人：500-1000mg，每4-6小時一次，每日不超過4000mg；兒童：10-15mg/kg",
      interactions: ["酒精"],
    },
  };

  const medDetails = medications.map((medName: string) => {
    const key = medName.toLowerCase();
    const dbEntry = FALLBACK_DB[key];

    if (dbEntry) {
      return {
        original: medName,
        ...dbEntry,
        found: true,
      };
    } else {
      return {
        original: medName,
        cn: medName,
        purpose: "根據藥名推測可能用於緩解症狀或治療相關疾病",
        ingredient: `${medName} 的活性成分`,
        risk: "使用前應諮詢醫師或藥師",
        infantRisk: ageGroup === "infant" ? "高" : "中",
        dosage: "劑量應由醫師決定",
        interactions: [],
        found: false,
      };
    }
  });

  let riskLevel = "低";
  let interactions: string[] = [];

  for (let i = 0; i < medDetails.length; i++) {
    for (let j = i + 1; j < medDetails.length; j++) {
      const med1 = medDetails[i];
      const med2 = medDetails[j];
      if (med1.interactions && med1.interactions.includes(med2.cn)) {
        interactions.push(`${med1.cn} 與 ${med2.cn} 可能存在交互作用`);
        riskLevel = "高";
      }
    }
  }

  if (ageGroup === "infant") {
    const infantRisks = medDetails.map((d: any) => d.infantRisk);
    if (infantRisks.includes("極高")) {
      riskLevel = "極高";
    } else if (infantRisks.includes("高")) {
      riskLevel = "高";
    }
  }

  return {
    success: true,
    riskLevel,
    interactions,
    medDetails,
    usedFallback: true,
  };
}
