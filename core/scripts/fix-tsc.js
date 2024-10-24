import fs from "fs";

const dist = "./dist";

const fixPaths = (path) => {
  // chop off leading dist
  const relativePath = path.replace(`${dist}/`, "");

  // calculate how many levels deep this path is
  const levels = relativePath.split("/").length - 1;

  // read the file
  const content = fs.readFileSync(path, "utf8");

  // replace all import and export paths
  const newContent = content.replace(
    /from "@\//g,
    `from "${levels === 0 ? "./" : "../".repeat(levels)}`,
  );

  // write the file
  fs.writeFileSync(path, newContent, "utf8");
};

// walk /dist directory
const walk = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const path = `${dir}/${file}`;

    // if it's a directory, walk it
    if (fs.statSync(path).isDirectory()) {
      walk(path);
      return;
    }

    // if it's a .d.ts or .js file, fix paths
    if (file.endsWith(".d.ts") || file.endsWith(".js")) {
      fixPaths(path);
    }
  });
};

walk(dist);
