import * as R from "ramda";

// the following parsing logic is adapted from
// https://raw.githubusercontent.com/nounsDAO/nouns-monorepo/master/packages/nouns-webapp/src/wrappers/nounsDao.ts
const hashRegex = /^\s*#{1,6}\s+([^\n]+)/;
const equalTitleRegex = /^\s*([^\n]+)\n(={3,25}|-{3,25})/;

/**
 * Extract a markdown title from a proposal body that uses the `# Title` format
 * Returns null if no title found.
 */
const extractHashTitle = (body) => body.match(hashRegex);
/**
 * Extract a markdown title from a proposal body that uses the `Title\n===` format.
 * Returns null if no title found.
 */
const extractEqualTitle = (body) => body.match(equalTitleRegex);

/**
 * Extract title from a proposal's body/description. Returns null if no title found in the first line.
 * @param body proposal body
 */
const extractTitle = (body) => {
  if (!body) return null;
  const hashResult = extractHashTitle(body);
  const equalResult = extractEqualTitle(body);
  return hashResult ? hashResult[1] : equalResult ? equalResult[1] : null;
};

const removeBold = (text) => (text ? text.replace(/\*\*/g, "") : text);
const removeItalics = (text) => (text ? text.replace(/__/g, "") : text);
const removeMarkdownStyle = R.compose(removeBold, removeItalics);

export const parseDescription = (desc = "") => {
  const d = desc.replace(/\\n/g, "\n").replace(/(^['"]|['"]$)/g, "");
  return {
    title: R.pipe(extractTitle, removeMarkdownStyle)(d) ?? "Untitled",
    desc: d ?? "No description.",
  };
};
