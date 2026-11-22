import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config';
import cors from 'cors';
const app=express();
const PORT=8000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoClient=await connectToMongoDB();
const db=mongoClient.db("book-nook");
const bookCollection=db.collection("books");

// Books added

app.post('/books',async(req,res)=>{
    const data=req.body;
    const result=await bookCollection.insertOne(data);

    console.log(result)

    res.send(result)
})

// All Books Read

app.get('/books',async(req,res)=>{
    const result=await bookCollection.find().toArray();
    res.send(result)
})

// Details Books Read

app.get('/books/:id',async(req,res)=>{
    const {id}=req.params;
    const result=await bookCollection.findOne({_id:new ObjectId(id)});
    res.send(result)
})

app.get('/',(req,res)=>{
    res.send({message:"Server is running"})
})

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})