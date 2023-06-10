/**
 * Build a website from Markdown files.
 * @author Zachary K. Watkins
 * @license MIT
 * @version 0.1.0
 */
import fs from 'fs'
import { marked } from 'marked'
import { gfmHeadingId } from 'marked-gfm-heading-id'
marked.use({ gfm: true, async: true })
marked.use(gfmHeadingId())

/**
 * Builds a web page from a Markdown file.
 * @param {string} source - Path to the Markdown file to build.
 * @param {string} newRoot - New root directory for the built page.
 * @returns {Promise} A promise that resolves when the page has been built.
 */
export function build (source, newRoot) {

    const route = getRoute(source)
    const depth = route.split('/').length - 1
    const destDirectory = newRoot + '/' + route
    const destination = destDirectory + 'index.html'
    const pageTitle = parsePageTitle(route)
    const content = fs.readFileSync(source, 'utf8')

    marked.parse(content, { mangle: false }).then((markdownHtml) => {

        markdownHtml = applyTemplate(markdownHtml, depth, pageTitle)
        markdownHtml = replaceMarkdownFileReferences(markdownHtml, destination)

        if (!fs.existsSync(destDirectory)) {
            fs.mkdirSync(destDirectory, { recursive: true })
        }

        fs.writeFileSync(destination, markdownHtml)

    })

}

/**
 * List words that should be lowercase in page titles.
 */
const lowercaseWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'with']

/**
 * Convert a file path into a web page title using title case.
 * @param {string} path - File path.
 * @returns {string} The page title.
 */
function parsePageTitle (path) {

    if (!path) {
        return 'Home'
    }

    return path
        .replace(/index\.html$/, '')
        .replace(/\/$/, '')
        .replace(/\.html$/, '')
        .replaceAll('-', ' ')
        .replaceAll('_', ' ')
        .split('/')
        .pop()
        .split(' ')
        .map((word) => {
            const lower = word.toLowerCase()
            if (lowercaseWords.includes(lower)) {
                return lower
            }
            return word.charAt(0).toUpperCase() + word.slice(1)
        })
        .join(' ')

}

/**
 * Replace Markdown file references with HTML file references.
 * @param {string} html - The HTML to search.
 * @param {string} destination - The destination of the HTML file.
 * @returns {string} The HTML with the Markdown file references replaced.
 */
function replaceMarkdownFileReferences (html, destination) {

    let markdownRef = getMarkdownFileReference(html)
    while (markdownRef) {
        let newRef = getRoute(markdownRef[1], destination)
        if (markdownRef[2]) {
            newRef += markdownRef[2]
        }
        html = html.replace(markdownRef[0], `href="${newRef}"`)
        markdownRef = getMarkdownFileReference(html)
    }

    return html

}

/**
 * Format a Markdown file path into a destination HTML file path.
 * Files in the "content" directory will not include that directory in their destination path.
 * Files without a file extension will be treated as markdown files.
 * Underscores will be replaced with hyphens.
 * @param {string} path - Markdown file path.
 * @param {string} [documentPath] - Path to the document that contains the Markdown file path.
 * @returns {string} Directory where the file should be copied to as `index.html`.
 */
function getRoute (path, documentPath) {

    path = path.toLowerCase()

    if ('readme.md' !== path) {
        return path.toLowerCase().replaceAll('_', '-').replace(/^(\.\/)?content\//, '').replace(/\.md$/, '') + '/'
    }

    return !documentPath ? '' : '../'

}

/**
 * Get the first Markdown file reference from the HTML string.
 * @param {string} html - The HTML to search.
 * @returns {string} The first Markdown file reference.
 */
function getMarkdownFileReference (html) {
    return html.match(/\bhref="(?!#)(?!http)([^"]+\.md)(#[a-zA-Z0-9\-_]+)?"/)
}

/**
 * Get the template object used to convert a Markdown file to a web page.
 * @param {Object} options - The template options.
 * @param {number} options.depth - The depth of the web page file in the directory structure.
 * @param {string} options.title - The title of the web page.
 * @returns {Object} The template object.
 */
function template({ depth, title }) {

    if (!title || 'Home' === title) {
        title = 'GitHub Guide'
    } else {
        title = title + ' - GitHub Guide'
    }

    const relativeRootDirectoryPrefix = !depth ? './' : '../'.repeat(depth)

    return {
        pre: `<!doctype html>
            <html lang="en-US">
                <head>
                    <meta charset="utf-8"/>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <link rel="stylesheet" href="${relativeRootDirectoryPrefix}styles/github-markdown-css/github-markdown.css">
                    <title>${title}</title>
                    <style>
                        .markdown-body {
                            box-sizing: border-box;
                            min-width: 200px;
                            max-width: 980px;
                            margin: 0 auto;
                            padding: 45px;
                        }

                        .markdown-body a {
                            text-decoration: underline;
                        }

                        @media (max-width: 767px) {
                            .markdown-body {
                                padding: 15px;
                            }
                        }
                    </style>
                </head>
                <body class="markdown-body">`,
        post: `</body></html>`,
    }

}

/**
 * Apply a webpage template to the Markdown content.
 * @param {string} markdownHtml - The HTML generated from the Markdown content.
 * @param {number} depth - The depth of the web page file in the directory structure.\
 * @param {string} title - The title of the web page.
 * @returns {string} The HTML with the template applied.
 */
function applyTemplate (markdownHtml, depth, title) {

    const template = template({ depth, title })

    return template.pre + markdownHtml + template.post

}

export default build
