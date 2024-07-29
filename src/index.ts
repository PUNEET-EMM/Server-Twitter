import {initServer} from "./app";
import dotenv from "dotenv";


dotenv.config();


async function init(){
    const app = await initServer();
    
    const PORT: number = process.env.PORT ? parseInt(process.env.PORT) :8000
    app.listen(PORT,()=>{
        console.log("start");
    })
}

init();

