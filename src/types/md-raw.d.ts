// Type declarations for importing Markdown files with Vite's ?raw option
declare module '*.md?raw' {
  const content: string;
  export default content;
}

// Optional: plain .md imports (in case ?raw is omitted)
declare module '*.md' {
  const content: string;
  export default content;
}