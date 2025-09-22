export type AstNode = {
  type: string;
  payload: any;
  line: number;
  children?: AstNode[];
};

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
      const newNode: AstNode = { type: 'IF', payload: payload, line: lineNumber, children: [] };
      currentAst.push(newNode);
      stack.push(newNode.children!);
      currentAst = newNode.children!;
    } else if (upperCommand === 'FOREACH') {
        const newNode: AstNode = { type: 'FOREACH', payload: payload, line: lineNumber, children: [] };
        currentAst.push(newNode);
        stack.push(newNode.children!);
        currentAst = newNode.children!;
    } else if (upperCommand === 'ENDIF' || upperCommand === 'ENDFOREACH') {
        stack.pop();
        currentAst = stack[stack.length - 1];
    } else {
        let nodeType = upperCommand;
        let nodePayload = payload;
        if (line.startsWith('>')) {
            nodeType = '>';
            nodePayload = line.substring(1).trim();
        } else {
            const parts = line.split(/\s+/);
            nodeType = parts[0].toUpperCase();
            nodePayload = parts.slice(1).join(' ');
        }

        currentAst.push({
            type: nodeType,
            payload: nodePayload,
            line: lineNumber
        });
    }
  }

  return mainAst;
}
