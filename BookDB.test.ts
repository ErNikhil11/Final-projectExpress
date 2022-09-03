import { BookDBInMemory, BookLowDB } from "./BookDB";
import { Book } from "./Book";
import fs from "fs/promises";
describe("BookDB in memory implementation tests", () => {
  let bookDB: BookDBInMemory;

  beforeAll(() => {
    bookDB = new BookDBInMemory();
  });

  it("check crud wuth bookDB", async () => {
    let books = await bookDB.getBooks();
    expect(books).toEqual([]);

    let aBook = new Book("sherlock holmes", "Arthur", "universal", 200);

    const added = await bookDB.addBook(aBook);
    expect(added).toEqual(aBook);
    books = await bookDB.getBooks();
    expect(books).toEqual([added]);

    const updated = await bookDB.updateBook(aBook?.id, {
      name: "sherlock holmes stories",
    });
    expect(updated?.name).toEqual("sherlock holmes stories");

    const deletedId = await bookDB.deleteBook(aBook.id);
    expect(deletedId).toEqual(aBook.id);
  });
});

describe("Book DB using Low DB, tests", () => {
  let bookDB: BookLowDB;

  beforeAll(async () => {
    await fs.writeFile("./db/db.json", JSON.stringify({ books: [] }));

    bookDB = await BookLowDB.initialiseDb();
  }, 4000);
  it("check crud wuth bookDB", async () => {
    let books = await bookDB.getBooks();
    expect(books).toEqual([]);

    let aBook = new Book("sherlock holmes", "Arthur", "universal", 200);

    let added = await bookDB.addBook(aBook);
    expect(added).toEqual(aBook);
    books = await bookDB.getBooks();
    expect(books).toEqual([added]);
    const updated = await bookDB.updateBook(aBook?.id, {
      name: "sherlock holmes stories",
    });
    expect(updated?.name).toEqual("sherlock holmes stories");

    const deletedId = await bookDB.deleteBook(aBook.id);
    expect(deletedId).toEqual(aBook.id);

    aBook = new Book("sherlock homes1", "Arthur", "universal", 150);
    added = await bookDB.addBook(aBook);
    expect(added).toEqual(aBook);
    books = await bookDB.getBooks();

    expect(books).toEqual([added]);
  });
});
