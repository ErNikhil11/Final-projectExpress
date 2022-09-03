import { Book, BookInterface } from "./Book";
import * as url from "url";
import express from "express";
const app = express();

import { BookLowDB } from "./BookDB";

type PartialBook = Partial<Book>;

let bookLowDB;

/**
 * Function that that validates a entered book if satisfies returns true otherwise false.
 * @param {BookInterface} book it is the book that we need to check whether valid or not
 * @returns boolean value after validating book.
 */

function bookIsValid(book: BookInterface): boolean {
  return (
    book.name !== undefined &&
    book.author !== undefined &&
    book.publisher !== undefined &&
    book.price > 0
  );
}

/**
 * Function that validates book for some partial given information.
 * @param {PartialBook} book it is the book that we want to check
 * @returns boolean value after validating book.
 */

function partialBookInfoValid(book: PartialBook) {
  return (
    book.name !== undefined ||
    book.author !== undefined ||
    book.publisher !== undefined ||
    (book.price && book.price > 0)
  );
}

/**
 * Function that adds CORS headers to our response for proper communication.
 * @param {http.ServerResponse} response response for which cors headers will be added.
 * @param {number} statusCode the status code that we want to pass. By default it is 200
 */

function writeCorsHeadersToResponse(response, statusCode = 200) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, POST, GET, PUT, DELETE",
    "Access-Control-Max-Age": 2592000, // 30 days
    "Access-Control-Allow-Headers":
      "content-type, access-control-allow-origin, Sec-Fetch-Mode,Accept",
  };
  response.status(statusCode).set(headers);
}

//if get method called for getting all books
// app.get("/book", (req: express.Request, response: express.Response) => {
//   console.log("Returning all books");
//   bookLowDB.getBooks().then((book) => {
//     writeCorsHeadersToResponse(response, 201);
//     response.send(JSON.stringify(book));
//   });
// });

//if book searched with some id or name
app.get("/book/:id", (req: express.Request, response: express.Response) => {
  const id = req.params.id;

  const parsedUrl = url.parse(req?.originalUrl ?? "", true);

  if (id) {
    console.log("Returning book with id: ", id);
    bookLowDB.getBooks(id).then((book) => {
      writeCorsHeadersToResponse(response);
      response.send(JSON.stringify(book));
    });
  } else {
    // return all books in the db.
    console.log("Returning all books");
    bookLowDB.getBooks(id).then((book) => {
      writeCorsHeadersToResponse(response, 201);
      response.send(JSON.stringify(book));
    });
  }
});

app.get("/book", (req: express.Request, response: express.Response) => {
  const id = req.params.id;
  const name = req.query.name as string;
  //const parsedUrl = url.parse(req?.originalUrl ?? "", true);

  if (req.originalUrl.includes(name)) {
    console.log("returning book for given name", name);
    bookLowDB.getBooks(id, name).then((book) => {
      writeCorsHeadersToResponse(response, 201);
      response.send(JSON.stringify(book));
    });
  } else {
    // return all books in the db.
    console.log("Returning all books");
    bookLowDB.getBooks(id).then((book) => {
      writeCorsHeadersToResponse(response, 201);
      response.send(JSON.stringify(book));
    });
  }
});

/**
 * Function that process the POST books API call.
 * @param {http.IncomingMessage} req it is the request that we are getting from http.
 * @param {http.ServerResponse} response it is the response that server send to http.
 */

app.post("/book", (req: express.Request, response: express.Response) => {
  let bookInfo = "";
  req.on("data", function (chunk) {
    bookInfo += chunk;
  });

  req.on("end", () => {
    try {
      const book: BookInterface = JSON.parse(bookInfo);
      if (bookIsValid(book)) {
        console.log("book is valid");

        const newBook = new Book(
          book.name,
          book.author,
          book.publisher,
          book.price,
          book.favorite
        );
        bookLowDB.addBook(newBook).then(() => {
          writeCorsHeadersToResponse(response);
          response.send(JSON.stringify(newBook));
        });
      } else {
        throw new Error("Book info is invalid, please check");
      }
    } catch (err) {
      response.status(400).send("Bad request, book info is not proper");
    }
  });
});

/**
 * Function that process the PUT books API call.
 * @param {http.IncomingMessage} req it is the request that we are getting from http.
 * @param {http.ServerResponse} response it is the response that server send to http.
 */

app.put("/book/:id", (req: express.Request, response: express.Response) => {
  const id = req.params.id;

  if (!id) {
    response
      .status(400)
      .send("Bad request, book id is needed to update the book info");
    return;
  }

  // Lets extract the body

  let bookInfo = "";
  req.on("data", function (chunk) {
    bookInfo += chunk;
  });

  req.on("end", () => {
    try {
      const book = JSON.parse(bookInfo);
      if (partialBookInfoValid(book)) {
        console.log("book is valid");

        bookLowDB.updateBook(id, book).then((bookUpdated: Book | undefined) => {
          if (!bookUpdated) {
            throw new Error("Book info is invalid, please check");
          } else {
            response.status(200).send("updated the book");
          }
        });
      } else {
        throw new Error("Book info is invalid, please check");
      }
    } catch (err) {
      // handle error here.
      response.status(400).send("Bad request, book info is not proper");
    }
  });
});

/**
 * Function that process the DELETE books API call.
 * @param {http.IncomingMessage} req it is the request that we are getting from http.
 * @param {http.ServerResponse} response it is the response that server send to http.
 */

app.delete("/book/:id", (req: express.Request, response: express.Response) => {
  const id = req.params.id;

  if (!id) {
    response
      .status(400)
      .send("bad request, book id is needed to delete the book info");
  }

  bookLowDB.deleteBook(id).then((IdOfBookDeleted: string | undefined) => {
    if (IdOfBookDeleted === undefined) {
      response.status(400);
    } else {
      response.status(200);
    }
  });
});

/**
 * Function that checks the type of incoming request for books and process that.
 * @param {http.IncomingMessage} req it is the request that we are getting from http.
 * @param {http.ServerResponse} response it is the response that server send to http.
 */

// function processBookRequest(
//   req: http.IncomingMessage,
//   response: http.ServerResponse
// ): void {
//   // Check what is the type of the request? GET/POST/DELETE/PUT

//   if (req.method === "GET") {
//     processGetBooks(req, response);
//   }

//   if (req.method === "POST") {
//     processPostBooks(req, response);
//   }

//   if (req.method === "PUT") {
//     processPutBooks(req, response);
//   }
//   if (req.method === "DELETE") {
//     processDeleteRequest(req, response);
//   }
// }

const port = process.env.PORT || 3000;

BookLowDB.initialiseDb().then((db) => {
  bookLowDB = db;
  app.listen(port, () => {
    console.log("Server is running at 3000");
  });
});
