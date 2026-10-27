// Must match next.config.ts's `basePath`. In this Next.js version, basePath is NOT
// automatically applied to next/image `src`, raw `url()` CSS, or fetch() calls to
// same-origin API routes — those need to be prefixed manually.
export const BASE_PATH = "/sidi";

export function withBasePath(path: string) {
    return `${BASE_PATH}${path}`;
}
