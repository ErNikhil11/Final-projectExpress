fetchAllBooks();
const searchBookButton = document.getElementById("search-button");
let sampleForm = document.getElementById("book-form");
const refreshButton = document.getElementById("refresh-books-button");

/**
 * Helper function to POST data as JSON with Fetch.
 */
async function postFormFieldsAsJson({ url, formData }) {
  //Create an object from the form data entries
  let formDataObject = Object.fromEntries(formData.entries());
  // Format the plain form data as JSON
  let formDataJsonString = JSON.stringify(formDataObject);

  //Set the fetch options (headers, body)
  let fetchOptions = {
    //HTTP method set to POST.
    method: "POST",
    mode: "cors",
    //Set the headers that specify you're sending a JSON body request and accepting JSON response
    headers: {
      //   "Sec-Fetch-Mode": "no-cors",
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    // POST request body as JSON string.
    body: formDataJsonString,
  };

  //Get the response body as JSON.
  //If the response was not OK, throw an error.
  let res = await fetch(url, fetchOptions);

  //If the response is not ok throw an error (for debugging)
  if (!res.ok) {
    let error = await res.text();
    throw new Error(error);
  }
  //If the response was OK, return the response body.
  return res.json();
}

//Define the event handler for the form when it's submitted
sampleForm.addEventListener("submit", async (e) => {
  //Prevent browser default behavior
  e.preventDefault();

  //Get the entire form fields
  let form = e.currentTarget;

  //Get URL for api endpoint
  let url = "http://localhost:3000/book";

  try {
    //Form field instance
    let formData = new FormData(form);

    //Call the `postFormFieldsJson()` function
    let responseData = await postFormFieldsAsJson({ url, formData });
    fetchAllBooks();
  } catch (error) {
    // Handle the error here.
    console.error(`An error has occured ${error}`);
  }
});

/**
 * Helper function to fetch all books from database.
 */
async function fetchAllBooks() {
  let headersList = {
    Accept: "*/*",
    "User-Agent": "Thunder Client (https://www.thunderclient.com)",
  };

  let response = await fetch("http://localhost:3000/book", {
    method: "GET",
    headers: headersList,
  });

  let books = await response.json();
  console.log(books);

  const ul = document.getElementById("book-list");
  //creating an empty array using ul tag
  ul.replaceChildren([]);

  books.forEach((book) => {
    const li = document.createElement("li");
    if (book.favorite === "fav") {
      const content = document.createTextNode(`💙${book.name}`);
      li.append(content);
    } else {
      const content = document.createTextNode(`${book.name}`);
      li.append(content);
      ul.append(li);
    }
    ul.append(li);
  });
}

/**
 * Helper function that fetches all books by name from database.
 */
searchBookButton.addEventListener("click", async () => {
  const input = document.getElementById("book-search-input").value;
  const encodedSearchParam = encodeURIComponent(input);
  let headersList = {
    Accept: "*/*",
    "User-Agent": "Thunder Client (https://www.thunderclient.com)",
  };

  let response = await fetch(`http://localhost:3000/book?search=${input}`, {
    method: "GET",
    headers: headersList,
  });

  let books = await response.json();

  const ul = document.getElementById("searched-list");
  ul.replaceChildren([]);

  const favValue = document.getElementById("favouriteCheckbox");
  const listItems = books.forEach((book) => {
    if (favValue.checked && book.favorite === "fav") {
      const li = document.createElement("li");
      const content = document.createTextNode(`💙${book.name}`);
      li.appendChild(content);
      ul.append(li);
    } else if (!favValue.checked) {
      const li = document.createElement("li");
      const content = document.createTextNode(book.name);
      li.appendChild(content);
      ul.append(li);
    }
  });
});

refreshButton.addEventListener("click", async (e) => {
  fetchAllBooks();
});
