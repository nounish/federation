export const cleanName = (name) => {
  return name.replace(/ /g, "-").toLowerCase();
};

export const cleanURL = (url) => {
  return url.replace(/(^\w+:|^)\/\//, "");
};

const errorMsgRegex = /'(.*?)'/g;
export const parseError = (error) => {
  if (error?.reason === "") {
    return "";
  }

  // capitalize error message
  const msg = error.reason?.match(errorMsgRegex);
  if (msg) {
    let ret = msg[0].replaceAll("'", "");
    return ret.charAt(0).toUpperCase() + ret.slice(1);
  }

  const reversionMsg = error.reason?.replace("execution reverted: ", "");
  if (reversionMsg) {
    return reversionMsg.charAt(0).toUpperCase() + reversionMsg.slice(1);
  }

  console.error("parseError", error);
  return "An error occured";
};
