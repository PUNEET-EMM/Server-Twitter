import { Tweet } from "@prisma/client";
import { prismaClient } from "../../clients/db";
import { GraphQLContext } from "../interfaces"
import { S3Client,PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import UserService from "../../services/user";
import TweetService, { CreateTweetPayload } from "../../services/tweet";



const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
const region = process.env.AWS_DEFAULT_REGION || " ";




interface CreateTweetData {
    content: string
    imageUrl? :string
  }

const s3Client = new S3Client({
   region:region,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey
      
    }
  });
 

  const queries = {
    getAllTweets:()=> TweetService.getAllTweets(),
    getSignedURLForTweet:async(parent:any,{imageType ,imageName}:{imageType:string,imageName:string},ctx:GraphQLContext)=>{
       if(!ctx.user||!ctx.user.id) throw new Error ("Unauthenicated");
       const allowedImageTypes =['jpg',"jpeg","png","webp"];
       if(!allowedImageTypes.includes(imageType))
           throw new Error ("Unsupported Image Type");
        const putObjectCommand = new PutObjectCommand({
          Bucket:"image-storage-puneet-app",
          Key:`uploads/${imageName}-${Date.now()}.${imageType}`,


        })
        const signedURL = await getSignedUrl(s3Client,putObjectCommand);
        return signedURL;

    }
}


  const mutations ={
    createTweet: async(
        parent:any,
        {payload}:{payload:CreateTweetPayload},
        ctx: GraphQLContext
    )=>{
        if(!ctx.user) throw new Error("your are not authenticated");
        const tweet = TweetService.createTweet({...payload,userId:ctx.user.id})

        return tweet;
       
    }
} 


    const extraResolvers ={
        Tweet: {
            author:  (parent:Tweet)=>  UserService.getUserById(parent.authorId),
            
        }
    }

  

  
  export const resolvers={mutations,extraResolvers,queries}

  // "start": "node build/index",
  //   "build": "tsc -p .",
  //   "dev": "tsc-watch --onSuccess \"npm start\""