import { Book } from "./Book";

describe("Book creation test", () => {
  it("Book creation", () => {
    const newBook = new Book("othello", "william", "penguin", 2334, "fav");
    expect(newBook.id.length).toBeGreaterThan(0);
    expect(newBook.name).toEqual("othello");
    expect(newBook.author).toEqual("william");
    expect(newBook.publisher).toEqual("penguin");
    expect(newBook.price).toEqual(2334);
    expect(newBook.favorite).toEqual("fav");
  });
});
