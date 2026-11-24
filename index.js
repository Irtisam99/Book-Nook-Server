import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config';
import cors from 'cors';
const app = express();
const PORT = 8000;

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

const mongoClient = await connectToMongoDB();
const db = mongoClient.db("book-nook");
const bookCollection = db.collection("books");
const borrowCollection = db.collection('borrows')

// Books added

app.post('/books', async (req, res) => {
    const data = req.body;
    const result = await bookCollection.insertOne(data);

    console.log(result)

    res.send(result)
})

// All Books Read

app.get('/books', async (req, res) => {
    const result = await bookCollection.find().toArray();
    res.send(result)
})

// Details Books Read

app.get('/books/:id', async (req, res) => {
    const { id } = req.params;
    const result = await bookCollection.findOne({ _id: new ObjectId(id) });
    res.send(result)
})


// Update Book

app.patch('/books/:id', async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const result = await bookCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }

    )
    res.send(result)
})

// Delete Book

app.delete('/books/:id', async (req, res) => {
    const { id } = req.params
    const result = await bookCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result)
})

// Borrow Book

// Borrow Book
app.post('/borrows', async (req, res) => {
    try {
        const data = req.body;

        // 1. Check whether the user already borrowed this book
        const alreadyBorrowed = await borrowCollection.findOne({
            bookId: data.bookId,
            userEmail: data.userEmail,
            returned: false
        });

        if (alreadyBorrowed) {
            return res.status(409).send({
                message: "You have already borrowed this book."
            });
        }

        // 2. Decrease available copies by 1
        const updateBook = await bookCollection.updateOne(
            {
                _id: new ObjectId(data.bookId),
                availableCopies: { $gt: 0 }
            },
            {
                $inc: { availableCopies: -1 }
            }
        );

        // 3. Check whether a copy was available
        if (updateBook.matchedCount === 0) {
            return res.status(400).send({
                message: "This book is not available."
            });
        }

        // 4. Insert the borrowing record
        try {
            const result = await borrowCollection.insertOne({
                ...data,
                returned: false,
                createdAt: new Date()
            });

            res.status(201).send(result);

        } catch (error) {
            // Restore the copy if inserting the borrow record fails
            await bookCollection.updateOne(
                { _id: new ObjectId(data.bookId) },
                { $inc: { availableCopies: 1 } }
            );

            throw error;
        }

    } catch (error) {
        console.error(error);

        res.status(500).send({
            message: "Something went wrong."
        });
    }
});

// Get all borrows

app.get('/borrows',async(req,res)=>{
    const result=await borrowCollection.find().toArray();
    res.send(result)
})

// Return Book

app.delete('/borrows/:borrowId',async(req,res)=>{

    try{
        const {borrowId}=req.params;

        const borrow=await borrowCollection.findOne(
            {_id:new ObjectId(borrowId)}
        );

        if(!borrow){
            return res.status(404).send(
                {message:"Borrow record not found"}
            )
        }

        const result=await borrowCollection.deleteOne(
            {_id:new ObjectId(borrowId)}
        )

        if(result.deletedCount>0){
            await bookCollection.updateOne(
                {_id:new ObjectId(borrow.bookId)},
                {$inc:{availableCopies:1}}
            )
        }
        res.send({
            message:"Book returned successfully"
        })

    }catch(error){
        console.error(error);
        res.status(500).send({
            message:"Something went wrong"
        })
    }
})

app.get('/', (req, res) => {
    res.send({ message: "Server is running" })
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})