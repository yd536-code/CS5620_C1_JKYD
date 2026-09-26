const CracoAlias = require("craco-alias");

/**
 * Keep class and function names in production builds.
 *
 * CRA's default terser config mangles class names (to `t`, `e`, ...) in a
 * normal `craco build`. AniGraph reads class names at runtime:
 * `GetClassLabel` (src/anigraph/base/aserial/ASerializable.ts) falls back to
 * `constructor.name` for any class without an `@ALabel`/`@ASerializable`
 * label, and interaction modes use that label as the name they're stored
 * and activated under. With mangled names, a mode a student forgot to label
 * would show up as "t" in the GUI, couldn't be activated by its written
 * name, and could collide with another class that got the same short name.
 * Keeping names makes that fallback safe in production too. Cost: a slightly
 * larger bundle.
 */
function keepClassNames(webpackConfig) {
  const minimizers = webpackConfig.optimization?.minimizer ?? [];
  for (const plugin of minimizers) {
    if (plugin?.constructor?.name !== "TerserPlugin") {
      continue;
    }
    // terser-webpack-plugin v5 stores its terserOptions here.
    const terserOptions = plugin.options?.minimizer?.options;
    if (terserOptions) {
      terserOptions.keep_classnames = true;
      terserOptions.keep_fnames = true;
    }
  }
  return webpackConfig;
}

module.exports = {
  webpack: {
    configure: keepClassNames,
  },
  plugins: [
    {
      plugin: CracoAlias,
      options: {
        source: "tsconfig",
        // baseUrl SHOULD be specified
        // plugin does not take it from tsconfig
        baseUrl: "./src",
        /* tsConfigPath should point to the file where "baseUrl" and "paths"
                        are specified*/
        tsConfigPath: "./tsconfig.paths.json",
      },
    },
  ],
};
