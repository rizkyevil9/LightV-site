import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const options = {};

args.forEach(arg => {
    if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=');
        options[key] = value || true;
    }
});

const { name, category } = options;

if (!name || !category) {
    console.error('Usage: npm run create-plugin -- --name=<pluginName> --category=<categoryName>');
    process.exit(1);
}

const template = `export default {
  name: "${name}",
  category: "${category}",
  aliases: ["${name.substring(0, 3)}"],
  description: "Description for ${name}",
  usage: "${name}",

  permissions: ["user"],

  async execute(ctx) {
    try {
      await ctx.reply("This is a newly created plugin: ${name}");
    } catch (err) {
      console.error(err);
      await ctx.reply("Error executing ${name}");
    }
  }
};
`;

const pluginDir = path.join(__dirname, '../../plugins', category);
if (!fs.existsSync(pluginDir)) {
    fs.mkdirSync(pluginDir, { recursive: true });
}

const filePath = path.join(pluginDir, `${name}.js`);

if (fs.existsSync(filePath)) {
    console.error(`Error: Plugin ${name} already exists in category ${category}.`);
    process.exit(1);
}

fs.writeFileSync(filePath, template);
console.log(`✅ Plugin ${name} created successfully at ${filePath}`);
