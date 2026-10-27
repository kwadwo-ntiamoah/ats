type ProblemDetailsError = {
    title?: string;
    errors?: Record<string, string[]>;
};

export function getApiErrorMessage(data: unknown, fallback = "Something went wrong. Please try again."): string {
    if (!data || typeof data !== "object") return fallback;

    const problem = data as ProblemDetailsError;

    // Pull the first validation message out of `errors`, if present
    if (problem.errors) {
        const firstField = Object.values(problem.errors)[0];
        if (Array.isArray(firstField) && firstField.length > 0) {
            return firstField[0];
        }
    }

    // Fall back to the general title (e.g. "One or more validation errors occurred.")
    if (typeof problem.title === "string") {
        return problem.title;
    }

    return fallback;
}