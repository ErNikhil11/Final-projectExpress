import * as http from "http";
import { Book, BookInterface } from "./Book";

import { BookLowDB } from "./BookDB";
import * as url from "url";

type PartialBook = Partial<Book>;
//let bookLowDB = new bookLowDB();

let bookLowDB;

/**
 * Function that that validates a entered book if satisfies returns true otherwise false.
 * @param {Book} book it is the book that we want to check.
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
 * @param {Book} book it is the book that we want to check
 * @returns boolean value after validating book.
 */

function partialBookInfoValid(book: PartialBook): boolean | undefined | 0 {
  return (
    book.name !== undefined ||
    book.author !== undefined ||
    book.publisher !== undefined ||
    (book.price && book.price > 0)
  );
}

/**
 * Function to get id of the book from the given url
 * @param {string} url given url for fetching books.
 * @returns string id of the book.
 */

function getIdFromURL(url: string): string {
  const urlComponents = url?.split("/");
  const id = urlComponents?.[2];

  return id;
}

/**
 * Function that adds CORS headers to our response for proper communication.
 * @param {http.ServerResponse} response it is the response that server is  sending to http client side according to request received.
 * @param {number} statusCode it is the status code that we want to pass by default is is 200
 */
function writeCorsHeadersToResponse(response, statusCode = 200): void {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, POST, GET, PUT, DELETE",
    "Access-Control-Max-Age": 2592000, // 30 days
    "Access-Control-Allow-Headers":
      "content-type, access-control-allow-origin, Sec-Fetch-Mode,Accept",

    /** add other headers as per requirement */
  };
  response.writeHead(statusCode, headers);
}

/**
 * Function that process request to get a specified book from database.
 * @param {http.IncomingMessage} req it is the request that we are getting from http client side or from our web app.
 * @param {http.ServerResponse} response it is the response that server is  sending to http client side according to request received.
 *
 */

function processGetBooks(
  req: http.IncomingMessage,
  response: http.ServerResponse
): void {
  // Check if the url also contains the id of the book,
  // if so we need to return the book info with that id

  const id = getIdFromURL(req.url ?? "");

  const parsedUrl = url.parse(req?.url ?? "", true);
  if (id) {
    //TODO:  GET the book with provided id from DB and return that.
    console.log("Returning book with id: ", id);
    bookLowDB.getBooks(id).then((book) => {
      writeCorsHeadersToResponse(response);
      response.write(JSON.stringify(book));
      response.end();
    });
  } else {
    if (req.url?.includes(parsedUrl.search ?? "")) {
      // return all books in the db.
      console.log("Returning book for given name", parsedUrl.query.search);
      bookLowDB.getBooks(id, parsedUrl.search).then((book) => {
        writeCorsHeadersToResponse(response, 201);
        response.write(JSON.stringify(book));
        response.end();
      });
    } else {
      console.log("Returning all books");
      bookLowDB.getBooks(id).then((book) => {
        writeCorsHeadersToResponse(response, 201);
        response.write(JSON.stringify(book));
        response.end();
      });
    }
  }
}

/**
 * Function that process request for addition of a new entered book to database after validating it.
 * @param {http.IncomingMessage} req it is the request that we are getting from http client side or from our web app.
 * @param {http.ServerResponse} response it is the response that server is  sending to http client side according to request received.
 *
 */

function processPostBooks(
  req: http.IncomingMessage,
  response: http.ServerResponse
): void {
  // Here we will get a new book representation as JSON
  // If the json is valid, then only we need to create a book
  // otherwise return an error
  let bookInfo = "";
  req.on("data", function (chunk) {
    bookInfo += chunk;
  });

  req.on("end", () => {
    // Check if the json data is valid representation of a book.
    try {
      const book: BookInterface = JSON.parse(bookInfo);
      if (bookIsValid(book)) {
        console.log("book is valid");
        // TODO: need to add this book to db

        const newBook = new Book(
          book.name,
          book.author,
          book.publisher,
          book.price,
          book.favorite
        );
        bookLowDB.addBook(newBook).then(() => {
          writeCorsHeadersToResponse(response);
          response.write(JSON.stringify(newBook));

          response.end("");
        });
      } else {
        throw new Error("Book info is invalid, please check");
      }
    } catch (err) {
      // handle error here.
      response.statusCode = 400; // Bad request, book info is not proper
      response.statusMessage = "Bad request, book info is not proper";
      response.end("");
    }
  });
}

/**
 * Function that process request to update the given book in database.
 * @param {http.IncomingMessage} req it is the request that we are getting from http client side or from our web app.
 * @param {http.ServerResponse} response it is the response that server is  sending to http client side according to request received.
 *
 */

function processPutBooks(
  req: http.IncomingMessage,
  response: http.ServerResponse
): void {
  // Extract id from the request, and see that there is a book with that id, if not
  // bail out with an error. Otherwise update the entry with new data that is received
  // as the body.
  // Get the body and parse it and validate it

  // extract the id:

  const id = getIdFromURL(req.url ?? "");

  if (!id) {
    response.statusCode = 400; // Bad request, book info is not proper
    response.statusMessage =
      "Bad request, book id is needed to update the book info";
    response.end("");
    return;
  }

  // Lets extract the body

  let bookInfo = "";
  req.on("data", function (chunk) {
    bookInfo += chunk;
  });

  req.on("end", () => {
    // Check if the json data is valid representation of a book.
    try {
      const book = JSON.parse(bookInfo);
      if (partialBookInfoValid(book)) {
        console.log("book is valid");
        // find the book to be modified and if not found throw an exception
        bookLowDB.updateBook(id, book).then((bookUpdated: Book | undefined) => {
          if (!bookUpdated) {
            throw new Error("Book info is invalid, please check");
          } else {
            response.statusCode = 201; // Bad request, book info is not proper
            response.end("");
          }
        });
      } else {
        throw new Error("Book info is invalid, please check");
      }
    } catch (err) {
      // handle error here.
      response.statusCode = 400; // Bad request, book info is not proper
      response.statusMessage = "Bad request, book info is not proper";
      response.end("");
    }
  });
}

/**
 * Function that process request to delete the entry of given book from database.
 * @param {http.IncomingMessage} req it is the request that we are getting from http client side or from our web app.
 * @param {http.ServerResponse} response it is the response that server is  sending to http client side according to request received.
 *
 */

function processDeleteRequest(
  req: http.IncomingMessage,
  response: http.ServerResponse
): void {
  const id = getIdFromURL(req.url ?? "");

  if (!id) {
    response.statusCode = 400;
    response.statusMessage =
      "bad equest, book id is needed to delete the book info";
    response.end("");
    return;
  }

  bookLowDB.deleteBook(id).then((IdOfBookDeleted: string | undefined) => {
    if (IdOfBookDeleted === undefined) {
      response.statusCode = 400;
      response.end();
    } else {
      response.statusCode = 200;
      response.end("");
    }
  });
}

/**
 * Function that checks the type of incoming request from web app for books and process that.
 * @param {http.IncomingMessage} req it is the request that we are getting from http client side or from our web app.
 * @param {http.ServerResponse} response it is the response that server is  sending to http client side according to request received.
 */

function processBookRequest(
  req: http.IncomingMessage,
  response: http.ServerResponse
): void {
  // Check what is the type of the request? GET/POST/DELETE/PUT

  if (req.method === "GET") {
    processGetBooks(req, response);
  }

  if (req.method === "POST") {
    processPostBooks(req, response);
  }

  if (req.method === "PUT") {
    processPutBooks(req, response);
  }
  if (req.method === "DELETE") {
    processDeleteRequest(req, response);
  }
}

const server = http.createServer(
  (req: http.IncomingMessage, response: http.ServerResponse) => {
    if (req.method === "OPTIONS") {
      writeCorsHeadersToResponse(response, 204);

      response.end();
      return;
    }
    if (req.url === "/") {
      console.log("All headers: ", req.headers);
      const customHeader = req.headers["custom-header"];
      console.log(customHeader);
      response.write('<h1 style="color:red">Welcome to node backend!<h1>');
      response.end();
    }

    if (req.url === "/books") {
      response.write(
        JSON.stringify(["Bhagavad Gita", "Ramayan", "Mahabharath"])
      );
      response.end();
    }

    if (req.url === "/post") {
      console.log(req.method);
      let body = "";
      req.on("data", function (chunk) {
        body += chunk;
      });

      req.on("end", function () {
        response.setHeader("server-message", "Felt happy");
        response.writeHead(200, { "Content-Type": "text/html" });
        body = `<h1 style="color:green">${body} </h1>`;
        response.end(body);
      });
    }

    if (req.url?.startsWith("/book")) {
      processBookRequest(req, response);
    }
  }
);

BookLowDB.initialiseDb().then((db) => {
  bookLowDB = db;
  server.listen(3000, () => {
    console.log("Server is running at 3000");
  });
});
