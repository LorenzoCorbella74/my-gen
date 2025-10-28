import { 
  ParseResult, 
  AstNode, 
  IfNode, 
  ElseIfBlock, 
  ForeachNode, 
  TaskNode, 
  ShellNode, 
  FillNode, 
  Metadata 
} from "./commands/types.js";


/**
 * Parses the content of a DSL (.gen) file into an Abstract Syntax Tree (AST).
 *
 * The parser processes each line, ignoring empty lines and comments (lines starting with `#`).
 * It recognizes block commands such as `@IF`, `@LOOP`, and their corresponding end commands (`@END`, `@ENDLOOP`),
 * managing nested structures using a stack. Other lines are parsed as individual AST nodes.
 *
 * @param content - The raw string content of the DSL file to parse.
 * @returns An array of `AstNode` objects representing the root-level nodes of the parsed AST.
 */
export function parseContent(content: string): ParseResult {
  // Parse front matter metadata first
  const { metadata, content: cleanContent } = parseFrontMatter(content);

  const lines = cleanContent.split('\n');
  const mainAst: AstNode[] = [];
  const stack: AstNode[][] = [mainAst]; // Stack to manage nested blocks
  let currentAst = mainAst;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNumber = i + 1;

    // comments and empty lines
    if (!line || line.startsWith('#')) {
      continue;
    }

    const [command, ...rest] = line.split(/\s+/);
    const payload = rest.join(' '); // tutto a dx del comando

    const upperCommand = command.toUpperCase();

    if (upperCommand === '@IF') {
      const newNode: IfNode = { type: '@IF', payload: payload, line: lineNumber, children: [], elseifBlocks: [] };
      currentAst.push(newNode);
      stack.push(newNode.children);
      currentAst = newNode.children;
    } else if (upperCommand === '@ELSEIF') {
      // Find the current IF node at the top of the stack
      if (stack.length < 2) {
        throw new Error(`@ELSEIF at line ${lineNumber} without corresponding @IF`);
      }
      
      // Pop current children and get the IF node
      stack.pop();
      const parentAst = stack[stack.length - 1];
      const ifNode = parentAst[parentAst.length - 1] as IfNode;
      
      if (ifNode.type !== '@IF') {
        throw new Error(`@ELSEIF at line ${lineNumber} not inside @IF block`);
      }
      
      // Create elseif block
      const elseifBlock: ElseIfBlock = {
        condition: payload,
        children: [],
        line: lineNumber
      };
      
      if (!ifNode.elseifBlocks) {
        ifNode.elseifBlocks = [];
      }
      ifNode.elseifBlocks.push(elseifBlock);
      
      // Set current context to elseif children
      stack.push(elseifBlock.children);
      currentAst = elseifBlock.children;
    } else if (upperCommand === '@LOOP') {
      const newNode: ForeachNode = { type: '@LOOP', payload: payload, line: lineNumber, children: [] };
      currentAst.push(newNode);
      stack.push(newNode.children);
      currentAst = newNode.children;
    } else if (upperCommand === '@TASK') {
      const taskNode: TaskNode = { type: '@TASK', payload: payload, line: lineNumber, children: [] };
      currentAst.push(taskNode);
      
      // Collect commands until empty line or end of file
      let j = i + 1;
      while (j < lines.length) {
        const taskLine = lines[j].trim();
        
        // Stop at empty line
        if (!taskLine) {
          break;
        }
        
        // Skip comments
        if (taskLine.startsWith('#')) {
          j++;
          continue;
        }
        
        // Parse the command line
        const [taskCommand, ...taskRest] = taskLine.split(/\s+/);
        const taskPayload = taskRest.join(' ');
        const taskLineNumber = j + 1;
        const taskUpperCommand = taskCommand.toUpperCase();
        
        // Handle shell commands
        if (taskLine.startsWith('>')) {
          const shellNode: ShellNode = {
            type: '>',
            payload: taskLine.substring(1).trim(),
            line: taskLineNumber
          };
          taskNode.children.push(shellNode);
        } else {
          // Handle other commands
          const node = createNodeByType(taskUpperCommand, taskPayload, taskLineNumber);
          if (node) {
            taskNode.children.push(node);
          } else {
            console.warn(`Unknown command "${taskUpperCommand}" at line ${taskLineNumber} in task "${payload}"`);
          }
        }
        
        j++;
      }
      
      // Skip processed lines
      i = j - 1;
    } else if (upperCommand === '@FILL') {
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
    } else if (upperCommand === '@END' || upperCommand === '@ENDLOOP') {
      if (stack.length <= 1) {
        throw new Error(`${upperCommand} at line ${lineNumber} without corresponding opening block`);
      }
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
        // Handle specific command types directly
        const node = createNodeByType(upperCommand, payload, lineNumber);
        if (node) {
          currentAst.push(node);
        } else {
          console.warn(`Unknown command "${upperCommand}" at line ${lineNumber}`);
        }
      }
    }
  }

  return { metadata, ast: mainAst };
}

/**
 * Creates a node of the specified type with proper typing
 */
function createNodeByType(command: string, payload: string, line: number): AstNode | null {
  switch (command) {
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
    case '@FILL':
      return { type: '@FILL', payload, line, content: [] };
    case '@IMPORT':
      return { type: '@IMPORT', payload, line };
    case '@IF':
      return { type: '@IF', payload, line, children: [], elseifBlocks: [] };
    case '@LOOP':
      return { type: '@LOOP', payload, line, children: [] };
    case '@TASK':
      return { type: '@TASK', payload, line, children: [] };
    case '>':
      return { type: '>', payload, line };
    default:
      return null;
  }
}

/**
 * Parses the front matter metadata from the content
 */
function parseFrontMatter(content: string): { metadata: Metadata; content: string } {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    return { metadata: {}, content };
  }
  
  const [, frontMatterText, remainingContent] = match;
  const metadata: Metadata = {};
  
  try {
    const lines = frontMatterText.split('\n');
    let currentKey = '';
    let inArray = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      if (trimmedLine.endsWith(':')) {
        // Start of array
        currentKey = trimmedLine.slice(0, -1).trim();
        if (trimmedLine.includes('[')) {
          inArray = true;
          const arrayContent = trimmedLine.substring(trimmedLine.indexOf('[') + 1);
          if (arrayContent.includes(']')) {
            // Single line array
            const content = arrayContent.substring(0, arrayContent.indexOf(']'));
            (metadata as any)[currentKey] = content.split(',').map(s => s.trim().replace(/['"]/g, ''));
            inArray = false;
          } else {
            (metadata as any)[currentKey] = [];
          }
        } else {
          // Simple property, will be handled in the else if below
          inArray = false;
        }
      } else if (inArray && trimmedLine.includes(']')) {
        // End of array
        const content = trimmedLine.substring(0, trimmedLine.indexOf(']'));
        if (content.trim()) {
          ((metadata as any)[currentKey] as string[]).push(...content.split(',').map(s => s.trim().replace(/['"]/g, '')));
        }
        inArray = false;
      } else if (inArray) {
        // Array item
        const items = trimmedLine.split(',').map(s => s.trim().replace(/['"]/g, ''));
        ((metadata as any)[currentKey] as string[]).push(...items);
      } else if (!inArray && trimmedLine.includes(':')) {
        // Simple key-value pair
        const [key, value] = trimmedLine.split(':').map(s => s.trim());
        if (key && value) {
          if (value.startsWith('[') && value.endsWith(']')) {
            // Array value
            const arrayContent = value.slice(1, -1);
            (metadata as any)[key] = arrayContent.split(',').map(s => s.trim().replace(/['"]/g, ''));
          } else {
            (metadata as any)[key] = value.replace(/['"]/g, '');
          }
        }
      }
    }
  } catch (error) {
    console.warn('Warning: Failed to parse front matter metadata');
  }
  
  return { metadata, content: remainingContent };
}
