// Base type for all AST nodes
export interface BaseAstNode {
  line: number;
  children?: AstNode[];
}

// Specific node types for each command
export interface LogNode extends BaseAstNode {
  type: '@LOG';
  payload: string; // The message to log
}

export interface SetNode extends BaseAstNode {
  type: '@SET';
  payload: string; // The assignment expression (e.g., "name = value")
}

export interface GlobalNode extends BaseAstNode {
  type: '@GLOBAL';
  payload: string; // The assignment expression (e.g., "name = value") - saved to .global.json
}

export interface AiNode extends BaseAstNode {
  type: '@AI';
  payload: string; // The AI prompt to send to Ollama
}

export interface ShellNode extends BaseAstNode {
  type: '>';
  payload: string; // The shell command to execute
}

export interface WriteNode extends BaseAstNode {
  type: '@WRITE' | '@SAVE';
  payload: string; // The write expression (e.g., '"content" to path' or 'variable to path')
}

export interface IfNode extends BaseAstNode {
  type: 'IF';
  payload: string; // The condition (e.g., "exists path" or "not_exists path")
  children: AstNode[]; // Always has children for IF blocks
}

export interface ForeachNode extends BaseAstNode {
  type: 'FOREACH';
  payload: string; // The iteration expression (e.g., "item in listVar")
  children: AstNode[]; // Always has children for FOREACH blocks
}

export interface CompileNode extends BaseAstNode {
  type: '@COMPILE';
  payload: string; // The path to the template JSON file
}

export interface FillNode extends BaseAstNode {
  type: '@FILL';
  payload: string; // The file path to write to
  content?: string[]; // Array containing the content lines
}

// Union type for all possible AST nodes
export type AstNode = 
  | LogNode 
  | SetNode 
  | GlobalNode
  | AiNode
  | ShellNode 
  | WriteNode 
  | IfNode 
  | ForeachNode 
  | CompileNode
  | FillNode;

// Type guards for runtime type checking
export const isLogNode = (node: AstNode): node is LogNode => node.type === '@LOG';
export const isSetNode = (node: AstNode): node is SetNode => node.type === '@SET';
export const isGlobalNode = (node: AstNode): node is GlobalNode => node.type === '@GLOBAL';
export const isAiNode = (node: AstNode): node is AiNode => node.type === '@AI';
export const isShellNode = (node: AstNode): node is ShellNode => node.type === '>';
export const isWriteNode = (node: AstNode): node is WriteNode => node.type === '@WRITE' || node.type === '@SAVE';
export const isIfNode = (node: AstNode): node is IfNode => node.type === 'IF';
export const isForeachNode = (node: AstNode): node is ForeachNode => node.type === 'FOREACH';
export const isCompileNode = (node: AstNode): node is CompileNode => node.type === '@COMPILE';
export const isFillNode = (node: AstNode): node is FillNode => node.type === '@FILL';

// Helper type for block commands that have children
export type BlockNode = IfNode | ForeachNode;

/**
 * Parses the content of a DSL (.gen) file into an Abstract Syntax Tree (AST).
 *
 * The parser processes each line, ignoring empty lines and comments (lines starting with `#`).
 * It recognizes block commands such as `IF`, `FOREACH`, and their corresponding end commands (`ENDIF`, `ENDFOREACH`),
 * managing nested structures using a stack. Other lines are parsed as individual AST nodes.
 *
 * @param content - The raw string content of the DSL file to parse.
 * @returns An array of `AstNode` objects representing the root-level nodes of the parsed AST.
 */
export function parseContent(content: string): AstNode[] {
  const lines = content.split('\n');
  const mainAst: AstNode[] = [];
  const stack: AstNode[][] = [mainAst]; // Stack to manage nested blocks
  let currentAst = mainAst;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNumber = i + 1;

    if (!line || line.startsWith('#')) {
      continue;
    }

    const [command, ...rest] = line.split(/\s+/);
    const payload = rest.join(' '); // tutto a dx del comando

    const upperCommand = command.toUpperCase();

    if (upperCommand === 'IF') {
      const newNode: IfNode = { type: 'IF', payload: payload, line: lineNumber, children: [] };
      currentAst.push(newNode);
      stack.push(newNode.children);
      currentAst = newNode.children;
    } else if (upperCommand === 'FOREACH') {
        const newNode: ForeachNode = { type: 'FOREACH', payload: payload, line: lineNumber, children: [] };
        currentAst.push(newNode);
        stack.push(newNode.children);
        currentAst = newNode.children;
    } else if (upperCommand === '@FILL' || upperCommand === 'FILL') {
        // Handle @fill command with multi-line content
        const fillNode: FillNode = { type: '@FILL', payload: payload, line: lineNumber, content: [] };
        
        // Look for the opening quote on the next line
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== '"') {
          j++;
        }
        
        if (j >= lines.length) {
          throw new Error(`@FILL command at line ${lineNumber} missing opening quote delimiter`);
        }
        
        // Skip the opening quote line
        j++;
        const contentLines: string[] = [];
        
        // Collect content until closing quote
        while (j < lines.length && lines[j].trim() !== '"') {
          contentLines.push(lines[j]);
          j++;
        }
        
        if (j >= lines.length) {
          throw new Error(`@FILL command at line ${lineNumber} missing closing quote delimiter`);
        }
        
        fillNode.content = contentLines;
        currentAst.push(fillNode);
        
        // Skip processed lines
        i = j;
    } else if (upperCommand === 'ENDIF' || upperCommand === 'ENDFOREACH') {
        stack.pop();
        currentAst = stack[stack.length - 1];
    } else {
        // Handle different command types
        if (line.startsWith('>')) {
            const shellNode: ShellNode = {
                type: '>',
                payload: line.substring(1).trim(),
                line: lineNumber
            };
            currentAst.push(shellNode);
        } else {
            // Map command strings to specific node types
            const nodeType = mapCommandToType(upperCommand);
            if (nodeType) {
                const node = createNodeByType(nodeType, payload, lineNumber);
                currentAst.push(node);
            } else {
                // Handle unknown commands - could throw error or create generic node
                console.warn(`Unknown command "${upperCommand}" at line ${lineNumber}`);
            }
        }
    }
  }

  return mainAst;
}

/**
 * Maps command strings to their corresponding node types
 */
function mapCommandToType(command: string): AstNode['type'] | null {
  switch (command) {
    case '@LOG':
    case 'LOG':
      return '@LOG';
    case '@SET':
    case 'SET':
      return '@SET';
    case '@GLOBAL':
    case 'GLOBAL':
      return '@GLOBAL';
    case '@AI':
    case 'AI':
      return '@AI';
    case '@WRITE':
    case 'WRITE':
      return '@WRITE';
    case '@SAVE':
    case 'SAVE':
      return '@SAVE';
    case '@COMPILE':
    case 'COMPILE':
      return '@COMPILE';
    case '@FILL':
    case 'FILL':
      return '@FILL';
    default:
      return null;
  }
}

/**
 * Creates a node of the specified type with proper typing
 */
function createNodeByType(type: AstNode['type'], payload: string, line: number): AstNode {
  switch (type) {
    case '@LOG':
      return { type: '@LOG', payload, line };
    case '@SET':
      return { type: '@SET', payload, line };
    case '@GLOBAL':
      return { type: '@GLOBAL', payload, line };
    case '@AI':
      return { type: '@AI', payload, line };
    case '@WRITE':
      return { type: '@WRITE', payload, line };
    case '@SAVE':
      return { type: '@SAVE', payload, line };
    case '@COMPILE':
      return { type: '@COMPILE', payload, line };
    case '@FILL':
      return { type: '@FILL', payload, line, content: [] };
    case '>':
      return { type: '>', payload, line };
    default:
      // This should never happen due to mapCommandToType check
      throw new Error(`Unsupported node type: ${type}`);
  }
}
