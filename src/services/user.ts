import axios from "axios";
import { prismaClient } from "../clients/db";
import JWTService from "./jwt";

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

export default class UserService {
    public static async verifyGoogleAuthToken(token: string) {
        const googleOauthUrl = new URL('https://oauth2.googleapis.com/tokeninfo');
        googleOauthUrl.searchParams.set('id_token', token);

        const { data } = await axios.get<GoogleTokenResult>(googleOauthUrl.toString(), {
            responseType: 'json'
        });

        let user = await prismaClient.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            user = await prismaClient.user.create({
                data: {
                    email: data.email!,
                    firstName: data.given_name!,
                    lastName: data.family_name,
                    profileImageUrl: data.picture,
                }
            });
        }

        if (!user) throw new Error("Something went wrong");

        const userToken = JWTService.generateTokenForUser(user);
        return userToken;
    }

    public static getUserById(id: string) {
        return prismaClient.user.findUnique({ where: { id } });
    }

    public static followUser(from: string, to: string) {
        return prismaClient.follows.create({
            data: {
                follower: { connect: { id: from } },
                following: { connect: { id: to } }
            }
        });
    }

    public static unfollowUser(from: string, to: string) {
        return prismaClient.follows.delete({
            where: { followerId_followingId: { followerId: from, followingId: to } }
        });
    }
}
