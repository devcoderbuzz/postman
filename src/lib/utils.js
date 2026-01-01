import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { faker } from '@faker-js/faker';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const dynamicAliases = {
    '$guid': () => faker.string.uuid(),
    '$timestamp': () => Math.floor(Date.now() / 1000).toString(),
    '$isoTimestamp': () => new Date().toISOString(),
    '$randomInt': () => faker.number.int({ max: 1000 }).toString(),
    '$randomFirstName': () => faker.person.firstName(),
    '$randomLastName': () => faker.person.lastName(),
    '$randomFullName': () => faker.person.fullName(),
    '$randomEmail': () => faker.internet.email(),
    '$randomUserName': () => faker.internet.userName(),
    '$randomPassword': () => faker.internet.password(),
    '$randomPhoneNumber': () => faker.phone.number(),
    '$randomCity': () => faker.location.city(),
    '$randomCountry': () => faker.location.country(),
    '$randomStreetAddress': () => faker.location.streetAddress(),
    '$randomColor': () => faker.color.human(),
    '$randomWord': () => faker.lorem.word(),
    '$randomSentence': () => faker.lorem.sentence(),
    '$randomParagraph': () => faker.lorem.paragraph(),
    '$randomImageUrl': () => faker.image.url(),
    '$randomDomainName': () => faker.internet.domainName(),
    '$randomIp': () => faker.internet.ip(),
    '$randomCompanyName': () => faker.company.name(),
    '$randomJobTitle': () => faker.person.jobTitle(),
    '$randomCurrencyCode': () => faker.finance.currencyCode(),
    '$randomPrice': () => faker.finance.amount(),
};

/**
 * Resolves a dynamic variable name to its faker value.
 * Supports Postman aliases ($randomEmail) and direct faker paths ($person.firstName).
 */
function resolveDynamicVariable(path) {
    const key = `$${path}`;
    
    // 1. Check direct aliases first
    if (dynamicAliases[key]) return dynamicAliases[key]();

    // 2. Try to resolve via direct faker path (e.g. $internet.email)
    try {
        const parts = path.split('.');
        let current = faker;
        for (const part of parts) {
            if (current[part]) {
                current = current[part];
            } else {
                return null;
            }
        }
        
        if (typeof current === 'function') {
            return current();
        }
        return String(current);
    } catch (e) {
        return null;
    }
}

// Utility function to replace variables in text
export function replaceEnvVariables(text, environment) {
    if (!text) return text;

    let result = text;

    // 1. Handle dynamic variables ({{$guid}}, {{$randomFirstName}}, {{$person.firstName}}, etc)
    const dynamicRegex = /{{\$([^}]+)}}/g;
    result = result.replace(dynamicRegex, (match, path) => {
        const resolved = resolveDynamicVariable(path);
        return resolved !== null ? resolved : match;
    });

    // 2. Handle environment variables
    if (environment && environment.variables) {
        environment.variables.forEach(({ key, value }) => {
            if (key) {
                const regex = new RegExp(`{{${key}}}`, 'g');
                const val = String(value);
                result = result.replace(regex, () => val);
            }
        });
    }

    // Fix double slashes except protocol
    result = result.replace(/([^:])\/\/+/g, '$1/');
    return result;
}
