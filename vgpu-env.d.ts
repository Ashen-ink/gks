declare module "*.wgsl" {
  const shader: { readonly version: 1; readonly wgsl: string };
  export default shader;
}
