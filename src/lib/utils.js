import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Utility function to replace variables in text
export function replaceEnvVariables(text, environment) {
    if (!text || !environment) return text;

    let result = text;
    environment.variables.forEach(({ key, value }) => {
        if (key) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            const val = String(value);
            result = result.replace(regex, () => val);
        }
    });
    // Fix double slashes except protocol
    result = result.replace(/([^:])\/\/+/g, '$1/');
    return result;
}
