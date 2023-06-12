const fs = require("fs");
const path = require("path");
const { load } = require("cheerio");

const attributes = [
  "mat-button",
  "mat-flat-button",
  "mat-stroked-button",
  "mat-raised-button",
];

function convertMatButtonToTailwind(filePath) {
  const html = fs.readFileSync(filePath, "utf-8");
  return extractHtmlTags(html).reduce(
    (html, tag) => html.replace(tag, convertTag(tag)),
    html
  );
}

function convertTag(tag) {
  if (!attributes.some((a) => tag.includes(a))) return tag;

  const $ = load(tag, { xmlMode: true, decodeEntities: false });

  for (const attribute of attributes) {
    $(`[${attribute}]`).each((_, element) => {
      const $element = $(element);
      $element.addClass("btn");
      switch (attribute) {
        case "mat-button":
          $element.removeAttr("mat-button");
          break;
        case "mat-flat-button":
          $element.removeAttr("mat-flat-button");
          break;
        case "mat-stroked-button":
          $element.removeAttr("mat-stroked-button");
          $element.addClass("btn-outline");
          break;
        case "mat-raised-button":
          $element.removeAttr("mat-raised-button");
          break;
      }
      const color = $element.attr("color");
      $element.removeAttr("color");
      if (color) {
        switch (color) {
          case "basic":
            $element.addClass("btn-neutral");
            break;
          case "primary":
            $element.addClass("btn-primary");
            break;
          case "accent":
            $element.addClass("btn-accent");
            break;
          case "warn":
            $element.addClass("btn-warning");
            break;
        }
      }
    });
  }

  let newTag = $.html();
  newTag = newTag.replace(/(\W\w+)=""/gm, "$1");

  if (newTag.endsWith("/>") && tag.endsWith("/>")) {
    return newTag;
  } else {
    return newTag.slice(0, -2) + ">";
  }
}

function extractHtmlTags(html) {
  let openingTags = [];
  let tag = "";
  let inTag = false;
  let quote = null;

  for (const ch of [...html]) {
    if (!inTag && ch === "<") {
      inTag = true;
      tag += ch;
    } else if (inTag) {
      tag += ch;

      if (quote === null && (ch === '"' || ch === "'")) {
        quote = ch;
      } else if (quote !== null && ch === quote) {
        quote = null;
      } else if (quote === null && ch === ">") {
        openingTags.push(tag);
        tag = "";
        inTag = false;
      }
    }
  }

  return openingTags;
}

function convertFile(filePath) {
  const convertedData = convertMatButtonToTailwind(filePath);
  fs.writeFileSync(filePath, convertedData, "utf-8");
  console.log(`File converted successfully: ${filePath}`);
}

function processFiles(folderPath, processFile, processFolder, level = 0) {
  if (fs.existsSync(folderPath)) {
    // console.log(`folderPath: ${folderPath}`);
    fs.readdirSync(folderPath).forEach((file) => {
      const currentPath = path.join(folderPath, file);
      // console.log(`currentPath: ${currentPath}`);
      if (fs.lstatSync(currentPath).isDirectory()) {
        if (
          currentPath.endsWith("node_modules") ||
          currentPath.endsWith("dist")
        ) {
          return;
        }

        if (processFiles(currentPath, processFile, processFolder, level + 1)) {
          processFolder?.(currentPath);
        }
      } else {
        if (currentPath.endsWith(".html")) {
          processFile(currentPath, level);
        }
      }
    });
    return true;
  } else {
    console.log(`Could not find folderPath: ${folderPath}`);
    return false;
  }
}

module.exports = {
  processFiles,
  convertFile,
  convertTag,
  extractHtmlTags,
  extractHtmlTags,
};
