import vkbeautify from 'vkbeautify';
import prettier from 'prettier/standalone'
import xmlPlugin from '@prettier/plugin-xml'

export function formatXML(value) {
  return prettier.format(value, {
    parser: 'xml',
    plugins: [xmlPlugin],
    xmlWhitespaceSensitivity: 'ignore',
  })
}

export function beautifyXML(value) {
  return vkbeautify.xml(value, 2);
}

export function minXML(text) {
  return vkbeautify.xmlmin(text, true);
}
