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

export function formatXMLBeautify(value) {
  return vkbeautify.xml(value, 2);
}
