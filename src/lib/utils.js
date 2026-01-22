import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { faker } from '@faker-js/faker';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const dynamicAliases = {
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

export const DYNAMIC_VARIABLES = Object.keys(dynamicAliases).map(k => k.substring(1));

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

export function getCursorCoordinates(input, cursorIndex) {
    const { offsetWidth, value } = input;
    const { scrollLeft, scrollTop } = input;
    
    // Create mirror div
    const div = document.createElement('div');
    const style = window.getComputedStyle(input);
    
    // Copy essential measurement styles
    const props = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'textTransform', 'wordSpacing', 'textIndent', 'paddingLeft', 'paddingTop', 'borderLeftWidth', 'borderTopWidth', 'lineHeight'];
    props.forEach(prop => {
        div.style[prop] = style[prop];
    });
    
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = input.tagName === 'TEXTAREA' ? 'pre-wrap' : 'pre';
    div.style.width = input.tagName === 'TEXTAREA' ? `${offsetWidth}px` : 'auto';
    div.style.left = '-9999px';
    div.style.top = '0';
    
    const textBeforeCursor = value.substring(0, cursorIndex);
    div.textContent = textBeforeCursor;
    
    const span = document.createElement('span');
    span.textContent = value.substring(cursorIndex, cursorIndex + 1) || '.';
    div.appendChild(span);
    
    document.body.appendChild(div);
    const { offsetLeft: spanLeft, offsetTop: spanTop } = span;
    document.body.removeChild(div);
    
    const rect = input.getBoundingClientRect();
    const lineHeight = parseInt(style.lineHeight) || parseInt(style.fontSize) * 1.2 || 20;

    return {
        top: rect.top + spanTop - scrollTop + lineHeight + 2,
        left: rect.left + spanLeft - scrollLeft
    };
}
