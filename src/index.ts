import fs from "fs";
import path from "path";
import colors from "ansi-colors";
import { program } from "commander";

const PATH = process.cwd();

async function main() {
    program
        .name(colors.yellow.bold("cjs-fixer"))
        .usage(
            `${colors.green.bold("[option]")} ${colors.blue.bold("[value]")}`
        )
        .description("Cli tool to fix commonjs exports")
        .option("-d, --dir <directory>")
        .option("-f, --file <file>");

    // check if no args
    if (process.argv.length < 3) {
        program.help();
    }
    // parse argv
    program.parse(process.argv);

    // program options
    const options = program.opts();

    // check if dir or file is provided
    if (!options.dir && !options.file) {
        console.log(colors.red.bold("\nPlease provide a directory or file\n"));
        program.help();
    }
    // check if both dir and file are provided
    if (options.dir && options.file) {
        console.log(
            colors.red.bold("\nPlease provide only one directory or file\n")
        );
        program.help();
    }

    // Directory
    // check if dir exists
    if (options.dir) {
        const dir = options.dir === "." ? PATH : path.join(PATH, options.dir);
        if (!fs.existsSync(dir)) {
            console.log(colors.red.bold(`\nDirectory ${dir} does not exist\n`));
            process.exit(0);
        }

        // fixed counter
        let fixedCounter = 0;
        // read dir
        const files = fs.readdirSync(dir);

        // check if dir is empty
        if (files.length === 0) {
            colors.red.bold(`\nDirectory ${dir} is empty\n`);
            process.exit(0);
        }

        // fix files
        for (const file of files) {
            if (!file.endsWith(".js")) {
                continue;
            }
            // fix file
            const result = fixCjsExports(path.join(dir, file));

            // increment fixed counter
            if (result) {
                fixedCounter++;
            }
        }

        // log success
        console.log(
            colors.green.bold(
                `\n${colors.yellow(fixedCounter + "")} files are fixed${
                    fixedCounter > 0 ? " successfully" : ""
                }.\n`
            )
        );
    }

    // File
    // check if file exists
    if (options.file) {
        const file = path.join(PATH, options.file);
        if (!fs.existsSync(file)) {
            console.log(
                colors.red.bold(`\nFile ${getFileName(file)} does not exist.`)
            );
            process.exit(0);
        }
        if (!file.endsWith(".js")) {
            console.log(
                colors.red.bold(
                    `\nFile ${getFileName(file)} is not a javascript file.`
                )
            );
            process.exit(0);
        }
        // fix file
        fixCjsExports(file);
    }

    // log success
    console.log(colors.green.bold("\nAll done.\n"));

    // exit process
    process.exit(0);
}

function fixCjsExports(file: string) {
    // read file
    const fileContent = fs.readFileSync(file, "utf8");
    // regex to match exports.default || module.exports.default
    const regex = /(module\.)?exports\.default/g;

    // test if file has exports.default
    if (!regex.test(fileContent)) {
        console.log(
            colors.red(`${getFileName(file)} does not have exports.default`)
        );
        return false;
    }

    // replace exports.default with module.exports
    const fixedContent = fileContent.replace(regex, "module.exports");

    // write fixed content to file
    fs.writeFileSync(file, fixedContent, "utf8");

    // log success
    console.log(
        colors.green(
            `\n${getFileName(file)} is checked and fixed successfully.`
        )
    );
    return true;
}

// get file name from path
function getFileName(file: string): string {
    return path.basename(file);
}

main().catch((err) => {
    console.error(err);
});
