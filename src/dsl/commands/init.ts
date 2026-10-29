import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initCommand(): Promise<void> {
  const currentDir = process.cwd();
  const outputFile = path.join(currentDir, 'template.gen');
  
  // Check if template.gen already exists
  if (fs.existsSync(outputFile)) {
    console.log('⚠️  template.gen already exists in current directory');
    console.log('Use a different name or remove the existing file first');
    return;
  }
  
  try {
    // Find the base template - adjust path for new location
    const templatePath = path.resolve(__dirname, '../../../templates/base.gen');
    
    if (!fs.existsSync(templatePath)) {
      console.log('❌ Base template not found at:', templatePath);
      return;
    }
    
    // Read and copy the base template
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    fs.writeFileSync(outputFile, templateContent);
    
    console.log('✅ Created template.gen in current directory');
    console.log('📝 Edit template.gen to customize your project setup');
    console.log('🚀 Run with: gen --file <name>.gen --output ./my-project');
    
  } catch (error) {
    console.log('❌ Error creating template.gen:', error);
  }
}
