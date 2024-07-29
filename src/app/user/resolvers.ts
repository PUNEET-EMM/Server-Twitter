import axios from "axios";
import { prismaClient } from "../../clients/db";
import JWTService from "../../services/jwt";
import { GraphQLContext } from "../interfaces";
import { User } from "@prisma/client";
import UserService from "../../services/user";

interface GoogleTokenResult {
    iss?: string;
    nbf?: string;
    aud?: string;
    sub?: string;
    email?: string;
    email_verified?: string;
    azp?: string;
    name?: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
    iat?: string;
    exp?: string;
    jti?: string;
    alg?: string;
    kid?: string;
    typ?: string;
}

const queries = {
    getUserById: async (parent: any, { id }: { id: string }, ctx: GraphQLContext) => {
        return UserService.getUserById(id);
    },

    verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
        return UserService.verifyGoogleAuthToken(token);
    },

    getCurrentUser: async (parent: any, args: any, ctx: GraphQLContext) => {
        const id = ctx.user?.id;
        if (!id) return null;
        return UserService.getUserById(id);
    },
}

const extraResolvers = {
    User: {
        tweets: (parent: User) => {
            return prismaClient.tweet.findMany({ where: { authorId: parent.id } });
        },
        followers: async (parent: User) => {
            const result = await prismaClient.follows.findMany({
                where: { followingId: parent.id },
                include: { follower: true }
            });
            return result.map((el) => el.follower);
        },
        following: async (parent: User) => {
            const result = await prismaClient.follows.findMany({
                where: { followerId: parent.id },
                include: { following: true }
            });
            return result.map((el) => el.following);
        }
    }
};

const mutations = {
    followUser: async (parent: any, { to }: { to: string }, ctx: GraphQLContext) => {
        if (!ctx.user || !ctx.user.id) throw new Error("unauthenticated");
        await UserService.followUser(ctx.user.id, to);
        return true;
    },
    unfollowUser: async (parent: any, { to }: { to: string }, ctx: GraphQLContext) => {
        if (!ctx.user || !ctx.user.id) throw new Error("unauthenticated");
        await UserService.unfollowUser(ctx.user.id, to);
        return true;
    }
}

export const resolvers = { queries, extraResolvers, mutations };
