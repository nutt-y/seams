import {
  type Asset,
  Project,
  type Signifier,
  setLogger,
} from "@bscotch/gml-parser";
import { pathy } from "@bscotch/pathy";
import type winston from "winston";

export class GMLProject {
  // The project instance that can be initialized
  private project: Project | null = null;

  // The logger instance to use
  private logger: winston.Logger;

  // The extension of a gml project type
  private readonly projectExtension: string = "yyp";

  /**
   * Create an instance of the gml project for getting the necessary
   * content
   *
   * @param logger The logger to use
   */
  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  /**
   * Initialize the project by reading the root `.yyp` folder
   * @param path The path for the project file
   * @returns True if the project was initailized correctly
   */
  public async initializeProject(path: string): Promise<boolean> {
    let status = false;

    // TODO: Make sure that you can find the .yyp file and the main folder for it
    this.logger.info(`Path: ${path}`);
    for (const f of Deno.readDirSync(path)) {
      const name = f.name;
      const extension = name.split(".").pop();

      try {
        if (extension === this.projectExtension) {
          // Set the logging
          setLogger({
            log: (...args: string[]) => this.logger.info(`[GML LOG]: ${args}`),
            debug: (...args: string[]) =>
              this.logger.debug(`[GML DEBUG]: ${args}`),
            info: (...args: string[]) =>
              this.logger.info(`[GML INFO]: ${args}`),
            warn: (...args: string[]) =>
              this.logger.warn(`[GML WARN]: ${args}`),
            error: (...args: string[]) =>
              this.logger.error(`[GML ERROR]: ${args}`),
            dir: (obj) => this.logger.info(obj),
          } as Parameters<typeof setLogger>[0]);

          this.project = await Project.initialize(`${path}/${name}`);

          // Initialize the project
          if (this.project) {
            this.logger.info(`GML Project ${name} Initialized`);
            status = true;
          }

          break;
        }
      } catch (error) {
        this.logger.info(`Error initializing project: ${error}`);
      }
    }

    return status;
  }

  /**
   * Add a document to the list of already opened documents
   */
  public addDocument() {}

  /**
   * Given the file path, return an object with the file
   * @param path The file's path
   */
  public getFile(
    path: string,
  ): ReturnType<(typeof Project.prototype)["getGmlFile"]> | null {
    let file: ReturnType<(typeof Project.prototype)["getGmlFile"]> | null =
      null;

    try {
      const p = pathy(path);
      file = this.project?.getGmlFile(p);
    } catch (error) {
      this.logger.error(`Error in GMLProject.getFile: ${error}`);
    }

    return file ?? null;
  }

  /**
   * Get the object that contains information about all builtin symbols
   */
  public getBuiltInSymbols(): Project["native"] | null {
    let symbols: Project["native"] | null = null;

    try {
      const native = this.project?.native;

      symbols = native ?? null;
    } catch (error) {
      this.logger.error("Error in GMLProject.getBuiltInSymbols: ", error);
    }

    return symbols;
  }

  /**
   * Get a completion list given the line and column
   * @param file The file stype
   * @param line The line (with offset of 1)
   * @param column The column (with offset of 1)
   * @returns The symbols available from that position and file
   */
  public getCompletionList(
    file: ReturnType<(typeof Project.prototype)["getGmlFile"]>,
    line: number,
    column: number,
  ): Signifier[] {
    const symbols = file?.getInScopeSymbolsAt(line, column);

    return symbols ?? [];
  }

  /**
   * Get assets given a resource name
   * @param name The name of the resource to get the asset for
   * @return the asset if it exists, else it's null
   */
  public getAssets<T extends Asset>(name: string): T | null {
    const asset = this.project?.getAssetByName(name) ?? null;

    return asset as T;
  }
}

export default GMLProject;
