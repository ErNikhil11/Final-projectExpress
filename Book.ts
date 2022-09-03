/**
 * Book class encapsulated a book in our books backend system
 * @class Book
 */

import { v4 as uuidv4 } from "uuid";
export interface BookInterface {
  name: string;
  author: string;
  publisher: string;
  price: number;
  favorite?: string;
}

export class Book implements BookInterface {
  id: string = uuidv4();
  name: string;
  author: string;
  publisher: string;
  price: number;
  favorite?: string;

  constructor(
    name: string,
    author: string,
    publisher: string,
    price: number,
    favorite?: string
  ) {
    this.name = name;
    this.author = author;
    this.publisher = publisher;
    this.price = price;
    this.favorite = favorite;
  }
}
