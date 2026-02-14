export interface ToolStat {
  value: string;
  label: string;
}

export interface ToolParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ToolItem {
  name: string;
  description: string;
  tags: string[];
  parameters: ToolParameter[];
}

export interface SkillItem {
  name: string;
  description: string;
  tags: string[];
}

export interface MemoryConfig {
  type: string;
  directory: string;
  mainFile: string;
  mainFileLimit: string;
  topicFiles: string;
  whatToSave: string[];
  whatNotToSave: string[];
  persistence: string;
  management: string;
}

export interface SystemPromptSection {
  id: string;
  title: string;
  rules?: string[];
  safetyRules?: string[];
  workflow?: string[];
  riskyActions?: string[];
  priorityMatrix?: { operation: string; use: string; notThis: string }[];
  events?: { event: string; when: string }[];
  tags?: { tag: string; purpose: string }[];
}

export interface McpServer {
  name: string;
  description: string;
  tools: string[];
  instruction: string;
}

export interface Identity {
  name: string;
  tagline: string;
  role: string;
  model: {
    id: string;
    name: string;
    family: string;
    knowledgeCutoff: string;
    availableSubagentModels: string[];
    haikuGuidance: string;
  };
  apiConfig: {
    maxTokens: number;
    stream: boolean;
    thinking: { type: string };
    contextManagement: {
      edits: { type: string; keep: string }[];
    };
  };
  outputFormat: string;
  fastMode: string;
  capabilities: string[];
}

export interface Specificities {
  mcpServers: McpServer[];
  userConfig: {
    claudeMdLocations: string[];
    claudeMdBehavior: string;
    hooksConfigured: string[];
  };
  environment: Record<string, string | boolean>;
  contextCompression: {
    behavior: string;
    implication: string;
  };
  billingHeader: string;
}

export interface SidebarLink {
  href: string;
  label: string;
  indent: boolean;
}

export interface ToolVersion {
  slug: string;
  version: string;
  order: number;
  sourcePayload: string;
  metadata: {
    title: string;
    organization: string;
    name: string;
    description: string;
    generatedAt: string;
    extractedFrom: string;
    stats: Record<string, number>;
  };
  identity?: Identity;
  tools: ToolItem[];
  skills?: SkillItem[];
  memory?: MemoryConfig;
  systemPrompt?: SystemPromptSection[];
  specificities?: Specificities;
  sidebarNav?: SidebarLink[];
}

export interface ToolIndexEntry {
  slug: string;
  name: string;
  organization: string;
  versions: {
    version: string;
    name: string;
    description: string;
    stats: ToolStat[];
    toolCount: number;
  }[];
}
