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

//successfully connect to the database, then start the web server
connectToMongoClient().then(() => {
    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`);
    });
}).catch(console.dir)