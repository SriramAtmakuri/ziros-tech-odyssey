// Self-host Monaco entirely from node_modules instead of @monaco-editor/react's
// default CDN loader — the game must be fully playable offline, no external
// services, per the project requirements.
import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new JsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker()
    return new EditorWorker()
  },
}

loader.config({ monaco })

// Our own challenge.check() functions do real validation — Monaco's built-in
// JSON/CSS schema validation would only add unused squiggles, so turn it off.
monaco.languages.json.jsonDefaults.setDiagnosticsOptions({ validate: false })
monaco.languages.css.cssDefaults.setDiagnosticsOptions({ validate: false })
