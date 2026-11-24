import {MongoClient} from 'mongodb';
import express from 'express';
// const express = require('express');
const app = express();

const port = 3000;

let database = null;
async function connectToMongoClient() {
    const mongoUri = 'mongodb://localhost:27017/';
    const client = new MongoClient(mongoUri);
    database = client.db('admin');
}

async function fetchResults(cursor){
    let results = []
    for await (const doc of cursor) {
        results.push(doc);
    }
    return results;
}

// automatically serve static files
app.use(express.static("frontEnd"))
app.use(express.json()); // for parsing application/json
app.disable('etag');

app.get('/user', async (request, response) => {
    let userTable = database.collection('users');
    let users = userTable.find({});
    let results = await fetchResults(users)
    response.contentType('application/json');
    response.send(JSON.stringify(results));
});

app.get('/users/:age', async (request, response) => {
    let age = request.params.age;
    let userTable = database.collection('users');
    let users = await fetchResults(userTable.find({age:Number(age)}));
    response.contentType('application/json');
    response.send(JSON.stringify(users));
})

app.get('/whiteboardContent', async (request, response) => {
    let boardId = request.query.id
    // console.log(boardId);
    if(boardId === undefined){
        response.status(404)
        response.send("Not Found");
        return;
    }
    if(isNaN(Number(boardId))){
        response.status(404)
        response.send("Not Found");
        return;
    }
    //get from the data base!!!
    let whiteboardsTable = database.collection('whiteboards');
    let users = whiteboardsTable.find({
        boardId: Number(boardId),
    });
    let results = await fetchResults(users)
    if(results.length === 0){
        response.status(404)
        response.send("Not Found");
        return;
    }
    for(let i=0;i<results[0].items.length;i++){
        if (results[0].items[i].selected){
            let ts = results[0].items[i].selectedTs;
            //if it has been more then 10 seconds since a user reported this item selected,
            if(ts === undefined || ts+10000 < Date.now()){
                results[0].items[i].selected = false;
            }
        }
    }
    response.contentType('application/json');
    response.send(JSON.stringify(results[0]));
})

//YOU MUST HAVE A response.send !!!!!!
app.post("/whiteboards/modify", async (request, response) => {
    if(request.headers['content-type'] !== 'application/json'){
        response.status(400);
        response.setHeader('content-type', 'application/json');
        response.send({message:"Invalid content type"});
        return;
    }
    let type = request.body.type
    let index = request.body.index
    let item = request.body.item
    let board = request.body.board
    let revised = request.body.revised;
    let setObj = {}
    item.timestamp = Date.now()
    if(item.selected){
        item.selectedTs = Date.now()
    }
    if(index === undefined || index < 0){
        response.status(404)
        response.send("Element Not Found");
        return
    }
    setObj["items."+index] = item
    if(type === "modify"){
        let whiteboardsTable = database.collection('whiteboards');
        whiteboardsTable.updateOne(
            {boardId: board,
                revised:revised},//only update if the revision has not changed
            {
                $set: setObj
            }
        )
    }
    response.send()
})

app.post("/whiteboards/add", async (request, response) => {
    if(request.headers['content-type'] !== 'application/json'){
        response.status(400);
        response.setHeader('content-type', 'application/json');
        response.send({message:"Invalid content type"});
        return;
    }
    let item = request.body.item
    let board = request.body.board
    let revised = Date.now()

    item.timestamp = Date.now()
    if(item.selected){
        item.selectedTs = Date.now()
    }

    let whiteboardsTable =  database.collection('whiteboards');
    whiteboardsTable.updateOne(
        {boardId: board},
        {
            $set: {revised:revised},
            $push: {items:item}
        }
    )

    response.send()
})

//successfully connect to the database, then start the web server
connectToMongoClient().then(() => {
    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`);
    });
}).catch(console.dir)