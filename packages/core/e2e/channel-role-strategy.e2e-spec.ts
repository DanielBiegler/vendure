import { ChannelRolePlugin, mergeConfig } from '@vendure/core';
import { createTestEnvironment, registerInitializer, SqljsInitializer } from '@vendure/testing';
import gql from 'graphql-tag';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { Permission } from './graphql/generated-e2e-admin-types';

import { initialData } from '../../../e2e-common/e2e-initial-data';
import { TEST_SETUP_TIMEOUT_MS, testConfig } from '../../../e2e-common/test-config';

registerInitializer('sqljs', new SqljsInitializer(path.join(__dirname, '__data__'), 1000));

describe('RolePermissionResolverStrategy with ChannelRolePermissionResolverStrategy', () => {
    const { server, adminClient } = createTestEnvironment(
        mergeConfig(testConfig(), {
            plugins: [ChannelRolePlugin.init({})],
        }),
    );

    beforeAll(async () => {
        await server.init({
            initialData,
            customerCount: 1,
        });
        await adminClient.asSuperAdmin();
    }, TEST_SETUP_TIMEOUT_MS);

    afterAll(async () => {
        await server.destroy();
    });

    describe('Create Admin', () => {
        let testRole: { id: string };
        let defaultChannel: { id: string };

        beforeAll(async () => {
            // Create a test role to use with the new administrator
            const { createRole } = await adminClient.query(gql`
                mutation {
                    createRole(input: {
                        code: "test-role"
                        description: "Test role for E2E test"
                        permissions: [ReadCatalog, UpdateCatalog]
                    }) {
                        id
                    }
                }
            `);
            testRole = createRole;

            // Get the default channel
            const { channels } = await adminClient.query(gql`
                query {
                    channels {
                        items {
                            id
                            code
                        }
                    }
                }
            `);
            defaultChannel = channels.items.find((c: any) => c.code === 'e2e-default-channel') || channels.items[0];
        });

        it('Successfully create admin', async () => {
            const result = await adminClient.query(gql`
                mutation CreateChannelAdmin($input: CreateChannelAdministratorInput!) {
                    createChannelAdministrator(input: $input) {
                        id
                        firstName
                        lastName
                        emailAddress
                        user {
                            id
                            identifier
                            lastLogin
                        }
                    }
                }
            `, {
                input: {
                    emailAddress: "newadmin@test.com",
                    firstName: "New",
                    lastName: "Admin",
                    password: "password",
                    channelRoles: [{ channelId: defaultChannel.id, roleId: testRole.id }]
                }
            });

            expect(result.createChannelAdministrator).toBeDefined();
            expect(result.createChannelAdministrator.firstName).toBe('New');
            expect(result.createChannelAdministrator.lastName).toBe('Admin');
            expect(result.createChannelAdministrator.emailAddress).toBe('newadmin@test.com');
        });

        it('Fail to create admin due to non-existent role', async () => {
            await expect(
                adminClient.query(gql`
                    mutation CreateChannelAdmin($input: CreateChannelAdministratorInput!) {
                        createChannelAdministrator(input: $input) {
                            id
                        }
                    }
                `, {
                    input: {
                        emailAddress: "failedrole@test.com",
                        firstName: "Failed",
                        lastName: "Role",
                        password: "password",
                        channelRoles: [{ channelId: defaultChannel.id, roleId: "999" }]
                    }
                })
            ).rejects.toThrow();
        });

        it('Fail to create admin due to non-existent channel', async () => {
            await expect(
                adminClient.query(gql`
                    mutation CreateChannelAdmin($input: CreateChannelAdministratorInput!) {
                        createChannelAdministrator(input: $input) {
                            id
                        }
                    }
                `, {
                    input: {
                        emailAddress: "failedchannel@test.com",
                        firstName: "Failed",
                        lastName: "Channel", 
                        password: "password",
                        channelRoles: [{ channelId: "999", roleId: testRole.id }]
                    }
                })
            ).rejects.toThrow();
        });
    });

    describe('Update Admin', () => {
        let createdAdmin: { id: string };
        let secondRole: { id: string };

        beforeAll(async () => {
            // Create a second test role
            const { createRole } = await adminClient.query(gql`
                mutation {
                    createRole(input: {
                        code: "second-test-role"
                        description: "Second test role for E2E test"
                        permissions: [ReadOrder, UpdateOrder]
                    }) {
                        id
                    }
                }
            `);
            secondRole = createRole;

            // Create an administrator to update
            const { createChannelAdministrator } = await adminClient.query(gql`
                mutation CreateChannelAdmin($input: CreateChannelAdministratorInput!) {
                    createChannelAdministrator(input: $input) {
                        id
                    }
                }
            `, {
                input: {
                    emailAddress: "updateme@test.com",
                    firstName: "Update",
                    lastName: "Me",
                    password: "password",
                    channelRoles: [{ channelId: defaultChannel.id, roleId: testRole.id }]
                }
            });
            createdAdmin = createChannelAdministrator;
        });

        it('Successfully assign new role to admin user', async () => {
            const result = await adminClient.query(gql`
                mutation UpdateChannelAdmin($input: UpdateChannelAdministratorInput!) {
                    updateChannelAdministrator(input: $input) {
                        id
                        firstName
                        lastName
                    }
                }
            `, {
                input: {
                    id: createdAdmin.id,
                    channelRoles: [{ channelId: defaultChannel.id, roleId: secondRole.id }]
                }
            });

            expect(result.updateChannelAdministrator).toBeDefined();
            expect(result.updateChannelAdministrator.id).toBe(createdAdmin.id);
        });

        it('Fail to assign new role to admin user due to non-existent channel', async () => {
            await expect(
                adminClient.query(gql`
                    mutation UpdateChannelAdmin($input: UpdateChannelAdministratorInput!) {
                        updateChannelAdministrator(input: $input) {
                            id
                        }
                    }
                `, {
                    input: {
                        id: createdAdmin.id,
                        channelRoles: [{ channelId: "999", roleId: secondRole.id }]
                    }
                })
            ).rejects.toThrow();
        });

        it('Fail to assign new role to admin user due to non-existent role', async () => {
            await expect(
                adminClient.query(gql`
                    mutation UpdateChannelAdmin($input: UpdateChannelAdministratorInput!) {
                        updateChannelAdministrator(input: $input) {
                            id
                        }
                    }
                `, {
                    input: {
                        id: createdAdmin.id,
                        channelRoles: [{ channelId: defaultChannel.id, roleId: "999" }]
                    }
                })
            ).rejects.toThrow();
        });
    });
});
