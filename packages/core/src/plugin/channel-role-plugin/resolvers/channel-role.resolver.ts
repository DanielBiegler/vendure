import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
    MutationCreateAdministratorArgs,
    MutationUpdateAdministratorArgs,
    Permission,
} from '@vendure/common/lib/generated-types';

import { Allow, Ctx, RequestContext, Transaction } from '../../../api';
import { IllegalOperationError } from '../../../common/error/errors';
import { Administrator } from '../../../entity';
import { AdministratorService } from '../../../service';
import {
    MutationCreateChannelAdministratorArgs,
    MutationUpdateChannelAdministratorArgs,
} from '../types';

/**
 * @description
 * GraphQL resolver for channel-role-specific administrator mutations.
 * This resolver provides channel-aware administrator creation and updates,
 * and overrides the default administrator mutations to enforce the use
 * of channel-specific operations when the ChannelRolePlugin is active.
 *
 * @docsCategory ChannelRolePlugin
 */
@Resolver()
export class ChannelRoleResolver {
    constructor(private administratorService: AdministratorService) {}

    // // // OVERRIDES

    /**
     * @description
     * Overrides the default createAdministrator mutation to enforce the use of
     * channel-specific administrator creation when the ChannelRolePlugin is active.
     * 
     * @throws IllegalOperationError Always throws to guide users to use createChannelAdministrator
     */
    @Transaction()
    @Mutation()
    @Allow(Permission.CreateAdministrator)
    createAdministrator(
        @Ctx() ctx: RequestContext,
        @Args() args: MutationCreateAdministratorArgs,
    ): Promise<Administrator> {
        throw new IllegalOperationError('error.channel-role-plugin-create-administrator-deprecated');
    }

    /**
     * @description
     * Overrides the default updateAdministrator mutation to enforce the use of
     * channel-specific administrator updates when the ChannelRolePlugin is active.
     * 
     * @throws IllegalOperationError Always throws to guide users to use updateChannelAdministrator
     */
    @Transaction()
    @Mutation()
    @Allow(Permission.UpdateAdministrator)
    updateAdministrator(
        @Ctx() ctx: RequestContext,
        @Args() args: MutationUpdateAdministratorArgs,
    ): Promise<Administrator> {
        throw new IllegalOperationError('error.channel-role-plugin-update-administrator-deprecated');
    }

    // // // EXTENSIONS

    /**
     * @description
     * Creates a new administrator with channel-specific role assignments.
     * This mutation uses the ChannelRolePermissionResolverStrategy to handle
     * the mapping between users, roles, and channels.
     * 
     * @param ctx The request context
     * @param args Arguments containing CreateChannelAdministratorInput
     * @returns Promise resolving to the created Administrator entity
     */
    @Transaction()
    @Mutation()
    @Allow(Permission.CreateAdministrator)
    createChannelAdministrator(
        @Ctx() ctx: RequestContext,
        @Args() args: MutationCreateChannelAdministratorArgs,
    ): Promise<Administrator> {
        return this.administratorService.create(ctx, args.input);
    }

    /**
     * @description
     * Updates an existing administrator with new channel-specific role assignments.
     * This mutation uses the ChannelRolePermissionResolverStrategy to handle
     * the mapping between users, roles, and channels.
     * 
     * @param ctx The request context
     * @param args Arguments containing UpdateChannelAdministratorInput
     * @returns Promise resolving to the updated Administrator entity
     */
    @Transaction()
    @Mutation()
    @Allow(Permission.UpdateAdministrator)
    updateChannelAdministrator(
        @Ctx() ctx: RequestContext,
        @Args() args: MutationUpdateChannelAdministratorArgs,
    ): Promise<Administrator> {
        return this.administratorService.update(ctx, args.input);
    }
}
