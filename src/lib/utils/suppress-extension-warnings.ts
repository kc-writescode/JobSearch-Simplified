/**
 * Utility to suppress known hydration warnings caused by browser extensions
 * This should only be used in development to reduce noise from third-party interference
 */

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const originalError = console.error;
    console.error = (...args) => {
        const errorMessage = args[0];

        // Suppress hydration warnings caused by browser extensions
        if (
            typeof errorMessage === 'string' &&
            (
                errorMessage.includes('bis_skin_checked') ||
                errorMessage.includes('Hydration') && errorMessage.includes('browser extension')
            )
        ) {
            // Log a simplified warning instead
            console.warn('⚠️ Browser extension detected - may cause hydration warnings. Consider disabling extensions for development.');
            return;
        }

        // Pass through all other errors
        originalError.apply(console, args);
    };
}

export { };
