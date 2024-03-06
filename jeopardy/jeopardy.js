// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];
const NUM_CATEGORIES = 6;
const NUM_QUESTIONS_PER_CAT = 5;
let gameStarted = false;

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoriesIds() {
    try {
        const response = await axios.get(`https://jservice-new.herokuapp.com/api/categories?count=100`);
        const categoryIds = response.data.map(category => category.id);
        return _.sampleSize(categoryIds, NUM_CATEGORIES);
    } catch (error) {
        console.error('Error fetching category IDs:', error);
        return [];
    }
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
    try {
        const response = await axios.get(`https://jservice-new.herokuapp.com/api/category?id=${catId}`);
        const category = response.data;
        category.clues = category.clues.slice(0, NUM_QUESTIONS_PER_CAT);
        category.clues.forEach(clue => {
            clue.showing = null;
        });
        return category;
    } catch (error) {
        console.error('Error fetching category data:', error);
        return null;
    }
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */
// Render categories in the table
function renderCategories(categories) {
    const $thead = $("#jeopardy thead");
    const $tbody = $("#jeopardy tbody");

    // Clear table
    $thead.empty();
    $tbody.empty();

    // Adding categories to table header
    const $tr = $("<tr>");
    categories.forEach(category => {
        $tr.append($("<th>").text(category.title.toUpperCase()));
    });
    $thead.append($tr);

    //Adding questions to table body
    for (let clueIdx = 0; clueIdx < NUM_QUESTIONS_PER_CAT; clueIdx++) {
        const $tr = $("<tr>");
        categories.forEach((category, catIdx) => {
            $tr.append($("<td>").attr("id", `${catIdx}-${clueIdx}`).text("?"));
        });
        $tbody.append($tr);
    }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

// Handle clicking on a clue: show the question or answer.
function handleClick(evt) {
    const id = evt.target.id;
    const [catId, clueId] = id.split("-");
    const clue = categories[catId].clues[clueId];

    if (!clue.showing) {
        $(`#${id}`).text(clue.question);
        clue.showing = "question";
    } else if (clue.showing === "question") {
        $(`#${id}`).text(clue.answer);
        $(`#${id}`).addClass('showing-answer');
        clue.showing = "answer";
    }
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
    const $thead = $("#jeopardy thead");
    const $tbody = $("#jeopardy tbody");

    //Clear the table first
    $thead.empty();
    $tbody.empty();

    $("#spin-container").show();
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
    $("#spin-container").hide();
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
    showLoadingView();

    const categoryIds = await getCategoriesIds();

    categories = [];

    for (const catId of categoryIds) {
        const category = await getCategory(catId);
        if (category) {
            categories.push(category);
        }
    }

    renderCategories(categories);

    hideLoadingView();

    const $startButton = $("#start");
    gameStarted = !gameStarted;

    if (gameStarted) {
        $startButton.text("👉 Restart 👈");
    } else {
        $startButton.text("👉 Start 👈");
    }
}

/** On click of start / restart button, set up game. */
$("#start").on("click", setupAndStart);

/** On page load, add event handler for clicking clues */
$(async function () {
    $("#jeopardy").on("click", "td", handleClick);
});