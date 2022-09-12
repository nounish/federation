export const cleanName = (name) => {
  return name.replace(/ /g, "-").toLowerCase();
};

export const cleanURL = (url) => {
  return url.replace(/(^\w+:|^)\/\//, "");
};
