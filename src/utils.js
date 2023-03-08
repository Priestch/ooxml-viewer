import vkbeautify from "vkbeautify";
import prettier from "prettier/standalone";
import xmlPlugin from "@prettier/plugin-xml";

export function formatXML(value) {
  return prettier.format(value, {
    parser: "xml",
    plugins: [xmlPlugin],
    xmlWhitespaceSensitivity: "ignore",
  });
}

export function beautifyXML(value) {
  return vkbeautify.xml(value, 2);
}

export function minXML(text) {
  return vkbeautify.xmlmin(text, true);
}

export function createPromise() {
  let promiseResolve, promiseReject;

  const promise = new Promise((resolve, reject) => {
    promiseResolve = resolve;
    promiseReject = reject;
  });

  return {
    promise,
    resolve: promiseResolve,
    reject: promiseReject,
  };
}
