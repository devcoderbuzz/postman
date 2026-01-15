import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import * as apiService from '../apiservice';

vi.mock('axios');

describe('apiservice', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('login', () => {
        it('should call axios.post with correct arguments and return data on success', async () => {
             const mockResponse = {
                data: { token: 'fake-token', user: { id: 1, username: 'test' } }
            };
            axios.post.mockResolvedValue(mockResponse);

            const result = await apiService.login('testuser', 'password123');

            expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/users/login'), {
                username: 'testuser',
                password: 'password123'
            });
            expect(result).toEqual(mockResponse.data);
        });

        it('should throw error when backend returns error', async () => {
             const errorResponse = {
                response: {
                    status: 401,
                    data: { error: 'Invalid credentials' }
                }
            };
            axios.post.mockRejectedValue(errorResponse);

            await expect(apiService.login('testuser', 'wrong')).rejects.toThrow('Invalid credentials');
        });
        
         it('should throw error on axios failure', async () => {
            axios.post.mockRejectedValue(new Error('Network Error'));
            await expect(apiService.login('testuser', 'pass')).rejects.toThrow('Network Error');
        });
    });

    describe('getAllUsers', () => {
        it('should fetch users correctly', async () => {
             const mockResponse = {
                data: [{ id: 1, username: 'user1' }]
            };
            axios.get.mockResolvedValue(mockResponse);

            const currentUser = { username: 'admin', role: 'admin', status: 'active', token: 'token123' };
            const result = await apiService.getAllUsers(currentUser);

            expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/users/allusersWithProjectData'), expect.objectContaining({
                params: expect.objectContaining({ username: 'admin' })
            }));
            expect(result).toEqual([{ id: 1, username: 'user1' }]);
        });
    });

    describe('getAllAppCodesForAdmin', () => {
        it('should fetch hierarchy correctly', async () => {
             const mockResponse = {
                data: [{ id: 1, projectName: 'P1' }]
            };
            axios.get.mockResolvedValue(mockResponse);

            const currentUser = { token: 'token123' };
            const result = await apiService.getAllAppCodesForAdmin(currentUser);

            expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/projects/hierarchy'), expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'Bearer token123'
                })
            }));
            expect(result).toEqual([{ id: 1, projectName: 'P1' }]);
        });
    });

     describe('register', () => {
        it('should register successfully', async () => {
            const mockResponse = {
                data: { id: 1, username: 'newuser' }
            };
            axios.post.mockResolvedValue(mockResponse);
            
            const userData = { username: 'newuser', password: 'pw' };
            const result = await apiService.register(userData);
            
            expect(result).toEqual({ id: 1, username: 'newuser' });
        });
     });
        
    // Testing the migrated stub functions
    describe('getAllProjects', () => {
        it('should return empty array after timeout', async () => {
            vi.useFakeTimers();
            const promise = apiService.getAllProjects();
            
            vi.advanceTimersByTime(600);
            const result = await promise;
            expect(result).toEqual([]);
            vi.useRealTimers();
        });
    });

    describe('updateUser', () => {
        it('should update user status', async () => {
             const mockResponse = {
                data: { success: true }
            };
            axios.post.mockResolvedValue(mockResponse);
            
            const result = await apiService.updateUser({ id: 1, status: 'ACTIVE' }, 'token');
            expect(result).toEqual({ success: true });
        });
    });

    describe('Other API functions', () => {
        const successResponse = { data: { success: true } };
        beforeEach(() => {
            axios.post.mockResolvedValue(successResponse);
        });

        it('updatePassword', async () => {
            await expect(apiService.updatePassword('u', 'old', 'new', 't')).resolves.toEqual({ success: true });
        });

        it('createRequestData', async () => {
            await expect(apiService.createRequestData({}, 't')).resolves.toEqual({ success: true });
        });

        it('updateProfilePic', async () => {
           await expect(apiService.updateProfilePic(1, 'img', 't')).resolves.toEqual({ success: true }); 
        });

        it('GetProjectDetails', async () => {
            await expect(apiService.GetProjectDetails([], 't')).resolves.toEqual({ success: true });
        });

        it('unassignUserFromProject', async () => {
            await expect(apiService.unassignUserFromProject(1, 1, 't')).resolves.toEqual({ success: true });
        });

        it('assignUserToProject', async () => {
            await expect(apiService.assignUserToProject(1, 1, 't')).resolves.toEqual({ success: true });
        });
        
        it('deleteUser', async () => {
            await expect(apiService.deleteUser(1, 't')).resolves.toEqual({ success: true });
        });

        it('createUpdateCollections', async () => {
            await expect(apiService.createUpdateCollections({}, 't')).resolves.toEqual({ success: true });
        });

        it('getEnvDetails', async () => {
            await expect(apiService.getEnvDetails(null, 't')).resolves.toEqual({ success: true });
        });

        it('updateEnvDetails', async () => {
            await expect(apiService.updateEnvDetails({}, 't')).resolves.toEqual({ success: true });
        });
        
         it('activateUser', async () => {
            await expect(apiService.activateUser(1, 'u', 'pw', 'newpw', 't')).resolves.toEqual({ success: true });
        });
        
         it('resetPassword', async () => {
            await expect(apiService.resetPassword(1, 'u', 'pw', 'newpw', 't')).resolves.toEqual({ success: true });
        });
    });

    describe('Error Handling', () => {
        const networkError = new Error('Network Error');
        const apiError = {
            response: {
                data: { message: 'Some Error' }
            }
        };

        const apiFunctions = [
            { name: 'updatePassword', fn: () => apiService.updatePassword('u', 'o', 'n', 't') },
            { name: 'createRequestData', fn: () => apiService.createRequestData({}, 't') },
            { name: 'updateProfilePic', fn: () => apiService.updateProfilePic(1, 'img', 't') },
            { name: 'GetProjectDetails', fn: () => apiService.GetProjectDetails([], 't') },
            { name: 'unassignUserFromProject', fn: () => apiService.unassignUserFromProject(1, 1, 't') },
            { name: 'assignUserToProject', fn: () => apiService.assignUserToProject(1, 1, 't') },
            { name: 'deleteUser', fn: () => apiService.deleteUser(1, 't') },
            { name: 'createUpdateCollections', fn: () => apiService.createUpdateCollections({}, 't') },
            { name: 'getEnvDetails', fn: () => apiService.getEnvDetails(null, 't') },
            { name: 'updateEnvDetails', fn: () => apiService.updateEnvDetails({}, 't') },
            { name: 'activateUser', fn: () => apiService.activateUser(1, 'u', 'p', 'n', 't') },
            { name: 'resetPassword', fn: () => apiService.resetPassword(1, 'u', 'p', 'n', 't') }
        ];

        apiFunctions.forEach(({ name, fn }) => {
            it(`${name} should throw error on API failure`, async () => {
                axios.post.mockRejectedValue(apiError);
                await expect(fn()).rejects.toThrow('Some Error');
            });

            it(`${name} should throw error on Network failure`, async () => {
                axios.post.mockRejectedValue(networkError);
                await expect(fn()).rejects.toThrow('Network Error');
            });
        });
    });
});
