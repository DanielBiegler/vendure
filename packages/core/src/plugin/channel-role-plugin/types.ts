import { ID } from '@vendure/common/lib/shared-types';

/**
 * @description
 * Input for creating a channel role assignment
 * 
 * @docsCategory ChannelRolePlugin
 */
export interface ChannelRoleInput {
    channelId: ID;
    roleId: ID;
}

/**
 * @description
 * Input for creating an administrator with channel-specific role assignments
 * 
 * @docsCategory ChannelRolePlugin
 */
export interface CreateChannelAdministratorInput {
    firstName: string;
    lastName: string;
    emailAddress: string;
    password: string;
    channelRoles: ChannelRoleInput[];
}

/**
 * @description
 * Input for updating an administrator with channel-specific role assignments
 * 
 * @docsCategory ChannelRolePlugin
 */
export interface UpdateChannelAdministratorInput {
    id: ID;
    firstName?: string;
    lastName?: string;
    emailAddress?: string;
    password?: string;
    channelRoles?: ChannelRoleInput[];
}

/**
 * @description
 * GraphQL mutation arguments for creating a channel administrator
 * 
 * @docsCategory ChannelRolePlugin
 */
export type MutationCreateChannelAdministratorArgs = {
    input: CreateChannelAdministratorInput;
};

/**
 * @description
 * GraphQL mutation arguments for updating a channel administrator
 * 
 * @docsCategory ChannelRolePlugin
 */
export type MutationUpdateChannelAdministratorArgs = {
    input: UpdateChannelAdministratorInput;
};