import { describe, it, expect } from 'vitest';
import { cn, replaceEnvVariables } from '../utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
    });

    it('should handle conditional class names', () => {
      expect(cn('bg-red-500', false && 'text-white', 'p-4')).toBe('bg-red-500 p-4');
    });

    it('should merge tailwind classes correctly (override)', () => {
      expect(cn('p-4', 'p-8')).toBe('p-8');
    });
  });

  describe('replaceEnvVariables', () => {
    it('should return original text if no environment is provided', () => {
      expect(replaceEnvVariables('{{url}}/api', null)).toBe('{{url}}/api');
    });

    it('should return original text if text is empty', () => {
      expect(replaceEnvVariables('', { variables: [] })).toBe('');
    });

    it('should replace variables correctly', () => {
      const environment = {
        variables: [
            { key: 'url', value: 'https://api.example.com' },
            { key: 'version', value: 'v1' }
        ]
      };
      const text = '{{url}}/{{version}}/users';
      expect(replaceEnvVariables(text, environment)).toBe('https://api.example.com/v1/users');
    });

    it('should ignore variables not in environment', () => {
      const environment = { variables: [{ key: 'url', value: 'https://api.example.com' }] };
      const text = '{{url}}/{{missing}}';
      expect(replaceEnvVariables(text, environment)).toBe('https://api.example.com/{{missing}}');
    });

     it('should replace multiple occurrences of the same variable', () => {
      const environment = { variables: [{ key: 'id', value: '123' }] };
      const text = '/users/{{id}}/posts/{{id}}';
      expect(replaceEnvVariables(text, environment)).toBe('/users/123/posts/123');
    });
  });
});
