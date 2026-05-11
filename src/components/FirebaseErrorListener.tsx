'use client';
import React, { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

export function FirebaseErrorListener() {
    useEffect(() => {
        const handleError = (error: Error) => {
            if (process.env.NODE_ENV === 'development') {
                // In development, we want to see the error overlay from Next.js
                // Throwing the error here will cause it to be caught by the overlay.
                // We use a timeout to break out of the current event loop.
                setTimeout(() => {
                    throw error;
                });
            } else {
                // In production, you might want to log this to a service like Sentry.
                console.error("Caught a Firebase permission error:", error);
            }
        };

        errorEmitter.on('permission-error', handleError);

        return () => {
            errorEmitter.removeListener('permission-error', handleError);
        };
    }, []);

    return null; // This component does not render anything.
}
