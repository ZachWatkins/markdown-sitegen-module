/**
 * Build Markdown into HTML.
 * @author Zachary K. Watkins
 * @license MIT
 * @version 0.1.0
 */
import fs from 'fs'
import build from './src/build.mjs'

const HELP = `Usage: node scripts/md-site [options]
Options:
  --config=FILE               A JSON configuration file for argument values.
  --assets=FILE1,FILE2,...    A comma-separated list of asset files to copy.
  --markdown=FILE1,FILE2,...  A comma-separated list of Markdown files to build.
  --directory=DIR             The directory to output the built files to. Defaults to 'build'.
  --help, -h                  Show this help message and exit.`

const argList = ['assets', 'markdown', 'directory', 'config', 'help', 'h']

const args = {
    assets: [],
    markdown: [],
    directory: 'build',
}

if (process.argv.length === 2 || process.argv.indexOf('--help') >= 0 || process.argv.indexOf('-h') >= 0) {
    console.log(HELP)
    process.exit(0)
}

// Iterate over each argument and collect the values.
// Check for errors while doing so.
const passedArgs = {}
let config = null
for (let i = 2; i < process.argv.length; i++) {
    const [key, value] = process.argv[i].split('=')
    const arg = key.startsWith('--') ? key.substring(2) : key.substring(1)
    if (-1 === argList.indexOf(arg)) {
        console.error(`Error: Unknown argument '${key}'. For help, run \`node scripts/md-site --help\`.`)
        process.exit(1)
    }
    if (value === undefined || !value.length) {
        console.error(`Error: Argument '${key}' requires a value. For help, run \`node scripts/md-site --help\`.`)
        process.exit(1)
    }
    switch(arg) {
    case 'assets':
    case 'markdown':
        passedArgs[arg] = value.split(',')
        break
    case 'directory':
        passedArgs[arg] = value
        break
    case 'config':
        config = value
        break
    case 'help':
    case 'h':
        console.log(HELP)
        process.exit(0)
    }
}

// If a configuration file was passed, use it to fill in missing CLI arguments.
if (config) {
    const config = JSON.parse(fs.readFileSync(config, 'utf8'))
    for (const key in config) {
        if (args[key] === undefined) {
            console.error(`Error: Unknown argument '${key}' in configuration file. Please check the configuration file and try again. For help, run \`node scripts/md-site --help\`.`)
            process.exit(1)
        }
        if (passedArgs[key] === undefined) {
            passedArgs[key] = config[key]
        }
    }
}

// Validate the resolved argument values.
for (const key in passedArgs) {
    switch(key) {
    case 'assets':
    case 'markdown':
        if (!Array.isArray(passedArgs[key])) {
            console.error(`Error: Argument '${key}' must be an array of file paths. For help, run \`node scripts/md-site --help\`.`)
            process.exit(1)
        } else {
            for (let i = 0; i < passedArgs[key].length; i++) {
                if (typeof passedArgs[key][i] !== 'string') {
                    console.error(`Error: Argument '${key}' must be an array of file paths. For help, run \`node scripts/md-site --help\`.`)
                    process.exit(1)
                    break
                }
            }
        }
        break
    case 'directory':
        if (passedArgs[key] !== undefined && (typeof passedArgs[key] !== 'string' || !passedArgs[key].length)) {
            console.error(`Error: Argument '${key}' must be a directory name. For help, run \`node scripts/md-site --help\`.`)
            process.exit(1)
        }
        break
    }
}

// Assign the resolved argument values to the args object.
for (const key in args) {
    if (passedArgs[key] !== undefined) {
        args[key] = passedArgs[key]
    }
}

// Execute the build script.
build(args)
