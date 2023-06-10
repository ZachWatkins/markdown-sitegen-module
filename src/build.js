/**
 * Build a static website from assets and Markdown files.
 * @author Zachary K. Watkins
 * @license MIT
 * @version 0.1.0
 */
import fs from 'fs'
import Factory from './factory.mjs'

/**
 * Builds a set of web pages from Markdown files and copies assets to a specified directory.
 * @param {Object} options - The build options.
 * @param {Array} options.markdown - An array of Markdown files to build.
 * @param {Array} options.assets - An array of asset files to copy.
 * @param {string} options.directory - The directory to output the built files to.
 * @returns {void}
 */
function build({ markdown, assets, directory }) {

    const queue = []

    if (fs.existsSync(directory)) {
        fs.rmSync(directory, { recursive: true })
    }

    for (let i = 0; i < assets.length; i++) {

        queue.push(new Promise((resolve) => {

            const source = assets[i][0]
            const destination = directory + '/' + assets[i][1]
            const destDirectory = destination.substring(0, destination.lastIndexOf('/'))

            if (!fs.existsSync(destDirectory)) {
                fs.mkdirSync(destDirectory, { recursive: true })
            }

            resolve(fs.copyFileSync(source, destination))

        }))

    }

    for (let i = 0; i < markdown.length; i++) {

        queue.push(new Promise((resolve) => {

            resolve(Factory.build(markdown[i], directory))

        }))

    }

    Promise.all(queue)

}

export default build
