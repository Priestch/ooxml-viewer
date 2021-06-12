import prettier from 'prettier/standalone'
import xmlPlugin from '@prettier/plugin-xml'

export function formatXML(value) {
  return prettier.format(value, {
    parser: 'xml',
    plugins: [xmlPlugin],
    xmlWhitespaceSensitivity: 'ignore',
  })
}
