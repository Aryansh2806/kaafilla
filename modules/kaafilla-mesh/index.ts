// Typed native binding. NOTE: importing this eagerly calls requireNativeModule,
// which throws on a build without the native module. The app talks to the mesh
// through the guarded facade in src/mesh (requireOptionalNativeModule), not this
// barrel — import only the *types* from here elsewhere.
export { default } from './src/KaafillaMeshModule';
export * from './src/KaafillaMesh.types';
