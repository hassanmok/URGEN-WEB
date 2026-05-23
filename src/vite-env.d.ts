/// <reference types="vite/client" />

declare module '*.woff2?url' {
  const url: string
  export default url
}

declare module '*.pdf?url' {
  const url: string
  export default url
}

declare module '*.png?url' {
  const url: string
  export default url
}

declare module '*.ttf?url' {
  const url: string
  export default url
}

declare module '*?url' {
  const url: string
  export default url
}
