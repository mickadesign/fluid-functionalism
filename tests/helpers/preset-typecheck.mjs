// Shared compile guard for the preset generators.
//
// Type-checking one preset means building a real TypeScript program over the
// repo — the project tsconfig, its path aliases, lib.d.ts, and every module
// the generated file imports — with the generated files injected as virtual
// ones. Building that program from scratch costs roughly a second, and each
// preset suite checks a whole matrix of presets, so the per-preset cost was
// what pushed CI past its 5s per-test timeout.
//
// Only the virtual files differ from one preset to the next. So the parsed
// config, the compiler host, and every parsed real SourceFile are built once
// per suite and reused; each later program re-parses only the handful of
// generated files. This is the same sharing tsserver does through a
// DocumentRegistry, and it is sound here because every program in a suite is
// created with identical compiler options.
import ts from "typescript";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.dirname(
  fileURLToPath(new URL("../../package.json", import.meta.url))
);

/** Every directory between `root` and each virtual file, so `directoryExists`
 *  answers for paths that only exist in the virtual map. */
function dirsOf(files) {
  return new Set(
    [...files].flatMap((f) => {
      const dirs = [];
      let d = path.dirname(f);
      while (d.startsWith(root) && d !== root) {
        dirs.push(d);
        d = path.dirname(d);
      }
      return dirs;
    })
  );
}

/**
 * Builds a typechecker bound to one set of compiler options.
 * @param {{ paths?: Record<string, string[]> }} [opts] extra path aliases,
 *   for a generator whose files import each other by alias.
 * @returns {(files: {target: string, content: string}[]) => string[]}
 *   the diagnostics for the generated files, empty when they compile.
 */
export function createPresetTypechecker({ paths: extraPaths } = {}) {
  let virtual = new Map();
  let virtualDirs = new Set();

  const configFile = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
  const options = {
    ...parsed.options,
    noEmit: true,
    skipLibCheck: true,
    paths: { ...parsed.options.paths, ...extraPaths },
    baseUrl: parsed.options.baseUrl ?? root,
  };

  const host = ts.createCompilerHost(options);
  const origReadFile = host.readFile.bind(host);
  const origFileExists = host.fileExists.bind(host);
  const origGetSourceFile = host.getSourceFile.bind(host);
  const origDirExists = (host.directoryExists ?? ts.sys.directoryExists).bind(
    host.directoryExists ? host : ts.sys
  );

  // Real repo and lib files are byte-identical for every preset, so each is
  // parsed once. Virtual files change per preset and are never cached.
  const sourceFileCache = new Map();

  host.readFile = (f) => virtual.get(path.normalize(f)) ?? origReadFile(f);
  host.fileExists = (f) => virtual.has(path.normalize(f)) || origFileExists(f);
  host.directoryExists = (d) => virtualDirs.has(path.normalize(d)) || origDirExists(d);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreate) => {
    const key = path.normalize(fileName);
    const content = virtual.get(key);
    if (content !== undefined) {
      return ts.createSourceFile(fileName, content, languageVersion, true);
    }
    const cached = sourceFileCache.get(key);
    if (cached) return cached;
    const file = origGetSourceFile(fileName, languageVersion, onError, shouldCreate);
    if (file) sourceFileCache.set(key, file);
    return file;
  };

  return function typecheck(files) {
    virtual = new Map(
      files.map((f) => [path.join(root, "__preset__", f.target), f.content])
    );
    virtualDirs = dirsOf(virtual.keys());
    const program = ts.createProgram([...virtual.keys()], options, host);
    // Ask for diagnostics per generated file rather than for the whole
    // program. The no-argument calls type-check every real repo module the
    // generated files reach, on every preset, and then we throw all of it
    // away in the filter below; scoping the request keeps the check to the
    // files under test and resolves the rest lazily.
    const diagnostics = [...virtual.keys()]
      .map((f) => program.getSourceFile(f))
      .filter(Boolean)
      .flatMap((sf) => [
        ...program.getSyntacticDiagnostics(sf),
        ...program.getSemanticDiagnostics(sf),
      ])
      .filter((d) => d.file && virtual.has(path.normalize(d.file.fileName)));
    return diagnostics.map(
      (d) =>
        `${path.basename(d.file.fileName)}:${
          d.file.getLineAndCharacterOfPosition(d.start).line + 1
        } ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`
    );
  };
}
