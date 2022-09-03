//A DB needs to essentially support CRUD operation for an entity or entities.

import { Book, BookInterface } from "./Book";
import { join } from "path";

type partailBook = Partial<BookInterface>;

export interface Adapter<T> {
  read: () => Promise<T | null>;
  write: (data: T) => Promise<void>;
}
export declare class Low<T = unknown> {
  adapter: Adapter<T>;
  data: T | null;
  constructor(adapter: Adapter<T>);
  read(): Promise<void>;
  write(): Promise<void>;
}

interface BookDBInterface {
  /**
   * This function will be used to get the books.
   * @param {string} id the id of the book if we are looking for particular book
   * @returns it returns a promise that wraps a book in case a particular book with id is found otherwise an array of all books.
   */
  getBooks: (id?: string) => Promise<Book[] | Book>;

  /**
   * This function will be used to add the book
   * @param {Book} book the book that needs to be added.
   * @returns Promise wrapping true  if book addition is sucessful, false otherwise.
   */

  addBook: (book: Book) => Promise<Book | undefined>;

  /**
   * This function will be used to update the book
   * @param {string} id of the book to be updated
   * @param {Partial<BookInterface>} bookProperties The book properties to be updated
   * @returns Promise of  book object or undefined if there is no book with provided id.
   */
  updateBook: (
    id: string,
    partailBook: partailBook
  ) => Promise<Book | undefined>;

  /**
   * This function is used to delete the book with given id
   * @param {string} id id of the book that we want to delete
   * @returns  promise wrapping a string indicating id. True if the said book is found and deleted successfully,false otherwise.
   */

  deleteBook: (id: string) => Promise<string | undefined>;
}

/**
 * class that abstracts a book db in memory. This uses an array internally
 * to store the book objects
 * @class BookDBInMemory
 */

export class BookDBInMemory implements BookDBInterface {
  private storage: Book[] = [];

  /**
   * This function returns the given book after searching it from storage if id is provided otherwise returns all book.
   * @param {string} id the id of the book if we are looking for particular book.
   * @returns it returns a promise that wraps a book in case a particular book with id is found otherwise an array of all books.
   */

  async getBooks(id?: string): Promise<Book[] | Book> {
    if (id) {
      const filteredBooks = this.storage.filter((book: Book) => book.id === id);
      return filteredBooks[0] ?? [];
    }
    return this.storage;
  }

  /**
   * This function adds given book in storage.
   * @param {Book} book the book that needs to be added.
   * @returns Promise wrapping true  if book addition is sucessful, false otherwise
   */

  async addBook(book: Book): Promise<Book | undefined> {
    this.storage.push(book);
    return book;
  }

  /**
   * This function updates the given book in storage
   * @param {string} id of the book to be updated
   * @param {Partial<BookInterface>} bookProperties The book properties to be updated
   * @returns Promise of  book object or undefined if there is no book with provided id.
   */

  async updateBook(
    id: string,
    partailBook: partailBook
  ): Promise<Book | undefined> {
    if (id) {
      const filteredBooks = this.storage.filter((book: Book) => book.id === id);
      const bookToBeUpdated = filteredBooks[0];
      if (bookToBeUpdated) {
        for (let key in partailBook) {
          bookToBeUpdated[key] = partailBook[key];
        }
        return bookToBeUpdated;
      }
    }
    return;
  }

  /**
   * This function deletes the book with given id from storage.
   * @param {string} id id of the book that we want to delete
   * @returns  promise wrapping a string indicating id. True if the said book is found and deleted successfully,false otherwise.
   */

  async deleteBook(id: string): Promise<string | undefined> {
    const entries = this.storage.filter((book) => book.id === id);
    if (entries.length === 0) {
      return;
    }
    this.storage = this.storage.filter((book) => book.id !== id);
    return id;
  }
}

type BookData = {
  books: Book[];
};

/**
 * @class BookLowDB is a class that provides an implementation of bookInterface
 */

export class BookLowDB implements BookDBInterface {
  db: Low<BookData>;
  private constructor(db) {
    this.db = db;
  }
  async loadDb() {
    await this.db.read();

    this.db.data = { books: [] };
  }

  static async initialiseDb() {
    const LowDB = await import("lowdb");
    const __dirname = `${process.cwd()}/db`;

    const file = join(__dirname, "db.json");
    const adapter = new LowDB.JSONFile<BookData>(file);
    const db = new LowDB.Low(adapter);

    const dbInstance = new BookLowDB(db);
    await dbInstance.loadDb();
    return dbInstance;
  }

  /**
   * This function returns the given book after searching from database if id is provided otherwise returns all book.
   * @param {string} id the id of the book if we are looking for particular book
   * @param {string} searchString it is the parameter for searching the book
   * @returns it returns a promise that wraps a book in case a particular book with id is found otherwise an array of all books.
   */

  async getBooks(id?: string, searchString?: string): Promise<Book[] | Book> {
    if (id) {
      const filteredBooks = this.db?.data?.books.filter(
        (book: Book) => book.id === id
      );
      return filteredBooks?.[0] ?? [];
    } else if (searchString) {
      const searchTerms = searchString.split("=");
      const term = searchTerms[searchTerms.length - 1];
      const decodedQueryParam = decodeURIComponent(term);
      const searchedBook = this.db?.data?.books.filter((book: Book) => {
        return book.name.includes(decodedQueryParam);
      });
      return searchedBook ?? [];
    }

    return this.db?.data?.books ?? [];
  }

  /**
   * This function adds given book in database.
   * @param {Book} book the book that needs to be added.
   * @return Promise wrapping true  if book addition is sucessful, false otherwise.
   */

  async addBook(book: Book): Promise<Book | undefined> {
    this.db?.data?.books.push(book);
    await this.db.write();
    return book;
  }

  /**
   * This function updates the book that is pre existing in database.
   * @param {string} id it is the id of the book to be updated.
   * @param {Partial<BookInterface>} bookProperties The book properties to be updated
   * @returns Promise of  book object or undefined if there is no book with provided id.
   */

  async updateBook(
    id: string,
    partailBook: partailBook
  ): Promise<Book | undefined> {
    if (id) {
      const filteredBooks = this.db?.data?.books.filter(
        (book: Book) => book.id === id
      );
      const bookToBeUpdated = filteredBooks?.[0];
      if (bookToBeUpdated) {
        for (let key in partailBook) {
          bookToBeUpdated[key] = partailBook[key];
        }
        await this.db.write();
        return bookToBeUpdated;
      }
    }
    return;
  }

  /**
   * This function deletes the book with given id from database.
   * @param {string} id id of the book that we want to delete.
   * @returns promise wrapping a string indicating id. True if the said book is found and deleted successfully,false otherwise.
   */

  async deleteBook(id: string): Promise<string | undefined> {
    const entries = this.db?.data?.books.filter((book) => book.id === id);
    if (entries?.length === 0) {
      return;
    }
    this.db.data = {
      books: this.db?.data?.books.filter((book) => book.id !== id) ?? [],
    };
    await this.db.write();
    return id;
  }
}
