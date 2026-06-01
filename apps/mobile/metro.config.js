const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Expo Go charge toujours node_modules/expo/AppEntry.js qui fait `import '../../App'`.
// Dans un monorepo, ce chemin pointe vers la racine du workspace, pas apps/mobile/.
// On redirige vers le vrai App.tsx de l'application.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    context.originModulePath.includes(`node_modules${path.sep}expo${path.sep}AppEntry`) &&
    moduleName === '../../App'
  ) {
    return {
      filePath: path.resolve(projectRoot, 'App.tsx'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
