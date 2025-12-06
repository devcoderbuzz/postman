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
            result = result.replace(regex, value);
        }
    });
    return result;
}
