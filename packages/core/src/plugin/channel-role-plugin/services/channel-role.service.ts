import { Injectable } from '@nestjs/common';
import { DeletionResponse, DeletionResult } from '@vendure/common/lib/generated-types';
import { ID } from '@vendure/common/lib/shared-types';

import { RequestContext } from '../../../api/index';
import { TransactionalConnection } from '../../../connection/index';
import { Channel, Role, User } from '../../../entity';
import { ChannelRole } from '../entities/channel-role.entity';

/**
 * @description
 * Contains methods relating to {@link ChannelRole} entities for managing
 * channel-specific role assignments for users. This service is used by
 * the {@link ChannelRolePermissionResolverStrategy} to manage user permissions
 * on a per-channel basis.
 *
 * @docsCategory services
 */
@Injectable()
export class ChannelRoleService {
    constructor(private connection: TransactionalConnection) {}

    /**
     * @description
     * Creates a new ChannelRole entity that assigns a specific role to a user
     * within a particular channel context.
     * 
     * @param ctx The request context
     * @param input Object containing userId, channelId, and roleId
     * @returns Promise resolving to the created ChannelRole entity
     * @throws EntityNotFoundError if user, channel, or role cannot be found
     */
    async create(
        ctx: RequestContext,
        input: { userId: ID; channelId: ID; roleId: ID },
    ): Promise<ChannelRole> {
        const [user, channel, role] = await Promise.all([
            this.connection.getEntityOrThrow(ctx, User, input.userId),
            this.connection.getEntityOrThrow(ctx, Channel, input.channelId),
            this.connection.getEntityOrThrow(ctx, Role, input.roleId),
        ]);
        const entity = new ChannelRole({
            user,
            channel,
            role,
        });

        // TODO custom fields ???

        return this.connection.getRepository(ctx, ChannelRole).save(entity);
    }

    /**
     * @description
     * Updates an existing ChannelRole entity with new user, channel, or role assignments.
     * 
     * @param ctx The request context
     * @param input Object containing the ChannelRole id and new userId, channelId, and roleId
     * @returns Promise resolving to the updated ChannelRole entity
     * @throws EntityNotFoundError if the ChannelRole, user, channel, or role cannot be found
     */
    async update(
        ctx: RequestContext,
        input: { id: ID; userId: ID; channelId: ID; roleId: ID },
    ): Promise<ChannelRole> {
        // Promise.all will fail fast if any entity is not found
        const [channelRole, user, channel, role] = await Promise.all([
            this.connection.getEntityOrThrow(ctx, ChannelRole, input.id),
            this.connection.getEntityOrThrow(ctx, User, input.userId),
            this.connection.getEntityOrThrow(ctx, Channel, input.channelId),
            this.connection.getEntityOrThrow(ctx, Role, input.roleId),
        ]);

        channelRole.user = user;
        channelRole.channel = channel;
        channelRole.role = role;

        // TODO custom fields ???

        return this.connection.getRepository(ctx, ChannelRole).save(channelRole);
    }

    /**
     * @description
     * Deletes a ChannelRole entity, removing the user's role assignment for the specified channel.
     * 
     * @param ctx The request context
     * @param id The ID of the ChannelRole to delete
     * @returns Promise resolving to a DeletionResponse indicating success or failure
     * @throws EntityNotFoundError if the ChannelRole cannot be found
     */
    async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
        const channelRole = await this.connection.getEntityOrThrow(ctx, ChannelRole, id);
        try {
            await this.connection.getRepository(ctx, ChannelRole).remove(channelRole);
            return {
                result: DeletionResult.DELETED,
            };
        } catch (e: any) {
            return {
                result: DeletionResult.NOT_DELETED,
                message: e.message,
            };
        }
    }
}
